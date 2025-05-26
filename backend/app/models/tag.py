from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    tag = Column(String(100), nullable=False, index=True)
    
    file = relationship("File", back_populates="tags")
    
    __table_args__ = (UniqueConstraint('file_id', 'tag', name='unique_file_tag'),)