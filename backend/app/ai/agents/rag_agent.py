"""RAGAgent implementation using LangGraph.

This module provides a RAG-focused agent that builds a LangGraph StateGraph with nodes for:
1. Planning - determines if knowledge base search is needed
2. Knowledge Retrieval - searches the vector database
3. Response Generation - LLM generates response based on retrieved context
4. Finalization - formats and returns the response

This agent ONLY uses the knowledge base tool for retrieval-augmented generation.
"""
from typing import List, Optional, Dict, Any, TypedDict, TYPE_CHECKING
import logging
import os
import uuid
import asyncio
from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.models import Message, Conversation
from app.models.message import MessageType
from app.services.chat_service import ChatService
from app.ai.agents.common.agent_event_types import AgentEventType, AgentStepKind
from app.ai.tools import search_knowledge_base
from app.ai.agents.common.base_agent import BaseAgent

if TYPE_CHECKING:
    from app.ai.agents.common.agent_factory import AgentConfig

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class RAGAgentState(TypedDict):
    """State passed through the RAG LangGraph"""
    conversation_id: str
    message_id: str
    user_id: str
    workspace_id: str
    user_message: str
    conversation_history: List[Dict[str, str]]
    needs_retrieval: bool
    retrieved_context: List[Dict[str, Any]]
    response: str
    step_index: int


class RAGAgent(BaseAgent):
    """RAG Agent using LangGraph.

    Builds a StateGraph focused on knowledge base retrieval and response generation.
    Only uses the knowledge base tool - no web search or website fetching.
    
    Use this agent when you want responses grounded in the user's stored documents,
    notes, and files.
    """

    def __init__(
        self,
        chat_service: ChatService,
        agent_config: Optional["AgentConfig"] = None,
        llm_name: str = "llm",
        model: str = "gpt-4o-mini",
        temperature: float = 0.3  # Lower temperature for more factual responses
    ):
        """Initialize RAGAgent.
        
        Args:
            chat_service: ChatService instance for event handling
            agent_config: Optional AgentConfig from factory (overrides model/temperature)
            llm_name: Name identifier for the LLM
            model: Default model to use if no agent_config provided
            temperature: Default temperature (lower for RAG to be more factual)
        """
        self.chat_service = chat_service
        self.llm_name = llm_name
        self.agent_config = agent_config
        
        # Use agent_config values if provided, otherwise use defaults
        if agent_config:
            self.model = agent_config.ai_model or model
            self.temperature = agent_config.temperature if agent_config.temperature is not None else temperature
            self.instructions = agent_config.instructions
            self.max_tokens = agent_config.max_tokens
            self.capabilities = agent_config.capabilities
            self.tools_config = agent_config.tools
            logger.info(f"Initialized RAG agent with config: {agent_config.name} (model={self.model}, temp={self.temperature})")
        else:
            self.model = model
            self.temperature = temperature
            self.instructions = None
            self.max_tokens = 4000
            self.capabilities = None
            self.tools_config = None
            
        self.graph = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph StateGraph for RAG"""
        workflow = StateGraph(RAGAgentState)
        
        # Add nodes
        workflow.add_node("analyze", self._analyze_node)
        workflow.add_node("retrieve", self._retrieve_node)
        workflow.add_node("generate", self._generate_node)
        workflow.add_node("finalize", self._finalize_node)
        
        # Add edges
        workflow.add_edge(START, "analyze")
        
        # Conditional edge: if retrieval needed, do it first
        workflow.add_conditional_edges(
            "analyze",
            lambda state: "retrieve" if state.get("needs_retrieval") else "generate"
        )
        
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", "finalize")
        workflow.add_edge("finalize", END)
        
        self.graph = workflow.compile()
    
    async def _analyze_node(self, state: RAGAgentState) -> Dict[str, Any]:
        """Analyze node: determine if knowledge base retrieval is needed"""
        try:
            # Emit analysis step
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.REASONING,
                    "content": f"Analyzing query for knowledge retrieval: {state['user_message'][:100]}...",
                    "user_id": state["user_id"]
                }
            )
            
            # Build context from history
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"][-5:]
            ])
            
            # Simple analysis prompt for RAG
            analysis_prompt = f"""You are a RAG (Retrieval-Augmented Generation) assistant. Analyze the user's message and determine if you need to search the knowledge base.

Conversation history (for context):
{history_context}

User message: {state['user_message']}

INSTRUCTIONS:
1. If the user is asking about information that might be in their documents, notes, or files → respond with "RETRIEVE: <search query>"
2. If the user is asking a simple greeting, general question, or conversation that doesn't need documents → respond with "NO_RETRIEVAL"
3. If unsure, prefer to RETRIEVE - it's better to have context than not

Examples that NEED retrieval:
- "What does my note say about X?"
- "Find information about Y in my files"
- "What did I write about Z?"
- "Summarize my notes on..."
- Any question that might benefit from stored knowledge

