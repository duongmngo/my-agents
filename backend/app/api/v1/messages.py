"""
Message and conversation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.api.v1.dtos.message_dtos import (
    ConversationCreateRequest,
    MessageCreateRequest,
    ConversationResponse,
    MessageResponse,
    ConversationListResponse,
    MessageListResponse,
    ConversationCreateResponse,
    MessageCreateResponse
)

router = APIRouter()


@router.post("/conversations", response_model=ConversationCreateResponse)
async def create_conversation(
    conversation_data: ConversationCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    # TODO: Implement conversation creation
    return ConversationCreateResponse(
        conversation=ConversationResponse(
            id="temp-id",
            title=conversation_data.title,
            type=conversation_data.type,
            workspace_id=conversation_data.workspace_id,
            created_by=current_user.id,
            participant_count=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    )


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    workspace_id: str = Query(...),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get conversations in workspace"""
    # TODO: Implement conversation listing
    return ConversationListResponse(
        conversations=[],
        total=0,
        skip=skip,
        limit=limit
    )


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conversation_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages in conversation"""
    # TODO: Implement message listing
    return MessageListResponse(
        messages=[],
        total=0,
        skip=skip,
        limit=limit
    )


@router.post("/messages", response_model=MessageCreateResponse)
async def send_message(
    message_data: MessageCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message"""
    # TODO: Implement message sending
    return MessageCreateResponse(
        message=MessageResponse(
            id="temp-id",
            content=message_data.content,
            type=message_data.type,
            conversation_id=message_data.conversation_id,
            sender_id=current_user.id,
            sender_name=current_user.full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    )
