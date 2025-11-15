"""
Chat service for managing conversations and messages
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json

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


class ChatService:
    """Service for managing chat conversations and messages"""
    
    def __init__(self):
        self.chat_repo = ChatRepository()
        self.agent_repo = AgentRepository()
    
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
