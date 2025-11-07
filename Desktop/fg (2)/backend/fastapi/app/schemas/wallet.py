from pydantic import BaseModel
from typing import Optional


class WalletConnectRequest(BaseModel):
    wallet_address: str
    user_id: int


class RewardClaimRequest(BaseModel):
    user_id: int
    reward_amount: float
    reward_type: str = "mining"


class WithdrawalRequest(BaseModel):
    user_id: int
    amount_usd: float
    wallet_address: str


class WalletDisconnectRequest(BaseModel):
    user_id: int


class WalletStatusResponse(BaseModel):
    wallet_connected: bool
    wallet_address: Optional[str]
    last_connection: Optional[str]