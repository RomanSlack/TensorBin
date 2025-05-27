from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True, index=True)
    filename = Column(String(255), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False, unique=True)
    size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    sha256 = Column(String(64), unique=True, nullable=False, index=True)
    upload_status = Column(String(20), default="pending", nullable=False, index=True)
    nsfw_score = Column(Float, default=0.0)
    blocked = Column(Boolean, default=False, nullable=False, index=True)
    download_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    owner = relationship("User", back_populates="files")
    tags = relationship("Tag", back_populates="file", cascade="all, delete-orphan")