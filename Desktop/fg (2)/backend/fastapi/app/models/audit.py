from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Audit(Base):
    __tablename__ = 'audits'

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(200), nullable=False)
    admin_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
