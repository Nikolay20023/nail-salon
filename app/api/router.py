from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.api.dao import ServiceDAO, MasterDAO, BookingDAO, UserDAO
from app.api.schemas import ServiceInDB, BookingCreate, BookingPublic, BookingInDB, ServiceFilter, TelegramIDModel
from app.dao.session_maker_fastapi import db
from app.tg_bot.scheduler_task import schedule_appointment_notification
from app.dao.models import Booking
from sqlalchemy import select
import pytz


MOSCOW_TZ = pytz.timezone("Europe/Moscow")
router = APIRouter()


@router.get("/services")
async def get_services(session: AsyncSession = Depends(db.get_db)):
    """Получить все активные услуги"""
    return await ServiceDAO.find_all(session=session)

@router.get("/services/{service_id}")
async def get_service(service_id: int, session: AsyncSession = Depends(db.get_db)):
    """Получить конкретную услугу"""
    service = await ServiceDAO.find_one_or_none_by_id(session=session, data_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return service

@router.get("/masters")
async def get_masters(session: AsyncSession = Depends(db.get_db)):
    """Получить всех активных мастеров"""
    return await MasterDAO.find_all(session=session)

@router.get("/masters/{master_id}")
async def get_master(master_id: int, session: AsyncSession = Depends(db.get_db)):
    """Получить конкретного мастера"""
    master = await MasterDAO.find_one_or_none_by_id(session=session, data_id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    return master

@router.get("/masters/by-service/{service_id}")
async def get_masters_by_service(service_id: int, session: AsyncSession = Depends(db.get_db)):
    """Получить мастеров, предоставляющих конкретную услугу"""
    return await MasterDAO.find_all(session=session, filters=ServiceFilter(id=service_id))

@router.get("/bookings/master/{master_id}")
async def get_master_bookings(
    master_id: int,
    date: str = Query(..., description="Дата в формате YYYY-MM-DD"),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить все бронирования мастера на конкретную дату"""
    try:
        from datetime import datetime
        booking_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        query = select(Booking).where(
            Booking.master_id == master_id,
            Booking.date == booking_date,
            Booking.status != 'cancelled'
        )
        result = await session.execute(query)
        bookings = result.scalars().all()
        
        return [BookingPublic.model_validate(booking) for booking in bookings]
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error in get_master_bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при получении бронирований")

# Старые алиасы для обратной совместимости
@router.get("/service")
async def get_specialists(session: AsyncSession = Depends(db.get_db)):
    return await get_services(session)

@router.get("/masters/{serivce_id}")
async def get_doctors_spec(serivce_id: int, session: AsyncSession = Depends(db.get_db)):
    return await get_masters_by_service(serivce_id, session)


@router.post("/users")
async def create_or_get_user(
    user_data: dict,
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Создать или получить пользователя по telegram_id"""
    try:
        telegram_id = user_data.get("telegram_id")
        logger.info(f"telegram_id={telegram_id}")
        if not telegram_id:
            raise HTTPException(status_code=400, detail="telegram_id обязателен")
        
        # Ищем существующего пользователя
        filter = TelegramIDModel(telegram_id=telegram_id)
        user = await UserDAO.find_one_or_none(session=session, filters=filter)
        logger.info(f"user={user}")
        if not user:
            # Создаем нового пользователя
            from app.dao.models import User
            user = User(
                telegram_id=telegram_id,
                username=user_data.get("username"),
                first_name=user_data.get("first_name"),
                last_name=user_data.get("last_name"),
                is_admin=False
            )
            session.add(user)
            await session.flush()
            await session.refresh(user)
        
        return {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "phone": user.phone,
            "is_admin": user.is_admin,
            # "created_at": user.created_at.isoformat() if user.created_at else None
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in create_or_get_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при создании/получении пользователя")


@router.post("/booking")
async def create_booking(
    booking_request: BookingCreate, 
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Создать новое бронирование"""
    return await book_appointment_and_schedule_notifications(booking_request, session)


@router.post("/book")
async def book_appointment_and_schedule_notifications(
        booking_request: BookingCreate, session: AsyncSession = Depends(db.get_db_with_commit)
):
    """
    Эндпоинт для бронирования записи и планирования уведомлений.
    """
    try:
        logger.info(f"Начинаю обработку бронирования: {booking_request}")
        
        # Валидация обязательных полей
        if not booking_request.service_id:
            raise HTTPException(status_code=400, detail="service_id обязателен")
        if not booking_request.master_id:
            raise HTTPException(status_code=400, detail="master_id обязателен")
        
        logger.info(f"Получение user_id для telegram_id: {booking_request.user_id}")
        # Получение user_id по Telegram ID
        user_id = await UserDAO.get_user_id(session=session, telegram_id=booking_request.user_id)
        if not user_id:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        logger.info(f"Создание брони: master_id={booking_request.master_id}, user_id={user_id}, service_id={booking_request.service_id}")

        # Создание брони в базе данных
        appointment = await BookingDAO.book_appointment(
            session=session,
            master_id=booking_request.master_id,
            user_id=user_id,
            service_id=booking_request.service_id,
            date=booking_request.date,
            time=booking_request.time,
            client_name=booking_request.client_name,
            client_phone=booking_request.client_phone
        )
        logger.info(f"Бронь создана: id={appointment.id}, date={appointment.date}, time={appointment.time}, type(time)={type(appointment.time)}")
        
        master_info = await MasterDAO.find_one_or_none_by_id(session=session, data_id=booking_request.master_id)
        service_info = await ServiceDAO.find_one_or_none_by_id(session=session, data_id=booking_request.service_id)

        # Формирование объекта appointment для уведомлений
        logger.info(f"Формирую appointment_details")
        appointment_details = {
            'id': appointment.id,
            'date': appointment.date.strftime("%Y-%m-%d"),
            'time': appointment.time.strftime("%H:%M") if hasattr(appointment.time, 'strftime') else str(appointment.time),
            'doctor_full_name': f'{master_info.name}' if master_info else 'Не указан',
            'service': f'{service_info.name}' if service_info else 'Не указано'
        }
        logger.info(f"appointment_details: {appointment_details}")

        # Расчет времени напоминаний
        # Преобразуем время в datetime
        logger.info(f"Преобразую время в datetime")
        time_str = appointment.time.strftime("%H:%M") if hasattr(appointment.time, 'strftime') else str(appointment.time)
        booking_time_str = f"{appointment_details['date']} {time_str}"
        logger.info(f"booking_time_str: {booking_time_str}")
        booking_time = datetime.strptime(booking_time_str, "%Y-%m-%d %H:%M").replace(tzinfo=MOSCOW_TZ)
        logger.info(f"booking_time: {booking_time}, type={type(booking_time)}")
        
        now = datetime.now(MOSCOW_TZ)
        notification_times = []

        logger.info(f"Планирую уведомления")
        # Напоминание 1: Сразу
        logger.info(f"Уведомление 1 - Сразу, time={now}, type={type(now)}")
        await schedule_appointment_notification(
            user_tg_id=booking_request.user_id,
            appointment=appointment_details,
            notification_time=now,
            reminder_label="immediate"
        )
        notification_times.append(now)

        # Напоминание 2: За сутки
        time_24h = booking_time - timedelta(hours=24)
        logger.info(f"Уведомление 2 - За сутки, time={time_24h}, type={type(time_24h)}")
        if time_24h > now:
            await schedule_appointment_notification(
                user_tg_id=booking_request.user_id,
                appointment=appointment_details,
                notification_time=time_24h,
                reminder_label="24h"
            )
            notification_times.append(time_24h)

        # Напоминание 3: За 6 часов
        time_6h = booking_time - timedelta(hours=6)
        logger.info(f"Уведомление 3 - За 6 часов, time={time_6h}, type={type(time_6h)}")
        if time_6h > now:
            await schedule_appointment_notification(
                user_tg_id=booking_request.user_id,
                appointment=appointment_details,
                notification_time=time_6h,
                reminder_label="6h"
            )
            notification_times.append(time_6h)

        # Напоминание 4: За 30 минут
        time_30min = booking_time - timedelta(minutes=30)
        logger.info(f"Уведомление 4 - За 30 минут, time={time_30min}, type={type(time_30min)}")
        if time_30min > now:
            await schedule_appointment_notification(
                user_tg_id=booking_request.user_id,
                appointment=appointment_details,
                notification_time=time_30min,
                reminder_label="30min"
            )
            notification_times.append(time_30min)

        logger.info(f"Форматирую времена уведомлений")
        # Форматирование времени уведомлений для ответа
        notification_times_formatted = [notif_time.strftime("%Y-%m-%d %H:%M:%S") for notif_time in notification_times]

        logger.info(f"Возвращаю успешный ответ")
        return {
            "status": "SUCCESS",
            "message": "Запись успешно создана и напоминания запланированы!",
            "appointment": appointment_details,
            "notification_times": notification_times_formatted
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Error in book_appointment_and_schedule_notifications endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при создании брони и планировании уведомлений"
        )


@router.get("/bookings/{telegram_id}")
async def get_user_bookings(telegram_id: int, session: AsyncSession = Depends(db.get_db)):
    """Получить все бронирования пользователя по telegram_id"""
    try:
        user_id = await UserDAO.get_user_id(session=session, telegram_id=telegram_id)
        if not user_id:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        bookings = await BookingDAO.get_user_bookings_with_master_info(session=session, user_id=user_id)
        return bookings
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in get_user_bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при получении бронирований")


@router.get("/booking/{booking_id}")
async def get_booking(booking_id: int, session: AsyncSession = Depends(db.get_db)):
    """Получить конкретное бронирование"""
    try:
        booking = await BookingDAO.find_one_or_none_by_id(session=session, data_id=booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")
        
        # Загружаем связанные данные
        query = (
            select(Booking)
            .options(joinedload(Booking.service), joinedload(Booking.master), joinedload(Booking.user))
            .where(Booking.id == booking_id)
        )
        result = await session.execute(query)
        booking = result.unique().scalar_one_or_none()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")
        
        return BookingPublic.model_validate(booking)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in get_booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при получении бронирования")


@router.put("/booking/{booking_id}")
async def update_booking(
    booking_id: int,
    booking_update: BookingCreate,
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Обновить бронирование"""
    try:
        booking = await BookingDAO.find_one_or_none_by_id(session=session, data_id=booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")
        
        # Проверяем, что пользователь имеет право обновлять это бронирование
        user_id = await UserDAO.get_user_id(session=session, telegram_id=booking_update.user_id)
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Нет доступа к этому бронированию")
        
        # Обновляем поля
        if booking_update.date:
            booking.date = booking_update.date
        if booking_update.time:
            booking.time = booking_update.time
        if booking_update.master_id:
            booking.master_id = booking_update.master_id
        if booking_update.service_id:
            booking.service_id = booking_update.service_id
        if booking_update.client_name is not None:
            booking.client_name = booking_update.client_name
        if booking_update.client_phone is not None:
            booking.client_phone = booking_update.client_phone
        
        await session.flush()
        await session.refresh(booking)
        
        return BookingPublic.model_validate(booking)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in update_booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при обновлении бронирования")


@router.delete("/booking/{booking_id}")
async def delete_booking(
    booking_id: int,
    telegram_id: int = Query(..., description="Telegram ID пользователя"),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Удалить бронирование"""
    try:
        booking = await BookingDAO.find_one_or_none_by_id(session=session, data_id=booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")
        
        # Проверяем, что пользователь имеет право удалять это бронирование
        user_id = await UserDAO.get_user_id(session=session, telegram_id=telegram_id)
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Нет доступа к этому бронированию")
        
        await session.delete(booking)
        await session.flush()
        
        return {"status": "SUCCESS", "message": "Бронирование успешно удалено"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in delete_booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при удалении бронирования")