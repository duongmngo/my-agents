"""Agent factory for instantiating agent implementations.

This module defines the AgentFactory class for creating and retrieving
agent instances at runtime.
"""
from __future__ import annotations

from typing import Optional

from app.ai.agents.default_agent import DefaultAgent
from app.services.chat_service import ChatService


class AgentFactory:
    """Factory for instantiating agent implementations."""

    @staticmethod
    def get_agent_by_id(
        agent_id: Optional[str],
        workspace_id: Optional[str] = None,
        chat_service: Optional[ChatService] = None
    ):
        """Factory helper that returns the DefaultAgent implementation.
        
        Currently only uses DefaultAgent (langgraph-based).
        
        Args:
            agent_id: Optional agent ID (currently unused)
            workspace_id: Optional workspace ID (currently unused)
            chat_service: ChatService instance for event handling and persistence
            
        Returns:
            DefaultAgent instance with injected dependencies
        """
        if chat_service is None:
            chat_service = ChatService()
            
        return DefaultAgent(chat_service=chat_service)




