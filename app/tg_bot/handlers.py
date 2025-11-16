from httpx import AsyncClient
from loguru import logger
from app.api.dao import UserDAO, BookingDAO
from app.api.schemas import TelegramIDModel, UserBase
from app.tg_bot.kbs import back_kb, main_kb, generate_kb_profile, get_main_kb
from app.tg_bot.methods import call_answer, bot_send_message, get_greeting_text, get_about_text, get_booking_text, format_appointment
from app.utils.admin import is_admin

async def cmd_start(client: AsyncClient, session, user_info):
    try:
        logger.info(f"Начало обработки команды /start для пользователя {user_info.get('first_name')} (ID: {user_info.get('id')})")
        user_in_db = await UserDAO.find_one_or_none(session=session, filters=TelegramIDModel(telegram_id=user_info["id"]))

        if not user_in_db:
            # Добавляем нового пользователя
            logger.info(f"Пользователь {user_info.get('first_name')} не найден в БД, добавляем нового")
            values = UserBase(
                telegram_id=user_info["id"],
                username=user_info.get("username"),
                first_name=user_info.get("first_name"),
                last_name=user_info.get("last_name")
            )
            await UserDAO.add(session=session, values=values)
            logger.info(f"Пользователь {user_info.get('first_name')} добавлен в БД")
        else:
            logger.info(f"Пользователь {user_info.get('first_name')} уже есть в базе данных")
        
        # Проверяем права админа
        admin_status = await is_admin(user_info["id"], session)
        
        greeting_message = get_greeting_text(user_info.get("first_name"))
        logger.info(f"Подготовлено приветственное сообщение: {greeting_message}")
        
        # Используем клавиатуру с учетом прав доступа
        keyboard = get_main_kb(is_admin=admin_status)
        logger.info(f"Вызываем bot_send_message для пользователя {user_info['id']} с клавиатурой: {keyboard}")
        
        await bot_send_message(client, user_info["id"], greeting_message, keyboard)
        logger.info(f"Команда /start успешно обработана для пользователя {user_info.get('first_name')}")
    except Exception as e:
        logger.exception(f"Ошибка в cmd_start для пользователя {user_info.get('first_name')}: {e}")
        raise


async def handler_back_home(client: AsyncClient, callback_query_id: int, chat_id: int):
    await call_answer(client, callback_query_id, "Главное меню")
    await bot_send_message(client, chat_id, "Вы на главной странице!", main_kb)


async def handler_about_us(client: AsyncClient, callback_query_id: int, chat_id: int):
    await call_answer(client, callback_query_id, "О нас")
    about_us_text = get_about_text()
    await bot_send_message(client, chat_id, about_us_text, back_kb)


async def handler_my_appointments(client: AsyncClient, callback_query_id: int, chat_id: int, session):
    await call_answer(client, callback_query_id, "Ваши записи к мастерам")
    db_user_id = await UserDAO.get_user_id(session=session, telegram_id=chat_id)
    appointment_count = await BookingDAO.count_user_booking(session=session, user_id=db_user_id)
    message_text = get_booking_text(appointment_count)
    keyboard = generate_kb_profile(db_user_id, appointment_count)
    await bot_send_message(client, chat_id, message_text, kb=keyboard)


async def handler_my_appointments_all(client: AsyncClient,
                                      callback_query_id: int,
                                      chat_id: int,
                                      user_db_id: int,
                                      session):
    await call_answer(client, callback_query_id, "Ваши записи к мастерам (подробно)")
    appointments = await BookingDAO.get_user_bookings_with_master_info(session=session, user_id=user_db_id)

    for appointment in appointments:
        await bot_send_message(client, chat_id, format_appointment(appointment))

    await bot_send_message(client, chat_id, "Это все ваши текущие записи.", main_kb)