"""
Chat API endpoints for conversations and messages
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Optional
import logging

from app.core.dependencies import get_current_user, get_workspace_id_from_header
from app.models import User
from app.models.message import MessageStatus
from app.services.chat_service import ChatService
from app.services.workspace_service import WorkspaceService
from app.services.ai_service import ai_service
from app.schemas.chat_schemas import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    AgentResponse,
    ConversationSearch,
    ConversationStats
)
from app.api.v1.dtos.chat_dtos import (
    ConversationCreateRequest as ConversationCreateDto,
    ConversationCreateResponse as ConversationCreateResponseDto,
    ConversationItem as ConversationItemDto,
    ConversationResponseDto as ConversationResponseDto,
    ConversationListResponse as ConversationListResponseDto,
    MessageItem as MessageItemDto,
    MessageResponseDto as MessageResponseDto,
    MessageCreateRequest as MessageCreateRequestDto,
)
import asyncio


logger = logging.getLogger(__name__)

router = APIRouter()


# Conversation endpoints

@router.post("/conversations", response_model=ConversationCreateResponseDto)
async def create_conversation(
    conversation_data: ConversationCreate,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    logger.info("Creating conversation for user=%s workspace=%s", current_user.id, workspace_id)
    logger.info("Conversation data: title=%s, agent_type=%s, agent_id=%s", 
                conversation_data.title, conversation_data.agent_type, conversation_data.agent_id)
    chat_service = ChatService()
    conversation = chat_service.create_conversation(
        conversation_data,
        current_user.id,
        workspace_id
    )

    # Fetch agent name based on agent type
    from app.services.agent_service import AgentService
    agent_service = AgentService()
    agent_name = agent_service.get_agent_info(conversation.agent_type, conversation.agent_id)

    # Build DTO item explicitly to ensure camelCase aliases are applied
    conv_item = ConversationItemDto(
        id=conversation.id,
        title=conversation.title,
        type=conversation.type.value if hasattr(conversation.type, 'value') else conversation.type,
        agentType=conversation.agent_type,
        agentId=conversation.agent_id,
        agentName=agent_name,
        workspaceId=conversation.workspace_id,
        createdBy=conversation.created_by,
        participantCount=conversation.participant_count,
        messageCount=conversation.message_count,
        createdAt=conversation.created_at,
        updatedAt=conversation.updated_at
    )

    return ConversationCreateResponseDto(conversation=conv_item)


@router.get("/conversations", response_model=ConversationListResponseDto)
async def get_conversations(
    skip: int = 0,
    limit: int = 20,
    agent_id: Optional[str] = None,
    search: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Get conversations for the current user"""
    chat_service = ChatService()
    result = chat_service.get_conversations_with_count(
        current_user.id,
        workspace_id,
        skip=skip,
        limit=limit,
        agent_id=agent_id,
        search=search
    )

    # Fetch agent names for all conversations
    from app.services.agent_service import AgentService
    agent_service = AgentService()

    # Build DTO items
    dto_items = []
    for conv in result.get("conversations", []):
        agent_name = agent_service.get_agent_info(conv.agent_type, conv.agent_id)
        dto_items.append(
            ConversationItemDto(
                id=conv.id,
                title=conv.title,
                type=conv.type.value if hasattr(conv.type, 'value') else conv.type,
                agentType=conv.agent_type,
                agentId=conv.agent_id,
                agentName=agent_name,
                workspaceId=conv.workspace_id,
                createdBy=conv.created_by,
                participantCount=conv.participant_count,
                messageCount=conv.message_count,
                createdAt=conv.created_at,
                updatedAt=conv.updated_at,
            )
        )

    return ConversationListResponseDto(
        conversations=dto_items,
        total=result.get("total", len(dto_items)),
        skip=skip,
        limit=limit
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponseDto)
async def get_conversation(
    conversation_id: str,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation"""
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
    
    # Fetch agent name based on agent type
    from app.services.agent_service import AgentService
    agent_service = AgentService()
    agent_name = agent_service.get_agent_info(conversation.agent_type, conversation.agent_id)
    
    # Build DTO item explicitly to ensure camelCase aliases are applied
    conv_item = ConversationItemDto(
        id=conversation.id,
        title=conversation.title,
        type=conversation.type.value if hasattr(conversation.type, 'value') else conversation.type,
        agentType=conversation.agent_type,
        agentId=conversation.agent_id,
        agentName=agent_name,
        workspaceId=conversation.workspace_id,
        createdBy=conversation.created_by,
        participantCount=conversation.participant_count,
        messageCount=conversation.message_count,
        createdAt=conversation.created_at,
        updatedAt=conversation.updated_at
    )

    return ConversationResponseDto(conversation=conv_item)


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    conversation_data: ConversationUpdate,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Update a conversation"""
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
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation"""
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

@router.post("/messages", response_model=MessageResponseDto)
async def create_message(
    message_data: MessageCreate,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Create a new message"""
    chat_service = ChatService()
    
    try:
        message = chat_service.create_message(
            message_data,
            current_user.id,
            workspace_id
        )
        
        # If this is a user message then generate an AI response.
        # Prefer conversation-attached agent when present and available,
        # otherwise use the project's DefaultAgent (langgraph-backed).
        if message_data.type != "ai_response":
            # Get conversation history
            conversation_history = chat_service.get_messages(
                message.conversation_id,
                current_user.id,
                workspace_id,
                limit=20
            )
            
            # Reverse to chronological order (oldest to newest)
            conversation_history.reverse()

            # Resolve runtime agent implementation and delegate
            from app.ai.agents.common.agent_factory import AgentFactory, AgentType

            # Get agent_type and agent_id from conversation, with defaults
            agent_type_str = message.conversation.agent_type or AgentType.BUILT_IN.value
            agent_type = AgentType(agent_type_str) if agent_type_str in [e.value for e in AgentType] else AgentType.BUILT_IN
            agent_id = message.conversation.agent_id or "default"

            runtime_agent = AgentFactory.get_agent(
                agent_type=agent_type,
                agent_id=agent_id,
                workspace_id=workspace_id,
                chat_service=chat_service
            )

            if not runtime_agent:
                logger.warning(
                    "No runtime agent could be determined for conversation=%s agent_id=%s",
                    message.conversation_id,
                    message.conversation.agent_id,
                )
            
            else:
                # Create an empty AI response message upfront to get its ID for streaming
                # This allows streaming to persist across page reloads
                ai_response_message = chat_service.create_message(
                    MessageCreate(
                        conversation_id=message.conversation_id,
                        content="",  # Empty content, will be updated via streaming
                        type="ai_response",
                        status=MessageStatus.STREAMING  # Mark as streaming
                    ),
                    current_user.id,
                    workspace_id
                )
                
                logger.info(f"Created empty AI response message {ai_response_message.id} for streaming")
                
                # Start agent task with the pre-created message ID
                asyncio.create_task(
                    runtime_agent.generate_agent_response(
                        message.conversation,
                        message,
                        conversation_history,
                        stream=True,
                        response_message_id=ai_response_message.id
                    )
                )            
            
        
        # Build DTO to return camelCase response
        msg_item = MessageItemDto(
            id=message.id,
            conversationId=message.conversation_id,
            content=message.content,
            type=message.type.value if hasattr(message.type, 'value') else message.type,
            status=message.status.value if message.status and hasattr(message.status, 'value') else None,
            senderId=message.sender_id,
            isEdited=message.is_edited,
            isDeleted=message.is_deleted,
            isPinned=message.is_pinned,
            replyToMessageId=message.reply_to_message_id if message.reply_to_message_id else None,
            threadId=message.thread_id,
            attachments=message.attachments,
            metadata=message.message_metadata,
            aiModel=message.ai_model,
            aiPromptTokens=message.ai_prompt_tokens,
            aiCompletionTokens=message.ai_completion_tokens,
            createdAt=message.created_at,
            updatedAt=message.updated_at,
            role='assistant' if message.type.value == 'ai_response' else 'user'
        )

        return MessageResponseDto(data=msg_item)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageItemDto])
