# Frontend Integration Guide

## Обзор

Frontend для Telegram Mini App создан в папке `nails-bot-front/` с использованием:
- React 18 + TypeScript
- @tma.js/sdk-react - Telegram Mini Apps SDK
- @telegram-apps/telegram-ui - UI компоненты
- Vite - сборщик

## Структура проекта

```
nails-bot-front/
├── src/
│   ├── types/
│   │   └── index.ts           # TypeScript типы для API
│   ├── utils/
│   │   ├── api.ts             # API клиент для backend
│   │   └── timeSlots.ts       # Утилиты для работы со временем
│   ├── pages/
│   │   ├── IndexPage/         # Главная страница с бронированиями
│   │   ├── BookingNew/        # Создание нового бронирования
│   │   └── BookingDetail/     # Детали бронирования
│   ├── components/
│   │   ├── App.tsx            # Главный компонент
│   │   └── Page.tsx           # Wrapper для страниц
│   └── navigation/
│       └── routes.tsx         # Маршруты приложения
├── .env                       # Конфигурация (не в git)
├── .env.example               # Пример конфигурации
├── package.json
└── vite.config.ts
```

## Добавленные API endpoints

В `app/api/router.py` добавлены следующие эндпоинты:

### Пользователи
```python
POST /users
# Создать или получить пользователя по telegram_id
# Body: { telegram_id: int, username?: str, full_name?: str }
```

### Услуги
```python
GET /services              # Все услуги
GET /services/{id}         # Конкретная услуга
```

### Мастера
```python
GET /masters               # Все мастера
GET /masters/{id}          # Конкретный мастер
GET /masters/by-service/{service_id}  # Мастера по услуге
```

### Бронирования
```python
GET /bookings/{telegram_id}           # Бронирования пользователя
GET /booking/{id}                     # Конкретное бронирование
POST /booking                         # Создать бронирование
PUT /booking/{id}                     # Обновить бронирование
DELETE /booking/{id}?telegram_id=...  # Удалить бронирование
GET /bookings/master/{master_id}?date=YYYY-MM-DD  # Занятые слоты
```

## Обновления в backend

### app/api/router.py
- Добавлены новые эндпоинты для фронтенда
- Старые эндпоинты (`/book`, `/service`) оставлены для обратной совместимости
- Добавлена поддержка получения занятых слотов мастера

### app/dao/models.py
- Обновлено отношение many-to-many между Service и Master
- Добавлены индексы для оптимизации запросов

## Интеграция с Telegram Bot

### app/tg_bot/kbs.py

Обновите функцию для главной кнопки:

```python
from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo

def _get_main_button():
    return KeyboardButton(
        text='📱 Открыть приложение',
        web_app=WebAppInfo(url='https://your-frontend-ngrok-url.ngrok.io')
    )

def get_main_kb(is_admin: bool = False):
    keyboard = [
        [_get_main_button()],
    ]
    # ... остальной код
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
```

## Настройка для разработки

### 1. Frontend

```bash
cd nails-bot-front
npm install
cp .env.example .env
# Отредактируйте .env и укажите VITE_API_URL
npm run dev:https
```

### 2. Backend

```bash
cd nails-bot
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 3. ngrok

Запустите 2 туннеля:

```bash
# Терминал 1: Backend
ngrok http 8000

# Терминал 2: Frontend
ngrok http 5173
```

### 4. Конфигурация

Обновите:
1. `.env` в `nails-bot-front/` - URL backend ngrok
2. `app/tg_bot/kbs.py` - URL frontend ngrok

## Функциональность

### Главная страница
- Отображает активные бронирования пользователя
- Автоматически скрывает прошедшие записи
- MainButton для перехода к созданию записи
- Клик на запись → детали записи

### Создание бронирования
- Пошаговый процесс:
  1. Выбор услуги
  2. Выбор мастера (фильтрация по услуге)
  3. Выбор даты и времени
  4. Контактные данные
- Занятые слоты отображаются приглушенными
- MainButton для перехода к следующему шагу/подтверждения

### Детали бронирования
- Полная информация о записи
- Кнопка отмены (если статус позволяет)

## Типы данных

Все типы определены в `src/types/index.ts`:

```typescript
interface Booking {
  id: number;
  user_id: number;
  master_id: number;
  service_id: number;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  // ... и связанные объекты
}
```

## Работа со временными слотами

```typescript
// Генерация слотов (9:00-21:00 с интервалом 30 мин)
const slots = generateTimeSlots(9, 21, 30, bookedTimes);

// Каждый слот имеет структуру:
interface TimeSlot {
  time: string;      // "09:00"
  available: boolean; // true/false
}
```

## CORS настройка

Убедитесь, что в `app/main.py` настроен CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Развертывание в продакшен

### Frontend

```bash
cd nails-bot-front
npm run build
```

Соберите `dist/` и разместите на хостинге (Vercel, Netlify, etc.)

### Backend

Убедитесь, что все эндпоинты доступны через HTTPS

### Telegram Bot

Обновите URL WebApp на продакшн URL фронтенда

## Troubleshooting

### Frontend не подключается к API
- Проверьте `VITE_API_URL` в `.env`
- Убедитесь, что backend доступен
- Проверьте CORS настройки

### Занятые слоты не отображаются
- Проверьте эндпоинт `/bookings/master/{master_id}`
- Убедитесь, что формат даты правильный (YYYY-MM-DD)

### Telegram user data недоступен
- Убедитесь, что приложение открыто в Telegram
- Проверьте инициализацию SDK в `App.tsx`

## Дальнейшие улучшения

- [ ] Добавить уведомления через Telegram
- [ ] Кэширование данных на клиенте
- [ ] Оффлайн режим
- [ ] Анимации и transitions
- [ ] Поддержка нескольких языков
- [ ] История бронирований
- [ ] Отзывы и рейтинги

