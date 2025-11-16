# Quick Start: Getting Your Telegram Mini App Working

## The Problem
Your webapp isn't opening because:
1. Frontend needs to be **built** (React source code → static HTML/JS)
2. URL must be **HTTPS** (Telegram requirement)
3. Files must be **served correctly**

## Quick Fix (3 Steps)

### Step 1: Build the Frontend
```bash
cd app/static
npm install
npm run build
```

This creates `app/static/dist/` with production files.

### Step 2: Set Your Frontend URL
In your `.env` file:
```env
FRONT_SITE=https://yourdomain.com/static
```

**For local testing**, use ngrok:
```bash
# Install ngrok: https://ngrok.com/
ngrok http 8000

# Then in .env:
FRONT_SITE=https://your-ngrok-url.ngrok.io/static
```

### Step 3: Restart Your Server
```bash
# Your FastAPI server will now serve the built files
python -m uvicorn app.main:app --reload
```

## How It Works - Simple Explanation

### 1. **Button in Telegram**
When user clicks "🔖 Записаться" button:
- Bot sends button with `web_app: {url: "https://..."}`
- Telegram sees `web_app` → opens Mini App window
- If it's just `url` → opens in browser

### 2. **Telegram Opens Your Page**
- Telegram loads your URL in an in-app browser
- Injects `telegram-web-app.js` script automatically
- Provides user data via `window.Telegram.WebApp`

### 3. **Your Page Loads**
- Your React app initializes
- Calls `tg.ready()` and `tg.expand()`
- Uses Telegram theme colors
- Can access user info from `tg.initDataUnsafe.user`

## Key Requirements

✅ **HTTPS URL** (or localhost for testing)  
✅ **Built frontend files** in `dist/` folder  
✅ **Telegram script loaded** (already in index.html)  
✅ **Correct path** - `/static` serves your files  

## Testing Checklist

- [ ] Frontend built (`npm run build` completed)
- [ ] `app/static/dist/` folder exists
- [ ] `FRONT_SITE` in `.env` is HTTPS URL
- [ ] Server restarted after changes
- [ ] Button shows "🔖 Записаться" in bot
- [ ] Clicking button opens Mini App (not browser)

## Common Issues

**"Button opens browser instead of Mini App"**
→ Check `FRONT_SITE` starts with `https://`

**"404 Not Found"**
→ Make sure you built frontend (`npm run build`)
→ Check `app/static/dist/` exists

**"Page loads but blank"**
→ Check browser console for errors
→ Verify API URL is correct

**"Telegram SDK not working"**
→ Make sure you're testing in Telegram (not regular browser)
→ Script loads automatically in Telegram context

## Production Deployment

1. Build frontend: `cd app/static && npm run build`
2. Deploy to server with HTTPS
3. Set `FRONT_SITE=https://yourdomain.com/static`
4. Ensure FastAPI serves `/static` route
5. Test in Telegram bot

