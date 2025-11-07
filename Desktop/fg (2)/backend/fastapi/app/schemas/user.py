from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    wallet_address: str
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    role: Optional[str] = 'user'
    wallet_connected: Optional[bool] = False
    wallet_balance: float = 0.0


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None
    wallet_connected: Optional[bool] = None
    wallet_balance: Optional[float] = None


class User(UserBase):
    id: int
    last_wallet_connection: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
