import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


def send_telegram_message(text: str, chat_id: Optional[str] = None, parse_mode: str = 'Markdown', disable_notification: bool = False) -> bool:
    """Send a message via Telegram bot.

    Supports sending to users, groups and channels. The chat_id may be:
    - a numeric id like -1001234567890 (as str or int)
    - a username like "@channelusername"
    - a plain username without @ (we'll add it)

    Returns True on success, False otherwise. Detailed response is logged.
    """
    if not settings.telegram_bot_token:
        logger.debug('Telegram bot token not configured; skipping send')
        return False

    target_chat = chat_id or settings.telegram_chat_id
    if not target_chat:
        logger.debug('Telegram chat id not configured; skipping send')
        return False

    # Normalize chat id / username
    try:
        # convert ints to str
        if isinstance(target_chat, int):
            target_chat = str(target_chat)
        # if looks like a username without @, add it
        if isinstance(target_chat, str) and target_chat and not target_chat.startswith('@') and not target_chat.lstrip('-').isdigit():
            target_chat = '@' + target_chat
    except Exception:
        # fallback: stringify
        target_chat = str(target_chat)

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        'chat_id': target_chat,
        'text': text,
        'parse_mode': parse_mode,
        'disable_notification': disable_notification,
    }

    try:
        import httpx
        resp = httpx.post(url, json=payload, timeout=10.0)
        # If HTTP status is not 2xx this will raise
        resp.raise_for_status()
        # Telegram returns JSON with an 'ok' boolean
        try:
            resp_json = resp.json()
        except Exception:
            logger.warning('Telegram response is not JSON: %s', resp.text)
            return False

        if not resp_json.get('ok'):
            logger.error('Telegram API returned error: %s', resp_json)
            return False

        logger.debug('Telegram message sent successfully to %s', target_chat)
        return True
    except Exception as e:
        # If httpx HTTP error includes response, log it for more detail
        try:
            import httpx as _httpx
            if isinstance(e, _httpx.HTTPStatusError) and e.response is not None:
                logger.exception('Failed to send Telegram message, status=%s, body=%s', e.response.status_code, e.response.text)
            else:
                logger.exception('Failed to send Telegram message: %s', e)
        except Exception:
            logger.exception('Failed to send Telegram message: %s', e)
        return False


# end of file
