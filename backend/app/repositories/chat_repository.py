"""
Chat repository for data access layer
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime

from app.core.database import SessionLocal
from app.models import Conversation, Message, Agent
from app.models.message import MessageType, ConversationType, ConversationParticipant
from app.models.agent import AgentStatus
from app.repositories.base_repository import BaseRepository


class ChatRepository(BaseRepository[Conversation]):
    """Repository for chat-related data access"""
    
    def __init__(self):
        super().__init__(Conversation)
    
    # Conversation Repository Methods
    
    def create_conversation(self, conversation: Conversation) -> Conversation:
        """Create a new conversation"""
        with self._get_db() as db:
            db.add(conversation)
            db.flush()  # Flush to persist
            db.refresh(conversation)
            # Context manager auto-commits on exit
        return conversation
    
    def get_conversation_by_id(
        self, 
        conversation_id: str, 
        workspace_id: str
    ) -> Optional[Conversation]:
        """Get conversation by ID with workspace filtering"""
        with self._get_db() as db:
            return db.query(Conversation).filter(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False
                )
            ).first()
    
    def get_conversation_with_access(
        self, 
        conversation_id: str, 
        user_id: str, 
        workspace_id: str
    ) -> Optional[Conversation]:
        """Get conversation with user access control"""
        with self._get_db() as db:
            return db.query(Conversation).filter(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False,
                    or_(
                        Conversation.created_by == user_id,
                        Conversation.participants.any(
                            and_(
                                ConversationParticipant.user_id == user_id,
                                ConversationParticipant.is_active == True
                            )
                        )
                    )
                )
            ).first()
    
    def get_conversations_by_user(
        self, 
        user_id: str, 
        workspace_id: str, 
        skip: int = 0, 
        limit: int = 20,
        agent_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Conversation]:
        """Get conversations for a user with filtering"""
        with self._get_db() as db:
            query = db.query(Conversation).filter(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False,
                    or_(
                        Conversation.created_by == user_id,
                        Conversation.participants.any(
                            and_(
                                ConversationParticipant.user_id == user_id,
                                ConversationParticipant.is_active == True
                            )
                        )
                    )
                )
            )
            
            if agent_id:
                query = query.filter(Conversation.agent_id == agent_id)
            
            if search:
                query = query.filter(
                    or_(
                        Conversation.title.ilike(f"%{search}%"),
                        Conversation.description.ilike(f"%{search}%")
                    )
                )
            
            return query.order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()

    def get_conversations_count_by_user(
        self,
        user_id: str,
        workspace_id: str,
        agent_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        """Get total count of conversations for a user with filtering"""
        with self._get_db() as db:
            query = db.query(Conversation).filter(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False,
                    or_(
                        Conversation.created_by == user_id,
                        Conversation.participants.any(
                            and_(
                                ConversationParticipant.user_id == user_id,
                                ConversationParticipant.is_active == True
                            )
                        )
                    )
                )
            )

            if agent_id:
                query = query.filter(Conversation.agent_id == agent_id)

            if search:
                query = query.filter(
                    or_(
                        Conversation.title.ilike(f"%{search}%"),
                        Conversation.description.ilike(f"%{search}%")
                    )
                )

            return query.count()
    
    def update_conversation(self, conversation: Conversation) -> Conversation:
        """Update a conversation"""
        with self._get_db() as db:
            conversation.updated_at = datetime.utcnow()
            db.flush()  # Flush changes
            db.refresh(conversation)
            # Context manager auto-commits on exit
        return conversation
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Soft delete a conversation"""
        with self._get_db() as db:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()
            
            if not conversation:
                return False
            
            conversation.is_deleted = True
            conversation.updated_at = datetime.utcnow()
            # Context manager auto-commits on exit
        return True
    
    def get_conversation_participant(
        self, 
        conversation_id: str, 
        user_id: str
    ) -> Optional[ConversationParticipant]:
        """Get conversation participant"""
        with self._get_db() as db:
            return db.query(ConversationParticipant).filter(
                and_(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == user_id,
                    ConversationParticipant.is_active == True
                )
            ).first()
    
    def add_conversation_participant(
        self, 
        conversation_id: str, 
        user_id: str, 
        role: str = "participant"
    ) -> ConversationParticipant:
        """Add a participant to a conversation"""
        with self._get_db() as db:
            participant = ConversationParticipant(
                conversation_id=conversation_id,
                user_id=user_id,
                role=role,
                is_active=True
            )
            
            db.add(participant)
            db.flush()  # Flush to persist
            db.refresh(participant)
            # Context manager auto-commits on exit
        return participant
    
    # Message Repository Methods
    
    def create_message(self, message: Message) -> Message:
        """Create a new message"""
        db = self.db if self.db else SessionLocal()
        try:
            db.add(message)
            db.commit()
            db.refresh(message)
            
            # Eagerly load conversation relationship and its attributes
            # to prevent DetachedInstanceError when used in background tasks
            _ = message.conversation
            if message.conversation:
                _ = message.conversation.agent_id
                _ = message.conversation.type
                _ = message.conversation.workspace_id
            
            # Access message attributes to ensure they're loaded
            _ = message.type
            _ = message.content
            _ = message.conversation_id
            
            # Expunge from session to prevent DetachedInstanceError in background tasks
            db.expunge(message)
            if message.conversation:
                db.expunge(message.conversation)
            
            return message
        except Exception:
            db.rollback()
            raise
        finally:
            if not self.db:
                db.close()
    
    def get_message_by_id(
        self, 
        message_id: str, 
        workspace_id: str
    ) -> Optional[Message]:
        """Get message by ID with workspace filtering"""
        with self._get_db() as db:
            return db.query(Message).filter(
                and_(
                    Message.id == message_id,
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False
                )
            ).first()
    
    def get_messages_by_conversation(
        self, 
        conversation_id: str, 
        workspace_id: str,
        skip: int = 0,
        limit: int = 50,
        before_message_id: Optional[str] = None
    ) -> List[Message]:
        """Get messages for a conversation"""
        db = self.db if self.db else SessionLocal()
        try:
            query = db.query(Message).filter(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False
                )
            )
            
            if before_message_id:
                # Get messages before a specific message
                before_message = db.query(Message).filter(Message.id == before_message_id).first()
                if before_message:
                    query = query.filter(Message.created_at < before_message.created_at)
            
            messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
            
            # Eagerly access all attributes to ensure they're loaded before expunge
            # This prevents DetachedInstanceError when messages are used in background tasks
            for msg in messages:
                # Access all enum and lazy-loaded attributes
                _ = msg.type
                _ = msg.content
                _ = msg.sender_id
                _ = msg.attachments
                _ = msg.message_metadata
                _ = msg.ai_model
                _ = msg.ai_prompt_tokens
                _ = msg.ai_completion_tokens
                # Expunge to prevent lazy loading attempts after session closes
                db.expunge(msg)
            
            return messages
        finally:
            if not self.db:
                db.close()
    
    def update_message(self, message: Message) -> Message:
        """Update a message"""
        with self._get_db() as db:
            message.updated_at = datetime.utcnow()
            db.flush()  # Flush changes
            db.refresh(message)
            # Context manager auto-commits on exit
        return message
    
    def delete_message(self, message_id: str) -> bool:
        """Soft delete a message"""
        with self._get_db() as db:
            message = db.query(Message).filter(Message.id == message_id).first()
            
            if not message:
                return False
            
            message.is_deleted = True
            message.updated_at = datetime.utcnow()
            # Context manager auto-commits on exit
        return True
    
    def increment_conversation_message_count(self, conversation_id: str) -> bool:
        """Increment conversation message count"""
        with self._get_db() as db:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()
            
            if not conversation:
                return False
            
            conversation.message_count += 1
            conversation.updated_at = datetime.utcnow()
            # Context manager auto-commits on exit
        return True
    
    def decrement_conversation_message_count(self, conversation_id: str) -> bool:
        """Decrement conversation message count"""
        with self._get_db() as db:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()
            
            if not conversation:
                return False
            
            conversation.message_count = max(0, conversation.message_count - 1)
            conversation.updated_at = datetime.utcnow()
            # Context manager auto-commits on exit
        return True
    
    # Additional methods leveraging base repository
    
    def get_conversations_by_workspace(
        self, 
        workspace_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Conversation]:
        """Get conversations by workspace using base repository"""
        return self.filter_by(
            {"workspace_id": workspace_id}, 
            skip=skip, 
            limit=limit
        )
    
    def search_conversations(
        self, 
        workspace_id: str, 
        search_term: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Conversation]:
        """Search conversations by title and description"""
        with self._get_db() as db:
            query = db.query(Conversation).filter(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False,
                    or_(
                        Conversation.title.ilike(f"%{search_term}%"),
                        Conversation.description.ilike(f"%{search_term}%")
                    )
                )
            )
            
            return query.order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()
    
    def get_conversations_by_agent(
        self, 
        agent_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Conversation]:
        """Get conversations by agent using base repository"""
        return self.filter_by(
            {"agent_id": agent_id}, 
            skip=skip, 
            limit=limit
        )
    
    # Statistics Repository Methods
    
    def get_conversation_stats(self, workspace_id: str) -> Dict[str, int]:
        """Get conversation statistics for a workspace"""
        with self._get_db() as db:
            total_conversations = self.count({"workspace_id": workspace_id})
            
            active_conversations = db.query(Conversation).filter(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.is_deleted == False,
                    Conversation.is_archived == False
                )
            ).count()
            
            total_messages = db.query(Message).filter(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False
                )
            ).count()
            
            return {
                "total_conversations": total_conversations,
                "active_conversations": active_conversations,
                "total_messages": total_messages
            }
    
    def get_messages_today(self, workspace_id: str) -> int:
        """Get message count for today"""
        with self._get_db() as db:
            today = datetime.utcnow().date()
            return db.query(Message).filter(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False,
                    func.date(Message.created_at) == today
                )
            ).count()
    
    def get_messages_this_week(self, workspace_id: str) -> int:
        """Get message count for this week"""
        with self._get_db() as db:
            week_start = datetime.utcnow().date() - datetime.timedelta(days=7)
            return db.query(Message).filter(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False,
                    func.date(Message.created_at) >= week_start
                )
            ).count()
    
    def get_messages_this_month(self, workspace_id: str) -> int:
        """Get message count for this month"""
        with self._get_db() as db:
            month_start = datetime.utcnow().date().replace(day=1)
            return db.query(Message).filter(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.is_deleted == False,
                    func.date(Message.created_at) >= month_start
                )
            ).count()