async def get_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    before_message_id: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a conversation"""
    chat_service = ChatService()
    messages = chat_service.get_messages(
        conversation_id,
        current_user.id,
        workspace_id,
        skip=skip,
        limit=limit,
        before_message_id=before_message_id
    )

    # Build DTO list to ensure camelCase output
    dto_list = []
    for m in messages:
        # Parse metadata to extract steps
        steps = None
        if m.message_metadata:
            try:
                import json
                metadata_dict = json.loads(m.message_metadata) if isinstance(m.message_metadata, str) else m.message_metadata
                if isinstance(metadata_dict, dict) and "steps" in metadata_dict:
                    steps = metadata_dict["steps"]
            except:
                pass
        
        dto_list.append(
            MessageItemDto(
                id=m.id,
                conversationId=m.conversation_id,
                content=m.content,
                type=m.type.value if hasattr(m.type, 'value') else m.type,
                status=m.status.value if m.status and hasattr(m.status, 'value') else None,
                senderId=m.sender_id,
                isEdited=m.is_edited,
                isDeleted=m.is_deleted,
                isPinned=m.is_pinned,
                replyToMessageId=m.reply_to_message_id if m.reply_to_message_id else None,
                threadId=m.thread_id,
                attachments=m.attachments,
                metadata=m.message_metadata,
                steps=steps,  # Include extracted steps
                aiModel=m.ai_model,
                aiPromptTokens=m.ai_prompt_tokens,
                aiCompletionTokens=m.ai_completion_tokens,
                createdAt=m.created_at,
                updatedAt=m.updated_at,
                role='assistant' if m.type.value == 'ai_response' else 'user'
            )
        )

    return dto_list


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    message_data: MessageUpdate,
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Update a message"""
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
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Delete a message"""
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
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Attach an agent to a conversation"""
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
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Detach agent from a conversation"""
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
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Get available agents for the current workspace"""
    chat_service = ChatService()
    agents = chat_service.get_available_agents(workspace_id)
    
    return agents


# Statistics endpoints

@router.get("/stats", response_model=ConversationStats)
async def get_conversation_stats(
    workspace_id: str = Depends(get_workspace_id_from_header),
    current_user: User = Depends(get_current_user)
):
    """Get conversation statistics for the current workspace"""
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
