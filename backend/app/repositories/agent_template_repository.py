"""
Agent Template repository for data access layer
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.models import AgentTemplate
from app.repositories.base_repository import BaseRepository


class AgentTemplateRepository(BaseRepository[AgentTemplate]):
    """Repository for agent template data access"""
    
    def __init__(self):
        super().__init__(AgentTemplate)
    
    # Agent Template Repository Methods
    
    def create_agent_template(self, template: AgentTemplate) -> AgentTemplate:
        """Create a new agent template"""
        with self._get_db() as db:
            db.add(template)
            db.commit()
            db.refresh(template)
            return template
    
    def get_agent_template_by_id(
        self, 
        template_id: str, 
        workspace_id: str
    ) -> Optional[AgentTemplate]:
        """Get agent template by ID with workspace filtering"""
        with self._get_db() as db:
            return db.query(AgentTemplate).filter(
                and_(
                    AgentTemplate.id == template_id,
                    AgentTemplate.workspace_id == workspace_id,
                    AgentTemplate.is_deleted == False
                )
            ).first()
    
    def get_agent_templates(
        self, 
        workspace_id: str,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None
    ) -> List[AgentTemplate]:
        """Get agent templates for a workspace using base repository"""
        filters = {"workspace_id": workspace_id}
        if category:
            filters["category"] = category
        
        return self.filter_by(filters, skip=skip, limit=limit)
    
    def get_public_agent_templates(
        self, 
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None
    ) -> List[AgentTemplate]:
        """Get public agent templates across all workspaces using base repository"""
        filters = {"is_public": True}
        if category:
            filters["category"] = category
        
        return self.filter_by(filters, skip=skip, limit=limit)
    
    def update_agent_template(self, template: AgentTemplate) -> AgentTemplate:
        """Update an agent template"""
        with self._get_db() as db:
            template.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(template)
            return template
    
    def delete_agent_template(self, template_id: str) -> bool:
        """Soft delete an agent template using base repository"""
        return self.delete(template_id, soft_delete=True)
    
    def increment_template_usage(self, template_id: str) -> bool:
        """Increment template usage count"""
        with self._get_db() as db:
            template = db.query(AgentTemplate).filter(AgentTemplate.id == template_id).first()
            
            if not template:
                return False
            
            template.usage_count += 1
            template.updated_at = datetime.utcnow()
            db.commit()
            return True
    
    def search_templates(
        self, 
        workspace_id: str, 
        search_term: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[AgentTemplate]:
        """Search templates by name or description using base repository"""
        return self.search(
            search_term=search_term,
            search_fields=["name", "description"],
            skip=skip,
            limit=limit
        )
    
    def get_templates_by_category(
        self, 
        workspace_id: str, 
        category: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[AgentTemplate]:
        """Get templates by category using base repository"""
        return self.filter_by(
            {
                "workspace_id": workspace_id,
                "category": category
            }, 
            skip=skip, 
            limit=limit
        )
    
    def count_templates_by_workspace(self, workspace_id: str) -> int:
        """Count templates in a workspace using base repository"""
        return self.count({"workspace_id": workspace_id})
    
    def count_public_templates(self) -> int:
        """Count public templates using base repository"""
        return self.count({"is_public": True})
