import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_database
from app.routers.auth import get_current_user
from app.schemas.file import FileListResponse, FileResponse as FileResponseSchema, SearchQuery
from app.services.file_service import FileService
from app.models.user import User

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileResponseSchema)
async def upload_file(
    file: UploadFile = File(...),
    tags: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    tag_list = []
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    uploaded_file = await FileService.upload_file(db, current_user, file, tag_list)
    
    file_response = FileResponseSchema.from_orm(uploaded_file)
    file_response.tags = tag_list
    file_response.download_url = f"/api/v1/files/{uploaded_file.id}/download"
    
    return file_response

@router.get("/", response_model=FileListResponse)
async def get_user_files(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    return await FileService.get_user_files(db, current_user, page, per_page)

@router.get("/search", response_model=FileListResponse)
async def search_files(
    query: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    mime_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    tag_list = []
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    search_query = SearchQuery(
        query=query,
        tags=tag_list if tag_list else None,
        mime_type=mime_type,
        page=page,
        per_page=per_page
    )
    
    return await FileService.search_files(db, current_user, search_query)

@router.get("/{file_id}", response_model=FileResponseSchema)
async def get_file(
    file_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    file = await FileService.get_file_by_id(db, file_id, current_user)
    
    file_response = FileResponseSchema.from_orm(file)
    file_response.tags = [tag.tag for tag in file.tags]
    file_response.download_url = f"/api/v1/files/{file.id}/download"
    
    return file_response

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    file = await FileService.get_file_by_id(db, file_id, current_user)
    
    if not os.path.exists(file.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    file.download_count += 1
    await db.commit()
    
    return FileResponse(
        path=file.file_path,
        filename=file.original_filename,
        media_type=file.mime_type or 'application/octet-stream'
    )

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    success = await FileService.delete_file(db, file_id, current_user)
    return {"message": "File deleted successfully"}