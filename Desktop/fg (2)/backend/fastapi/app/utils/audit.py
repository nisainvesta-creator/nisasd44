from app.database import SessionLocal
from app.models.audit import Audit
from typing import Optional, Any


def log_audit(action: str, admin_id: Optional[int] = None, user_id: Optional[int] = None, details: Optional[Any] = None):
    db = SessionLocal()
    try:
        a = Audit(action=action, admin_id=admin_id, user_id=user_id, details=details)
        db.add(a)
        db.commit()
        db.refresh(a)
        return a
    finally:
        db.close()
