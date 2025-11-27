# 🚀 Быстрое развертывание

## Одна команда для запуска всего

```bash
cd /Users/nikolay/dev/nails-bot
./start_app.sh
```

Этот скрипт:
1. ✅ Активирует виртуальное окружение
2. ✅ Соберет frontend (если не собран)
3. ✅ Запустит backend на порту 8000
4. ✅ Frontend будет доступен на `/webapp`

## Архитектура "Всё на одном URL"

```
https://your-ngrok-url.ngrok.io/
├── /webapp              ← Frontend (главная страница)
├── /webapp/booking/new  ← Frontend (создание записи)
├── /webapp/booking/123  ← Frontend (детали записи)
├── /assets/*            ← Frontend статика (js, css)
├── /services            ← Backend API
├── /bookings/*          ← Backend API
└── /webhook             ← Telegram webhook
```

## Пошаговая инструкция

### Шаг 1: Соберите frontend

```bash
./build_frontend.sh
```

Или вручную:
```bash
cd nails-bot-front
npm install
npm run build
```

Frontend соберется в `app/static/webapp/`

### Шаг 2: Запустите приложение

```bash
./start_app.sh
```

Или вручную:
```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Приложение запустится на `http://localhost:8000`

### Шаг 3: Запустите ngrok

В **новом терминале**:

```bash
ngrok http 8000
```

Вы увидите что-то вроде:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

Скопируйте этот HTTPS URL (например, `https://abc123.ngrok.io`)

### Шаг 4: Обновите .env

Отредактируйте `.env` в корне проекта:

```env
BOT_TOKEN=your_bot_token_here
BASE_SITE=https://abc123.ngrok.io
TG_API_SITE=https://api.telegram.org
ADMIN_IDS=[123456789]
DB_URL=sqlite+aiosqlite:///./test.db
```

**Важно**: 
- `BASE_SITE` - это ваш ngrok URL без слэша в конце
- Не нужна переменная `FRONT_SITE` - frontend теперь на `/webapp`

### Шаг 5: Перезапустите бота

Нажмите `Ctrl+C` в терминале с backend и запустите снова:

```bash
./start_app.sh
```

### Шаг 6: Проверьте в браузере

Откройте в браузере:
```
http://localhost:8000/webapp
```

Вы должны увидеть главную страницу приложения.

### Шаг 7: Проверьте в Telegram

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите кнопку "🔖 Записаться"
4. Должно открыться Mini App

## Проверка работы

### Проверка backend
```bash
curl http://localhost:8000/services
```

### Проверка frontend
```bash
curl http://localhost:8000/webapp
# Должен вернуть HTML
```

### Проверка через ngrok
```bash
curl https://your-ngrok-url.ngrok.io/services
curl https://your-ngrok-url.ngrok.io/webapp
```

## Обновление кода

### После изменения backend:
Uvicorn автоматически перезагрузится (благодаря `--reload`)

### После изменения frontend:
```bash
./build_frontend.sh
```

Backend начнет отдавать новую версию сразу же.

## Структура проекта

```
nails-bot/
├── app/
│   ├── main.py              ← FastAPI приложение
│   ├── api/                 ← API endpoints
│   ├── tg_bot/              ← Telegram bot
│   │   └── kbs.py           ← Обновлено для /webapp
│   └── static/
│       └── webapp/          ← Собранный frontend (создается при сборке)
│           ├── index.html
│           └── assets/
├── nails-bot-front/         ← Исходники frontend
│   ├── src/
│   └── vite.config.ts       ← Настроен для сборки в app/static/webapp
├── build_frontend.sh        ← Скрипт сборки frontend
├── start_app.sh             ← Скрипт запуска приложения
└── .env                     ← Конфигурация
```

## Переменные окружения

Минимальный `.env`:

```env
# Telegram
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_IDS=[123456789,987654321]

# URLs
BASE_SITE=https://your-ngrok-url.ngrok.io
TG_API_SITE=https://api.telegram.org

# Database
DB_URL=sqlite+aiosqlite:///./test.db
```

## Частые проблемы

### ❌ "WebApp not found"

**Причина**: Frontend не собран

**Решение**:
```bash
./build_frontend.sh
```

### ❌ "404 Not Found" при открытии /webapp

**Причина**: Backend не запущен или frontend не собран

**Решение**:
```bash
./build_frontend.sh
./start_app.sh
```

### ❌ WebApp не открывается в Telegram

**Причина**: Используется HTTP вместо HTTPS

**Решение**: Используйте ngrok URL (HTTPS) в `.env`:
```env
BASE_SITE=https://your-ngrok-url.ngrok.io
```

### ❌ API запросы не работают

**Причина**: CORS или неправильный API URL

**Решение**: Убедитесь, что в `nails-bot-front/.env`:
```env
VITE_API_URL=
```
(пусто - будет использоваться тот же домен)

## Production deployment

### 1. Соберите frontend
```bash
./build_frontend.sh
```

### 2. Установите зависимости
```bash
pip install -r requirements.txt
```

### 3. Настройте systemd сервис

Создайте `/etc/systemd/system/nails-bot.service`:

```ini
[Unit]
Description=Nails Bot Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/nails-bot
Environment="PATH=/path/to/nails-bot/venv/bin"
ExecStart=/path/to/nails-bot/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nails-bot
sudo systemctl start nails-bot
```

### 4. Настройте nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Установите SSL

```bash
sudo certbot --nginx -d your-domain.com
```

### 6. Обновите .env

```env
BASE_SITE=https://your-domain.com
```

## Готово! 🎉

Теперь у вас:
- ✅ Frontend и Backend на одном порту
- ✅ Один ngrok туннель
- ✅ Простой процесс развертывания
- ✅ Легкое обновление кода

