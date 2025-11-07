# FastAPI Backend

A comprehensive FastAPI backend with PostgreSQL database, JWT authentication, and RESTful API endpoints.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: ORM for database operations
- **JWT Authentication**: Secure token-based authentication
- **Pydantic**: Data validation and serialization
- **CORS**: Cross-origin resource sharing support

## Project Structure

```
backend/fastapi/
├── app/
│   ├── __init__.py
│   ├── config.py          # Configuration settings
│   ├── database/
│   │   ├── __init__.py    # Database connection and session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py        # User model
│   │   └── deposit.py     # Deposit model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py        # User schemas
│   │   ├── deposit.py     # Deposit schemas
│   │   └── token.py       # Token schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── users.py       # User management endpoints
│   │   └── deposits.py    # Deposit management endpoints
│   └── utils/
│       ├── __init__.py
│       └── auth.py        # Authentication utilities
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── README.md
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
SECRET_KEY=your-secret-key-here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

3. Run the application:
```bash
uvicorn main:app --reload
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with wallet address
- `GET /api/v1/auth/me` - Get current user info

### Users
- `GET /api/v1/users/` - List users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `POST /api/v1/users/` - Create user
- `PUT /api/v1/users/{user_id}` - Update user

### Deposits
- `GET /api/v1/deposits/` - List deposits
- `GET /api/v1/deposits/{deposit_id}` - Get deposit by ID
- `POST /api/v1/deposits/` - Create deposit
- `PUT /api/v1/deposits/{deposit_id}` - Update deposit
- `GET /api/v1/deposits/wallet/{wallet_address}` - Get deposits by wallet

## Database Models

### User
- `id`: Primary key
- `wallet_address`: Unique wallet address
- `email`: Optional email
- `username`: Optional username
- `is_active`: Account status
- `is_admin`: Admin privileges
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Deposit
- `id`: Primary key
- `wallet`: Wallet address
- `amount_usd`: Amount in USD
- `eth_amount`: Amount in ETH (optional)
- `tx_hash`: Transaction hash (optional)
- `metadata`: Additional data (JSON)
- `confirmed`: Confirmation status
- `user_id`: Foreign key to User
- `created_at`: Creation timestamp

## Development

The application uses:
- **SQLAlchemy** for ORM
- **Alembic** for database migrations (can be added later)
- **Pydantic** for data validation
- **JWT** for authentication
- **CORS** for cross-origin requests

## Testing

Run the application and visit `http://localhost:8000/docs` for interactive API documentation.