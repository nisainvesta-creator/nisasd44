from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
import requests
from app.config import settings
from .auth import verify_token

router = APIRouter()
security = HTTPBearer()


@router.get("/deposits/", response_model=List[schemas.Deposit])
def read_deposits(
    skip: int = 0,
    limit: int = 100,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Only allow admin users to list all deposits
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    deposits = db.query(models.Deposit).offset(skip).limit(limit).all()
    return deposits


@router.get("/deposits/{deposit_id}", response_model=schemas.Deposit)
def read_deposit(
    deposit_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Allow users to read their own deposits or admins to read any deposit
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deposit = db.query(models.Deposit).filter(models.Deposit.id == deposit_id).first()
    if deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")

    if deposit.wallet != wallet_address and not user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    return deposit


@router.post("/deposits/", response_model=schemas.Deposit)
def create_deposit(
    deposit: schemas.DepositCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Only allow admin users to create deposits
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    db_deposit = models.Deposit(**deposit.dict())
    db.add(db_deposit)
    db.commit()
    db.refresh(db_deposit)

    # Send Telegram notification
    message = f"New deposit: {deposit.amount_usd} USD from wallet {deposit.wallet[:10]}..."
    send_telegram_notification(message)

    return db_deposit


@router.put("/deposits/{deposit_id}", response_model=schemas.Deposit)
def update_deposit(
    deposit_id: int,
    deposit_update: schemas.DepositUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Only allow admin users to update deposits
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    deposit = db.query(models.Deposit).filter(models.Deposit.id == deposit_id).first()
    if deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")

    for field, value in deposit_update.dict(exclude_unset=True).items():
        setattr(deposit, field, value)

    db.commit()
    db.refresh(deposit)
    return deposit


@router.get("/deposits/wallet/{wallet_address}", response_model=List[schemas.Deposit])
def read_deposits_by_wallet(
    wallet_address: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token_wallet_address = verify_token(credentials.credentials)
    if not token_wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Allow users to read their own deposits or admins to read any deposits
    user = db.query(models.User).filter(models.User.wallet_address == token_wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if wallet_address != token_wallet_address and not user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    deposits = db.query(models.Deposit).filter(models.Deposit.wallet == wallet_address).all()
    return deposits


from app.utils.telegram import send_telegram_message


def send_telegram_notification(message: str, chat_id: Optional[str] = None):
    """Backward compatible wrapper"""
    try:
        return send_telegram_message(message, chat_id=chat_id)
    except Exception as e:
        print(f"Failed to send Telegram notification: {e}")
        return False
