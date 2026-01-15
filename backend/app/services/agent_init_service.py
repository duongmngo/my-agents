"""
Service for initializing and managing built-in agents.

This module handles the creation and updating of built-in agents
when a workspace is created or when the application starts.
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentType, AgentStatus
from app.core.agent_config import get_built_in_agents, BuiltInAgentConfig
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class AgentInitService:
    """Service for initializing built-in agents"""
    
    @staticmethod
    def initialize_built_in_agents(workspace_id: str, created_by: str, db: Optional[Session] = None) -> List[Agent]:
        """
        Initialize built-in agents for a workspace.
        
        Args:
            workspace_id: The workspace ID to create agents for
            created_by: The user ID who is creating the workspace
            db: Optional database session (will create one if not provided)
            
        Returns:
            List of created Agent objects
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
        
        try:
            created_agents = []
            built_in_configs = get_built_in_agents()
            
            for config in built_in_configs:
                # Check if agent already exists
                existing_agent = db.query(Agent).filter(
                    Agent.workspace_id == workspace_id,
                    Agent.name == config.name,
                    Agent.is_built_in == True,
                    Agent.is_deleted == False
                ).first()
                
                if existing_agent:
                    logger.info(f"Built-in agent '{config.name}' already exists for workspace {workspace_id}")
                    created_agents.append(existing_agent)
                    continue
                
                # Create new built-in agent
                agent = Agent(
                    name=config.name,
                    description=config.description,
                    instructions=config.instructions,
                    agent_type=AgentType.DEFAULT_AGENT,
                    is_built_in=True,
                    status=AgentStatus.ACTIVE,
                    is_public=config.is_public,
                    is_active=config.is_active,
                    ai_model=config.ai_model,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens,
                    capabilities=config.capabilities,
                    tools=config.tools,
                    system_prompt=config.system_prompt,
                    avatar_url=config.avatar_url,
                    color=config.color,
                    version=config.version,
                    workspace_id=workspace_id,
                    created_by=created_by,
                )
                
                db.add(agent)
                created_agents.append(agent)
                logger.info(f"Created built-in agent '{config.name}' for workspace {workspace_id}")
            
            db.commit()
            
            # Refresh to get IDs
            for agent in created_agents:
                db.refresh(agent)
            
            logger.info(f"Initialized {len(created_agents)} built-in agents for workspace {workspace_id}")
            return created_agents
            
        except Exception as e:
            logger.error(f"Error initializing built-in agents: {e}")
            db.rollback()
            raise
        finally:
            if should_close:
                db.close()
    
    @staticmethod
    def update_built_in_agents(db: Optional[Session] = None) -> int:
        """
        Update all built-in agents across all workspaces with latest configuration.
        This is useful when built-in agent definitions change.
        
        Args:
            db: Optional database session
            
        Returns:
            Number of agents updated
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
        
        try:
            updated_count = 0
            built_in_configs = get_built_in_agents()
            
            # Get all built-in agents
            built_in_agents = db.query(Agent).filter(
                Agent.is_built_in == True,
                Agent.is_deleted == False
            ).all()
            
            config_map = {config.name: config for config in built_in_configs}
            
            for agent in built_in_agents:
                config = config_map.get(agent.name)
                if not config:
                    logger.warning(f"No configuration found for built-in agent '{agent.name}'")
                    continue
                
                # Update agent with latest configuration
                # Only update fields that are part of the built-in definition
                agent.description = config.description
                agent.instructions = config.instructions
                agent.ai_model = config.ai_model
                agent.temperature = config.temperature
                agent.max_tokens = config.max_tokens
                agent.capabilities = config.capabilities
                agent.tools = config.tools
                agent.system_prompt = config.system_prompt
                agent.color = config.color
                agent.version = config.version
                
                updated_count += 1
            
            db.commit()
            logger.info(f"Updated {updated_count} built-in agents")
            return updated_count
            
        except Exception as e:
            logger.error(f"Error updating built-in agents: {e}")
            db.rollback()
            raise
        finally:
            if should_close:
                db.close()
    
    @staticmethod
    def ensure_workspace_has_built_in_agents(workspace_id: str, created_by: str, db: Optional[Session] = None):
        """
        Ensure a workspace has all built-in agents.
        Creates any missing built-in agents.
        
        Args:
            workspace_id: The workspace ID
            created_by: The user ID
            db: Optional database session
        """
        return AgentInitService.initialize_built_in_agents(workspace_id, created_by, db)
