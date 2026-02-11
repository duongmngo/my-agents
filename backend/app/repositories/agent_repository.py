"""
Agent repository for data access layer
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.core.database import SessionLocal
from app.models import Agent
from app.models.agent import AgentStatus, AgentType
from app.repositories.base_repository import BaseRepository


class AgentRepository(BaseRepository[Agent]):
    """Repository for agent-related data access"""
    def __init__(self):
        super().__init__(Agent)
    
    # Agent Repository Methods
    
    def create_agent(self, agent_data: Dict[str, Any]) -> Agent:
        """Create a new agent"""
        db = self.db if self.db else SessionLocal()
        should_close = self.db is None
        
        try:
            agent = Agent(**agent_data)
            db.add(agent)
            db.commit()
            db.refresh(agent)
            
            # Expunge from session to prevent DetachedInstanceError
            db.expunge(agent)
            
            return agent
        except Exception:
            db.rollback()
            raise
        finally:
            if should_close:
                db.close()
    
    def get_agent_by_id(self, agent_id: str, workspace_id: str = None) -> Optional[Agent]:
        """Get agent by ID with optional workspace filtering"""
        with self._get_db() as db:
            query = db.query(Agent).filter(Agent.id == agent_id)
            if workspace_id:
                query = query.filter(Agent.workspace_id == workspace_id)
            return query.filter(Agent.is_deleted == False).first()
    
    def get_agents_by_filters(self, filters: Dict[str, Any]) -> List[Agent]:
        """Get agents by filters"""
        with self._get_db() as db:
            query = db.query(Agent)
            for key, value in filters.items():
                if key == "agent_type":
                    if value == "default-agent":
                        query = query.filter(Agent.agent_type == AgentType.DEFAULT_AGENT)
                    elif value == "user-agent":
                        query = query.filter(Agent.agent_type == AgentType.USER_AGENT)
                else:
                    query = query.filter(getattr(Agent, key) == value)
            return query.order_by(Agent.created_at.desc()).all()
    
    def get_available_agents(self, workspace_id: str) -> List[Agent]:
        """Get available agents for a workspace"""
        with self._get_db() as db:
            return db.query(Agent).filter(
                and_(
                    Agent.workspace_id == workspace_id,
                    Agent.is_active == True,
                    Agent.status == AgentStatus.ACTIVE,
                    Agent.is_deleted == False
                )
            ).order_by(Agent.name).all()
    
    def get_agents_by_user(
        self, 
        user_id: str, 
        workspace_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[Agent]:
        """Get agents created by a user"""
        with self._get_db() as db:
            return db.query(Agent).filter(
                and_(
                    Agent.workspace_id == workspace_id,
                    Agent.created_by == user_id,
                    Agent.is_deleted == False
                )
            ).order_by(desc(Agent.updated_at)).offset(skip).limit(limit).all()
    
    def get_public_agents(self, workspace_id: str) -> List[Agent]:
        """Get public agents in a workspace"""
        with self._get_db() as db:
            return db.query(Agent).filter(
                and_(
                    Agent.workspace_id == workspace_id,
                    Agent.is_public == True,
                    Agent.is_active == True,
                    Agent.status == AgentStatus.ACTIVE,
                    Agent.is_deleted == False
                )
            ).order_by(Agent.name).all()
    
    def update_agent(self, agent_id: str, update_data: Dict[str, Any]) -> Agent:
        """Update an agent"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id, Agent.is_deleted == False).first()
            if agent:
                for key, value in update_data.items():
                    if value is not None:
                        # Convert agent_type string to enum
                        if key == "agent_type":
                            if value == "default-agent":
                                value = AgentType.DEFAULT_AGENT
                            elif value == "user-agent":
                                value = AgentType.USER_AGENT
                        setattr(agent, key, value)
                agent.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(agent)
            return agent
    
    def delete_agent(self, agent_id: str) -> bool:
        """Soft delete an agent"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id, Agent.is_deleted == False).first()
            if agent:
                agent.is_deleted = True
                agent.updated_at = datetime.utcnow()
                db.commit()
                return True
            return False
    
    def increment_agent_conversation_count(self, agent_id: str) -> bool:
        """Increment agent conversation count"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            
            if not agent:
                return False
            
            agent.conversation_count += 1
            agent.updated_at = datetime.utcnow()
            db.commit()
            return True
    
    def increment_agent_message_count(self, agent_id: str) -> bool:
        """Increment agent message count"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            
            if not agent:
                return False
            
            agent.message_count += 1
            agent.updated_at = datetime.utcnow()
            db.commit()
            return True
    
    def update_agent_token_usage(
        self, 
        agent_id: str, 
        prompt_tokens: int, 
        completion_tokens: int
    ) -> bool:
        """Update agent token usage statistics"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            
            if not agent:
                return False
            
            agent.total_tokens_used += prompt_tokens + completion_tokens
            agent.updated_at = datetime.utcnow()
            db.commit()
            return True
    
    def search_agents(
        self, 
        workspace_id: str, 
        query: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[Agent]:
        """Search agents by name or description using base repository"""
        return self.search(
            search_term=query,
            search_fields=["name", "description"],
            skip=skip,
            limit=limit
        )
    
    def get_agent_stats(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent statistics"""
        with self._get_db() as db:
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            
            if not agent:
                return None
            
            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "conversation_count": agent.conversation_count,
                "message_count": agent.message_count,
                "total_tokens_used": agent.total_tokens_used,
                "last_used": agent.updated_at
            }
    
    # Additional methods leveraging base repository
    
    def get_agents_by_workspace(
        self, 
        workspace_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Agent]:
        """Get agents by workspace using base repository"""
        return self.filter_by(
            {"workspace_id": workspace_id}, 
            skip=skip, 
            limit=limit
        )
    
    def get_agents_by_user(
        self, 
        user_id: str, 
        workspace_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[Agent]:
        """Get agents created by a user using base repository"""
        return self.filter_by(
            {
                "workspace_id": workspace_id,
                "created_by": user_id
            }, 
            skip=skip, 
            limit=limit
        )
    
    def get_public_agents_by_workspace(
        self, 
        workspace_id: str, 
        skip: int = 0,
        limit: int = 20
    ) -> List[Agent]:
        """Get public agents in a workspace using base repository"""
        return self.filter_by(
            {
                "workspace_id": workspace_id,
                "is_public": True,
                "is_active": True
            }, 
            skip=skip, 
            limit=limit
        )
    
    def count_agents_by_workspace(self, workspace_id: str) -> int:
        """Count agents in a workspace using base repository"""
        return self.count({"workspace_id": workspace_id})
    
    def count_agents_by_user(self, user_id: str, workspace_id: str) -> int:
        """Count agents created by a user using base repository"""
        return self.count({
            "workspace_id": workspace_id,
            "created_by": user_id
        })
    
