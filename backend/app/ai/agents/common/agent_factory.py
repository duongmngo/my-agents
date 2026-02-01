"""Agent factory for instantiating agent implementations.

This module defines the AgentFactory class for creating and retrieving
agent instances at runtime.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    """Enum for agent types."""
    BUILT_IN = "built-in"
    CUSTOM = "custom"


@dataclass
class AgentConfig:
    """Configuration for an agent instance."""
    agent_id: str
    name: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    ai_model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: Optional[int] = 4000
    capabilities: Optional[list] = None
    tools: Optional[dict] = None
    is_built_in: bool = False


class AgentFactory:
    """Factory for instantiating agent implementations."""

    @staticmethod
    def get_agent_config_from_db(agent_id: str, workspace_id: Optional[str] = None) -> Optional[AgentConfig]:
        """Load agent configuration from database via AgentService.
        
        Args:
            agent_id: The agent ID to look up
            workspace_id: Optional workspace ID for filtering
            
        Returns:
            AgentConfig if found, None otherwise
        """
        try:
            from app.services.agent_service import AgentService
            
            service = AgentService()
            result = service.get_agent(agent_id, workspace_id)
            
            if not result.get("success") or not result.get("data"):
                logger.warning(f"Custom agent not found: {agent_id}")
                return None
            
            agent = result["data"]
            
            # Convert temperature string to float
            temperature = float(agent.temperature) if agent.temperature else 0.7
            
            return AgentConfig(
                agent_id=str(agent.id),
                name=agent.name,
                description=agent.description,
                instructions=agent.instructions,
                ai_model=agent.ai_model or "gpt-4o-mini",
                temperature=temperature,
                max_tokens=agent.max_tokens,
                capabilities=agent.capabilities,
                tools=agent.tools,
                is_built_in=agent.is_built_in or False
            )
        except Exception as e:
            logger.error(f"Failed to load agent config from DB: {e}")
            return None

    @staticmethod
    def get_built_in_agent_config(agent_id: str) -> Optional[AgentConfig]:
        """Load built-in agent configuration from JSON.
        
        Args:
            agent_id: The built-in agent ID to look up
            
        Returns:
            AgentConfig if found, None otherwise
        """
        try:
            from app.ai.agents.common.loader import get_built_in_agent_by_id
            
            agent = get_built_in_agent_by_id(agent_id)
            
            if agent is None:
                logger.warning(f"Built-in agent not found: {agent_id}")
                return None
            
            # Convert temperature string to float
            temperature = float(agent.temperature) if agent.temperature else 0.7
            
            return AgentConfig(
                agent_id=str(agent.id),
                name=agent.name,
                description=agent.description,
                instructions=agent.instructions,
                ai_model=agent.ai_model or "gpt-4o-mini",
                temperature=temperature,
                max_tokens=agent.max_tokens,
                capabilities=agent.capabilities,
                tools=agent.tools,
                is_built_in=True
            )
        except Exception as e:
            logger.error(f"Failed to load built-in agent config: {e}")
            return None

    @staticmethod
    def get_agent(
        agent_type: Optional[AgentType] = AgentType.BUILT_IN,
        agent_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        chat_service: Optional["ChatService"] = None
    ):
        """Factory helper that returns the appropriate agent implementation.
        
        Args:
            agent_type: Agent type (AgentType.BUILT_IN or AgentType.CUSTOM)
            agent_id: Optional agent ID for custom agents
            workspace_id: Optional workspace ID for custom agent lookup
            chat_service: ChatService instance for event handling and persistence
            
        Returns:
            Agent instance with injected dependencies
        """
        # Import at runtime to avoid circular dependency
        from app.ai.agents.default_agent import DefaultAgent
        from app.ai.agents.common.custom_agent import CustomAgent
        from app.services.chat_service import ChatService
        
        if chat_service is None:
            chat_service = ChatService()
        
        agent_config: Optional[AgentConfig] = None
        
        if agent_type == AgentType.BUILT_IN:
            # Load built-in agent config from JSON
            if agent_id:
                agent_config = AgentFactory.get_built_in_agent_config(agent_id)
            # Use DefaultAgent for built-in agents
            return DefaultAgent(chat_service=chat_service, agent_config=agent_config)
                
        elif agent_type == AgentType.CUSTOM:
            # Load custom agent config from database
            if agent_id:
                agent_config = AgentFactory.get_agent_config_from_db(agent_id, workspace_id)
            # Use CustomAgent for DB-based agents
            return CustomAgent(chat_service=chat_service, agent_config=agent_config)
        
        # Default fallback to DefaultAgent
        return DefaultAgent(chat_service=chat_service, agent_config=agent_config)
