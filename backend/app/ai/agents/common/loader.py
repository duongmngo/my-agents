# Common loader for built-in agents
import json
import os
from app.models.agent import Agent

def get_built_in_agents():
    """
    Return a list of built-in agent objects (not inserted into DB).
    Loads from built_in.json file.
    """
    json_path = os.path.join(os.path.dirname(__file__), '..', 'built_in.json')
    with open(json_path, 'r') as f:
        built_in_agents = json.load(f)
    return [Agent(**agent_data) for agent_data in built_in_agents]
