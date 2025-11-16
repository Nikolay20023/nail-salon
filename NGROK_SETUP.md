# Настройка Frontend через ngrok

## Если у вас уже запущен ngrok для FastAPI

### Шаг 1: Узнайте ваш ngrok URL

Когда вы запустили ngrok, он показал что-то вроде:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok-free.app`)

### Шаг 2: Соберите frontend

```bash
cd app/static
npm install
npm run build
```

Это создаст папку `app/static/dist/` с готовыми файлами.

### Шаг 3: Настройте .env файл

Создайте или обновите `.env` файл в корне проекта:

```env
# Ваш ngrok URL для frontend (тот же, что для backend)
FRONT_SITE=https://ваш-ngrok-url.ngrok-free.app/static

# URL для API (тот же ngrok URL)
# Это нужно для frontend, чтобы он знал куда отправлять запросы
```

**Важно:** URL должен заканчиваться на `/static` - это путь, где FastAPI отдает frontend.

### Шаг 4: Настройте API URL в frontend

Создайте файл `app/static/.env`:

```env
VITE_API_URL=https://ваш-ngrok-url.ngrok-free.app
```

Или если у вас отдельный ngrok для API, укажите его URL.

### Шаг 5: Пересоберите frontend (если изменили .env)

```bash
cd app/static
npm run build
```

### Шаг 6: Перезапустите FastAPI сервер

```bash
# Остановите текущий сервер (Ctrl+C)
# Запустите снова
python -m uvicorn app.main:app --reload
```

## Проверка

1. Откройте в браузере: `https://ваш-ngrok-url.ngrok-free.app/static`
2. Должна открыться ваша страница
3. В Telegram боте нажмите кнопку "🔖 Записаться"
4. Должно открыться Mini App

## Структура URL

```
https://ваш-ngrok-url.ngrok-free.app  ← ngrok URL
├── /webhook                          ← webhook для бота
├── /service                          ← API endpoint
├── /bookings/...                     ← API endpoints
└── /static                           ← Frontend (ваш React app)
    ├── index.html
    ├── assets/
    └── ...
```

## Если что-то не работает

### Проблема: "404 Not Found" на /static
- Убедитесь, что собрали frontend: `npm run build`
- Проверьте, что папка `app/static/dist/` существует
- Перезапустите FastAPI сервер

### Проблема: "API requests fail"
- Проверьте `VITE_API_URL` в `app/static/.env`
- Убедитесь, что ngrok все еще работает
- Проверьте CORS настройки в `app/main.py`

### Проблема: "Button opens browser instead of Mini App"
- Убедитесь, что `FRONT_SITE` в `.env` начинается с `https://`
- URL должен заканчиваться на `/static`
- Перезапустите бота после изменения `.env`

