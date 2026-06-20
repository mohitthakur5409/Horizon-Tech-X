# Social Sphere

A full-stack social media web app inspired by Facebook, Instagram, WhatsApp, Twitter/X, and Telegram.

## Features

- Login and signup with secure password hashing
- Facebook-style timeline feed
- Instagram-style stories, photo posts, reels, saves, and profiles
- Twitter/X-style short posts, hashtags, likes, and comments
- WhatsApp-style direct messaging
- Telegram-style group/community chat
- Follow/unfollow suggestions
- Notifications and mark-as-read
- Search across posts, people, and tags
- Persistent JSON database in `backend/data/db.json`

## Run

```bash
cd backend
npm start
```

Open:

```text
http://localhost:5000
```

Demo login:

```text
username: mohit
password: password123
```

## Main Files

- `backend/server.js` - Node API server and static file server
- `backend/public/index.html` - frontend structure
- `backend/public/styles.css` - responsive UI styling
- `backend/public/app.js` - client-side app logic
- `backend/data/db.json` - created automatically on first run
