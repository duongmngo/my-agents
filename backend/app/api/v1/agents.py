"""
Agent management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import logging

from app.models.user import User
from app.schemas.chat_schemas import AgentCreate, AgentUpdate, AgentResponse
from app.services.agent_service import AgentService
from app.core.dependencies import get_current_user
from app.ai.agents.common.loader import get_built_in_agents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=List[AgentResponse], response_model_by_alias=True)
async def get_agents(
    agent_type: Optional[str] = Query(None, description="Filter by agent type: default-agent or user-agent"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user)
):
    """Get all agents for the current workspace, including built-in agents"""
    agent_service = AgentService()
    result = agent_service.get_agents_for_user(
        user_id=current_user.id,
        agent_type=agent_type,
        is_active=is_active
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "workspace not found" in result["error"].lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    # Convert ORM objects to Pydantic models for proper serialization
    agents = result["data"]
    agent_responses = [AgentResponse.from_orm_object(agent) for agent in agents]
    
    # Add built-in agents
    try:
        from datetime import datetime
        built_in_agents = get_built_in_agents()
        # Convert built-in agents to response format
        for built_in_agent in built_in_agents:
            # Set required fields for serialization (keep original id from built_in.json)
            built_in_agent.workspace_id = str(result.get("workspace_id", ""))
            built_in_agent.created_by = str(current_user.id)
            built_in_agent.created_at = datetime.now()
            built_in_agent.updated_at = datetime.now()
            built_in_agent_res = AgentResponse.from_orm_object(built_in_agent)
            built_in_agent_res.is_built_in = True            
            agent_responses.append(built_in_agent_res)
    except Exception as e:
        logger.warning(f"Failed to load built-in agents: {e}")
    
    return agent_responses


@router.get("/{agent_id}", response_model=AgentResponse, response_model_by_alias=True)
async def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single agent by ID"""
    agent_service = AgentService()
    result = agent_service.get_agent_for_user(
        agent_id=agent_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    
    # Convert ORM object to Pydantic model
    return AgentResponse.from_orm_object(result["data"])


@router.post("", response_model=AgentResponse, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new agent"""
    agent_service = AgentService()
    result = agent_service.create_agent_for_user(
        agent_data=agent_data.model_dump(),
        user_id=current_user.id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "workspace not found" in result["error"].lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    # Convert ORM object to Pydantic model
    return AgentResponse.model_validate(result["data"])


@router.put("/{agent_id}", response_model=AgentResponse, response_model_by_alias=True)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing agent"""
    agent_service = AgentService()
    result = agent_service.update_agent_for_user(
        agent_id=agent_id,
        agent_data=agent_data.model_dump(exclude_unset=True),
        user_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        if "not found" in error_detail.lower():
            status_code = status.HTTP_404_NOT_FOUND
        elif "cannot edit" in error_detail.lower():
            status_code = status.HTTP_403_FORBIDDEN
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        raise HTTPException(
            status_code=status_code,
            detail=error_detail
        )
    
    # Convert ORM object to Pydantic model
    return AgentResponse.from_orm_object(result["data"])


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an agent (soft delete)"""
    agent_service = AgentService()
    result = agent_service.delete_agent_for_user(
        agent_id=agent_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        if "not found" in error_detail.lower():
            status_code = status.HTTP_404_NOT_FOUND
        elif "cannot delete" in error_detail.lower():
            status_code = status.HTTP_403_FORBIDDEN
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        raise HTTPException(
            status_code=status_code,
            detail=error_detail
        )
    
    return None


@router.post("/{agent_id}/duplicate", response_model=AgentResponse, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
async def duplicate_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Duplicate an existing agent"""
    agent_service = AgentService()
    result = agent_service.duplicate_agent_for_user(
        agent_id=agent_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in result["error"].lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    # Convert ORM object to Pydantic model
    return AgentResponse.from_orm_object(result["data"])
