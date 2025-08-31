"""
Tenant API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class TenantCreateRequest(BaseApiModel):
    """Tenant creation request"""
    name: str
    subdomain: str
    contact_email: Optional[str] = Field(None, alias="contactEmail")
    max_users: int = Field(50, alias="maxUsers")
    max_workspaces: int = Field(10, alias="maxWorkspaces")


# Response DTOs
class TenantResponse(BaseApiModel):
    """Tenant response"""
    id: str
    name: str
    subdomain: str
    contact_email: Optional[str] = Field(None, alias="contactEmail")
    max_users: int = Field(..., alias="maxUsers")
    max_workspaces: int = Field(..., alias="maxWorkspaces")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class TenantListResponse(BaseApiModel):
    """Tenant list response"""
    tenants: List[TenantResponse]
    total: int


class TenantCreateResponse(BaseApiModel):
    """Tenant creation response"""
    success: bool = True
    tenant: TenantResponse
    message: str = "Tenant created successfully"
