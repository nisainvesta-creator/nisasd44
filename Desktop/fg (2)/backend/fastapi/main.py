from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import Base, engine, get_db
from app import models
from app.routes import auth_router, users_router, deposits_router, wallet_router, admin_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FastAPI Backend",
    description="A FastAPI backend with PostgreSQL and authentication",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(deposits_router, prefix="/api/v1", tags=["deposits"])
app.include_router(wallet_router, prefix="/api/v1", tags=["wallet"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])

# Configure logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Start Telegram bot on app startup (polling or webhook)
@app.on_event('startup')
async def start_telegram_bot():
    try:
        if settings.telegram_bot_token:
            # Import lazily to avoid requiring telebot in environments that don't need it
            import bot as telegram_bot_module
            use_webhook = getattr(settings, 'use_telegram_webhook', False)
            webhook_url = getattr(settings, 'telegram_webhook_url', '') or None
            telegram_bot_module.start_bot(background=True, use_webhook=use_webhook, webhook_url=webhook_url)
            logger.info('Telegram bot started (polling or webhook configured)')
    except Exception as e:
        logger.exception('Failed to start Telegram bot on startup: %s', e)

# Webhook receiver for Telegram (if using webhook mode)
@app.post('/api/v1/telegram/webhook')
async def telegram_webhook(request: Request):
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=400, detail='Telegram bot not configured')
    try:
        payload = await request.json()
        # Import telebot types here to avoid global dependency
        import telebot
        from telebot import types as tb_types
        update = tb_types.Update.de_json(payload)
        # Import the bot module and process the update
        import bot as telegram_bot_module
        telegram_bot_module.bot.process_new_updates([update])
    except Exception as e:
        logger.exception('Failed to process Telegram webhook: %s', e)
        raise HTTPException(status_code=500, detail='Failed to process update')

# Public stats endpoint for bot access
@app.get("/api/v1/stats", tags=["public"])
def get_public_stats(db: Session = Depends(get_db)):
    """Get basic public statistics"""
    total_users = db.query(models.User).count()
    total_deposits = db.query(models.Deposit).count()
    confirmed_deposits = db.query(models.Deposit).filter(models.Deposit.confirmed.is_(True)).count()

    return {
        "total_users": total_users,
        "total_deposits": total_deposits,
        "confirmed_deposits": confirmed_deposits,
        "system_status": "operational"
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to the API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
