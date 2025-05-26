from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    tier = Column(Integer, default=0, nullable=False)  # 0: free, 1: creator, 2: power
    storage_used = Column(BigInteger, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    
    @property
    def storage_limit(self):
        limits = {
            0: 1024 * 1024 * 1024,      # 1GB for free
            1: 10 * 1024 * 1024 * 1024, # 10GB for creator  
            2: 100 * 1024 * 1024 * 1024 # 100GB for power
        }
        return limits.get(self.tier, limits[0])