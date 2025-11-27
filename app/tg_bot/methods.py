from datetime import datetime
from httpx import AsyncClient
from app.config import settings
from loguru import logger


async def bot_send_message(client: AsyncClient, chat_id: int, text: str, kb: list | None = None):
    logger.info(f"Отправляем сообщение пользователю {chat_id} с текстом: {text}")
    send_data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if kb:
        send_data["reply_markup"] = {"inline_keyboard": kb}
    
    try:
        url = f"{settings.get_tg_api_url()}/sendMessage"
        logger.info(f"Отправка запроса на URL: {url}")
        response = await client.post(url, json=send_data)
        logger.info(f"Получен ответ со статусом: {response.status_code}")
        response_data = response.json()
        logger.info(f"Ответ от Telegram API: {response_data}")
        
        if response.status_code != 200:
            logger.error(f"Ошибка при отправке сообщения: статус {response.status_code}, ответ: {response_data}")
            raise Exception(f"Telegram API вернул статус {response.status_code}: {response_data}")
        
        if not response_data.get("ok"):
            logger.error(f"Telegram API вернул ошибку: {response_data}")
            raise Exception(f"Telegram API вернул ошибку: {response_data}")
        
        logger.info(f"Сообщение успешно отправлено пользователю {chat_id}")
        return response_data
    except Exception as e:
        logger.exception(f"Исключение при отправке сообщения пользователю {chat_id}: {e}")
        raise


async def call_answer(client: AsyncClient, callback_query_id: int, text: str):
    await client.post(f"{settings.get_tg_api_url()}/answerCallbackQuery", json={
        "callback_query_id": callback_query_id,
        "text": text
    })


def format_appointment(appointment, start_text="🗓 <b>Запись на прием</b>"):
    appointment_date = datetime.strptime(appointment['date'], '%Y-%m-%d').strftime('%d.%m.%Y')
    return f"""
        {start_text}

        📅 Дата: {appointment_date}
        🕒 Время: {appointment['time']}
        👨‍⚕️ Мастер: {appointment['master_full_name']}
        🏥 Услуга: {appointment['service']}

        ℹ️ Номер записи: {appointment['id']}

        Пожалуйста, приходите за 10-15 минут до назначенного времени.
        """


def get_greeting_text(first_name: str):
    return f"Привет, {first_name}! Я бот-помощник для бронированию ногтей."


def get_about_text():
    return f"Я бот-помощник для бронирования ногтей. Я помогаю вам записаться к мастеру и не забыть о ваших записях."

def get_booking_text(count_booking: int):
    return f"У вас {count_booking} записей к мастерам."