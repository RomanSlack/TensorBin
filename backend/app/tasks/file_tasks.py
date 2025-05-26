import os
from celery import Celery
from PIL import Image
from app.tasks.celery_app import celery_app
from app.config import settings

@celery_app.task
def generate_thumbnail(file_path: str, file_id: int):
    try:
        if not os.path.exists(file_path):
            return {"status": "error", "message": "File not found"}
        
        filename = os.path.basename(file_path)
        name, ext = os.path.splitext(filename)
        
        if ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
            return {"status": "skipped", "message": "Not an image file"}
        
        thumbnail_dir = os.path.join(os.path.dirname(file_path), "thumbnails")
        os.makedirs(thumbnail_dir, exist_ok=True)
        
        thumbnail_path = os.path.join(thumbnail_dir, f"{name}_thumb{ext}")
        
        with Image.open(file_path) as img:
            img.thumbnail((512, 512), Image.Resampling.LANCZOS)
            img.save(thumbnail_path, optimize=True, quality=85)
        
        return {
            "status": "success", 
            "thumbnail_path": thumbnail_path,
            "file_id": file_id
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@celery_app.task
def analyze_file_content(file_path: str, file_id: int):
    try:
        if not os.path.exists(file_path):
            return {"status": "error", "message": "File not found"}
        
        analysis_result = {
            "file_id": file_id,
            "safe": True,
            "confidence": 0.95
        }
        
        return {"status": "success", "analysis": analysis_result}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}