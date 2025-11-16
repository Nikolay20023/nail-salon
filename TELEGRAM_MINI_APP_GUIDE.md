# Telegram Mini App Setup Guide

## How Telegram Mini Apps Work

### Key Points:

1. **Button Type**: Your bot sends a button with `web_app` parameter (not just `url`)
2. **HTTPS Required**: Telegram only opens Mini Apps from HTTPS URLs (except localhost for testing)
3. **Static Files**: The frontend must be built and served as static files
4. **Telegram Script**: The page must load `telegram-web-app.js` script
5. **User Data**: Telegram injects user data via `window.Telegram.WebApp.initDataUnsafe`

## Current Setup Analysis

### ✅ What's Working:
- Button configuration in `app/tg_bot/kbs.py` correctly uses `web_app` for HTTPS
- Frontend code is ready with Telegram SDK integration
- Static files mounting in `app/main.py`

### ❌ What Needs Fixing:

1. **Frontend Not Built**: The React app needs to be built first
2. **Static Files Path**: Need to serve the built files, not the source
3. **HTTPS for Production**: Need HTTPS URL (or ngrok for testing)

## Step-by-Step Setup

### 1. Build the Frontend

```bash
cd app/static
npm install
npm run build
```

This creates `app/static/dist/` with production files.

### 2. Update Static Files Serving

The current setup mounts `app/static` but we need to serve the `dist` folder.

### 3. Configure Environment

Your `.env` should have:
```
FRONT_SITE=https://yourdomain.com/static
# OR for local testing with ngrok:
FRONT_SITE=https://your-ngrok-url.ngrok.io/static
```

### 4. Testing Locally

For local testing, you need:
- **Option A**: Use ngrok to create HTTPS tunnel
- **Option B**: Use Telegram's test mode (localhost works in some cases)

## Common Issues

### Issue 1: "Web App not opening"
- **Cause**: URL is HTTP instead of HTTPS
- **Fix**: Use HTTPS URL or ngrok

### Issue 2: "Page loads but Telegram SDK not working"
- **Cause**: Script not loaded or wrong context
- **Fix**: Ensure `telegram-web-app.js` is loaded before your code

### Issue 3: "404 on static files"
- **Cause**: Files not built or wrong path
- **Fix**: Build frontend and check static file serving

### Issue 4: "Button shows as URL instead of Web App"
- **Cause**: URL doesn't start with `https://`
- **Fix**: Check `FRONT_SITE` in `.env`

