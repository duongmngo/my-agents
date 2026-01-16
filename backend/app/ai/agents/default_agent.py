"""DefaultAgent implementation using LangGraph.

This module provides a DefaultAgent that builds a LangGraph StateGraph with nodes for:
1. Planning - analyzes the user message and conversation context
2. Response Generation - LLM generates response based on plan
3. Finalization - formats and returns the response

The agent emits streaming events to Redis at each step for WebSocket delivery.
"""
from typing import List, Optional, Dict, Any, TypedDict, Annotated
import logging
import os
import uuid
import asyncio
from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from app.models import Message, Conversation
from app.models.agent import Agent as AgentModel
from app.models.message import MessageType
from app.services.chat_service import ChatService
from app.ai.agents.common.agent_event_types import AgentEventType, AgentStepKind
from app.ai.tools import search_web, fetch_website

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

from app.ai.agents.common.base_agent import BaseAgent


class AgentState(TypedDict):
    """State passed through the LangGraph"""
    conversation_id: str
    message_id: str
    user_id: str
    user_message: str
    conversation_history: List[Dict[str, str]]
    plan: str
    needs_tools: bool
    tool_results: List[Dict[str, Any]]
    response: str
    step_index: int


class DefaultAgent(BaseAgent):
    """Default agent runner using LangGraph.

    Builds a StateGraph with nodes for planning, response generation, and finalization.
    Emits events to Redis at each step for WebSocket streaming.
    """

    def __init__(
        self,
        chat_service: ChatService,
        llm_name: str = "llm",
        model: str = "gpt-4o-mini",
        temperature: float = 0.7
    ):
        self.chat_service = chat_service
        self.llm_name = llm_name
        self.model = model
        self.temperature = temperature
        self.graph = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph StateGraph"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("plan", self._plan_node)
        workflow.add_node("route_tools", self._route_tools_node)
        workflow.add_node("execute_tools", self._execute_tools_node)
        workflow.add_node("generate", self._generate_node)
        workflow.add_node("finalize", self._finalize_node)
        
        # Add edges
        workflow.add_edge(START, "plan")
        workflow.add_edge("plan", "route_tools")
        
        # Conditional edge: if tools needed, execute them first
        workflow.add_conditional_edges(
            "route_tools",
            lambda state: "execute_tools" if state.get("needs_tools") else "generate"
        )
        
        workflow.add_edge("execute_tools", "generate")
        workflow.add_edge("generate", "finalize")
        workflow.add_edge("finalize", END)
        
        self.graph = workflow.compile()
    
    async def _plan_node(self, state: AgentState) -> Dict[str, Any]:
        """Plan node: analyze user message and conversation context"""
        try:
            # Emit planning step start
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.REASONING,
                    "content": f"Analyzing user message: {state['user_message'][:100]}...",
                    "user_id": state["user_id"]
                }
            )
            
            # Create planning prompt
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"][-5:]  # Last 5 messages
            ])
            
            planning_prompt = f"""Analyze the CURRENT user message and determine if you need to use tools.

IMPORTANT: Focus on the CURRENT user message. The conversation history is provided only for context - do not answer questions from previous messages.

Conversation history (chronological order - oldest to newest, for context only):
{history_context}

CURRENT user message (answer THIS): {state['user_message']}

TOOL USAGE INSTRUCTIONS:
1. **Website Scraper (FETCH)**: Use when a specific website URL is mentioned in the CURRENT message
   - Priority: ALWAYS try to use FETCH first when a URL is mentioned
   - Format: FETCH: <url>
   - Examples: "check python.org", "what's on example.com", "read the article at [URL]"
   - Use for: Getting current content from specific websites, reading articles, accessing documentation

2. **Web Search (SEARCH)**: Use when you need to find information or when FETCH fails
   - Use when: No specific URL mentioned, need to find latest news, compare multiple sources
   - Format: SEARCH: <query>
   - Examples: "latest AI news", "what is happening in...", "find information about..."
   - Fallback: If FETCH fails or URL is invalid, fall back to SEARCH

3. **Decision Priority**:
   - If URL is mentioned in CURRENT message → Use FETCH first
   - If FETCH fails → Fall back to SEARCH with relevant query
   - If no URL mentioned in CURRENT message → Use SEARCH directly if needed
   - If CURRENT message is a greeting or doesn't need external info → No tools needed

RESPOND TO THE CURRENT MESSAGE ONLY. Provide a plan that includes:
1. Which tool to use (SEARCH: <query> or FETCH: <url>) - ONLY if needed for the CURRENT message
2. Your reasoning for the tool choice
3. Your approach to answering the CURRENT message (1-2 sentences)

If no tools needed for the CURRENT message, just provide your approach."""
            
            # Create LLM and get plan
            llm = ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            plan_message = await asyncio.to_thread(
                lambda: llm.invoke([HumanMessage(content=planning_prompt)])
            )
            plan = plan_message.content if hasattr(plan_message, 'content') else str(plan_message)
            
            # Detect if tools are needed
            needs_tools = "SEARCH:" in plan or "FETCH:" in plan
            
            # Emit plan result
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.PLAN,
                    "content": plan,
                    "user_id": state["user_id"]
                }
            )
            
            return {
                "plan": plan,
                "needs_tools": needs_tools,
                "tool_results": [],
                "step_index": state["step_index"] + 1
            }
        
        except Exception as e:
            logger.error(f"Plan node error: {e}")
            raise
    
    async def _route_tools_node(self, state: AgentState) -> Dict[str, Any]:
        """Route tools node: determine if tools should be executed"""
        # This node just passes through - routing is handled by conditional edge
        return {}
    
    async def _execute_tools_node(self, state: AgentState) -> Dict[str, Any]:
        """Execute tools node: run web search or website fetch"""
        try:
            tool_results = []
            plan = state["plan"]
            
            # Extract search queries
            if "SEARCH:" in plan:
                search_start = plan.find("SEARCH:") + 7
                search_end = plan.find("\n", search_start)
                if search_end == -1:
                    search_end = len(plan)
                search_query = plan[search_start:search_end].strip()
                
                # Emit tool call step
                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"],
                        "kind": AgentStepKind.TOOL_CALL,
                        "content": f"Searching the web for: {search_query}",
                        "tool_name": "search_web",
                        "tool_input": {"query": search_query},
                        "user_id": state["user_id"]
                    }
                )
                
                # Execute search
                search_result = await search_web(query=search_query, max_results=5)
                tool_results.append({
                    "tool": "search_web",
                    "input": search_query,
                    "output": search_result
                })
                
                # Emit tool result step
                result_summary = f"Found {len(search_result.get('results', []))} results"
                if search_result.get("answer"):
                    result_summary += f": {search_result['answer'][:200]}"
                
                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"] + 1,
                        "kind": AgentStepKind.TOOL_RESULT,
                        "content": result_summary,
                        "tool_name": "search_web",
                        "user_id": state["user_id"]
                    }
                )
            
            # Extract URLs to fetch
            if "FETCH:" in plan:
                fetch_start = plan.find("FETCH:") + 6
                fetch_end = plan.find("\n", fetch_start)
                if fetch_end == -1:
                    fetch_end = len(plan)
                url = plan[fetch_start:fetch_end].strip()
                
                # Emit tool call step
                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"],
                        "kind": AgentStepKind.TOOL_CALL,
                        "content": f"Fetching website: {url}",
                        "tool_name": "fetch_website",
                        "tool_input": {"url": url},
                        "user_id": state["user_id"]
                    }
                )
                
                # Execute fetch
                fetch_result = await fetch_website(url=url)
                
                # Check if fetch was successful
                if fetch_result.get("success"):
                    tool_results.append({
                        "tool": "fetch_website",
                        "input": url,
                        "output": fetch_result
                    })
                    
                    # Emit tool result step
                    result_summary = f"Fetched: {fetch_result.get('title', 'N/A')}"
                    if fetch_result.get("content"):
                        result_summary += f" ({len(fetch_result['content'])} characters)"
                    
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.STEP,
                        payload={
                            "step_index": state["step_index"] + 1,
                            "kind": AgentStepKind.TOOL_RESULT,
                            "content": result_summary,
                            "tool_name": "fetch_website",
                            "user_id": state["user_id"]
                        }
                    )
                else:
                    # FETCH failed, fall back to web search
                    error_msg = fetch_result.get("error", "Unknown error")
                    logger.warning(f"FETCH failed for {url}: {error_msg}. Falling back to web search.")
                    
                    # Emit failure result
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.STEP,
                        payload={
                            "step_index": state["step_index"] + 1,
                            "kind": AgentStepKind.TOOL_RESULT,
                            "content": f"Failed to fetch website: {error_msg}. Trying web search instead...",
                            "tool_name": "fetch_website",
                            "user_id": state["user_id"]
                        }
                    )
                    
                    # Extract domain or create search query from URL
                    from urllib.parse import urlparse
                    parsed_url = urlparse(url)
                    domain = parsed_url.netloc or url
                    fallback_query = f"site:{domain} OR {state['user_message'][:100]}"
                    
                    # Emit fallback search
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.STEP,
                        payload={
                            "step_index": state["step_index"] + 2,
                            "kind": AgentStepKind.TOOL_CALL,
                            "content": f"Searching web as fallback: {fallback_query}",
                            "tool_name": "search_web",
                            "tool_input": {"query": fallback_query},
                            "user_id": state["user_id"]
                        }
                    )
                    
                    # Execute fallback search
                    search_result = await search_web(query=fallback_query, max_results=5)
                    tool_results.append({
                        "tool": "search_web",
                        "input": fallback_query,
                        "output": search_result
                    })
                    
                    # Emit search result
                    result_summary = f"Found {len(search_result.get('results', []))} results"
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.STEP,
                        payload={
                            "step_index": state["step_index"] + 3,
                            "kind": AgentStepKind.TOOL_RESULT,
                            "content": result_summary,
                            "tool_name": "search_web",
                            "user_id": state["user_id"]
                        }
                    )
            
            return {"tool_results": tool_results, "step_index": state["step_index"] + 2}
        
        except Exception as e:
            logger.error(f"Execute tools node error: {e}")
            # Continue with empty results on error
            return {"tool_results": [], "step_index": state["step_index"] + 1}
    
    async def _generate_node(self, state: AgentState) -> Dict[str, Any]:
        """Generate node: create response based on plan"""
        try:
            # Emit generation step
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.TOOL_CALL,
                    "content": "Calling LLM to generate response...",
                    "user_id": state["user_id"]
                }
            )
            
            # Build messages for generation
            system_prompt = """You are a helpful AI assistant. Provide clear, concise, and accurate responses.
Based on the plan and any tool results provided, generate a natural response to the user."""
            
            # Reverse to show oldest to newest (chronological order)
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"]
            ])
            
            # Include tool results if available
            tool_context = ""
            if state.get("tool_results"):
                tool_context = "\n\nTool Results:\n"
                for result in state["tool_results"]:
                    tool_context += f"\n{result['tool']}({result['input']}):\n"
                    output = result['output']
                    if isinstance(output, dict):
                        if 'results' in output:  # Search results
                            for item in output['results'][:3]:  # Top 3 results
                                tool_context += f"- {item.get('title', '')}: {item.get('content', '')[:200]}...\n"
                        elif 'content' in output:  # Website content
                            tool_context += f"{output['content'][:1000]}...\n"
            
            generation_prompt = f"""Previous plan: {state['plan']}
{tool_context}

Conversation history:
{history_context}

User message: {state['user_message']}

Generate a helpful response based on the plan and tool results above."""
            
            # Create LLM and stream response
            llm = ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                api_key=os.getenv("OPENAI_API_KEY"),
                streaming=True
            )
            
            full_response = ""
            
            # Use asyncio to run sync streaming in thread
            def stream_response():
                stream = llm.stream([
                    HumanMessage(content=system_prompt),
                    HumanMessage(content=generation_prompt)
                ])
                return list(stream)
            
            stream_tokens = await asyncio.to_thread(stream_response)
            
            for token_msg in stream_tokens:
                if hasattr(token_msg, 'content'):
                    chunk = token_msg.content                    
                    if chunk:
                        full_response += chunk
                        # Emit token in real-time
                        await self.chat_service.handle_response_events(
                            conversation_id=state["conversation_id"],
                            response_id=state["message_id"],
                            event_type=AgentEventType.TOKEN,
                            payload={
                                "chunk": chunk,
                                "is_final": False,
                                "user_id": state["user_id"]
                            }
                        )
            
            return {"response": full_response, "step_index": state["step_index"] + 1}
        
        except Exception as e:
            logger.error(f"Generate node error: {e}")
            raise
    
    async def _finalize_node(self, state: AgentState) -> Dict[str, Any]:
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
                    "content": "Response finalized and ready",
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
        """Run the LangGraph and save the final response.

        This creates or uses a message ID, builds the agent state, executes the graph,
        and streams/saves the result via chat_service.
        
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
                        "temperature": self.temperature
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
            initial_state: AgentState = {
                "conversation_id": str(conversation.id),
                "message_id": message_id,
                "user_id": conversation.created_by,
                "user_message": str(user_message.content or ""),
                "conversation_history": history_dicts,
                "plan": "",
                "needs_tools": False,
                "tool_results": [],
                "response": "",
                "step_index": 0
            }
            
            # Execute the graph
            logger.info(f"Starting LangGraph execution for conversation {conversation.id} with message_id {message_id}")
            if self.graph:
                final_state = await self.graph.ainvoke(initial_state)
            else:
                final_state = initial_state
            
            # Emit completion event - this will update the existing message content
            await self.chat_service.handle_response_events(
                conversation_id=str(conversation.id),
                response_id=message_id,
                event_type=AgentEventType.COMPLETE,
                payload={
                    "content": final_state.get("response", ""),
                    "metadata": {
                        "model": self.model,
                        "temperature": self.temperature,
                        "plan": final_state.get("plan", "")
                    },
                    "workspace_id": conversation.workspace_id,
                    "user_id": conversation.created_by,
                    "ai_model": self.model,
                    "message_id": message_id  # Pass message_id to update existing message
                }
            )
            
            logger.info(f"Response completed for conversation {conversation.id}, message ID: {message_id}")
            
            # Return None since message already exists and was updated
            return None
        
        except Exception as e:
            logger.exception(f"DefaultAgent response generation failed: {e}")
            # Emit error event
            await self.chat_service.handle_response_events(
                conversation_id=str(conversation.id),
                response_id=message_id,
                event_type=AgentEventType.ERROR,
                payload={
                    "error": str(e),
                    "code": "AGENT_ERROR",
                    "user_id": conversation.created_by
                }
            )
            return None
