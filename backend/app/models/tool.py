"""
Tool models for AI agent tool management
"""
from sqlalchemy import Column, String, Text, Boolean, Enum, Integer, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, WorkspaceMixin


class ToolType(enum.Enum):
    """Tool type enumeration"""
    BUILT_IN = "built_in"  # Built-in tools from code (search_knowledge_base, search_web, etc.)
    CUSTOM = "custom"  # Custom tools created by users


class Tool(BaseModel):
    """
    Tool model for AI agent tools
    
    Built-in tools are loaded from tools/built_in.json and not stored in database.
    Custom tools are created by users and stored in the database.
    """
    __tablename__ = "tools"
    
    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)  # Icon identifier (e.g., "database-search", "globe", "api")
    
    # Tool properties
    tool_type = Column(
        Enum(ToolType, values_callable=lambda x: [e.value for e in x]), 
        default=ToolType.CUSTOM, 
        nullable=False
    )
    is_built_in = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Tool identifier for built-in tools (e.g., "search_knowledge_base", "api_call")
    tool_identifier = Column(String(100), nullable=True, unique=True)
    
    # Configuration schema (JSON Schema format)
    # Defines what configuration options are available for this tool
    config_schema = Column(JSON, nullable=True)
    
    # Default configuration values
    default_config = Column(JSON, nullable=True)
    
    # For custom tools - the actual implementation details
    # For api_call type tools, this contains the API configuration
    implementation = Column(JSON, nullable=True)
    
    # Workspace scope (null for built-in tools, workspace_id for custom tools)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="tools")
    created_by_user = relationship("User", foreign_keys=[created_by])
    tool_configs = relationship("ToolConfig", back_populates="tool", cascade="all, delete-orphan")
    agent_tools = relationship("AgentTool", back_populates="tool", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tool(id={self.id}, name={self.name}, type={self.tool_type.value})>"


class ToolConfig(BaseModel, WorkspaceMixin):
    """
    Workspace-level tool configuration
    
    Stores default configuration for a tool at the workspace level.
    Can be overridden at the agent level via AgentTool.config_override.
    """
    __tablename__ = "tool_configs"
    
    # Foreign keys
    tool_id = Column(String, ForeignKey("tools.id"), nullable=False)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    
    # Configuration values (merged with tool's default_config)
    config_values = Column(JSON, nullable=True)
    
    # Enable/disable at workspace level
    is_enabled = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    tool = relationship("Tool", back_populates="tool_configs")
    workspace = relationship("Workspace", back_populates="tool_configs")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('tool_id', 'workspace_id', name='uq_tool_workspace'),
    )
    
    def __repr__(self):
        return f"<ToolConfig(tool_id={self.tool_id}, workspace_id={self.workspace_id})>"


class AgentTool(BaseModel):
    """
    Agent-Tool junction model
    
    Links agents to tools with priority ordering and optional config overrides.
    For built-in agents, this is loaded from agents/built_in.json.
    For custom agents, this is stored in the database.
    """
    __tablename__ = "agent_tools"
    
    # Foreign keys
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    tool_id = Column(String, ForeignKey("tools.id"), nullable=False)
    
    # Tool priority (lower number = higher priority, executed first)
    priority = Column(Integer, default=0, nullable=False)
    
    # Enable/disable for this specific agent
    is_enabled = Column(Boolean, default=True, nullable=False)
    
    # Configuration override (merged on top of workspace config)
    config_override = Column(JSON, nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="agent_tools")
    tool = relationship("Tool", back_populates="agent_tools")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('agent_id', 'tool_id', name='uq_agent_tool'),
    )
    
    def __repr__(self):
        return f"<AgentTool(agent_id={self.agent_id}, tool_id={self.tool_id}, priority={self.priority})>"
