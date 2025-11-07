from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal


class DepositBase(BaseModel):
    wallet: str
    amount_usd: Decimal
    eth_amount: Optional[Decimal] = None
    tx_hash: Optional[str] = None
    deposit_metadata: Optional[Dict[str, Any]] = None
    confirmed: bool = False
    user_id: Optional[int] = None


class DepositCreate(DepositBase):
    pass


class DepositUpdate(BaseModel):
    eth_amount: Optional[Decimal] = None
    tx_hash: Optional[str] = None
    deposit_metadata: Optional[Dict[str, Any]] = None
    confirmed: Optional[bool] = None
    user_id: Optional[int] = None


class Deposit(DepositBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True