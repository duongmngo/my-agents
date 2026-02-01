# Common loader for built-in agents
import json
import os
from app.models.agent import Agent

# Fields in built_in.json that are not in Agent model
EXCLUDED_FIELDS = {"file_name"}

def get_built_in_agents():
    """
    Return a list of built-in agent objects (not inserted into DB).
    Loads from built_in.json file.
    """
    json_path = os.path.join(os.path.dirname(__file__), '..', 'built_in.json')
    with open(json_path, 'r') as f:
        built_in_agents = json.load(f)
    
    # Filter out fields that are not in Agent model
    agents = []
    for agent_data in built_in_agents:
        filtered_data = {k: v for k, v in agent_data.items() if k not in EXCLUDED_FIELDS}
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
