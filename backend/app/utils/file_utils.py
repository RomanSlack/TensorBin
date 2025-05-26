import hashlib
import magic
import os
import aiofiles
from pathlib import Path
from typing import Optional
from app.config import settings

async def calculate_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(8192):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def get_mime_type(file_path: str) -> Optional[str]:
    try:
        return magic.from_file(file_path, mime=True)
    except:
        return None

def is_allowed_file(filename: str) -> bool:
    if not filename:
        return False
    
    file_ext = Path(filename).suffix.lower()
    return file_ext in settings.ALLOWED_EXTENSIONS

def generate_file_path(user_id: int, filename: str) -> str:
    from datetime import datetime
    
    now = datetime.now()
    year_month = now.strftime("%Y/%m")
    
    safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-").rstrip()
    if not safe_filename:
        safe_filename = "file"
    
    timestamp = now.strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{safe_filename}"
    
    return os.path.join(settings.UPLOAD_DIR, str(user_id), year_month, unique_filename)

async def ensure_directory_exists(file_path: str):
    directory = os.path.dirname(file_path)
    os.makedirs(directory, exist_ok=True)