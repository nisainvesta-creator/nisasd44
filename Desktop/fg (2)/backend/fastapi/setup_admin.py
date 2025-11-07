#!/usr/bin/env python3
"""
Setup script to create or promote a wallet address to admin
Usage: python setup_admin.py <wallet_address>
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.deposit import Deposit

def setup_admin(wallet_address):
    """Create tables and set admin status for a wallet address"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    # Create or update user
    db = SessionLocal()
    try:
        wallet_address_lower = wallet_address.lower()
        user = db.query(User).filter(User.wallet_address == wallet_address_lower).first()
        
        if not user:
            user = User(wallet_address=wallet_address_lower, is_admin=True, is_active=True)
            db.add(user)
            print(f"Created new user: {wallet_address_lower}")
        else:
            user.is_admin = True
            user.is_active = True
            print(f"Updated existing user: {wallet_address_lower}")

        db.commit()
        db.refresh(user)
        print(f"Admin status granted to: {user.wallet_address}")
        print(f"   - ID: {user.id}")
        print(f"   - Admin: {user.is_admin}")
        print(f"   - Active: {user.is_active}")
        print(f"   - Balance: ${user.wallet_balance}")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python setup_admin.py <wallet_address>")
        print("Example: python setup_admin.py 0xd27baddfc09d511305deef8aaa29d2a884f861a3")
        sys.exit(1)
    
    wallet = sys.argv[1]
    
    if not wallet.lower().startswith('0x') or len(wallet) != 42:
        print("Invalid wallet address format. Must be 0x followed by 40 hex characters")
        sys.exit(1)
    
    success = setup_admin(wallet)
    sys.exit(0 if success else 1)
