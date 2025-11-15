"""
Base model class with common fields
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class BaseModel(Base):
    """
    Base model class with common fields for all models
    """
    __abstract__ = True
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    @declared_attr
    def __tablename__(cls):
        """
        Generate table name from class name
        """
        return cls.__name__.lower() + 's'


# TenantMixin removed - no longer needed since each user is their own tenant


class UserOwnedMixin:
    """
    Mixin for models that are owned by a user
    """
    created_by = Column(String, nullable=False, index=True)
    updated_by = Column(String, nullable=True)


class WorkspaceMixin:
    """
    Mixin for models that belong to a workspace
    """
    workspace_id = Column(String, nullable=False, index=True)
