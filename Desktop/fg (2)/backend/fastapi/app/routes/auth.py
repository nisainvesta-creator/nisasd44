from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils import create_access_token
from datetime import timedelta
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    wallet_address: str


@router.post("/login", response_model=schemas.Token)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    wallet_address = request.wallet_address
    """
    Authenticate user by wallet address and return access token
    """
    # Check if user exists, create if not
    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if not user:
        user = models.User(wallet_address=wallet_address)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.wallet_address}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.User)
async def read_users_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user information
    """
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def verify_token(token: str):
    """
    Helper function to verify JWT token
    """
    from app.utils import verify_token as verify
    return verify(token)


def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user and verify they are an admin
    """
    wallet_address = verify_token(credentials.credentials)
    if not wallet_address:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user