Examples that DON'T need retrieval:
- "Hello"
- "Thanks"
- "What is 2+2?"
- Simple conversational responses

Respond with either:
- RETRIEVE: <optimized search query>
- NO_RETRIEVAL

Your response:"""
            
            # Create LLM and analyze
            llm = ChatOpenAI(
                model=self.model,
                temperature=0.1,  # Very low for analysis
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            analysis_message = await asyncio.to_thread(
                lambda: llm.invoke([HumanMessage(content=analysis_prompt)])
            )
            analysis = analysis_message.content if hasattr(analysis_message, 'content') else str(analysis_message)
            
            # Determine if retrieval is needed
            needs_retrieval = "RETRIEVE:" in analysis
            
            # Emit analysis result
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.PLAN,
                    "content": f"Analysis: {'Will search knowledge base' if needs_retrieval else 'No retrieval needed'}",
                    "user_id": state["user_id"]
                }
            )
            
            return {
                "needs_retrieval": needs_retrieval,
                "retrieved_context": [],
                "_analysis": analysis,  # Store for retrieve node
                "step_index": state["step_index"] + 1
            }
        
        except Exception as e:
            logger.error(f"Analyze node error: {e}")
            raise
    
    async def _retrieve_node(self, state: RAGAgentState) -> Dict[str, Any]:
        """Retrieve node: search the knowledge base"""
        try:
            # Extract search query from analysis
            analysis = state.get("_analysis", state["user_message"])
            
            if "RETRIEVE:" in analysis:
                query_start = analysis.find("RETRIEVE:") + 9
                query_end = analysis.find("\n", query_start)
                if query_end == -1:
                    query_end = len(analysis)
                search_query = analysis[query_start:query_end].strip()
            else:
                # Fallback to user message
                search_query = state["user_message"]
            
            # Emit retrieval step
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.TOOL_CALL,
                    "content": f"Searching knowledge base: {search_query}",
                    "tool_name": "search_knowledge_base",
                    "tool_input": {"query": search_query},
                    "user_id": state["user_id"]
                }
            )
            
            # Execute knowledge base search
            kb_result = await search_knowledge_base(
                query=search_query,
                workspace_id=state["workspace_id"],
                limit=5,
                threshold=0.0,
            )
            
            # Build retrieved context
            retrieved_context = []
            if kb_result.get("success") and kb_result.get("results"):
                for doc in kb_result["results"]:
                    retrieved_context.append({
                        "id": doc.get("id"),
                        "content": doc.get("content", ""),
                        "score": doc.get("score", 0),
                        "source_type": doc.get("source_type"),
                        "source_id": doc.get("source_id"),
                    })
            
            # Emit retrieval result
            result_summary = f"Found {len(retrieved_context)} relevant documents"
            if not kb_result.get("success"):
                result_summary = f"Knowledge base search failed: {kb_result.get('error', 'Unknown error')}"
            
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"] + 1,
                    "kind": AgentStepKind.TOOL_RESULT,
                    "content": result_summary,
                    "tool_name": "search_knowledge_base",
                    "user_id": state["user_id"]
                }
            )
            
            return {
                "retrieved_context": retrieved_context,
                "step_index": state["step_index"] + 2
            }
        
        except Exception as e:
            logger.error(f"Retrieve node error: {e}")
            return {"retrieved_context": [], "step_index": state["step_index"] + 1}
    
    async def _generate_node(self, state: RAGAgentState) -> Dict[str, Any]:
        """Generate node: create response based on retrieved context"""
        try:
            # Emit generation step
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.TOOL_CALL,
                    "content": "Generating response with retrieved context...",
                    "user_id": state["user_id"]
                }
            )
            
            # Build system prompt for RAG
            system_prompt = """You are a helpful AI assistant with access to the user's knowledge base.
