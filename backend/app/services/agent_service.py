"""
Agent service for business logic operations
"""
from typing import Dict, Any, List, Optional
 
import logging

from app.models.agent import Agent, AgentType, AgentStatus
from app.repositories.agent_repository import AgentRepository
from app.services.workspace_service import WorkspaceService
 

logger = logging.getLogger(__name__)


class AgentService:
    """Service for agent operations"""
    def __init__(self):
        self.agent_repo = AgentRepository()
        self.workspace_service = WorkspaceService()
    
    def get_agent_info(self, agent_type: str, agent_id: str) -> Optional[str]:
        """
        Get agent name based on agent type and ID.
        For built-in agents, loads from built_in.json file.
        For custom agents, loads from database.
        
        Args:
            agent_type: Type of agent ('built_in' or 'custom')
            agent_id: Agent identifier
            
        Returns:
            Agent name if found, None otherwise
        """
        if agent_type == 'built_in' and agent_id:
            # Load from JSON file for built-in agents
            try:
                import json
                import os
                from pathlib import Path
                
                # Get path to built_in.json
                current_file = Path(__file__)
                json_path = current_file.parent.parent / 'ai' / 'agents' / 'built_in.json'
                
                if json_path.exists():
                    with open(json_path, 'r') as f:
                        built_in_agents = json.load(f)
                        
                    # Find agent by id
                    for agent in built_in_agents:
                        if agent.get('id') == agent_id:
                            return agent.get('name')
                else:
                    logger.warning(f"built_in.json not found at {json_path}")
            except Exception as e:
                logger.warning(f"Failed to load built-in agent {agent_id} from JSON: {e}")
                
        elif agent_type == 'custom' and agent_id:
            # Load from database for custom agents
            try:
                agent = self.agent_repo.get_agent_by_id(agent_id)
                if agent:
                    return agent.name
            except Exception as e:
                logger.warning(f"Failed to load custom agent {agent_id} from database: {e}")
                
        return None
    
    def get_agents(
        self,
        workspace_id: str,
        agent_type: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Get all agents for workspace with optional filters"""
        try:
            filters = {
                "workspace_id": workspace_id,
                "is_deleted": False
            }
            
            if agent_type:
                filters["agent_type"] = agent_type
            
            if is_active is not None:
                filters["is_active"] = is_active
            
            agents = self.agent_repo.get_agents_by_filters(filters)
            
            return {
                "success": True,
                "data": agents
            }
        except Exception as e:
            logger.error(f"Failed to get agents: {e}")
            return {
                "success": False,
                "error": f"Failed to get agents: {str(e)}"
            }
    
    def get_agent(self, agent_id: str, workspace_id: str) -> Dict[str, Any]:
        """Get agent by ID"""
        try:
            agent = self.agent_repo.get_agent_by_id(agent_id)
            
            if not agent:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Verify workspace access
            if agent.workspace_id != workspace_id:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            if agent.is_deleted:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            return {
                "success": True,
                "data": agent
            }
        except Exception as e:
            logger.error(f"Failed to get agent: {e}")
            return {
                "success": False,
                "error": f"Failed to get agent: {str(e)}"
            }
    
    def create_agent(
        self,
        agent_data: Dict[str, Any],
        workspace_id: str,
        created_by: str
    ) -> Dict[str, Any]:
        """Create a new agent"""
        try:
            # Validate required fields
            if not agent_data.get("name"):
                return {
                    "success": False,
                    "error": "Agent name is required"
                }
            
            # Prepare agent data
            agent_dict = {
                "name": agent_data["name"],
                "description": agent_data.get("description"),
                "instructions": agent_data.get("instructions"),
                "agent_type": agent_data.get("agent_type", "user-agent"),
                "is_built_in": False,
                "ai_model": agent_data.get("ai_model", "gpt-4"),
                "temperature": agent_data.get("temperature", "0.7"),
                "max_tokens": agent_data.get("max_tokens"),
                "capabilities": agent_data.get("capabilities"),
                "tools": agent_data.get("tools"),
                "system_prompt": agent_data.get("system_prompt"),
                "avatar_url": agent_data.get("avatar_url"),
                "color": agent_data.get("color"),
                "is_public": agent_data.get("is_public", False),
                "conversation_starters": agent_data.get("conversation_starters"),
                "workspace_id": workspace_id,
                "created_by": created_by
            }
            
            agent = self.agent_repo.create_agent(agent_dict)
            
            logger.info(f"Created agent {agent.id} ({agent.name}) for workspace {workspace_id}")
            
            return {
                "success": True,
                "data": agent,
                "message": "Agent created successfully"
            }
        except Exception as e:
            logger.error(f"Failed to create agent: {e}")
            return {
                "success": False,
                "error": f"Failed to create agent: {str(e)}"
            }
    
    def update_agent(
        self,
        agent_id: str,
        agent_data: Dict[str, Any],
        workspace_id: str
    ) -> Dict[str, Any]:
        """Update an existing agent"""
        try:
            # Get existing agent
            agent = self.agent_repo.get_agent_by_id(agent_id)
            
            if not agent:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Verify workspace access
            if agent.workspace_id != workspace_id:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            if agent.is_deleted:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Check if user can edit built-in agents
            if agent.is_built_in:
                return {
                    "success": False,
                    "error": "Cannot edit built-in agents. Create a customization or duplicate instead."
                }
            
            # Update agent
            updated_agent = self.agent_repo.update_agent(agent_id, agent_data)
            
            logger.info(f"Updated agent {agent_id} ({updated_agent.name})")
            
            return {
                "success": True,
                "data": updated_agent,
                "message": "Agent updated successfully"
            }
        except Exception as e:
            logger.error(f"Failed to update agent: {e}")
            return {
                "success": False,
                "error": f"Failed to update agent: {str(e)}"
            }
    
    def delete_agent(self, agent_id: str, workspace_id: str) -> Dict[str, Any]:
        """Delete an agent (soft delete)"""
        try:
            # Get existing agent
            agent = self.agent_repo.get_agent_by_id(agent_id)
            
            if not agent:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Verify workspace access
            if agent.workspace_id != workspace_id:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            if agent.is_deleted:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Check if user can delete built-in agents
            if agent.is_built_in:
                return {
                    "success": False,
                    "error": "Cannot delete built-in agents"
                }
            
            # Soft delete
            success = self.agent_repo.delete_agent(agent_id)
            
            if success:
                logger.info(f"Deleted agent {agent_id} ({agent.name})")
                return {
                    "success": True,
                    "message": "Agent deleted successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to delete agent"
                }
        except Exception as e:
            logger.error(f"Failed to delete agent: {e}")
            return {
                "success": False,
                "error": f"Failed to delete agent: {str(e)}"
            }
    
    def duplicate_agent(
        self,
        agent_id: str,
        workspace_id: str,
        created_by: str
    ) -> Dict[str, Any]:
        """Duplicate an existing agent"""
        try:
            # Get original agent
            original_agent = self.agent_repo.get_agent_by_id(agent_id)
            
            if not original_agent:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Verify workspace access
            if original_agent.workspace_id != workspace_id:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            if original_agent.is_deleted:
                return {
                    "success": False,
                    "error": "Agent not found"
                }
            
            # Prepare duplicate data
            duplicate_data = {
                "name": f"{original_agent.name} (Copy)",
                "description": original_agent.description,
                "instructions": original_agent.instructions,
                "agent_type": "user-agent",  # Duplicates are always user agents
                "is_built_in": False,
                "ai_model": original_agent.ai_model,
                "temperature": original_agent.temperature,
                "max_tokens": original_agent.max_tokens,
                "capabilities": original_agent.capabilities,
                "tools": original_agent.tools,
                "system_prompt": original_agent.system_prompt,
                "avatar_url": original_agent.avatar_url,
                "color": original_agent.color,
                "is_public": original_agent.is_public,
                "parent_agent_id": agent_id,
                "workspace_id": workspace_id,
                "created_by": created_by
            }
            
            duplicate = self.agent_repo.create_agent(duplicate_data)
            
            logger.info(f"Duplicated agent {agent_id} to {duplicate.id}")
            
            return {
                "success": True,
                "data": duplicate,
                "message": "Agent duplicated successfully"
            }
        except Exception as e:
            logger.error(f"Failed to duplicate agent: {e}")
            return {
                "success": False,
                "error": f"Failed to duplicate agent: {str(e)}"
            }
    
    # User-facing wrapper methods (handle workspace lookup internally)
    
    def get_agents_for_user(
        self,
        user_id: str,
        agent_type: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Get all agents for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.get_agents(workspace_id, agent_type, is_active)
        except Exception as e:
            logger.error(f"Failed to get agents for user: {e}")
            return {
                "success": False,
                "error": f"Failed to get agents: {str(e)}"
            }
    
    def get_agent_for_user(
        self,
        agent_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get agent for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.get_agent(agent_id, workspace_id)
        except Exception as e:
            logger.error(f"Failed to get agent for user: {e}")
            return {
                "success": False,
                "error": f"Failed to get agent: {str(e)}"
            }
    
    def create_agent_for_user(
        self,
        agent_data: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Create agent for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.create_agent(agent_data, workspace_id, user_id)
        except Exception as e:
            logger.error(f"Failed to create agent for user: {e}")
            return {
                "success": False,
                "error": f"Failed to create agent: {str(e)}"
            }
    
    def update_agent_for_user(
        self,
        agent_id: str,
        agent_data: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Update agent for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.update_agent(agent_id, agent_data, workspace_id)
        except Exception as e:
            logger.error(f"Failed to update agent for user: {e}")
            return {
                "success": False,
                "error": f"Failed to update agent: {str(e)}"
            }
    
    def delete_agent_for_user(
        self,
        agent_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Delete agent for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.delete_agent(agent_id, workspace_id)
        except Exception as e:
            logger.error(f"Failed to delete agent for user: {e}")
            return {
                "success": False,
                "error": f"Failed to delete agent: {str(e)}"
            }
    
    def duplicate_agent_for_user(
        self,
        agent_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Duplicate agent for user's workspace"""
        try:
            # Get user's workspace through service
            workspace_id = self.workspace_service.get_user_workspace_id(user_id)
            
            if not workspace_id:
                return {
                    "success": False,
                    "error": "Workspace not found"
                }
            
            return self.duplicate_agent(agent_id, workspace_id, user_id)
        except Exception as e:
            logger.error(f"Failed to duplicate agent for user: {e}")
            return {
                "success": False,
                "error": f"Failed to duplicate agent: {str(e)}"
            }
