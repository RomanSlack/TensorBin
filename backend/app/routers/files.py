import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from fastapi.responses import FileResponse, StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_database
from app.routers.auth import get_current_user
from app.schemas.file import FileListResponse, FileResponse as FileResponseSchema, SearchQuery
from app.services.file_service import FileService
from app.models.user import User
from PIL import Image
import io

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileResponseSchema)
async def upload_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    tag_list = []
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    uploaded_file = await FileService.upload_file(db, current_user, file, tag_list, title)
    
    file_response = FileResponseSchema(
        id=uploaded_file.id,
        title=uploaded_file.title,
        filename=uploaded_file.filename,
        original_filename=uploaded_file.original_filename,
        size_bytes=uploaded_file.size_bytes,
        mime_type=uploaded_file.mime_type,
        sha256=uploaded_file.sha256,
        upload_status=uploaded_file.upload_status,
        blocked=uploaded_file.blocked,
        download_count=uploaded_file.download_count,
        created_at=uploaded_file.created_at,
        tags=tag_list,
        download_url=f"/api/v1/files/{uploaded_file.id}/download"
    )
    
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
    
    file_response = FileResponseSchema(
        id=file.id,
        title=file.title,
        filename=file.filename,
        original_filename=file.original_filename,
        size_bytes=file.size_bytes,
        mime_type=file.mime_type,
        sha256=file.sha256,
        upload_status=file.upload_status,
        blocked=file.blocked,
        download_count=file.download_count,
        created_at=file.created_at,
        tags=[tag.tag for tag in file.tags],
        download_url=f"/api/v1/files/{file.id}/download"
    )
    
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

@router.get("/{file_id}/thumbnail")
async def get_file_thumbnail(
    file_id: int,
    size: int = Query(150, ge=50, le=500),
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    file = await FileService.get_file_by_id(db, file_id, current_user)
    
    if not os.path.exists(file.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Check if it's an image
    if not file.mime_type or not file.mime_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not an image"
        )
    
    try:
        # Open and resize image
        with Image.open(file.file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate thumbnail size maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            # Save to memory
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=85, optimize=True)
            img_buffer.seek(0)
            
            return Response(
                content=img_buffer.getvalue(),
                media_type="image/jpeg",
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Content-Length": str(len(img_buffer.getvalue()))
                }
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate thumbnail"
        )

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    success = await FileService.delete_file(db, file_id, current_user)
    return {"message": "File deleted successfully"}