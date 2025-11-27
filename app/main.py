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
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi import HTTPException

# Определяем директорию с собранным frontend
webapp_dir = Path('app/static/webapp')

# Serve static assets (js, css, images, etc.)
@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    """Serve assets from webapp directory"""
    assets_path = webapp_dir / 'assets' / file_path
    if assets_path.exists() and assets_path.is_file():
        return FileResponse(assets_path)
    raise HTTPException(status_code=404, detail="Asset not found")

# Serve root webapp (main entry point for Telegram Mini App)
@app.get("/webapp")
async def serve_webapp_root():
    """Serve main webapp page"""
    index_path = webapp_dir / 'index.html'
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="WebApp not found. Run 'npm run build' in nails-bot-front/")

# SPA fallback for all webapp routes
@app.get("/webapp/{full_path:path}")
async def serve_webapp(full_path: str):
    """Serve webapp files, falling back to index.html for SPA routes"""
    file_path = webapp_dir / full_path
    
    # If it's a file, serve it
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Otherwise, return index.html for SPA routing
    index_path = webapp_dir / 'index.html'
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")
    
    raise HTTPException(status_code=404, detail="WebApp not found")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все источники (т.к. webapp на том же домене)
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
)


app.include_router(router_api)
app.include_router(router_admin)
app.include_router(router_tg_bot)