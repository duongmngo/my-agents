"""Agent event types for streaming and response handling.

This module defines constants for different types of events that can be emitted
during agent response generation.
"""
from enum import Enum
from typing import Literal


class AgentEventType(str, Enum):
    """Event types for agent response streaming and handling."""
    
    # Initialization
    START = "start"
    
    # Streaming events
    TOKEN = "token"
    
    # Agent reasoning/tool events
    STEP = "step"
    
    # Completion
    COMPLETE = "complete"
    
    # Error handling
    ERROR = "error"


class AgentStepKind(str, Enum):
    """Types of agent steps during processing."""
    
    # Planning and reasoning
    REASONING = "reasoning"
    PLAN = "plan"
    
    # Tool usage
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    
    # Other
    INFO = "info"
    WARNING = "warning"


# Type aliases for better type hints
EventType = Literal["start", "token", "step", "complete", "error"]
StepKind = Literal["reasoning", "plan", "tool_call", "tool_result", "info", "warning"]
