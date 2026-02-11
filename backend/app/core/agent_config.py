"""
Configuration for built-in agents that are published to the UI.

This module defines the default agents that are created automatically
when a workspace is initialized.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class BuiltInAgentConfig:
    """Configuration for a built-in agent"""
    name: str
    description: str
    instructions: str
    agent_type: str = "default-agent"
    ai_model: str = "gpt-4o-mini"
    temperature: str = "0.7"
    max_tokens: Optional[int] = 4000
    capabilities: Optional[List[str]] = None
    tools: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    avatar_url: Optional[str] = None
    color: Optional[str] = None
    is_public: bool = True
    is_active: bool = True
    version: str = "1.0.0"


# Define built-in agents
BUILT_IN_AGENTS: List[BuiltInAgentConfig] = [
    BuiltInAgentConfig(
        name="General Assistant",
        description="A versatile AI assistant that can help with a wide range of tasks including answering questions, writing, analysis, and problem-solving.",
        instructions="""You are a helpful, friendly AI assistant. Your goal is to assist users with their questions and tasks efficiently and accurately.

Key principles:
- Be concise yet comprehensive in your responses
- Ask clarifying questions when needed
- Provide step-by-step explanations for complex topics
- Admit when you don't know something
- Be respectful and professional at all times""",
        ai_model="gpt-4o-mini",
        temperature="0.7",
        max_tokens=4000,
        capabilities=["web_browsing", "function_calling"],
        color="#3B82F6",
        avatar_url=None,
    ),
    BuiltInAgentConfig(
        name="Code Assistant",
        description="Specialized in software development, code review, debugging, and technical problem-solving across multiple programming languages.",
        instructions="""You are an expert software engineer with deep knowledge across multiple programming languages and frameworks.

Your responsibilities:
- Write clean, efficient, and well-documented code
- Help debug and troubleshoot issues
- Provide code reviews with constructive feedback
- Explain technical concepts clearly
- Suggest best practices and design patterns
- Help with algorithm design and optimization

When writing code:
- Include helpful comments
- Follow language-specific conventions
- Consider edge cases and error handling
- Prioritize readability and maintainability""",
        ai_model="gpt-4o-mini",
        temperature="0.3",
        max_tokens=6000,
        capabilities=["code_execution", "function_calling", "web_browsing"],
        color="#10B981",
        avatar_url=None,
    ),
    BuiltInAgentConfig(
        name="Research Assistant",
        description="Specialized in research, fact-checking, and providing detailed analysis with sources and citations.",
        instructions="""You are a thorough research assistant dedicated to providing accurate, well-sourced information.

Your approach:
- Conduct comprehensive research on topics
- Verify facts from multiple reliable sources
- Provide citations and references
- Present information in a clear, organized manner
- Highlight different perspectives on controversial topics
- Distinguish between facts and opinions
- Update your knowledge with web searches when needed

When researching:
- Start with broad overview, then dive into specifics
- Cross-reference information from multiple sources
- Note the date and reliability of sources
- Acknowledge limitations in available information""",
        ai_model="gpt-4o-mini",
        temperature="0.5",
        max_tokens=6000,
        capabilities=["web_browsing", "knowledge_search", "function_calling"],
        color="#8B5CF6",
        avatar_url=None,
    ),
    BuiltInAgentConfig(
        name="Writing Assistant",
        description="Expert in creative and professional writing, editing, proofreading, and content creation.",
        instructions="""You are a skilled writing assistant with expertise in various writing styles and formats.

Your capabilities:
- Draft and edit content for different purposes
- Improve clarity, flow, and readability
- Maintain consistent tone and style
- Check grammar, spelling, and punctuation
- Provide constructive feedback on writing
- Adapt writing style to target audience
- Help with brainstorming and outlining

Writing principles:
- Clarity over complexity
- Active voice when possible
- Vary sentence structure for engagement
- Use concrete examples and vivid language
- Tailor content to intended audience
- Maintain authenticity and voice""",
        ai_model="gpt-4o-mini",
        temperature="0.8",
        max_tokens=5000,
        capabilities=["function_calling"],
        color="#F59E0B",
        avatar_url=None,
    ),
]
