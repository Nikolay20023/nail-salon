#!/bin/bash
# Build script for Telegram Mini App frontend

echo "Building frontend..."
npm install
npm run build

echo "Build complete! Files are in app/static/dist/"
echo "Make sure your FRONT_SITE points to: https://yourdomain.com/static"

