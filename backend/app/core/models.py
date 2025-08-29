"""
Base models for API responses with automatic camelCase conversion
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict
import re


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    """Base model that automatically converts field names to camelCase in responses"""
    
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel_case,
        str_strip_whitespace=True,
        validate_assignment=True
    )


class ResponseModel(CamelCaseModel):
    """Base response model with common fields"""
    success: bool = True
    message: Optional[str] = None
    error: Optional[str] = None


class PaginatedResponse(ResponseModel):
    """Base model for paginated responses"""
    data: list
    total: int
    page: int
    per_page: int
    total_pages: int


class ErrorResponse(ResponseModel):
    """Standard error response"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
