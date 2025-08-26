"""
Tenant model for multi-tenancy
"""
from sqlalchemy import Column, String, Boolean, Text, Integer
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Tenant(BaseModel):
    """
    Tenant model for multi-tenant application
    """
    __tablename__ = "tenants"
    
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    
    # Contact information
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    # Settings
    settings = Column(Text, nullable=True)  # JSON string for tenant-specific settings
    max_users = Column(Integer, default=50, nullable=False)
    max_workspaces = Column(Integer, default=10, nullable=False)
    max_storage_gb = Column(Integer, default=10, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_trial = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="tenant", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tenant(id={self.id}, name={self.name}, subdomain={self.subdomain})>"
