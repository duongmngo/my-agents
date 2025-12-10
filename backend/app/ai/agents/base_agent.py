"""Base agent abstraction.

This module defines the abstract BaseAgent class that all agent
implementations must extend.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, List

from app.models import Message, Conversation


class BaseAgent(ABC):
    """Abstract base for all agent implementations."""

    @abstractmethod
    async def generate_agent_response(
        self,
        conversation: Conversation,
        user_message: Message,
        conversation_history: Optional[List[Message]] = None,
        stream: bool = False,
    ) -> Optional[Message]:
        """Produce and persist an agent response for the given user message."""
