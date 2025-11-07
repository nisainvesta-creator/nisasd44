from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class AuditOut(BaseModel):
    id: int
    action: str
    admin_id: Optional[int]
    user_id: Optional[int]
    details: Optional[Any]
    created_at: datetime

    class Config:
        orm_mode = True
