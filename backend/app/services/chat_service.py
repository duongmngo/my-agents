"""
Chat service for managing conversations and messages
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
import logging

from app.models import Conversation, Message, Agent
from app.models.message import MessageType, ConversationType
from app.models.agent import AgentStatus
from app.repositories.chat_repository import ChatRepository
from app.repositories.agent_repository import AgentRepository
from app.schemas.chat_schemas import (
    ConversationCreate, 
    ConversationUpdate, 
    MessageCreate, 
    MessageUpdate,
    ConversationResponse,
    MessageResponse
)
from app.services.agent_event_emitter import AgentEventEmitter
from app.ai.agents.agent_event_types import AgentEventType, AgentStepKind

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat conversations and messages"""
    
    def __init__(self):
        self.chat_repo = ChatRepository()
        self.agent_repo = AgentRepository()
        self.event_emitter = AgentEventEmitter()
        # Track in-progress messages for streaming
        self._streaming_messages: Dict[str, Dict[str, Any]] = {}
    
    # Conversation Management
    
    def create_conversation(
        self, 
        conversation_data: ConversationCreate, 
        user_id: str, 
        workspace_id: str
    ) -> Conversation:
        """Create a new conversation"""
        conversation = Conversation(
            title=conversation_data.title,
            description=conversation_data.description,
            type=conversation_data.type or ConversationType.AI_CHAT,
            is_private=conversation_data.is_private,
            workspace_id=workspace_id,
            created_by=user_id,
            agent_id=conversation_data.agent_id,
            ai_model=conversation_data.ai_model,
            ai_system_prompt=conversation_data.ai_system_prompt,
            ai_temperature=conversation_data.ai_temperature,
            settings=json.dumps(conversation_data.settings) if conversation_data.settings else None
        )
        
        # Create conversation through repository
        conversation = self.chat_repo.create_conversation(conversation)
        
        # Add creator as participant
        self.chat_repo.add_conversation_participant(conversation.id, user_id, "admin")
        
        return conversation
    
    def get_conversation(self, conversation_id: str, user_id: str, workspace_id: str) -> Optional[Conversation]:
        """Get a conversation by ID with access control"""
        return self.chat_repo.get_conversation_with_access(conversation_id, user_id, workspace_id)
    
    def get_conversations(
        self, 
        user_id: str, 
        workspace_id: str, 
        skip: int = 0, 
        limit: int = 20,
        agent_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Conversation]:
        """Get conversations for a user with filtering"""
        return self.chat_repo.get_conversations_by_user(
            user_id, workspace_id, skip, limit, agent_id, search
        )

    def get_conversations_with_count(
        self,
        user_id: str,
        workspace_id: str,
        skip: int = 0,
        limit: int = 20,
        agent_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Return conversations and total count for pagination"""
        items = self.get_conversations(user_id, workspace_id, skip, limit, agent_id, search)
        total = self.chat_repo.get_conversations_count_by_user(user_id, workspace_id, agent_id, search)
        return {"conversations": items, "total": total, "skip": skip, "limit": limit}
    
    def update_conversation(
        self, 
        conversation_id: str, 
        conversation_data: ConversationUpdate, 
        user_id: str, 
        workspace_id: str
    ) -> Optional[Conversation]:
        """Update a conversation"""
        conversation = self.get_conversation(conversation_id, user_id, workspace_id)
        if not conversation:
            return None
        
        # Check if user has permission to update
        if conversation.created_by != user_id:
            # Check if user is admin participant
            participant = self.chat_repo.get_conversation_participant(conversation_id, user_id)
            if not participant or participant.role != "admin":
                return None
        
        # Update fields
        if conversation_data.title is not None:
            conversation.title = conversation_data.title
        if conversation_data.description is not None:
            conversation.description = conversation_data.description
        if conversation_data.is_private is not None:
            conversation.is_private = conversation_data.is_private
        if conversation_data.is_archived is not None:
            conversation.is_archived = conversation_data.is_archived
        if conversation_data.is_pinned is not None:
            conversation.is_pinned = conversation_data.is_pinned
        if conversation_data.agent_id is not None:
            conversation.agent_id = conversation_data.agent_id
        if conversation_data.settings is not None:
            conversation.settings = json.dumps(conversation_data.settings)
        
        return self.chat_repo.update_conversation(conversation)
    
    def delete_conversation(self, conversation_id: str, user_id: str, workspace_id: str) -> bool:
        """Soft delete a conversation"""
        conversation = self.get_conversation(conversation_id, user_id, workspace_id)
        if not conversation:
            return False
        
        # Check if user has permission to delete
        if conversation.created_by != user_id:
            return False
        
        return self.chat_repo.delete_conversation(conversation_id)
    
    # Message Management
    
    def create_message(
        self, 
        message_data: MessageCreate, 
        user_id: str, 
        workspace_id: str
    ) -> Message:
        """Create a new message"""
        # Verify conversation access
        conversation = self.get_conversation(message_data.conversation_id, user_id, workspace_id)
        if not conversation:
            raise ValueError("Conversation not found or access denied")
        
        message = Message(
            content=message_data.content,
            type=message_data.type or MessageType.TEXT,
            conversation_id=message_data.conversation_id,
            workspace_id=workspace_id,
            sender_id=user_id if message_data.type != MessageType.AI_RESPONSE else None,
            reply_to_message_id=message_data.reply_to_message_id,
            thread_id=message_data.thread_id,
            attachments=json.dumps(message_data.attachments) if message_data.attachments else None,
            message_metadata=json.dumps(message_data.metadata) if message_data.metadata else None,
            ai_model=message_data.ai_model,
            ai_prompt_tokens=message_data.ai_prompt_tokens,
            ai_completion_tokens=message_data.ai_completion_tokens
        )
        
        # Create message through repository
        message = self.chat_repo.create_message(message)
        
        # Update conversation message count
        self.chat_repo.increment_conversation_message_count(conversation.id)
        
        return message
    
    def get_messages(
        self, 
        conversation_id: str, 
        user_id: str, 
        workspace_id: str,
        skip: int = 0,
        limit: int = 50,
        before_message_id: Optional[str] = None
    ) -> List[Message]:
        """Get messages for a conversation"""
        # Verify conversation access
        conversation = self.get_conversation(conversation_id, user_id, workspace_id)
        if not conversation:
            return []
        
        return self.chat_repo.get_messages_by_conversation(
            conversation_id, workspace_id, skip, limit, before_message_id
        )
    
    def update_message(
        self, 
        message_id: str, 
        message_data: MessageUpdate, 
        user_id: str, 
        workspace_id: str
    ) -> Optional[Message]:
        """Update a message"""
        message = self.chat_repo.get_message_by_id(message_id, workspace_id)
        
        if not message or message.sender_id != user_id:
            return None
        
        if message_data.content is not None:
            message.content = message_data.content
        if message_data.is_pinned is not None:
            message.is_pinned = message_data.is_pinned
        
        message.is_edited = True
        
        return self.chat_repo.update_message(message)
    
    def delete_message(self, message_id: str, user_id: str, workspace_id: str) -> bool:
        """Soft delete a message"""
        message = self.chat_repo.get_message_by_id(message_id, workspace_id)
        
        if not message or message.sender_id != user_id:
            return False
        
        # Delete message through repository
        success = self.chat_repo.delete_message(message_id)
        
        if success:
            # Update conversation message count
            self.chat_repo.decrement_conversation_message_count(message.conversation_id)
        
        return success
    
    # Agent Integration
    
    def attach_agent_to_conversation(
        self, 
        conversation_id: str, 
        agent_id: str, 
        user_id: str, 
        workspace_id: str
    ) -> Optional[Conversation]:
        """Attach an agent to a conversation"""
        conversation = self.get_conversation(conversation_id, user_id, workspace_id)
        if not conversation:
            return None
        
        # Verify agent exists and is available
        agent = self.agent_repo.get_agent_by_id(agent_id, workspace_id)
        
        if not agent or not agent.is_available:
            return None
        
        conversation.agent_id = agent_id
        conversation.ai_model = agent.ai_model
        conversation.ai_system_prompt = agent.get_effective_system_prompt()
        conversation.ai_temperature = agent.temperature
        
        return self.chat_repo.update_conversation(conversation)
    
    def detach_agent_from_conversation(
        self, 
        conversation_id: str, 
        user_id: str, 
        workspace_id: str
    ) -> Optional[Conversation]:
        """Detach agent from a conversation"""
        conversation = self.get_conversation(conversation_id, user_id, workspace_id)
        if not conversation:
            return None
        
        conversation.agent_id = None
        conversation.ai_model = None
        conversation.ai_system_prompt = None
        conversation.ai_temperature = None
        
        return self.chat_repo.update_conversation(conversation)
    
    def get_available_agents(self, workspace_id: str) -> List[Agent]:
        """Get available agents for a workspace"""
        return self.agent_repo.get_available_agents(workspace_id)
    
    # Statistics Methods
    
    def get_conversation_stats(self, workspace_id: str) -> Dict[str, Any]:
        """Get conversation statistics for a workspace"""
        stats = self.chat_repo.get_conversation_stats(workspace_id)
        
        # Add additional time-based statistics
        stats.update({
            "messages_today": self.chat_repo.get_messages_today(workspace_id),
            "messages_this_week": self.chat_repo.get_messages_this_week(workspace_id),
            "messages_this_month": self.chat_repo.get_messages_this_month(workspace_id)
        })
        
        return stats
    
    # Agent Response Event Handling
    
    async def handle_response_events(
        self,
        conversation_id: str,
        response_id: Optional[str],
        event_type: str,
        payload: Dict[str, Any]
    ) -> Optional[str]:
        """Handle agent response events including streaming and persistence.
        
        Creates a message ID if not provided and handles different event types:
        - AgentEventType.START: Initialize streaming response
        - AgentEventType.TOKEN: Stream response chunks
        - AgentEventType.STEP: Emit agent reasoning/tool steps
        - AgentEventType.COMPLETE: Finalize and persist response
        - AgentEventType.ERROR: Handle and emit errors
        
        Args:
            conversation_id: The conversation ID
            response_id: Optional message ID (will be created if not provided)
            event_type: Type of event (use AgentEventType enum values)
            payload: Event data
            
        Returns:
            The response_id (message ID)
        """
        # Ensure Redis connection
        await self.event_emitter.connect()
        
        # Create message ID if not provided
        if not response_id:
            response_id = str(uuid.uuid4())
            logger.info(f"Created new response ID: {response_id} for conversation {conversation_id}")
        
        try:
            if event_type == AgentEventType.START:
                # Initialize streaming response tracking
                self._streaming_messages[response_id] = {
                    "conversation_id": conversation_id,
                    "content": "",
                    "metadata": payload.get("metadata", {}),
                    "step_index": 0
                }
                logger.debug(f"Started streaming response {response_id}")
                
            elif event_type == AgentEventType.TOKEN:
                # Stream token chunk
                chunk = payload.get("chunk", "")
                is_final = payload.get("is_final", False)
                
                # Accumulate content
                if response_id in self._streaming_messages:
                    self._streaming_messages[response_id]["content"] += chunk
                
                # Emit token to Redis
                await self.event_emitter.emit_token(
                    conversation_id,
                    response_id,
                    chunk,
                    is_final
                )
                logger.debug(f"Emitted token for {response_id}")
                
            elif event_type == AgentEventType.STEP:
                # Emit agent step (reasoning, tool call, etc.)
                step_index = payload.get("step_index", 0)
                kind = payload.get("kind", "reasoning")
                content = payload.get("content", "")
                tool_name = payload.get("tool_name")
                tool_input = payload.get("tool_input")
                
                await self.event_emitter.emit_step(
                    conversation_id,
                    response_id,
                    step_index,
                    kind,
                    content,
                    tool_name,
                    tool_input
                )
                
                # Update step index
                if response_id in self._streaming_messages:
                    self._streaming_messages[response_id]["step_index"] = step_index + 1
                    
                logger.debug(f"Emitted step {step_index} for {response_id}")
                
            elif event_type == AgentEventType.COMPLETE:
                # Finalize and persist response
                final_content = payload.get("content", "")
                metadata = payload.get("metadata", {})
                workspace_id = payload.get("workspace_id")
                user_id = payload.get("user_id")
                ai_model = payload.get("ai_model")
                existing_message_id = payload.get("message_id")  # Check if updating existing message
                
                # Use accumulated content if available
                if response_id in self._streaming_messages:
                    stream_data = self._streaming_messages[response_id]
                    if not final_content and stream_data["content"]:
                        final_content = stream_data["content"]
                    if not metadata:
                        metadata = stream_data.get("metadata", {})
                
                # Emit completion event
                await self.event_emitter.emit_complete(
                    conversation_id,
                    response_id,
                    final_content,
                    metadata
                )
                
                # Update existing message or create new one
                if workspace_id and user_id:
                    if existing_message_id:
                        # Update existing message content
                        existing_message = self.chat_repo.get_message_by_id(existing_message_id, workspace_id)
                        if existing_message:
                            existing_message.content = final_content
                            existing_message.ai_model = ai_model
                            existing_message.message_metadata = json.dumps(metadata) if metadata else None
                            updated_message = self.chat_repo.update_message(existing_message)
                            logger.info(f"Updated existing message {existing_message_id} with final content")
                        else:
                            logger.warning(f"Could not find existing message {existing_message_id} to update")
                    else:
                        # Create new message
                        message_create = MessageCreate(
                            content=final_content,
                            type=MessageType.AI_RESPONSE,
                            conversation_id=conversation_id,
                            ai_model=ai_model,
                            metadata=metadata
                        )
                        
                        saved_message = self.create_message(
                            message_create,
                            user_id,
                            workspace_id
                        )
                        logger.info(f"Persisted response {response_id} as new message {saved_message.id}")
                
                # Clean up streaming data
                if response_id in self._streaming_messages:
                    del self._streaming_messages[response_id]
                    
                logger.info(f"Completed response {response_id}")
                
            elif event_type == AgentEventType.ERROR:
                # Handle and emit error
                error = payload.get("error", "Unknown error")
                code = payload.get("code", "AGENT_ERROR")
                
                await self.event_emitter.emit_error(
                    conversation_id,
                    error,
                    response_id,
                    code
                )
                
                # Clean up streaming data
                if response_id in self._streaming_messages:
                    del self._streaming_messages[response_id]
                    
                logger.error(f"Error in response {response_id}: {error}")
            
            else:
                logger.warning(f"Unknown event type: {event_type}")
            
            return response_id
            
        except Exception as e:
            logger.exception(f"Error handling response event: {e}")
            # Emit error event
            await self.event_emitter.emit_error(
                conversation_id,
                str(e),
                response_id,
                "EVENT_HANDLER_ERROR"
            )
            # Clean up
            if response_id in self._streaming_messages:
                del self._streaming_messages[response_id]
            raise
