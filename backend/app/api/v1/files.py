"""
File management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File

from app.core.dependencies import get_current_active_user
from app.services.file_service import FileService
from app.models.user import User
from app.api.v1.dtos.file_dtos import (
    FileUpdateRequest,
    FileResponse,
    FileListResponse,
    FileUploadResponse,
    FileDeleteResponse
)

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    workspace_id: str = Query(...),
    folder_id: str = Query(default=None),
    description: str = Query(default=None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file"""
    file_service = FileService()
    
    result = file_service.upload_file(
        file_data=file.file,
        filename=file.filename,
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=folder_id,
        description=description
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return FileUploadResponse(file=FileResponse(**result["file"]))


@router.get("/", response_model=FileListResponse)
async def get_files(
    workspace_id: str = Query(...),
    folder_id: str = Query(default=None),
    file_type: str = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Get files in workspace"""
    file_service = FileService()
    
    files = file_service.get_workspace_files(
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=folder_id,
        file_type=file_type,
        skip=skip,
        limit=limit
    )
    
    return FileListResponse(
        files=[FileResponse(**file) for file in files],
        total=len(files),
        skip=skip,
        limit=limit
    )


@router.get("/search", response_model=FileListResponse)
async def search_files(
    q: str = Query(...),
    workspace_id: str = Query(...),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Search files"""
    file_service = FileService()
    
    files = file_service.search_files(
        search_term=q,
        workspace_id=workspace_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return FileListResponse(
        files=[FileResponse(**file) for file in files],
        total=len(files),
        skip=skip,
        limit=limit
    )


@router.get("/count")
async def count_files(
    workspace_id: str = Query(...),
    folder_id: str = Query(default=None),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of files in workspace"""
    file_service = FileService()
    count = file_service.count_files(
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=folder_id
    )
    return {"count": count}


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get file by ID"""
    file_service = FileService()
    
    file_data = file_service.get_file(
        file_id=file_id,
        user_id=current_user.id
    )
    
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(**file_data)


@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: str,
    update_data: FileUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update file metadata"""
    file_service = FileService()
    
    result = file_service.update_file(
        file_id=file_id,
        update_data=update_data.model_dump(exclude_unset=True, by_alias=False),
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return FileResponse(**result["file"])


@router.delete("/{file_id}", response_model=FileDeleteResponse)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete file"""
    file_service = FileService()
    
    result = file_service.delete_file(
        file_id=file_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return FileDeleteResponse(message=result["message"])
