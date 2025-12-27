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
from app.ai.agents.agent_event_types import AgentEventType, AgentStepKind

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

from app.ai.agents.base_agent import BaseAgent


class AgentState(TypedDict):
    """State passed through the LangGraph"""
    conversation_id: str
    message_id: str
    user_message: str
    conversation_history: List[Dict[str, str]]
    plan: str
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
        workflow.add_node("generate", self._generate_node)
        workflow.add_node("finalize", self._finalize_node)
        
        # Add edges
        workflow.add_edge(START, "plan")
        workflow.add_edge("plan", "generate")
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
                    "content": f"Analyzing user message: {state['user_message'][:100]}..."
                }
            )
            
            # Create planning prompt
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"][-5:]  # Last 5 messages
            ])
            
            planning_prompt = f"""Analyze the user's message and provide a brief plan.

Conversation history:
{history_context}

User message: {state['user_message']}

Provide a concise plan (1-2 sentences) for responding to this message."""
            
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
            
            # Emit plan result
            await self.chat_service.handle_response_events(
                conversation_id=state["conversation_id"],
                response_id=state["message_id"],
                event_type=AgentEventType.STEP,
                payload={
                    "step_index": state["step_index"],
                    "kind": AgentStepKind.PLAN,
                    "content": plan
                }
            )
            
            return {"plan": plan, "step_index": state["step_index"] + 1}
        
        except Exception as e:
            logger.error(f"Plan node error: {e}")
            raise
    
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
                    "content": "Calling LLM to generate response..."
                }
            )
            
            # Build messages for generation
            system_prompt = """You are a helpful AI assistant. Provide clear, concise, and accurate responses.
Based on the plan provided, generate a natural response to the user."""
            
            history_context = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in state["conversation_history"]
            ])
            
            generation_prompt = f"""Previous plan: {state['plan']}

Conversation history:
{history_context}

User message: {state['user_message']}

Generate a helpful response based on the plan above."""
            
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
                                "is_final": False
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
                    "content": "Response finalized and ready"
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
                    }
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
                "user_message": str(user_message.content or ""),
                "conversation_history": history_dicts,
                "plan": "",
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
                    "code": "AGENT_ERROR"
                }
            )
            return None
