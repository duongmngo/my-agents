# Common loader for built-in agents
import json
import os
from app.models.agent import Agent, AgentType, AgentStatus

# Fields in built_in.json that are not in Agent model columns
EXCLUDED_FIELDS = {"file_name", "tools"}


def _convert_enum_fields(data: dict) -> dict:
    """
    Convert string values to proper enum types for Agent model.
    """
    result = data.copy()
    
    # Convert agent_type string to AgentType enum
    if "agent_type" in result:
        agent_type_str = result["agent_type"]
        # Map JSON values to enum values
        type_mapping = {
            "default-agent": AgentType.DEFAULT_AGENT,
            "user-agent": AgentType.USER_AGENT,
        }
        result["agent_type"] = type_mapping.get(agent_type_str, AgentType.USER_AGENT)
    
    # Convert status string to AgentStatus enum
    if "status" in result:
        status_str = result["status"]
        status_mapping = {
            "ACTIVE": AgentStatus.ACTIVE,
            "INACTIVE": AgentStatus.INACTIVE,
            "DRAFT": AgentStatus.DRAFT,
            "ARCHIVED": AgentStatus.ARCHIVED,
        }
        result["status"] = status_mapping.get(status_str, AgentStatus.ACTIVE)
    
    return result


def get_built_in_agents():
    """
    Return a list of built-in agent objects (not inserted into DB).
    Loads from built_in.json file.
    """
    json_path = os.path.join(os.path.dirname(__file__), '..', 'built_in.json')
    with open(json_path, 'r') as f:
        built_in_agents = json.load(f)
    
    # Filter out fields that are not in Agent model and convert enums
    agents = []
    for agent_data in built_in_agents:
        filtered_data = {k: v for k, v in agent_data.items() if k not in EXCLUDED_FIELDS}
        filtered_data = _convert_enum_fields(filtered_data)
        agents.append(Agent(**filtered_data))
    
    return agents


def get_built_in_agent_by_id(agent_id: str):
    """
    Get a built-in agent by ID.
    Returns None if not found.
    """
    agents = get_built_in_agents()
    for agent in agents:
        if agent.id == agent_id:
            return agent
    return None
