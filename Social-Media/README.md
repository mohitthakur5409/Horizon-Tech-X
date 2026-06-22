
# Social Media Platform

Features:
- Facebook-style authentication
- Instagram-style posts and reels
- WhatsApp-style stories/status
- Telegram-style chat and messaging
- Twitter/X-style profiles and dashboards

## Requirements

- Node.js 18+
- MongoDB Community Server
- npm

## Local MongoDB

Start MongoDB:

```bash
mongod
```

Connection string:

```text
mongodb://127.0.0.1:27017/socialmedia
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Backend:

- PORT
- MONGO_URI
- JWT_SECRET
- JWT_EXPIRE

## GitHub Preparation

The archive excludes node_modules.
Add these to .gitignore:

```
node_modules/
.env
dist/
build/
```

## MongoDB Connectivity Check

Verify MongoDB is running:

```bash
mongosh
use socialmedia
db.stats()
```
