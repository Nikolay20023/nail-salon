# Быстрый старт

## Шаг 1: Установка

```bash
cd /Users/nikolay/dev/nails-bot/nails-bot-front
npm install
```

## Шаг 2: Настройка окружения

Создайте файл `.env`:

```env
VITE_API_URL=https://your-backend-ngrok-url.ngrok.io
```

## Шаг 3: Запуск backend

В отдельном терминале:

```bash
cd /Users/nikolay/dev/nails-bot
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Шаг 4: Запуск ngrok для backend

В еще одном терминале:

```bash
ngrok http 8000
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`) и обновите `.env`:

```env
VITE_API_URL=https://abc123.ngrok.io
```

## Шаг 5: Запуск frontend

```bash
npm run dev:https
```

## Шаг 6: Запуск ngrok для frontend

В новом терминале:

```bash
ngrok http 5173
```

Скопируйте HTTPS URL фронтенда (например: `https://xyz789.ngrok.io`)

## Шаг 7: Настройка Telegram бота

Обновите URL WebApp в коде бота (`app/tg_bot/kbs.py`):

```python
def _get_main_button():
    return KeyboardButton(
        text='📱 Открыть приложение',
        web_app=WebAppInfo(url='https://xyz789.ngrok.io')
    )
```

Перезапустите бота.

## Готово!

Откройте бота в Telegram и нажмите кнопку "📱 Открыть приложение"

## Архитектура

```
┌─────────────────┐
│  Telegram Bot   │
│   (Mini App)    │
└────────┬────────┘
         │
         │ HTTPS (ngrok)
         ▼
┌─────────────────┐
│   React App     │
│  (port 5173)    │
└────────┬────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│  FastAPI        │
│  (port 8000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    SQLite DB    │
└─────────────────┘
```

## Основные функции

### Главная страница (`/`)
- ✅ Список текущих бронирований
- ✅ Скрытие прошедших записей
- ✅ MainButton "Создать запись"

### Создание бронирования (`/booking/new`)
- ✅ Выбор услуги
- ✅ Выбор мастера (только для выбранной услуги)
- ✅ Выбор даты
- ✅ Выбор времени (с отключением занятых слотов)
- ✅ Контактные данные
- ✅ Подтверждение через MainButton

### Детали бронирования (`/booking/:id`)
- ✅ Просмотр всех деталей
- ✅ Отмена записи

## Требования

- Node.js 18+
- npm или pnpm
- ngrok (для локальной разработки)
- Python 3.9+ (backend)
- FastAPI backend запущен

## Troubleshooting

### Ошибка "Failed to fetch"
- Проверьте `VITE_API_URL` в `.env`
- Убедитесь, что backend запущен
- Проверьте ngrok для backend

### Белый экран в Telegram
- Используйте HTTPS URL от ngrok
- Проверьте консоль в Eruda
- Убедитесь, что frontend собран без ошибок

### "Telegram user data not available"
- Откройте приложение в Telegram, не в браузере
- Проверьте, что URL WebApp настроен правильно

