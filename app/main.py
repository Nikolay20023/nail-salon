import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from fastapi.staticfiles import StaticFiles
from app.api.router import router as router_api
from app.api.admin_router import router as router_admin
from app.async_client import http_client_manager
from app.config import settings, scheduler
from app.tg_bot.router import router as router_tg_bot


async def set_webhook(client):
    """Устанавливает вебхук для Telegram-бота."""
    try:
        response = await client.post(f"{settings.get_tg_api_url()}/setWebhook", json={
            "url": settings.get_webhook_url()
        })
        response_data = response.json()
        if response.status_code == 200 and response_data.get("ok"):
            logger.info(f"Webhook установлен: {response_data}")
        else:
            logger.error(f"Ошибка при установке вебхука: {response_data}")
    except Exception as e:
        logger.exception(f"Не удалось установить вебхук: {e}")


async def send_admin_msg(client, text):
    for admin in settings.ADMIN_IDS:
        try:
            await client.post(f"{settings.get_tg_api_url()}/sendMessage",
                              json={"chat_id": admin, "text": text, "parse_mode": "HTML"})
        except Exception as E:
            logger.exception(f"Ошибка при отправке сообщения админу: {E}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Контекстный менеджер для настройки и завершения работы бота."""
    client = http_client_manager.get_client()
    logger.info("Настройка бота...")
    scheduler.start()
    await set_webhook(client)
    await client.post(f"{settings.get_tg_api_url()}/setMyCommands",
                      data={"commands": json.dumps([{"command": "start", "description": "Главное меню"}])})
    await send_admin_msg(client, "Бот запущен!")
    yield
    logger.info("Завершение работы бота...")
    await send_admin_msg(client, "Бот остановлен!")
    await http_client_manager.close_client()
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)


# Serve built frontend files
import os
from fastapi.responses import FileResponse
from fastapi import HTTPException

static_dir = 'app/static/dist' if os.path.exists('app/static/dist') else 'app/static'

# Handle assets paths - redirect /assets/* to /static/assets/*
# This must be BEFORE mounting /static to have priority
@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    """Serve assets from static directory"""
    assets_path = os.path.join(static_dir, 'assets', file_path)
    if os.path.exists(assets_path):
        return FileResponse(assets_path)
    raise HTTPException(status_code=404, detail="Asset not found")

# SPA fallback route - handle all /static/* paths
@app.get("/static/{full_path:path}")
async def serve_static(full_path: str):
    """Serve static files, falling back to index.html for SPA routes"""
    file_path = os.path.join(static_dir, full_path)
    
    # If it's a file, serve it
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise, return index.html for SPA routing
    index_path = os.path.join(static_dir, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    
    raise HTTPException(status_code=404, detail="Static file not found")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Разрешаем локальный фронтенд
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
)


app.include_router(router_api)
app.include_router(router_admin)
app.include_router(router_tg_bot)