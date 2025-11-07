#!/usr/bin/env python3
"""Seed an admin user into the database.
Usage: python scripts/seed_admin.py --wallet 0x... --email admin@example.com --username admin
"""
import argparse
from app.database import SessionLocal, Base, engine
from app.models.user import User


def seed_admin(wallet_address: str, email: str = None, username: str = None):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.wallet_address.ilike(wallet_address)).first()
        if user:
            print(f"User already exists: {user.id}")
            user.is_admin = True
            if email:
                user.email = email
            if username:
                user.username = username
            db.commit()
            print("User promoted to admin")
            return
        user = User(wallet_address=wallet_address, email=email, username=username, is_admin=True, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created admin user ID {user.id}")
    finally:
        db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--wallet', required=True, help='Wallet address for admin')
    parser.add_argument('--email', default=None)
    parser.add_argument('--username', default=None)
    args = parser.parse_args()
    seed_admin(args.wallet, args.email, args.username)
