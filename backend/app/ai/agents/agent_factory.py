"""Agent factory for instantiating agent implementations.

This module defines the AgentFactory class for creating and retrieving
agent instances at runtime.
"""
from __future__ import annotations

from typing import Optional

from app.ai.agents.default_agent import DefaultAgent


class AgentFactory:
    """Factory for instantiating agent implementations."""

    @staticmethod
    def get_agent_by_id(agent_id: Optional[str], workspace_id: Optional[str] = None):
        """Factory helper that returns the DefaultAgent implementation.
        
        Currently only uses DefaultAgent (langgraph-based).
        """
        return DefaultAgent()




