# schemas.py
from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class ModelBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# === Базовые ===
class UserBase(ModelBase):
    telegram_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserInDB(UserBase):
    id: int


# === Услуги ===
class ServiceBase(ModelBase):
    name: str
    price: int
    duration_min: int
    description: Optional[str] = None
    photo: Optional[str] = None
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceInDB(ServiceBase):
    id: int


class ServicePublic(ServiceInDB):
    """То, что показываем клиенту"""
    pass


# === Мастера ===
class MasterBase(ModelBase):
    name: str
    instagram: Optional[str] = None
    photo: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class MasterCreate(MasterBase):
    pass


class MasterInDB(MasterBase):
    id: int


class MasterPublic(MasterInDB):
    pass


# === Записи (Booking) ===
class BookingCreate(ModelBase):
    """Данные, которые приходят от клиента при создании записи"""
    user_id: int  # telegram_id
    service_id: Optional[int] = None
    master_id: Optional[int] = None
    date: date
    time: time
    client_name: Optional[str] = None
    client_phone: Optional[str] = None


class BookingInDB(ModelBase):
    id: int
    user_id: int
    service_id: int
    master_id: Optional[int] = None
    date: date
    time: time
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    status: str = "new"
    created_at: datetime

    # Связи для удобного вывода
    user: Optional[UserInDB] = None
    service: Optional[ServiceInDB] = None
    master: Optional[MasterInDB] = None


class BookingPublic(BookingInDB):
    """То, что показываем клиенту в "Мои записи" и админу"""
    pass


# === Слоты времени ===
class TimeSlot(BaseModel):
    time: str = Field(..., example="10:00")  # строка, потому что в кнопках удобнее
    is_available: bool = Field(..., alias="isAvailable")


class DaySlots(BaseModel):
    date: date
    slots: List[TimeSlot]


class WeekAvailability(BaseModel):
    """Ответ на запрос свободного времени на неделю"""
    week: List[DaySlots]


# === Для админки ===
class BookingAdmin(BookingInDB):
    """Расширенная версия для админа — с полными данными пользователя"""
    user: UserInDB
    service: ServiceInDB
    master: Optional[MasterInDB]


class BookingCancel(ModelBase):
    booking_id: int
    reason: Optional[str] = None


# === Для уведомлений ===
class NewBookingNotification(ModelBase):
    """То, что отправляем админу при новой записи"""
    booking_id: int
    client_name: str
    client_phone: Optional[str]
    service_name: str
    master_name: Optional[str]
    date: date
    time: time


# === Упрощённые модели для фильтров ===
class DateFilter(ModelBase):
    date: date


class MasterFilter(ModelBase):
    master_id: Optional[int] = None


class ServiceFilter(ModelBase):
    """Фильтр для поиска мастеров по услуге"""
    id: int


class TelegramIDModel(BaseModel):
    telegram_id: int

    model_config = ConfigDict(from_attributes=True)