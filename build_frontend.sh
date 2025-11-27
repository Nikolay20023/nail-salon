#!/bin/bash
# Скрипт для сборки frontend

echo "🔨 Сборка frontend..."

cd nails-bot-front || exit 1

# Установка зависимостей (если нужно)
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Сборка проекта
echo "⚙️  Сборка проекта..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно собран в app/static/webapp/"
else
    echo "❌ Ошибка при сборке frontend"
    exit 1
fi

