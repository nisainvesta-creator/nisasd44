import telebot
import telebot
from telebot import types
import requests
from app.config import settings

# Database access
from app.database import SessionLocal
from app.models.user import User

bot = telebot.TeleBot(settings.telegram_bot_token)

# Helper to ensure only admin chat can run commands
def _is_admin_chat(chat_id: int) -> bool:
    try:
        return str(chat_id) == str(settings.telegram_chat_id)
    except Exception:
        return False


@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    btn1 = types.KeyboardButton("📊 Stats")
    btn2 = types.KeyboardButton("💰 Deposits")
    btn3 = types.KeyboardButton("👥 Users")
    markup.add(btn1, btn2, btn3)

    bot.reply_to(message, "Welcome to the Trading Bot Admin Panel!", reply_markup=markup)

@bot.message_handler(commands=['stats'])
@bot.message_handler(func=lambda message: message.text == "📊 Stats")
def send_stats(message):
    try:
        # Use public stats endpoint to avoid requiring admin auth for the bot
        response = requests.get("http://localhost:8000/api/v1/stats")
        if response.status_code == 200:
            stats = response.json()
            text = (
                f"📊 Bot Statistics:\n\n"
                f"Total Users: {stats.get('total_users', 0)}\n"
                f"Total Deposits: {stats.get('total_deposits', 0)}\n"
                f"Confirmed Deposits: {stats.get('confirmed_deposits', 0)}\n"
                f"System Status: {stats.get('system_status', 'unknown')}"
            )
        else:
            text = "Unable to fetch statistics"
    except Exception as e:
        text = f"Error connecting to server: {e}"

    bot.reply_to(message, text)

@bot.message_handler(func=lambda message: message.text == "💰 Deposits")
def send_deposits(message):
    try:
        # Get recent deposits from API
        response = requests.get("http://localhost:8000/api/v1/admin/deposits/?limit=5")
        if response.status_code == 200:
            deposits = response.json()
            text = "💰 Recent Deposits:\n\n"
            for deposit in deposits:
                text += f"Wallet: {deposit['wallet'][:10]}...\nAmount: ${deposit['amount_usd']}\nConfirmed: {'✅' if deposit['confirmed'] else '⏳'}\n\n"
        else:
            text = "Unable to fetch deposits"
    except:
        text = "Error connecting to server"

    bot.reply_to(message, text)

@bot.message_handler(func=lambda message: message.text == "👥 Users")
def send_users(message):
    try:
        # Get users count from API
        response = requests.get("http://localhost:8000/api/v1/admin/users/?limit=10")
        if response.status_code == 200:
            users = response.json()
            text = f"👥 Recent Users ({len(users)}):\n\n"
            for user in users[:5]:  # Show first 5 users
                wallet = user.get('wallet_address', 'N/A')[:10] + "..."
                status = "✅ Active" if user.get('is_active') else "⏸️ Inactive"
                admin = "👑 Admin" if user.get('is_admin') else ""
                text += f"ID: {user['id']} | Wallet: {wallet} | {status} {admin}\n"
        else:
            text = "Unable to fetch users"
    except Exception as e:
        text = f"Error connecting to server: {e}"

    bot.reply_to(message, text)


# Admin command: check wallet status by address
@bot.message_handler(commands=['check_wallet'])
def check_wallet(message):
    # Only allow admin chat to use this command
    chat_id = message.chat.id
    if not _is_admin_chat(chat_id):
        bot.reply_to(message, "Unauthorized: only admin chat can use this command.")
        return

    # Parse wallet address
    parts = message.text.split()
    if len(parts) < 2:
        bot.reply_to(message, "Usage: /check_wallet <wallet_address>")
        return

    wallet = parts[1].strip()
    if not wallet:
        bot.reply_to(message, "Please provide a wallet address.")
        return

    # Query DB directly
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.wallet_address.ilike(wallet)).first()
        if not user:
            bot.reply_to(message, f"No user found for wallet {wallet}")
            return

        text = (
            f"User ID: {user.id}\n"
            f"Wallet: {user.wallet_address}\n"
            f"Username: {user.username or 'N/A'}\n"
            f"Email: {user.email or 'N/A'}\n"
            f"Is Admin: {user.is_admin}\n"
            f"Active: {user.is_active}\n"
            f"Wallet Connected: {user.wallet_connected}\n"
            f"Last Connection: {user.last_wallet_connection}\n"
            f"Balance: {user.wallet_balance}\n"
        )
        bot.reply_to(message, text)
    except Exception as e:
        bot.reply_to(message, f"Error checking wallet: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass


@bot.message_handler(commands=['connected_wallets'])
def connected_wallets(message):
    chat_id = message.chat.id
    if not _is_admin_chat(chat_id):
        bot.reply_to(message, "Unauthorized: only admin chat can use this command.")
        return

    try:
        db = SessionLocal()
        users = db.query(User).filter(User.wallet_connected == True).limit(50).all()
        if not users:
            bot.reply_to(message, "No connected wallets found.")
            return

        text = f"Connected wallets ({len(users)}):\n\n"
        for u in users:
            text += f"ID:{u.id} {u.wallet_address} | Last: {u.last_wallet_connection or 'N/A'} | Bal: {u.wallet_balance}\n"
        bot.reply_to(message, text)
    except Exception as e:
        bot.reply_to(message, f"Error fetching connected wallets: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass

import threading


def start_bot(background: bool = True, use_webhook: bool = False, webhook_url: str | None = None):
    """Start the Telegram bot either via polling or webhook.

    If use_webhook is True and webhook_url is provided the bot will set webhook and not poll.
    Otherwise it will start polling in a background thread when background=True.

    Also registers bot command list so users see available commands in Telegram UI.
    """
    # Register bot commands (visible in Telegram clients)
    try:
        commands = [
            types.BotCommand('start', 'Show welcome and menu'),
            types.BotCommand('check_wallet', 'Check wallet details by address'),
            types.BotCommand('connected_wallets', 'List connected wallets'),
            types.BotCommand('stats', 'Show basic system statistics'),
        ]
        bot.set_my_commands(commands)
        print('Registered bot commands')
    except Exception as e:
        print(f'Failed to register bot commands: {e}')

    def _poll():
        try:
            print("Bot is running (polling)...")
            bot.polling()
        except Exception as e:
            print(f"Telegram bot polling stopped with error: {e}")

    def _set_webhook(url: str):
        try:
            bot.remove_webhook()
            bot.set_webhook(url)
            print(f"Webhook set to: {url}")
        except Exception as e:
            print(f"Failed to set webhook: {e}")

    if use_webhook and webhook_url:
        _set_webhook(webhook_url)
        print("Bot configured to use webhook (no polling)")
        return

    # Fallback to polling
    if background:
        thread = threading.Thread(target=_poll, daemon=True)
        thread.start()
    else:
        _poll()


if __name__ == '__main__':
    start_bot(background=False)
