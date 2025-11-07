from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.schemas import wallet as wallet_schemas
import requests
from app.config import settings
from .auth import verify_token

router = APIRouter()
security = HTTPBearer()


@router.post("/connect-wallet")
def connect_wallet(
    wallet_data: wallet_schemas.WalletConnectRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Connect user wallet and update status"""
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    wallet_address = wallet_data.wallet_address
    user_id = wallet_data.user_id

    if not wallet_address or not user_id:
        raise HTTPException(status_code=400, detail="Wallet address and user ID required")

    # Allow users to connect their own wallet or admins to connect any wallet
    current_user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find user by ID
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update wallet connection status
    user.wallet_connected = True
    user.last_wallet_connection = datetime.utcnow()
    user.wallet_address = wallet_address

    db.commit()
    db.refresh(user)

    # Send Telegram notification
    message = f"Wallet connected: {wallet_address[:10]}... for user {user.username or user.email or f'ID:{user.id}'}"
    send_telegram_notification(message)

    return {"message": "Wallet connected successfully", "user": user}


@router.post("/claim-reward")
def claim_reward(
    reward_data: wallet_schemas.RewardClaimRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Claim reward for user"""
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user_id = reward_data.user_id
    reward_amount = reward_data.reward_amount
    reward_type = reward_data.reward_type

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # Allow users to claim their own rewards or admins to claim for any user
    current_user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.wallet_connected:
        raise HTTPException(status_code=400, detail="Wallet not connected")

    # Here you would typically check if user has earned rewards
    # For now, we'll assume they can claim if they have a connected wallet

    # Send Telegram notification
    message = f"Reward claimed: {reward_amount} for {reward_type} by user {user.username or user.email or f'ID:{user.id}'} ({user.wallet_address[:10]}...)"
    send_telegram_notification(message)

    return {
        "message": "Reward claimed successfully",
        "user_id": user_id,
        "reward_amount": reward_amount,
        "reward_type": reward_type,
        "wallet_address": user.wallet_address
    }


@router.post("/withdraw")
def withdraw(
    withdrawal_data: wallet_schemas.WithdrawalRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Withdraw funds to user wallet"""
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user_id = withdrawal_data.user_id
    amount_usd = withdrawal_data.amount_usd
    wallet_address = withdrawal_data.wallet_address

    if not user_id or not amount_usd or not wallet_address:
        raise HTTPException(status_code=400, detail="User ID, amount, and wallet address required")

    # Allow users to withdraw from their own account or admins to withdraw for any user
    current_user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.wallet_connected:
        raise HTTPException(status_code=400, detail="Wallet not connected")

    # Here you would typically check user's balance
    # For now, we'll assume withdrawal is allowed

    # Send Telegram notification
    message = f"Withdrawal: {amount_usd} USD to {wallet_address[:10]}... for user {user.username or user.email or f'ID:{user.id}'} ({user.wallet_address[:10]}...)"
    send_telegram_notification(message)

    return {
        "message": "Withdrawal initiated successfully",
        "user_id": user_id,
        "amount_usd": amount_usd,
        "wallet_address": wallet_address,
        "status": "pending"
    }


@router.post("/disconnect-wallet")
def disconnect_wallet(
    user_data: wallet_schemas.WalletDisconnectRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Disconnect user wallet"""
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user_id = user_data.user_id

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # Allow users to disconnect their own wallet or admins to disconnect any wallet
    current_user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.wallet_connected = False
    user.last_wallet_connection = None

    db.commit()
    db.refresh(user)

    return {"message": "Wallet disconnected successfully"}


@router.get("/wallet-status/{user_id}", response_model=wallet_schemas.WalletStatusResponse)
def get_wallet_status(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get wallet connection status for user"""
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Allow users to check their own wallet status or admins to check any user's status
    current_user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return wallet_schemas.WalletStatusResponse(
        wallet_connected=user.wallet_connected,
        wallet_address=user.wallet_address,
        last_connection=user.last_wallet_connection.isoformat() if user.last_wallet_connection else None
    )


from app.utils.telegram import send_telegram_message


def send_telegram_notification(message: str, chat_id: Optional[str] = None):
    """Backward compatible wrapper"""
    try:
        return send_telegram_message(message, chat_id=chat_id)
    except Exception as e:
        print(f"Failed to send Telegram notification: {e}")
        return False
