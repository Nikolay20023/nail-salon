from loguru import logger
from app.async_client import http_client_manager
from app.config import scheduler
from app.tg_bot.methods import bot_send_message, format_appointment
from datetime import datetime
import asyncio


async def send_user_noti(user_tg_id: int, appointment: dict):
    client = http_client_manager.get_client()
    text = format_appointment(appointment, start_text="❗ Напоминаем, что у вас назначена запись к мастеру ❗")
    try:
        await bot_send_message(client=client, chat_id=user_tg_id, text=text)
    except Exception as e:
        logger.error(e)


def sync_send_user_noti(user_tg_id: int, appointment: dict):
    """Синхронная обёртка для async функции, совместима с APScheduler"""
    asyncio.run(send_user_noti(user_tg_id, appointment))


async def schedule_appointment_notification(user_tg_id: int, appointment: dict, notification_time: datetime,
                                            reminder_label: str):
    """
    Планирует напоминание с уникальным job_id для каждого случая.

    :param user_tg_id: ID пользователя Telegram
    :param appointment: Данные о записи
    :param notification_time: Время напоминания (должно быть datetime объектом)
    :param reminder_label: Уникальный идентификатор напоминания (например, 'immediate', '24h', '6h', '30min')
    """
    # Убедимся, что notification_time - это datetime объект
    if not isinstance(notification_time, datetime):
        raise ValueError(f"notification_time должна быть datetime объектом, получено: {type(notification_time)}")
    
    # Уникальный идентификатор задания
    job_id = f"notification_{user_tg_id}_{appointment['id']}_{reminder_label}"

    logger.info(f"Планирую уведомление: user_tg_id={user_tg_id}, job_id={job_id}, time={notification_time}")

    # Планируем задание с синхронной обёрткой
    scheduler.add_job(
        sync_send_user_noti,
        'date',
        run_date=notification_time,
        args=[user_tg_id, appointment],
        id=job_id,
        replace_existing=True
    )