#!/usr/bin/env python3
"""Seed a manager user into the database.
Usage: python scripts/seed_manager.py --wallet 0x... --email manager@example.com --username manager
"""
import argparse
from app.database import SessionLocal, Base, engine
from app.models.user import User


def seed_manager(wallet_address: str, email: str = None, username: str = None):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.wallet_address.ilike(wallet_address)).first()
        if user:
            print(f"User already exists: {user.id}")
            user.role = 'manager'
            if email:
                user.email = email
            if username:
                user.username = username
            db.commit()
            print("User promoted to manager")
            return
        user = User(wallet_address=wallet_address, email=email, username=username, is_admin=False, role='manager', is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created manager user ID {user.id}")
    finally:
        db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--wallet', required=True, help='Wallet address for manager')
    parser.add_argument('--email', default=None)
    parser.add_argument('--username', default=None)
    args = parser.parse_args()
    seed_manager(args.wallet, args.email, args.username)
