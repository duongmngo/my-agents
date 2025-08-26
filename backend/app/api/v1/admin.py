"""
Admin API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_admin_user, get_super_admin_user
from app.models.user import User

router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin statistics"""
    # TODO: Implement admin statistics
    return {
        "users": 0,
        "workspaces": 0,
        "files": 0,
        "storage_used": 0
    }


@router.get("/system/health")
async def system_health(
    current_user: User = Depends(get_super_admin_user),
    db: Session = Depends(get_db)
):
    """Get system health status"""
    # TODO: Implement system health check
    return {
        "status": "healthy",
        "database": "connected",
        "storage": "available"
    }
