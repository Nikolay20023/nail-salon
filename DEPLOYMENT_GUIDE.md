# Руководство по развертыванию

## Архитектура

Frontend и Backend работают на **одном порту 8000** через **один ngrok туннель**:

```
┌─────────────────────────────────────────┐
│          Telegram Bot                   │
│  https://your-url.ngrok.io/webapp       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            ngrok                         │
│    https://your-url.ngrok.io            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         FastAPI (port 8000)             │
│                                         │
│  GET /webapp        → index.html        │
│  GET /webapp/*      → SPA routes        │
│  GET /assets/*      → static files      │
│  GET /services      → API               │
│  POST /booking      → API               │
│  ...                → other APIs        │
└─────────────────────────────────────────┘
```

## Быстрый старт

### 1. Сборка frontend

```bash
cd /Users/nikolay/dev/nails-bot
chmod +x build_frontend.sh
./build_frontend.sh
```

Это соберет frontend в `app/static/webapp/`

### 2. Запуск приложения

```bash
chmod +x start_app.sh
./start_app.sh
```

Или вручную:

```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 3. Настройка ngrok

В отдельном терминале:

```bash
ngrok http 8000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)

### 4. Обновите WebApp URL в боте

Отредактируйте `app/tg_bot/kbs.py`:

```python
def _get_main_button():
    return KeyboardButton(
        text='📱 Открыть приложение',
        web_app=WebAppInfo(url='https://abc123.ngrok.io/webapp')  # ← ваш ngrok URL + /webapp
    )
```

Перезапустите бота (Ctrl+C и `./start_app.sh`)

### 5. Готово!

Откройте бота в Telegram и нажмите "📱 Открыть приложение"

## Структура URL

| URL | Описание |
|-----|----------|
| `http://localhost:8000/` | API корень |
| `http://localhost:8000/webapp` | Frontend главная страница |
| `http://localhost:8000/webapp/booking/new` | Frontend создание записи |
| `http://localhost:8000/services` | API: список услуг |
| `http://localhost:8000/bookings/{id}` | API: бронирования |
| `http://localhost:8000/assets/*` | Frontend статика (js, css, images) |

## Обновление frontend

После изменения кода frontend:

```bash
cd nails-bot-front
npm run build
# или из корня проекта
./build_frontend.sh
```

Backend автоматически начнет отдавать новую версию.

## Разработка frontend

Для разработки с hot reload:

```bash
cd nails-bot-front

# Отредактируйте .env
echo "VITE_API_URL=http://localhost:8000" > .env

# Запуск dev сервера
npm run dev
```

Откройте в браузере `http://localhost:5173`

**После разработки не забудьте собрать для production:**

```bash
npm run build
```

## Переменные окружения

### Backend (.env в корне проекта)

```env
BOT_TOKEN=your_bot_token
SITE=https://your-ngrok-url.ngrok.io
WEBHOOK_PATH=/webhook/telegram
DB_URL=sqlite+aiosqlite:///./test.db
```

### Frontend (.env в nails-bot-front/)

```env
# Оставьте пустым для production (будет использоваться тот же домен)
VITE_API_URL=

# Или укажите для разработки
# VITE_API_URL=http://localhost:8000
```

## Production deployment

### 1. Сборка

```bash
./build_frontend.sh
```

### 2. Проверка

```bash
ls -la app/static/webapp/
# Должны быть: index.html, assets/, и другие файлы
```

### 3. Настройка сервера

```bash
# Установите зависимости
pip install -r requirements.txt

# Запустите через systemd, supervisor или docker
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Настройте reverse proxy (nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. SSL (Let's Encrypt)

```bash
certbot --nginx -d your-domain.com
```

## Troubleshooting

### Frontend не отображается

1. Проверьте, что frontend собран:
   ```bash
   ls app/static/webapp/index.html
   ```

2. Если файла нет:
   ```bash
   ./build_frontend.sh
   ```

3. Проверьте URL в браузере:
   ```
   http://localhost:8000/webapp
   ```

### API недоступен

1. Проверьте, что backend запущен:
   ```bash
   curl http://localhost:8000/services
   ```

2. Проверьте CORS в `app/main.py`

### WebApp не открывается в Telegram

1. Убедитесь, что используется HTTPS URL от ngrok
2. Проверьте правильность URL в `app/tg_bot/kbs.py`
3. URL должен быть: `https://your-ngrok-url.ngrok.io/webapp` (не забудьте `/webapp`)

### Белый экран в Telegram

1. Откройте консоль в Eruda (должна открыться автоматически)
2. Проверьте ошибки
3. Убедитесь, что API_URL правильный в frontend

## Одновременная разработка

Если нужно разрабатывать frontend и backend одновременно:

**Терминал 1 - Backend:**
```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Терминал 2 - Frontend (dev mode):**
```bash
cd nails-bot-front
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

**Терминал 3 - ngrok для backend:**
```bash
ngrok http 8000
```

**Терминал 4 - ngrok для frontend (dev):**
```bash
ngrok http 5173
```

В боте используйте URL из Терминала 4 для разработки.

**Для production** используйте только Терминалы 1 и 3, предварительно собрав frontend через `./build_frontend.sh`

