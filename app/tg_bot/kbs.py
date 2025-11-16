from app.config import settings


def _get_booking_button():
    """Возвращает кнопку 'Записаться' в зависимости от протокола URL.
    Для HTTPS используется Web App, для HTTP - обычная URL кнопка.
    """
    front_url = settings.FRONT_SITE
    if front_url.startswith("https://"):
        # Для HTTPS используем Web App
        return {"text": "🔖 Записаться", "web_app": {"url": front_url}}
    elif front_url.startswith("http://"):
        # Для HTTP используем обычную URL кнопку (Telegram не поддерживает HTTP для Web App)
        return {"text": "🔖 Записаться", "url": front_url}
    else:
        # Если URL не указан или невалидный, используем URL кнопку
        return {"text": "🔖 Записаться", "url": front_url}


def _get_admin_button():
    """Возвращает кнопку 'Админ панель'"""
    admin_url = f"{settings.FRONT_SITE}/admin"
    if admin_url.startswith("https://"):
        return {"text": "⚙️ Админ панель", "web_app": {"url": admin_url}}
    else:
        return {"text": "⚙️ Админ панель", "url": admin_url}


def get_main_kb(is_admin: bool = False):
    """Возвращает главную клавиатуру с учетом прав доступа"""
    kb = [
        [{"text": "📅 Мои записи", "callback_data": "booking"}],
        [_get_booking_button()],
        [{"text": "ℹ️ О нас", "callback_data": "about_us"}]
    ]
    if is_admin:
        kb.append([_get_admin_button()])
    return kb


main_kb = [
    [{"text": "📅 Мои записи", "callback_data": "booking"}],
    [_get_booking_button()],
    [{"text": "ℹ️ О нас", "callback_data": "about_us"}]
]

back_kb = [
    [{"text": "🏠 Главное меню", "callback_data": "home"}],
    [_get_booking_button()]
]

def generate_kb_profile(user_db_id: int, count_booking: int):
    kb_profile = [
        [{"text": "🏠 Главное меню", "callback_data": "home"}],
        [_get_booking_button()]
    ]
    if count_booking > 0:
        kb_profile.append([{"text": f"🔒 Мои записи ({count_booking})", "callback_data": f"my_booking_{user_db_id}"}])
    return kb_profile