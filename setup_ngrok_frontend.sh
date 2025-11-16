#!/bin/bash
# Скрипт для настройки frontend через ngrok

echo "🚀 Настройка Frontend для работы с ngrok"
echo ""

# Проверяем, запущен ли ngrok
echo "📋 Шаг 1: Проверка ngrok"
if ! pgrep -x "ngrok" > /dev/null; then
    echo "⚠️  ngrok не запущен!"
    echo "   Запустите: ngrok http 8000"
    exit 1
fi

echo "✅ ngrok запущен"
echo ""

# Получаем ngrok URL (попробуем через API)
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "⚠️  Не удалось автоматически получить ngrok URL"
    echo "   Пожалуйста, введите ваш ngrok HTTPS URL вручную:"
    read -p "   URL (например: https://abc123.ngrok-free.app): " NGROK_URL
else
    echo "✅ Найден ngrok URL: $NGROK_URL"
fi

echo ""
echo "📋 Шаг 2: Сборка frontend"
cd app/static

if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

echo "🔨 Сборка frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Ошибка: папка dist не создана!"
    exit 1
fi

echo "✅ Frontend собран"
cd ../..

echo ""
echo "📋 Шаг 3: Настройка .env файлов"

# Обновляем основной .env
if [ -f ".env" ]; then
    # Проверяем, есть ли уже FRONT_SITE
    if grep -q "FRONT_SITE=" .env; then
        # Обновляем существующую строку
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|FRONT_SITE=.*|FRONT_SITE=${NGROK_URL}/static|" .env
        else
            # Linux
            sed -i "s|FRONT_SITE=.*|FRONT_SITE=${NGROK_URL}/static|" .env
        fi
        echo "✅ Обновлен FRONT_SITE в .env"
    else
        # Добавляем новую строку
        echo "FRONT_SITE=${NGROK_URL}/static" >> .env
        echo "✅ Добавлен FRONT_SITE в .env"
    fi
else
    echo "FRONT_SITE=${NGROK_URL}/static" > .env
    echo "✅ Создан .env файл"
fi

# Создаем .env для frontend (Vite)
if [ ! -f "app/static/.env" ]; then
    echo "VITE_API_URL=${NGROK_URL}" > app/static/.env
    echo "✅ Создан app/static/.env"
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|VITE_API_URL=.*|VITE_API_URL=${NGROK_URL}|" app/static/.env
    else
        sed -i "s|VITE_API_URL=.*|VITE_API_URL=${NGROK_URL}|" app/static/.env
    fi
    echo "✅ Обновлен VITE_API_URL в app/static/.env"
fi

echo ""
echo "📋 Шаг 4: Пересборка frontend с новым API URL"
cd app/static
npm run build
cd ../..

echo ""
echo "✅ Готово!"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Перезапустите FastAPI сервер"
echo "   2. Проверьте в браузере: ${NGROK_URL}/static"
echo "   3. В Telegram боте нажмите кнопку '🔖 Записаться'"
echo ""
echo "🔗 Frontend URL: ${NGROK_URL}/static"
echo "🔗 API URL: ${NGROK_URL}"

