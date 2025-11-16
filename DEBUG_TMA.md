# Отладка Telegram Mini App

## Если видите пустой черный экран

### Шаг 1: Проверьте консоль браузера

В Telegram Mini App:
1. Откройте DevTools (если доступно)
2. Или откройте страницу в обычном браузере: `https://ваш-ngrok-url.ngrok-free.app/static`
3. Откройте консоль (F12 или Cmd+Option+I)
4. Проверьте ошибки

### Шаг 2: Проверьте что файлы загружаются

В консоли браузера проверьте Network tab:
- `/static` - должен вернуть 200 OK
- `/assets/index-*.js` - должен вернуть 200 OK
- `/assets/index-*.css` - должен вернуть 200 OK

Если видите 404:
- Убедитесь что собрали frontend: `cd app/static && npm run build`
- Проверьте что папка `app/static/dist/` существует
- Перезапустите FastAPI сервер

### Шаг 3: Проверьте логи в консоли

Должны быть сообщения:
- "Initializing React app with basename: /static"
- "React app initialized successfully"
- "App component mounted"
- "Telegram WebApp initialized"

Если видите ошибки - скопируйте их.

### Шаг 4: Проверьте .env файлы

**В корне проекта (.env):**
```env
FRONT_SITE=https://ваш-ngrok-url.ngrok-free.app/static
```

**В app/static/.env:**
```env
VITE_API_URL=https://ваш-ngrok-url.ngrok-free.app
```

### Шаг 5: Пересоберите и перезапустите

```bash
# 1. Пересоберите frontend
cd app/static
npm run build

# 2. Перезапустите FastAPI
# Остановите сервер (Ctrl+C)
# Запустите снова
python -m uvicorn app.main:app --reload
```

### Шаг 6: Проверьте в браузере

Откройте в обычном браузере:
`https://ваш-ngrok-url.ngrok-free.app/static`

Должна открыться страница с контентом. Если работает в браузере, но не в Telegram - проблема в Telegram SDK или настройках бота.

## Частые проблемы

### "Blank page" / Пустой экран
- ✅ Проверьте что файлы собраны (`dist/` существует)
- ✅ Проверьте консоль на ошибки
- ✅ Убедитесь что FastAPI запущен
- ✅ Проверьте что ngrok работает

### "404 на /assets/..."
- ✅ Убедитесь что собрали frontend
- ✅ Проверьте что роут `/assets/*` добавлен в `main.py`
- ✅ Перезапустите FastAPI

### "React app not initialized"
- ✅ Проверьте консоль на ошибки JavaScript
- ✅ Убедитесь что `index.html` загружается
- ✅ Проверьте что все импорты правильные

