"""
Generic repository base class for database operations
"""
from typing import Generic, TypeVar, Type, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.exc import IntegrityError
from contextlib import contextmanager

from app.models.base import BaseModel
from app.core.database import SessionLocal

ModelType = TypeVar("ModelType", bound=BaseModel)


class _SessionContextManager:
    """Context manager wrapper for database session that commits on exit"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def __enter__(self) -> Session:
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            # No exception - commit the transaction
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise
        else:
            # Exception occurred - rollback
            self.db.rollback()
        # Don't suppress exceptions
        return False


class BaseRepository(Generic[ModelType]):
    """
    Generic repository base class with common CRUD operations
    Manages its own database session internally - one session per repository instance
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
        self.db: Optional[Session] = None
    
    def _get_db(self):
        """
        Get or create database session for this repository instance
        Returns a context manager that reuses the same session
        """
        if self.db is None:
            self.db = SessionLocal()
            # Keep objects accessible after commit
            self.db.expire_on_commit = False
        return _SessionContextManager(self.db)
    
    def commit(self):
        """Commit the current session"""
        if self.db:
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise
    
    def close(self):
        """Close the database session"""
        if self.db:
            self.db.close()
            self.db = None
    
    def __del__(self):
        """Cleanup: close session when repository is destroyed"""
        self.close()
    
    def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get a record by ID"""
        with self._get_db() as db:
            query = db.query(self.model).filter(
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
        with self._get_db() as db:
            query = db.query(self.model).filter(self.model.is_deleted == False)
            
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
        with self._get_db() as db:
            query = db.query(self.model).filter(self.model.is_deleted == False)
            
            if filters:
                query = self._apply_filters(query, filters)
            
            return query.count()
    
    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """Create a new record"""
        db = self.db if self.db else SessionLocal()
        should_close = self.db is None
        
        try:
            db_obj = self.model(**obj_data)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            # Expunge from session to prevent DetachedInstanceError
            db.expunge(db_obj)
            
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise e
        finally:
            if should_close:
                db.close()
    
    def update(self, id: str, obj_data: Dict[str, Any]) -> Optional[ModelType]:
        """Update a record"""
        with self._get_db() as db:
            db_obj = db.query(self.model).filter(
                self.model.id == id,
                self.model.is_deleted == False
            ).first()
            if not db_obj:
                return None
            
            try:
                for field, value in obj_data.items():
                    if hasattr(db_obj, field):
                        setattr(db_obj, field, value)
                
                # Flush changes to database (but don't commit yet)
                db.flush()
                # Now refresh to get any DB-generated values
                db.refresh(db_obj)
                # Context manager will commit on exit
                return db_obj
            except IntegrityError as e:
                db.rollback()
                raise e
    
    def delete(self, id: str, soft_delete: bool = True) -> bool:
        """Delete a record (soft delete by default)"""
        with self._get_db() as db:
            db_obj = db.query(self.model).filter(
                self.model.id == id,
                self.model.is_deleted == False
            ).first()
            if not db_obj:
                return False
            
            try:
                if soft_delete:
                    db_obj.is_deleted = True
                else:
                    db.delete(db_obj)
                # Context manager will commit on exit
                return True
            except Exception as e:
                db.rollback()
                raise e
    
    def exists(self, id: str) -> bool:
        """Check if a record exists"""
        with self._get_db() as db:
            query = db.query(self.model.id).filter(
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
        with self._get_db() as db:
            query = db.query(self.model).filter(self.model.is_deleted == False)
            
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
        with self._get_db() as db:
            query = db.query(self.model).filter(self.model.is_deleted == False)
            
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
        with self._get_db() as db:
            try:
                db_objs = [self.model(**obj_data) for obj_data in obj_data_list]
                db.add_all(db_objs)
                # Context manager will commit on exit
                
                for db_obj in db_objs:
                    db.refresh(db_obj)
                
                return db_objs
            except IntegrityError as e:
                db.rollback()
                raise e
    
    def bulk_delete(self, ids: List[str], soft_delete: bool = True) -> int:
        """Delete multiple records in bulk"""
        with self._get_db() as db:
            query = db.query(self.model).filter(
                self.model.id.in_(ids),
                self.model.is_deleted == False
            )
            
            try:
                if soft_delete:
                    count = query.update({"is_deleted": True}, synchronize_session=False)
                else:
                    count = query.delete(synchronize_session=False)
                
                # Context manager will commit on exit
                return count
            except Exception as e:
                db.rollback()
                raise e
