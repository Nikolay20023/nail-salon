#!/bin/bash
# Скрипт для запуска всего приложения

set -e

echo "🚀 Запуск Nails Bot"
echo "==================="

# Активация виртуального окружения
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено. Создайте его: python -m venv venv"
    exit 1
fi

echo "🐍 Активация виртуального окружения..."
source venv/bin/activate

# Проверка наличия собранного frontend
if [ ! -d "app/static/webapp" ] || [ ! -f "app/static/webapp/index.html" ]; then
    echo "⚠️  Frontend не собран. Запускаю сборку..."
    ./build_frontend.sh
fi

# Запуск FastAPI
echo ""
echo "🌐 Запуск backend на http://localhost:8000"
echo "📱 WebApp доступен на http://localhost:8000/webapp"
echo ""
echo "💡 Для доступа через Telegram используйте ngrok:"
echo "   ngrok http 8000"
echo "   Затем обновите URL в app/tg_bot/kbs.py на https://YOUR-NGROK-URL.ngrok.io/webapp"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo "==================="

uvicorn app.main:app --reload --port 8000

