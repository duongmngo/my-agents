"""
Loader for built-in tools from JSON configuration.
"""
import json
import os
from typing import List, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class BuiltInToolConfig:
    """Data class representing a built-in tool configuration."""
    id: str
    name: str
    description: str
    icon: str
    is_built_in: bool
    tool_identifier: str
    config_schema: Dict[str, Any]
    default_config: Dict[str, Any]


def get_built_in_tools() -> List[BuiltInToolConfig]:
    """
    Load and return all built-in tools from built_in.json.
    
    Returns:
        List of BuiltInToolConfig objects
    """
    json_path = os.path.join(os.path.dirname(__file__), 'built_in.json')
    with open(json_path, 'r') as f:
        built_in_tools = json.load(f)
    
    tools = []
    for tool_data in built_in_tools:
        tools.append(BuiltInToolConfig(
            id=tool_data['id'],
            name=tool_data['name'],
            description=tool_data['description'],
            icon=tool_data['icon'],
            is_built_in=tool_data['is_built_in'],
            tool_identifier=tool_data['tool_identifier'],
            config_schema=tool_data['config_schema'],
            default_config=tool_data['default_config']
        ))
    
    return tools


def get_built_in_tool_by_id(tool_id: str) -> Optional[BuiltInToolConfig]:
    """
    Get a built-in tool by its ID.
    
    Args:
        tool_id: The tool identifier (e.g., "search_knowledge_base")
        
    Returns:
        BuiltInToolConfig if found, None otherwise
    """
    tools = get_built_in_tools()
    for tool in tools:
        if tool.id == tool_id:
            return tool
    return None


def get_tool_ids() -> List[str]:
    """
    Get list of all built-in tool IDs.
    
    Returns:
        List of tool identifiers
    """
    return [tool.id for tool in get_built_in_tools()]


def get_tool_config_schema(tool_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the configuration schema for a specific tool.
    
    Args:
        tool_id: The tool identifier
        
    Returns:
        JSON Schema dict if found, None otherwise
    """
    tool = get_built_in_tool_by_id(tool_id)
    if tool:
        return tool.config_schema
    return None


def get_tool_default_config(tool_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the default configuration for a specific tool.
    
    Args:
        tool_id: The tool identifier
        
    Returns:
        Default config dict if found, None otherwise
    """
    tool = get_built_in_tool_by_id(tool_id)
    if tool:
        return tool.default_config
    return None


def merge_tool_config(tool_id: str, override_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Merge default tool config with override values.
    
    Args:
        tool_id: The tool identifier
        override_config: Optional config values to override defaults
        
    Returns:
        Merged configuration dict
    """
    default_config = get_tool_default_config(tool_id) or {}
    if override_config:
        return {**default_config, **override_config}
    return default_config
