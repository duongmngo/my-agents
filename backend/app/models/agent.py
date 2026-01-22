"""
Agent models for AI agent management
"""
from sqlalchemy import Column, String, Text, Boolean, Enum, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, WorkspaceMixin


class AgentType(enum.Enum):
    """Agent type enumeration"""
    DEFAULT_AGENT = "default-agent"  # Built-in agents from code
    USER_AGENT = "user-agent"  # Agents created from UI


class AgentStatus(enum.Enum):
    """Agent status enumeration"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class AgentCapability(enum.Enum):
    """Agent capability enumeration"""
    WEB_BROWSING = "web_browsing"
    CODE_EXECUTION = "code_execution"
    FILE_PROCESSING = "file_processing"
    IMAGE_GENERATION = "image_generation"
    FUNCTION_CALLING = "function_calling"
    KNOWLEDGE_SEARCH = "knowledge_search"


class Agent(BaseModel, WorkspaceMixin):
    """
    Agent model for AI agent management
    """
    __tablename__ = "agents"
    
    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)  # System prompt/instructions
    
    # Agent properties
    agent_type = Column(Enum(AgentType, values_callable=lambda x: [e.value for e in x]), default=AgentType.USER_AGENT, nullable=False)
    is_built_in = Column(Boolean, default=False, nullable=False)  # Built-in agents from code
    status = Column(Enum(AgentStatus, values_callable=lambda x: [e.value for e in x]), default=AgentStatus.ACTIVE, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)  # Public within workspace
    is_active = Column(Boolean, default=True, nullable=False)  # Can be used in conversations
    
    # AI Configuration
    ai_model = Column(String(100), default="gpt-4", nullable=False)  # AI model identifier
    temperature = Column(String(10), default="0.7", nullable=False)  # AI temperature
    max_tokens = Column(Integer, default=4000, nullable=True)  # Max response tokens
    
    # Agent capabilities and tools
    capabilities = Column(JSON, nullable=True)  # List of enabled capabilities
    tools = Column(JSON, nullable=True)  # MCP tools and function calling config
    system_prompt = Column(Text, nullable=True)  # Custom system prompt
    
    # Visual representation
    avatar_url = Column(String(500), nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code
    
    # Conversation starters for chat interface
    conversation_starters = Column(JSON, nullable=True)  # List of conversation starter objects
    
    # Knowledge base integration (will be added later)
    # knowledge_base_id = Column(String, ForeignKey("knowledge_bases.id"), nullable=True)
    
    # Usage statistics
    conversation_count = Column(Integer, default=0, nullable=False)
    message_count = Column(Integer, default=0, nullable=False)
    total_tokens_used = Column(Integer, default=0, nullable=False)
    
    # Version control
    version = Column(String(20), default="1.0.0", nullable=False)
    parent_agent_id = Column(String, ForeignKey("agents.id"), nullable=True)  # For cloning
    
    # Foreign keys
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="agents")
    created_by_user = relationship("User", foreign_keys=[created_by])
    # knowledge_base = relationship("KnowledgeBase", back_populates="agent")  # Will be added later
    conversations = relationship("Conversation", back_populates="agent")
    parent_agent = relationship("Agent", remote_side="Agent.id", backref="cloned_agents")
    
    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, status={self.status.value})>"
    
    @property
    def is_available(self) -> bool:
        """Check if agent is available for conversations"""
        return self.is_active and self.status == AgentStatus.ACTIVE
    
    def get_effective_system_prompt(self) -> str:
        """Get the effective system prompt combining instructions and system_prompt"""
        if self.system_prompt:
            return self.system_prompt
        return self.instructions or ""
    
    def has_capability(self, capability: AgentCapability) -> bool:
        """Check if agent has a specific capability"""
        if not self.capabilities:
            return False
        return capability.value in self.capabilities


class AgentTemplate(BaseModel, WorkspaceMixin):
    """
    Agent template for quick agent creation
    """
    __tablename__ = "agent_templates"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # e.g., "coding", "writing", "analysis"
    
    # Template configuration
    template_config = Column(JSON, nullable=False)  # Complete agent configuration
    is_public = Column(Boolean, default=False, nullable=False)  # Public across workspaces
    
    # Usage statistics
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Foreign keys
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<AgentTemplate(id={self.id}, name={self.name}, category={self.category})>"
