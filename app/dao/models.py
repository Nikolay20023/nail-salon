# models.py
from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import Column, Index, Integer, String, Table, Text, Boolean, ForeignKey, Date, Time, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.dao.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)        # будет заполняться при записи
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Связи
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking", back_populates="user", cascade="all, delete-orphan"
    )


class Master(Base):
    """
    Мастер маникюра / педикюра.
    Один мастер может предоставлять множество услуг (many-to-many с Service).
    """
    __tablename__ = "masters"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)           # например "Анна", "Марина"
    instagram: Mapped[Optional[str]] = mapped_column(String(100))
    photo: Mapped[Optional[str]] = mapped_column(String(255))               # путь или URL к фото
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Связи
    # One-to-many: один мастер может иметь множество бронирований
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking", 
        back_populates="master",
        cascade="all, delete-orphan"
    )
    
    # Many-to-many: один мастер может предоставлять множество услуг
    # Одна услуга может предоставляться множеством мастеров
    services: Mapped[List["Service"]] = relationship(
        "Service",
        secondary="master_service_association",
        back_populates="masters",
        lazy="selectin"  # Загружаем услуги при загрузке мастера
    )


class Service(Base):
    """
    Услуга: «Классический маникюр», «Покрытие гель-лак + дизайн», «Наращивание» и т.д.
    Одна услуга может предоставляться множеством мастеров (many-to-many с Master).
    """
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)              # в копейках или рублях, как удобно
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)       # длительность в минутах (90, 120 и т.д.)
    description: Mapped[Optional[str]] = mapped_column(Text)
    photo: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Связи
    # One-to-many: одна услуга может быть в множестве бронирований
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="service",
        cascade="all, delete-orphan"
    )
    
    # Many-to-many: одна услуга может предоставляться множеством мастеров
    # Один мастер может предоставлять множество услуг
    masters: Mapped[List["Master"]] = relationship(
        "Master",
        secondary="master_service_association",
        back_populates="services",
        lazy="selectin"  # Загружаем мастеров при загрузке услуги
    )


# Связующая таблица для отношения многие-ко-многим между Master и Service
# Один мастер может предоставлять множество услуг
# Одна услуга может предоставляться множеством мастеров
master_service_association = Table(
    "master_service_association",
    Base.metadata,
    Column("master_id", ForeignKey("masters.id", ondelete="CASCADE"), primary_key=True, nullable=False),
    Column("service_id", ForeignKey("services.id", ondelete="CASCADE"), primary_key=True, nullable=False),
    # Индексы для быстрого поиска
    Index("ix_master_service_master", "master_id"),
    Index("ix_master_service_service", "service_id"),
)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    master_id: Mapped[Optional[int]] = mapped_column(ForeignKey("masters.id"), nullable=True)  # если мастер не важен — можно None

    date: Mapped[date] = mapped_column(Date, nullable=False)      # дата записи
    time: Mapped[time] = mapped_column(Time, nullable=False)      # время записи

    client_name: Mapped[Optional[str]] = mapped_column(String(100))  
    client_phone: Mapped[Optional[str]] = mapped_column(String(20))

    status: Mapped[str] = mapped_column(
        String(20),
        default="new",                                      # new | confirmed | cancelled | completed
        server_default="new"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP")
    )

    # Связи
    user: Mapped["User"] = relationship("User", back_populates="bookings")
    service: Mapped["Service"] = relationship("Service", back_populates="bookings")
    master: Mapped[Optional["Master"]] = relationship("Master", back_populates="bookings")

    # Удобный индекс для быстрого поиска свободного времени
    __table_args__ = (
        Index("ix_bookings_date_time", "date", "time"),
        Index("ix_bookings_master_date", "master_id", "date"),
    )