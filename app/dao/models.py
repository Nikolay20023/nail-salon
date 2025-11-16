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
    Мастер маникюра / педикюра. Если у тебя один салон и мастера не выбирают — 
    можно оставить одного мастера или вообще убрать эту таблицу.
    Но лучше оставить — вдруг потом захочешь нескольких мастеров.
    """
    __tablename__ = "masters"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)           # например "Анна", "Марина"
    instagram: Mapped[Optional[str]] = mapped_column(String(100))
    photo: Mapped[Optional[str]] = mapped_column(String(255))               # путь или URL к фото
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Связи
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="master")
    services: Mapped[List["Service"]] = relationship(
        "Service", secondary="master_service_association", back_populates="masters"
    )


class Service(Base):
    """
    Услуга: «Классический маникюр», «Покрытие гель-лак + дизайн», «Наращивание» и т.д.
    """
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)              # в копейках или рублях, как удобно
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)       # длительность в минутах (90, 120 и т.д.)
    description: Mapped[Optional[str]] = mapped_column(Text)
    photo: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Если услугу могут делать не все мастера — связь many-to-many
    masters: Mapped[List["Master"]] = relationship(
        "Master", secondary="master_service_association", back_populates="services"
    )

    # Связи
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="service")


# Связующая таблица, если хочешь назначать услуги конкретным мастерам
master_service_association = Table(
    "master_service_association",
    Base.metadata,
    Column("master_id", ForeignKey("masters.id"), primary_key=True),
    Column("service_id", ForeignKey("services.id"), primary_key=True),
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