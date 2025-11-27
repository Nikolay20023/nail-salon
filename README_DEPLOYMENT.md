# 🎯 Развертывание: Frontend + Backend на одном URL

## Что изменилось

✅ **Frontend и Backend теперь работают через один порт 8000**  
✅ **Один ngrok туннель для всего**  
✅ **Frontend доступен на `/webapp`**  
✅ **API остается на корневых путях**

## Быстрый старт (3 команды)

```bash
# 1. Соберите frontend
./build_frontend.sh

# 2. Запустите приложение
./start_app.sh

# 3. В другом терминале запустите ngrok
ngrok http 8000
```

## Структура URL

| URL | Что отдается |
|-----|-------------|
| `https://your-url.ngrok.io/webapp` | Frontend (главная страница) |
| `https://your-url.ngrok.io/webapp/booking/new` | Frontend (создание записи) |
| `https://your-url.ngrok.io/assets/*` | Frontend статика |
| `https://your-url.ngrok.io/services` | Backend API |
| `https://your-url.ngrok.io/bookings/*` | Backend API |
| `https://your-url.ngrok.io/webhook` | Telegram webhook |

## Настройка

### 1. Обновите `.env`

```env
# Только BASE_SITE нужен (не FRONT_SITE!)
BASE_SITE=https://your-ngrok-url.ngrok.io
BOT_TOKEN=your_token
ADMIN_IDS=[123456789]
TG_API_SITE=https://api.telegram.org
DB_URL=sqlite+aiosqlite:///./test.db
```

### 2. Frontend автоматически использует тот же домен

Файл `nails-bot-front/.env` можно оставить пустым:
```env
VITE_API_URL=
```

При сборке frontend будет делать запросы к тому же домену.

## Что было изменено

### 1. `nails-bot-front/vite.config.ts`
```typescript
build: {
  outDir: '../app/static/webapp', // Собирается в backend
  emptyOutDir: true,
}
```

### 2. `app/main.py`
```python
# Отдает frontend на /webapp
@app.get("/webapp")
async def serve_webapp_root():
    return FileResponse('app/static/webapp/index.html')

# Отдает статику на /assets/*  
@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    return FileResponse(f'app/static/webapp/assets/{file_path}')
```

### 3. `app/tg_bot/kbs.py`
```python
# Использует BASE_SITE + /webapp
def _get_webapp_url(path: str = "") -> str:
    return f"{settings.BASE_SITE}/webapp{path}"
```

## Процесс разработки

### Разработка backend
```bash
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Разработка frontend (с hot reload)
```bash
cd nails-bot-front
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# Откройте http://localhost:5173
```

### Сборка frontend для production
```bash
./build_frontend.sh
# или
cd nails-bot-front && npm run build
```

Frontend соберется в `app/static/webapp/`

## Преимущества

✅ **Один ngrok туннель** - экономия ресурсов  
✅ **Нет CORS проблем** - frontend и API на одном домене  
✅ **Простое развертывание** - одна команда `./start_app.sh`  
✅ **Легкое обновление** - `./build_frontend.sh` и готово  
✅ **Production ready** - можно деплоить на любой сервер  

## Проверка работы

### 1. Локально
```bash
# Backend API
curl http://localhost:8000/services

# Frontend
curl http://localhost:8000/webapp
open http://localhost:8000/webapp
```

### 2. Через ngrok
```bash
curl https://your-url.ngrok.io/services
open https://your-url.ngrok.io/webapp
```

### 3. В Telegram
1. Откройте бота
2. Отправьте `/start`
3. Нажмите "🔖 Записаться"
4. WebApp откроется на `https://your-url.ngrok.io/webapp`

## Скрипты

| Скрипт | Описание |
|--------|----------|
| `./build_frontend.sh` | Собрать frontend |
| `./start_app.sh` | Запустить всё приложение |

## Документация

- 📚 `QUICK_DEPLOY_RU.md` - Быстрое развертывание
- 📖 `DEPLOYMENT_GUIDE.md` - Подробное руководство
- 🚀 `nails-bot-front/README_RU.md` - Frontend документация
- 📝 `nails-bot-front/SUMMARY_RU.md` - Резюме frontend

## Следующие шаги

1. **Соберите frontend**: `./build_frontend.sh`
2. **Запустите приложение**: `./start_app.sh`  
3. **Запустите ngrok**: `ngrok http 8000`
4. **Обновите `.env`**: укажите ngrok URL в `BASE_SITE`
5. **Перезапустите бота**: Ctrl+C и снова `./start_app.sh`
6. **Тестируйте в Telegram**! 🎉

## Архитектура

```
┌─────────────────────┐
│   Telegram Bot      │
│  Открывает WebApp   │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│       ngrok         │
│  Port forwarding    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  FastAPI :8000      │
│                     │
│  /webapp   → React  │
│  /assets/* → Static │
│  /services → API    │
│  /bookings → API    │
└─────────────────────┘
```

## Production checklist

- [ ] Собрать frontend: `./build_frontend.sh`
- [ ] Настроить `.env` с production настройками
- [ ] Настроить systemd сервис (см. `QUICK_DEPLOY_RU.md`)
- [ ] Настроить nginx reverse proxy
- [ ] Установить SSL (Let's Encrypt)
- [ ] Обновить `BASE_SITE` на production домен
- [ ] Настроить мониторинг и логи

---

**Готово! Всё работает на одном URL через один ngrok туннель** 🚀

