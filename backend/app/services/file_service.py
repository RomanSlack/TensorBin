import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional, Tuple
from app.models.user import User
from app.models.file import File
from app.models.tag import Tag
from app.schemas.file import FileListResponse, FileResponse, SearchQuery
from app.utils.file_utils import (
    calculate_sha256, 
    get_mime_type, 
    is_allowed_file, 
    generate_file_path, 
    ensure_directory_exists
)
from app.config import settings

class FileService:
    @staticmethod
    async def upload_file(
        db: AsyncSession, 
        user: User, 
        file: UploadFile, 
        tags: List[str] = None,
        title: Optional[str] = None
    ) -> File:
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed"
            )
        
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large"
            )
        
        if user.storage_used + (file.size or 0) > user.storage_limit:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Storage quota exceeded"
            )
        
        file_path = generate_file_path(user.id, file.filename)
        await ensure_directory_exists(file_path)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        file_size = len(content)
        sha256 = await calculate_sha256(file_path)
        mime_type = get_mime_type(file_path)
        
        result = await db.execute(select(File).where(File.sha256 == sha256))
        existing_file = result.scalar_one_or_none()
        
        if existing_file:
            os.remove(file_path)
            if existing_file.user_id == user.id:
                return existing_file
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="File already exists"
                )
        
        db_file = File(
            user_id=user.id,
            title=title,
            filename=file.filename,
            original_filename=file.filename,
            file_path=file_path,
            size_bytes=file_size,
            mime_type=mime_type,
            sha256=sha256,
            upload_status="completed"
        )
        
        db.add(db_file)
        await db.flush()
        
        if tags:
            for tag in tags:
                tag_obj = Tag(file_id=db_file.id, tag=tag.strip().lower())
                db.add(tag_obj)
        
        user.storage_used += file_size
        await db.commit()
        await db.refresh(db_file)
        
        return db_file
    
    @staticmethod
    async def get_user_files(
        db: AsyncSession, 
        user: User, 
        page: int = 1, 
        per_page: int = 20
    ) -> FileListResponse:
        offset = (page - 1) * per_page
        
        query = (
            select(File)
            .where(File.user_id == user.id)
            .options(selectinload(File.tags))
            .order_by(File.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        
        result = await db.execute(query)
        files = result.scalars().all()
        
        count_query = select(func.count(File.id)).where(File.user_id == user.id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        file_responses = []
        for file in files:
            file_response = FileResponse(
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
            file_responses.append(file_response)
        
        total_pages = (total + per_page - 1) // per_page
        
        return FileListResponse(
            files=file_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    
    @staticmethod
    async def get_file_by_id(db: AsyncSession, file_id: int, user: User) -> File:
        query = (
            select(File)
            .where(and_(File.id == file_id, File.user_id == user.id))
            .options(selectinload(File.tags))
        )
        
        result = await db.execute(query)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return file
    
    @staticmethod
    async def delete_file(db: AsyncSession, file_id: int, user: User) -> bool:
        file = await FileService.get_file_by_id(db, file_id, user)
        
        if os.path.exists(file.file_path):
            os.remove(file.file_path)
        
        user.storage_used -= file.size_bytes
        await db.delete(file)
        await db.commit()
        
        return True
    
    @staticmethod
    async def search_files(
        db: AsyncSession, 
        user: User, 
        search_query: SearchQuery
    ) -> FileListResponse:
        offset = (search_query.page - 1) * search_query.per_page
        
        query = select(File).where(File.user_id == user.id)
        
        if search_query.query:
            search_term = f"%{search_query.query}%"
            query = query.where(
                or_(
                    File.filename.ilike(search_term),
                    File.original_filename.ilike(search_term),
                    File.title.ilike(search_term)
                )
            )
        
        if search_query.tags:
            tag_subquery = (
                select(Tag.file_id)
                .where(Tag.tag.in_([tag.lower() for tag in search_query.tags]))
                .group_by(Tag.file_id)
                .having(func.count(Tag.tag) == len(search_query.tags))
            )
            query = query.where(File.id.in_(tag_subquery))
        
        if search_query.mime_type:
            query = query.where(File.mime_type.like(f"{search_query.mime_type}%"))
        
        query = (
            query
            .options(selectinload(File.tags))
            .order_by(File.created_at.desc())
            .offset(offset)
            .limit(search_query.per_page)
        )
        
        result = await db.execute(query)
        files = result.scalars().all()
        
        count_query = select(func.count(File.id)).where(File.user_id == user.id)
        if search_query.query:
            search_term = f"%{search_query.query}%"
            count_query = count_query.where(
                or_(
                    File.filename.ilike(search_term),
                    File.original_filename.ilike(search_term),
                    File.title.ilike(search_term)
                )
            )
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        file_responses = []
        for file in files:
            file_response = FileResponse(
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
            file_responses.append(file_response)
        
        total_pages = (total + search_query.per_page - 1) // search_query.per_page
        
        return FileListResponse(
            files=file_responses,
            total=total,
            page=search_query.page,
            per_page=search_query.per_page,
            total_pages=total_pages
        )