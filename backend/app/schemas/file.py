from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class FileUpload(BaseModel):
    filename: str
    tags: Optional[List[str]] = []

class FileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    size_bytes: int
    mime_type: Optional[str]
    sha256: str
    upload_status: str
    blocked: bool
    download_count: int
    tags: List[str] = []
    created_at: datetime
    download_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class FileListResponse(BaseModel):
    files: List[FileResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class SearchQuery(BaseModel):
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    mime_type: Optional[str] = None
    page: int = 1
    per_page: int = 20