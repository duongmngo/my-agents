"""
Generic repository base class for database operations
"""
from typing import Generic, TypeVar, Type, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.exc import IntegrityError

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository base class with common CRUD operations
    """
    
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model
    
    def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get a record by ID"""
        query = self.db.query(self.model).filter(
            self.model.id == id,
            self.model.is_deleted == False
        )
        
        return query.first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        order_by: Optional[str] = None,
        order_direction: str = "asc"
    ) -> List[ModelType]:
        """Get all records with pagination"""
        query = self.db.query(self.model).filter(self.model.is_deleted == False)
        
        # Apply ordering
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            if order_direction.lower() == "desc":
                query = query.order_by(desc(column))
            else:
                query = query.order_by(asc(column))
        else:
            query = query.order_by(desc(self.model.created_at))
        
        return query.offset(skip).limit(limit).all()
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters"""
        query = self.db.query(self.model).filter(self.model.is_deleted == False)
        
        if filters:
            query = self._apply_filters(query, filters)
        
        return query.count()
    
    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """Create a new record"""
        try:
            db_obj = self.model(**obj_data)
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            self.db.rollback()
            raise e
    
    def update(self, id: str, obj_data: Dict[str, Any]) -> Optional[ModelType]:
        """Update a record"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        
        try:
            for field, value in obj_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            self.db.rollback()
            raise e
    
    def delete(self, id: str, soft_delete: bool = True) -> bool:
        """Delete a record (soft delete by default)"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        
        try:
            if soft_delete:
                db_obj.is_deleted = True
                self.db.commit()
            else:
                self.db.delete(db_obj)
                self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e
    
    def exists(self, id: str) -> bool:
        """Check if a record exists"""
        query = self.db.query(self.model.id).filter(
            self.model.id == id,
            self.model.is_deleted == False
        )
        
        return query.first() is not None
    
    def search(
        self,
        search_term: str,
        search_fields: List[str],
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Search records by term in specified fields"""
        query = self.db.query(self.model).filter(self.model.is_deleted == False)
        
        # Build search conditions
        search_conditions = []
        for field in search_fields:
            if hasattr(self.model, field):
                column = getattr(self.model, field)
                search_conditions.append(column.ilike(f"%{search_term}%"))
        
        if search_conditions:
            query = query.filter(or_(*search_conditions))
        
        return query.offset(skip).limit(limit).all()
    
    def filter_by(
        self,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Filter records by multiple criteria"""
        query = self.db.query(self.model).filter(self.model.is_deleted == False)
        
        query = self._apply_filters(query, filters)
        
        return query.offset(skip).limit(limit).all()
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Apply filters to a query"""
        for field, value in filters.items():
            if hasattr(self.model, field):
                column = getattr(self.model, field)
                if isinstance(value, list):
                    query = query.filter(column.in_(value))
                elif isinstance(value, dict):
                    # Handle range queries
                    if 'gte' in value:
                        query = query.filter(column >= value['gte'])
                    if 'lte' in value:
                        query = query.filter(column <= value['lte'])
                    if 'gt' in value:
                        query = query.filter(column > value['gt'])
                    if 'lt' in value:
                        query = query.filter(column < value['lt'])
                else:
                    query = query.filter(column == value)
        
        return query
    
    def bulk_create(self, obj_data_list: List[Dict[str, Any]]) -> List[ModelType]:
        """Create multiple records in bulk"""
        try:
            db_objs = [self.model(**obj_data) for obj_data in obj_data_list]
            self.db.add_all(db_objs)
            self.db.commit()
            
            for db_obj in db_objs:
                self.db.refresh(db_obj)
            
            return db_objs
        except IntegrityError as e:
            self.db.rollback()
            raise e
    
    def bulk_delete(self, ids: List[str], soft_delete: bool = True) -> int:
        """Delete multiple records in bulk"""
        query = self.db.query(self.model).filter(
            self.model.id.in_(ids),
            self.model.is_deleted == False
        )
        
        try:
            if soft_delete:
                count = query.update({"is_deleted": True}, synchronize_session=False)
            else:
                count = query.delete(synchronize_session=False)
            
            self.db.commit()
            return count
        except Exception as e:
            self.db.rollback()
            raise e
