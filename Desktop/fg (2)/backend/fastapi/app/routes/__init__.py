from .auth import router as auth_router
from .users import router as users_router
from .deposits import router as deposits_router
from .wallet import router as wallet_router
from .admin import router as admin_router

__all__ = ["auth_router", "users_router", "deposits_router", "wallet_router", "admin_router"]