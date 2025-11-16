from datetime import date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select

from app.api.dao import ServiceDAO, MasterDAO, BookingDAO, UserDAO
from app.api.schemas import (
    ServiceCreate, ServiceInDB, ServicePublic,
    MasterCreate, MasterInDB, MasterPublic,
    UserInDB, UserBase,
    BookingPublic, BookingInDB
)
from app.dao.session_maker_fastapi import db
from app.dao.models import User, Service, Master, Booking
from app.utils.admin import is_admin

router = APIRouter(prefix="/admin", tags=["admin"])


async def verify_admin(
    telegram_id: int = Query(..., description="Telegram ID пользователя"),
    session: AsyncSession = Depends(db.get_db)
):
    """Dependency для проверки прав администратора"""
    admin = await is_admin(telegram_id, session)
    if not admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен. Требуются права администратора")
    return telegram_id


# ========== USERS ==========
@router.get("/users", response_model=List[UserInDB])
async def get_all_users(
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить всех пользователей"""
    users = await UserDAO.find_all(session=session)
    return users


@router.get("/users/{user_id}", response_model=UserInDB)
async def get_user(
    user_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить пользователя по ID"""
    user = await UserDAO.find_one_or_none_by_id(session=session, data_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.put("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Переключить статус админа у пользователя"""
    user = await UserDAO.find_one_or_none_by_id(session=session, data_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.is_admin = not user.is_admin
    await session.flush()
    await session.refresh(user)
    
    return {"id": user.id, "is_admin": user.is_admin, "message": f"Статус админа изменен на {user.is_admin}"}


# ========== SERVICES ==========
@router.get("/services", response_model=List[ServicePublic])
async def get_all_services(
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить все услуги"""
    services = await ServiceDAO.find_all(session=session)
    return services


@router.get("/services/{service_id}", response_model=ServicePublic)
async def get_service(
    service_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить услугу по ID"""
    service = await ServiceDAO.find_one_or_none_by_id(session=session, data_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return service


@router.post("/services", response_model=ServicePublic)
async def create_service(
    service: ServiceCreate,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Создать новую услугу"""
    new_service = await ServiceDAO.add(session=session, values=service)
    await session.refresh(new_service)
    return new_service


@router.put("/services/{service_id}", response_model=ServicePublic)
async def update_service(
    service_id: int,
    service: ServiceCreate,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Обновить услугу"""
    existing_service = await ServiceDAO.find_one_or_none_by_id(session=session, data_id=service_id)
    if not existing_service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    
    # Обновляем поля
    for key, value in service.model_dump(exclude_unset=True).items():
        setattr(existing_service, key, value)
    
    await session.flush()
    await session.refresh(existing_service)
    return existing_service


@router.delete("/services/{service_id}")
async def delete_service(
    service_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Удалить услугу"""
    service = await ServiceDAO.find_one_or_none_by_id(session=session, data_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    
    await session.delete(service)
    await session.flush()
    return {"status": "SUCCESS", "message": "Услуга удалена"}


# ========== MASTERS ==========
@router.get("/masters", response_model=List[MasterPublic])
async def get_all_masters(
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить всех мастеров"""
    masters = await MasterDAO.find_all(session=session)
    return masters


@router.get("/masters/{master_id}", response_model=MasterPublic)
async def get_master(
    master_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить мастера по ID"""
    master = await MasterDAO.find_one_or_none_by_id(session=session, data_id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    return master


@router.post("/masters", response_model=MasterPublic)
async def create_master(
    master: MasterCreate,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Создать нового мастера"""
    new_master = await MasterDAO.add(session=session, values=master)
    await session.refresh(new_master)
    return new_master


@router.put("/masters/{master_id}", response_model=MasterPublic)
async def update_master(
    master_id: int,
    master: MasterCreate,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Обновить мастера"""
    existing_master = await MasterDAO.find_one_or_none_by_id(session=session, data_id=master_id)
    if not existing_master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    
    # Обновляем поля
    for key, value in master.model_dump(exclude_unset=True).items():
        setattr(existing_master, key, value)
    
    await session.flush()
    await session.refresh(existing_master)
    return existing_master


@router.delete("/masters/{master_id}")
async def delete_master(
    master_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Удалить мастера"""
    master = await MasterDAO.find_one_or_none_by_id(session=session, data_id=master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    
    await session.delete(master)
    await session.flush()
    return {"status": "SUCCESS", "message": "Мастер удален"}


# ========== BOOKINGS ==========
@router.get("/bookings", response_model=List[BookingPublic])
async def get_all_bookings(
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0)
):
    """Получить все бронирования"""
    query = (
        select(Booking)
        .options(joinedload(Booking.user), joinedload(Booking.service), joinedload(Booking.master))
        .order_by(Booking.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(query)
    bookings = result.unique().scalars().all()
    return bookings


@router.get("/bookings/{booking_id}", response_model=BookingPublic)
async def get_booking(
    booking_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить бронирование по ID"""
    query = (
        select(Booking)
        .options(joinedload(Booking.user), joinedload(Booking.service), joinedload(Booking.master))
        .where(Booking.id == booking_id)
    )
    result = await session.execute(query)
    booking = result.unique().scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    return booking


@router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    status: str = Query(..., description="Новый статус: new, confirmed, cancelled, completed"),
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Изменить статус бронирования"""
    valid_statuses = ["new", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Статус должен быть одним из: {valid_statuses}")
    
    booking = await BookingDAO.find_one_or_none_by_id(session=session, data_id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    booking.status = status
    await session.flush()
    await session.refresh(booking)
    
    return {"id": booking.id, "status": booking.status, "message": f"Статус изменен на {status}"}


@router.delete("/bookings/{booking_id}")
async def delete_booking_admin(
    booking_id: int,
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db_with_commit)
):
    """Удалить бронирование (админ)"""
    booking = await BookingDAO.find_one_or_none_by_id(session=session, data_id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    await session.delete(booking)
    await session.flush()
    return {"status": "SUCCESS", "message": "Бронирование удалено"}


# ========== STATISTICS ==========
@router.get("/stats")
async def get_stats(
    telegram_id: int = Depends(verify_admin),
    session: AsyncSession = Depends(db.get_db)
):
    """Получить статистику"""
    from sqlalchemy import func
    
    # Количество пользователей
    users_count = await session.execute(select(func.count(User.id)))
    total_users = users_count.scalar()
    
    # Количество услуг
    services_count = await session.execute(select(func.count(Service.id)))
    total_services = services_count.scalar()
    
    # Количество мастеров
    masters_count = await session.execute(select(func.count(Master.id)))
    total_masters = masters_count.scalar()
    
    # Количество бронирований
    bookings_count = await session.execute(select(func.count(Booking.id)))
    total_bookings = bookings_count.scalar()
    
    # Бронирования по статусам
    status_query = select(Booking.status, func.count(Booking.id)).group_by(Booking.status)
    status_result = await session.execute(status_query)
    bookings_by_status = {row[0]: row[1] for row in status_result.all()}
    
    return {
        "users": total_users,
        "services": total_services,
        "masters": total_masters,
        "bookings": total_bookings,
        "bookings_by_status": bookings_by_status
    }

