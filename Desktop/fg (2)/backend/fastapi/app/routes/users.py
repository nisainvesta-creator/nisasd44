from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from .auth import verify_token

router = APIRouter()
security = HTTPBearer()


@router.get("/users/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Only allow admin users to list all users
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Allow users to read their own profile or admins to read any profile
    current_user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Only allow admin users to create users
    current_user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Check if wallet address already exists
    db_user = db.query(models.User).filter(models.User.wallet_address == user.wallet_address).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Wallet address already registered")

    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Allow users to update their own profile or admins to update any profile
    current_user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Current user not found")

    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user