Your responses should be grounded in the retrieved documents when available.
If the retrieved context is relevant, use it to provide accurate answers.
If the context doesn't help answer the question, acknowledge this and provide general assistance.
Always be clear about what information comes from the user's documents vs general knowledge."""

            # Add custom instructions if provided
            if self.instructions:
                system_prompt = f"{system_prompt}\n\nAdditional instructions:\n{self.instructions}"
            
            # Build conversation history
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"]
            ])
            
            # Build context from retrieved documents
            retrieval_context = ""
            if state.get("retrieved_context"):
                retrieval_context = "\n\n=== RETRIEVED DOCUMENTS ===\n"
                for i, doc in enumerate(state["retrieved_context"], 1):
                    retrieval_context += f"\n[Document {i}] (Score: {doc.get('score', 0):.3f})\n"
                    retrieval_context += f"Source: {doc.get('source_type', 'unknown')}/{doc.get('source_id', 'N/A')}\n"
                    retrieval_context += f"Content:\n{doc.get('content', '')}\n"
                    retrieval_context += "-" * 40 + "\n"
                retrieval_context += "=== END RETRIEVED DOCUMENTS ===\n"
            else:
                retrieval_context = "\n(No relevant documents were found in the knowledge base)\n"
            
            generation_prompt = f"""{system_prompt}

{retrieval_context}

Conversation history:
{history_context}

User message: {state['user_message']}

Provide a helpful response based on the retrieved context and conversation history."""
            
            # Create LLM and stream response
            llm = ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                api_key=os.getenv("OPENAI_API_KEY"),
                streaming=True
            )
            
            full_response = ""
            
            # Stream response
            def stream_response():
                messages = [HumanMessage(content=generation_prompt)]
                return list(llm.stream(messages))
            
            stream_tokens = await asyncio.to_thread(stream_response)
            
            for token_msg in stream_tokens:
                token = token_msg.content if hasattr(token_msg, 'content') else str(token_msg)
                if token:
                    full_response += token
                    
                    # Emit token event
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.TOKEN,
                        payload={
                            "token": token,
                            "user_id": state["user_id"]
                        }
                    )
            
            return {"response": full_response, "step_index": state["step_index"] + 1}
        
        except Exception as e:
            logger.error(f"Generate node error: {e}")
            raise
    
    async def _finalize_node(self, state: RAGAgentState) -> Dict[str, Any]:
        """Finalize node: format and return response"""
        try:
            # Emit finalization step
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.TOOL_RESULT,
                    "content": "Response finalized",
                    "user_id": state["user_id"]
                }
            )
            
            return {"step_index": state["step_index"] + 1}
        
        except Exception as e:
            logger.error(f"Finalize node error: {e}")
            raise

    async def generate_agent_response(
        self,
        conversation: Conversation,
        user_message: Message,
        conversation_history: Optional[List[Message]] = None,
        stream: bool = False,
        response_message_id: Optional[str] = None,
    ) -> Optional[Message]:
        """Run the RAG LangGraph and save the final response.

        Args:
            conversation: The conversation object
            user_message: The user's message to respond to
            conversation_history: Previous messages for context
            stream: Whether to stream events (always true for now)
            response_message_id: Pre-created AI response message ID for streaming persistence
        
        Returns:
            The saved message or None on error
        """
        # Use pre-created message ID or generate new one
        message_id = response_message_id or str(uuid.uuid4())
        
        try:
            # Emit start event
            await self.chat_service.handle_response_events(
                conversation_id=str(conversation.id),
                response_id=message_id,
                event_type=AgentEventType.START,
                payload={
                    "metadata": {
                        "model": self.model,
                        "temperature": self.temperature,
                        "agent_type": "rag"
                    },
                    "user_id": conversation.created_by
                }
            )
            
            # Convert conversation history to dict format
            history_dicts = []
            if conversation_history:
                for msg in conversation_history[-12:]:  # Last 12 messages
                    role = "assistant" if msg.type.value == MessageType.AI_RESPONSE.value else "user"
                    history_dicts.append({
                        "role": role,
                        "content": msg.content or ""
                    })
            
            # Build initial state
            initial_state: RAGAgentState = {
                "conversation_id": str(conversation.id),
                "message_id": message_id,
                "user_id": conversation.created_by,
                "workspace_id": str(conversation.workspace_id) if conversation.workspace_id else "",
                "user_message": str(user_message.content or ""),
                "conversation_history": history_dicts,
                "needs_retrieval": True,  # Default to retrieval for RAG agent
                "retrieved_context": [],
                "response": "",
                "step_index": 0
            }
            
            # Execute the graph
            logger.info(f"Starting RAG LangGraph execution for conversation {conversation.id}")
            if self.graph:
                final_state = await self.graph.ainvoke(initial_state)
            else:
                final_state = initial_state
            
            # Emit completion event
            await self.chat_service.handle_response_events(
                conversation_id=str(conversation.id),
                response_id=message_id,
                event_type=AgentEventType.COMPLETE,
                payload={
                    "content": final_state.get("response", ""),
                    "metadata": {
                        "model": self.model,
                        "temperature": self.temperature,
                        "agent_type": "rag",
                        "retrieved_count": len(final_state.get("retrieved_context", []))
                    },
                    "workspace_id": conversation.workspace_id,
                    "user_id": conversation.created_by,
                    "ai_model": self.model,
                    "message_id": message_id
                }
            )
            
            logger.info(f"RAG response completed for conversation {conversation.id}, message ID: {message_id}")
            
            return None
        
        except Exception as e:
            logger.exception(f"RAGAgent response generation failed: {e}")
            # Emit error event
            await self.chat_service.handle_response_events(
                conversation_id=str(conversation.id),
                response_id=message_id,
                event_type=AgentEventType.ERROR,
                payload={
                    "error": str(e),
                    "code": "RAG_AGENT_ERROR",
                    "user_id": conversation.created_by
                }
            )
            return None
