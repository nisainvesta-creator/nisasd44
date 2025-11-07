from pydantic import BaseModel
from typing import Optional


class BalanceUpdateRequest(BaseModel):
    balance: float


class BalanceUpdateByAddressRequest(BaseModel):
    wallet_address: str
    amount: float


class RewardNotificationRequest(BaseModel):
    reward_amount: float
    reward_type: str = "mining"
    message: Optional[str] = None


class DepositStatusUpdate(BaseModel):
    confirmed: bool


class MaintenanceModeRequest(BaseModel):
    enabled: bool
