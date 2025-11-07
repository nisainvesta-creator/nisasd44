# Deployment Guide for AI-BOT Smart Mining App

## Overview
This project consists of a React frontend built with Vite and a Node.js backend with PostgreSQL database.

## Prerequisites
- Node.js 18+
- PostgreSQL database
- Telegram Bot Token (for notifications)
- WalletConnect/Reown AppKit project ID

## Environment Variables

### Frontend (.env)
```
VITE_PUBLIC_BUILDER_KEY=your_builder_key_here
```

### Backend (backend/node/.env)
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
DATABASE_URL=your_postgresql_database_url_here
PORT=4001
```

## Frontend Deployment

### Build for Production
```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

### Deploy Options

#### Option 1: Static Hosting (Recommended)
Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

#### Option 2: Server Deployment
Serve the `dist/` folder using any static file server.

## Backend Deployment

### Install Dependencies
```bash
cd backend/node
npm install
```

### Database Setup
1. Create a PostgreSQL database
2. The app will automatically create the required tables on first run
3. Update `DATABASE_URL` in `.env` with your database connection string

### Deploy Options

#### Option 1: Cloud Platforms
- **Railway**: Connect GitHub repo, auto-deploys
- **Render**: Web service with persistent disk
- **Heroku**: Traditional PaaS
- **Vercel**: Serverless functions (requires adapter)
- **AWS EC2**: Full control, manual setup

#### Option 2: Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4001
CMD ["npm", "start"]
```

### Production Considerations
- Set `NODE_ENV=production`
- Use a process manager like PM2
- Set up proper logging
- Configure reverse proxy (nginx)
- Enable HTTPS
- Set up monitoring

## Full Stack Deployment

### Option 1: Separate Services
- Deploy frontend to static hosting
- Deploy backend to cloud platform
- Update frontend API calls to point to backend URL

### Option 2: Monolithic Deployment
- Deploy both frontend and backend to same server
- Configure backend to serve static files
- Use single domain with backend proxying frontend

## Post-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database connected and tables created
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Telegram notifications working
- [ ] Wallet connections functional
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Monitoring set up

## Troubleshooting
- Check browser console for frontend errors
- Check server logs for backend errors
- Verify environment variables are loaded
- Ensure database connectivity
- Test API endpoints manually