from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import requests
from app.database import get_db
from app import models, schemas
from app.schemas import admin as admin_schemas
from app.config import settings
from .auth import get_current_admin_user
from app.utils.audit import log_audit
from app.models.audit import Audit
from app.schemas.audit import AuditOut
from fastapi.responses import Response
import csv
import io

router = APIRouter()


@router.get("/dashboard/stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    """Get admin dashboard statistics"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    admin_users = db.query(models.User).filter(models.User.is_admin == True).count()
    total_deposits = db.query(models.Deposit).count()
    recent_deposits = db.query(models.Deposit).filter(
        models.Deposit.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users,
        "total_deposits": total_deposits,
        "recent_deposits": recent_deposits,
        "system_health": "healthy"
    }


@router.get("/users/", response_model=List[schemas.User])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_admin: Optional[bool] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Get all users with filtering options"""
    query = db.query(models.User)

    if search:
        query = query.filter(
            (models.User.wallet_address.contains(search)) |
            (models.User.username.contains(search)) |
            (models.User.email.contains(search))
        )

    if is_admin is not None:
        query = query.filter(models.User.is_admin == is_admin)

    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)

    users = query.offset(skip).limit(limit).all()
    return users


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user_admin(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Update user details (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from demoting themselves
    if user_id == current_admin.id and user_update.is_admin == False:
        raise HTTPException(status_code=400, detail="Cannot demote yourself")

    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/balance", response_model=schemas.User)
def update_user_balance(
    user_id: int,
    balance_data: admin_schemas.BalanceUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Update user wallet balance (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    new_balance_float = balance_data.balance

    if new_balance_float < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")

    # Get current balance - ensure it's a float
    current_balance = float(user.wallet_balance or 0.0)

    # Calculate the increase amount
    increase_amount = new_balance_float - current_balance

    # Update balance
    user.wallet_balance = new_balance_float

    # Send Telegram notification with increase amount
    if increase_amount > 0:
        message = f"Admin increased balance for user {user.username or user.email or f'ID:{user.id}'} by +{increase_amount:.2f} (New balance: {new_balance_float:.2f})"
    elif increase_amount < 0:
        message = f"Admin decreased balance for user {user.username or user.email or f'ID:{user.id}'} by {increase_amount:.2f} (New balance: {new_balance_float:.2f})"
    else:
        message = f"Admin set balance for user {user.username or user.email or f'ID:{user.id}'} to {new_balance_float:.2f} (No change)"

    send_telegram_notification(message)

    db.commit()
    db.refresh(user)

    # Audit: record balance change
    try:
        log_audit(action='update_user_balance', admin_id=current_admin.id if current_admin else None, user_id=user.id, details={'new_balance': new_balance_float, 'increase_amount': increase_amount})
    except Exception:
        pass

    return user


@router.post("/balance/by-address", response_model=dict)
def add_balance_by_wallet_address(
    balance_data: admin_schemas.BalanceUpdateByAddressRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Add balance to a wallet by address (admin only)"""
    wallet_address = balance_data.wallet_address.lower()
    user = db.query(models.User).filter(models.User.wallet_address.ilike(wallet_address)).first()

    if user is None:
        raise HTTPException(status_code=404, detail=f"User with wallet address {wallet_address} not found")

    amount = balance_data.amount

    if amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative")

    # Get current balance - ensure it's a float
    current_balance = float(user.wallet_balance or 0.0)

    # Add the amount
    new_balance = current_balance + amount

    # Update balance
    user.wallet_balance = new_balance

    # Send Telegram notification
    message = f"Admin added balance for user {user.username or user.email or f'ID:{user.id}'} (wallet: {wallet_address}): +{amount:.2f} (Previous: {current_balance:.2f}, New: {new_balance:.2f})"
    send_telegram_notification(message)

    db.commit()
    db.refresh(user)

    # Audit: record balance addition
    try:
        log_audit(action='add_balance_by_address', admin_id=current_admin.id if current_admin else None, user_id=user.id, details={'amount_added': amount, 'previous_balance': current_balance, 'new_balance': new_balance})
    except Exception:
        pass

    return {
        "message": "Balance added successfully",
        "user_id": user.id,
        "wallet_address": user.wallet_address,
        "amount_added": amount,
        "previous_balance": current_balance,
        "new_balance": new_balance
    }


@router.post("/users/{user_id}/notify-reward")
def notify_user_reward(
    user_id: int,
    reward_data: admin_schemas.RewardNotificationRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Send reward claim notification to user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    reward_amount = reward_data.reward_amount
    reward_type = reward_data.reward_type
    message = reward_data.message or f"Congratulations! You have earned {reward_amount} {reward_type} reward."

    if not reward_amount:
        raise HTTPException(status_code=400, detail="Reward amount is required")

    # Send Telegram notification to user
    user_message = f"🎉 Reward Notification 🎉\n\n{message}\n\nReward: {reward_amount}\nType: {reward_type}\n\nPlease claim your reward in the app!"
    from app.utils.telegram import send_telegram_message

    send_telegram_message(user_message, chat_id=settings.telegram_chat_id)

    # Log admin action
    admin_message = f"Admin sent reward notification to user {user.username or user.email or f'ID:{user.id}'}: {reward_amount} {reward_type}"
    send_telegram_message(admin_message, chat_id=settings.telegram_chat_id)

    try:
        log_audit(action='notify_user_reward', admin_id=current_admin.id if current_admin else None, user_id=user.id, details={'reward_amount': reward_amount, 'reward_type': reward_type, 'message': message})
    except Exception:
        pass

    return {
        "message": "Reward notification sent successfully",
        "user_id": user_id,
        "reward_amount": reward_amount,
        "reward_type": reward_type
    }


from app.utils.telegram import send_telegram_message


def send_telegram_notification_to_user(user: models.User, message: str, chat_id: Optional[str] = None):
    """Send notification to specific user via Telegram (for now routes to admin chat)."""
    # For now, send to configured admin chat with user identification; in future use user-specific chats
    target = chat_id or settings.telegram_chat_id
    body = f"📤 To User {user.username or user.email or f'ID:{user.id}'}:\n\n{message}"
    try:
        return send_telegram_message(body, chat_id=target)
    except Exception as e:
        print(f"Failed to send Telegram notification to user: {e}")
        return False


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Delete user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/deposits/", response_model=List[schemas.Deposit])
def get_all_deposits(
    skip: int = 0,
    limit: int = 100,
    wallet_address: Optional[str] = None,
    confirmed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Get all deposits with filtering"""
    query = db.query(models.Deposit)

    if wallet_address:
        query = query.filter(models.Deposit.wallet.contains(wallet_address))

    if confirmed is not None:
        query = query.filter(models.Deposit.confirmed == confirmed)

    deposits = query.offset(skip).limit(limit).all()
    return deposits


@router.put("/deposits/{deposit_id}", response_model=schemas.Deposit)
def update_deposit_status(
    deposit_id: int,
    status_update: admin_schemas.DepositStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Update deposit confirmation status"""
    deposit = db.query(models.Deposit).filter(models.Deposit.id == deposit_id).first()
    if deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")

    deposit.confirmed = status_update.confirmed
    db.commit()
    db.refresh(deposit)
    return deposit


@router.post("/system/maintenance")
def toggle_maintenance_mode(
    maintenance_data: admin_schemas.MaintenanceModeRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Toggle system maintenance mode"""
    # This would typically update a system settings table
    # For now, we'll just return a success message
    return {
        "message": f"Maintenance mode {'enabled' if maintenance_data.enabled else 'disabled'}",
        "maintenance_mode": maintenance_data.enabled
    }


# Admin: Send arbitrary message via Telegram bot (admin only)
class BotMessage(admin_schemas.BaseModel if hasattr(admin_schemas, 'BaseModel') else None):
    pass

from pydantic import BaseModel
class BotMessage(BaseModel):
    message: str


@router.post('/bot/send-message')
def admin_send_bot_message(
    payload: BotMessage,
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Send a message to the configured Telegram chat via bot (admin only)."""
    message = payload.message or ''
    if not message:
        raise HTTPException(status_code=400, detail='Message cannot be empty')

    try:
        send_telegram_notification(message)
        try:
            log_audit(action='send_bot_message', admin_id=current_admin.id if current_admin else None, details={'message': message})
        except Exception:
            pass
        return { 'ok': True, 'message': 'Sent' }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Audits listing (admin only)
@router.get('/audits/', response_model=List[AuditOut])
def list_audits(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    admin_id: Optional[int] = None,
    user_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_admin: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List audits with optional filtering and pagination."""
    query = db.query(Audit)
    if action:
        query = query.filter(Audit.action.ilike(f"%{action}%"))
    if admin_id is not None:
        query = query.filter(Audit.admin_id == admin_id)
    if user_id is not None:
        query = query.filter(Audit.user_id == user_id)
    if date_from:
        try:
            from datetime import datetime
            df = datetime.fromisoformat(date_from)
            query = query.filter(Audit.created_at >= df)
        except Exception:
            pass
    if date_to:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(date_to)
            query = query.filter(Audit.created_at <= dt)
        except Exception:
            pass

    audits = query.order_by(Audit.created_at.desc()).offset(skip).limit(limit).all()
    return audits


# Export users CSV with customizable columns
@router.get('/users/export')
def export_users_csv(
    columns: Optional[str] = None,
    current_admin: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Export users as CSV. Optional `columns` comma-separated list to customize columns."""
    default_cols = ['id','wallet_address','email','username','is_active','is_admin','role','wallet_balance']
    if columns:
        cols = [c.strip() for c in columns.split(',') if c.strip()]
        # Validate cols
        cols = [c for c in cols if c in default_cols]
        if not cols:
            cols = default_cols
    else:
        cols = default_cols

    users = db.query(models.User).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(cols)
    for u in users:
        row = []
        for c in cols:
            if c == 'id':
                row.append(u.id)
            elif c == 'wallet_address':
                row.append(u.wallet_address)
            elif c == 'email':
                row.append(u.email or '')
            elif c == 'username':
                row.append(u.username or '')
            elif c == 'is_active':
                row.append(u.is_active)
            elif c == 'is_admin':
                row.append(u.is_admin)
            elif c == 'role':
                row.append(getattr(u, 'role', 'user'))
            elif c == 'wallet_balance':
                row.append(getattr(u, 'wallet_balance', 0))
            else:
                row.append('')
        writer.writerow(row)
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type='text/csv', headers={"Content-Disposition": "attachment; filename=users.csv"})


@router.get("/system/logs")
def get_system_logs(
    lines: int = Query(100, ge=1, le=1000),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Get recent system logs"""
    # This would typically read from log files
    # For now, return mock data
    return {
        "logs": [
            {"timestamp": datetime.utcnow().isoformat(), "level": "INFO", "message": "System running normally"},
            {"timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(), "level": "INFO", "message": "User login successful"},
            {"timestamp": (datetime.utcnow() - timedelta(minutes=10)).isoformat(), "level": "WARNING", "message": "High memory usage detected"}
        ],
        "total_lines": lines
    }


from app.utils.telegram import send_telegram_message


def send_telegram_notification(message: str, chat_id: Optional[str] = None):
    """Backward compatible wrapper for send_telegram_message"""
    try:
        return send_telegram_message(message, chat_id=chat_id)
    except Exception as e:
        print(f"Failed to send Telegram notification: {e}")
        return False
