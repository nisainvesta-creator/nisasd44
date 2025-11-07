from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(Integer, primary_key=True, index=True)
    wallet = Column(String(128), nullable=False, index=True)
    amount_usd = Column(Numeric(18, 6), nullable=False)
    eth_amount = Column(Numeric(36, 18), nullable=True)
    tx_hash = Column(String(128), nullable=True)
    deposit_metadata = Column(JSON, default=dict)
    confirmed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="deposits")