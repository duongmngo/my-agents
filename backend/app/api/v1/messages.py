"""
Message and conversation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()


class ConversationCreate(BaseModel):
    title: str = None
    workspace_id: str
    type: str = "direct"


class MessageCreate(BaseModel):
    content: str
    conversation_id: str
    type: str = "text"


@router.post("/conversations")
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    # TODO: Implement conversation creation
    return {"conversation": {}}


@router.get("/conversations")
async def get_conversations(
    workspace_id: str = Query(...),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get conversations in workspace"""
    # TODO: Implement conversation listing
    return {"conversations": []}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages in conversation"""
    # TODO: Implement message listing
    return {"messages": []}


@router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message"""
    # TODO: Implement message sending
    return {"message": {}}
