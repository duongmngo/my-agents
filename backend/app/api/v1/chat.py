"""
Chat API endpoints for conversations and messages
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Optional
import logging

from app.core.dependencies import get_current_user
from app.models import User
from app.services.chat_service import ChatService
from app.services.workspace_service import WorkspaceService
from app.services.ai_service import ai_service
from app.schemas.chat_schemas import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    AgentResponse,
    ConversationSearch,
    ConversationStats
)
import asyncio
from app.core.websocket import websocket_endpoint

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_user_workspace_id(user_id: str) -> Optional[str]:
    """Helper function to get user's workspace ID using service layer"""
    # Note: WorkspaceService still requires db refactoring to follow the convention
    # Use service to get user's workspace
    workspace_service = WorkspaceService()
    workspaces_data = workspace_service.get_user_workspaces(user_id)
    if workspaces_data:
        return workspaces_data[0]['id']
    return None


# Conversation endpoints

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversation = chat_service.create_conversation(
        conversation_data, 
        current_user.id, 
        workspace_id
    )
    
    return conversation


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    skip: int = 0,
    limit: int = 20,
    agent_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get conversations for the current user"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversations = chat_service.get_conversations(
        current_user.id,
        workspace_id,
        skip=skip,
        limit=limit,
        agent_id=agent_id,
        search=search
    )
    
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversation = chat_service.get_conversation(
        conversation_id, 
        current_user.id, 
        workspace_id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    conversation_data: ConversationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversation = chat_service.update_conversation(
        conversation_id,
        conversation_data,
        current_user.id,
        workspace_id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )
    
    return conversation


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    success = chat_service.delete_conversation(
        conversation_id,
        current_user.id,
        workspace_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )
    
    return {"message": "Conversation deleted successfully"}


# Message endpoints

@router.post("/messages", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new message"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    
    try:
        message = chat_service.create_message(
            message_data,
            current_user.id,
            workspace_id
        )
        
        # If this is a user message and the conversation has an agent, generate AI response
        if (message_data.type != "ai_response" and 
            message.conversation.agent_id and 
            message.conversation.agent.is_available):
            
            # Get conversation history
            conversation_history = chat_service.get_messages(
                message.conversation_id,
                current_user.id,
                workspace_id,
                limit=20
            )
            
            # Generate AI response asynchronously
            from app.services.ai_service import AIService
            ai_service = AIService()
            
            asyncio.create_task(
                ai_service.generate_agent_response(
                    message.conversation.agent,
                    message.conversation,
                    message,
                    conversation_history
                )
            )
        
        return message
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    before_message_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get messages for a conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    messages = chat_service.get_messages(
        conversation_id,
        current_user.id,
        workspace_id,
        skip=skip,
        limit=limit,
        before_message_id=before_message_id
    )
    
    return messages


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a message"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    message = chat_service.update_message(
        message_id,
        message_data,
        current_user.id,
        workspace_id
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or access denied"
        )
    
    return message


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a message"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    success = chat_service.delete_message(
        message_id,
        current_user.id,
        workspace_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or access denied"
        )
    
    return {"message": "Message deleted successfully"}


# Agent integration endpoints

@router.post("/conversations/{conversation_id}/attach-agent")
async def attach_agent_to_conversation(
    conversation_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Attach an agent to a conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversation = chat_service.attach_agent_to_conversation(
        conversation_id,
        agent_id,
        current_user.id,
        workspace_id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation or agent not found"
        )
    
    return {"message": "Agent attached successfully"}


@router.delete("/conversations/{conversation_id}/detach-agent")
async def detach_agent_from_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Detach agent from a conversation"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    conversation = chat_service.detach_agent_from_conversation(
        conversation_id,
        current_user.id,
        workspace_id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {"message": "Agent detached successfully"}


@router.get("/agents", response_model=List[AgentResponse])
async def get_available_agents(
    current_user: User = Depends(get_current_user)
):
    """Get available agents for the current workspace"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    agents = chat_service.get_available_agents(workspace_id)
    
    return agents


# Statistics endpoints

@router.get("/stats", response_model=ConversationStats)
async def get_conversation_stats(
    current_user: User = Depends(get_current_user)
):
    """Get conversation statistics for the current workspace"""
    workspace_id = _get_user_workspace_id(current_user.id)
    
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    chat_service = ChatService()
    stats = chat_service.get_conversation_stats(workspace_id)
    
    return stats


# WebSocket endpoint

@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """WebSocket endpoint for real-time chat"""
    await websocket_endpoint(websocket, conversation_id, current_user)
