from app.config import settings
from app.api.dao import UserDAO
from sqlalchemy.ext.asyncio import AsyncSession


async def is_admin(telegram_id: int, session: AsyncSession) -> bool:
    """Проверяет, является ли пользователь админом"""
    # Проверяем в настройках
    if telegram_id in settings.ADMIN_IDS:
        return True
    
    # Проверяем в базе данных
    user_id = await UserDAO.get_user_id(session=session, telegram_id=telegram_id)
    if user_id:
        user = await UserDAO.find_one_or_none_by_id(session=session, data_id=user_id)
        if user and user.is_admin:
            return True
    
    return False


def check_admin_dependency(telegram_id: int):
    """Dependency для FastAPI - проверяет что пользователь админ"""
    if telegram_id not in settings.ADMIN_IDS:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Доступ запрещен. Требуются права администратора")
    return telegram_id

