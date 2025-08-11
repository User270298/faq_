from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "FAQ & Tariffs API"
    debug: bool = True
    api_prefix: str = "/api"
    
    # CORS settings - разрешаем запросы с фронтенда
    cors_origins: List[str] = [
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",  # Next.js dev server alternative
        "https://valles-bot.ru",  # Production domain
        "http://valles-bot.ru",   # HTTP version
        "https://217.199.252.234.nip.io",  # VPS domain with SSL
        "http://217.199.252.234.nip.io",   # VPS domain HTTP
        "http://localhost:5173",  # Vite dev server (если используется)
        "http://127.0.0.1:5173"  # Vite dev server alternative
          # Разрешаем все домены (временно для тестирования)
    ]
    
    # Data files
    faq_data_path: str = "data/faq.json"
    tariffs_data_path: str = "data/tariffs.json"

    # Email settings
    admin_email: str = "parkwoodoleg@yandex.ru"  # Email администратора для уведомлений
    smtp_host: str = "smtp.yandex.ru"
    smtp_port: int = 587 
    smtp_user: str = "parkwoodoleg@yandex.ru"
    smtp_password: str = "dmxxyki" #dmxxykilglgkzlcz
    smtp_from: str = "parkwoodoleg@yandex.ru"  # Если пусто, использовать smtp_user
    smtp_use_tls: bool = True  # STARTTLS (порт 587); для SSL (465) установите False и используйте SMTP_SSL

    # Telegram settings
    telegram_bot_token: str = "8014660296:AAGIcduqoTLp_y7_hRvlNJKxlIfV_QoDt-s"
    telegram_chat_id: str = "-1002768477989"

    # Google Sheets settings
    google_sheets_enabled: bool = True
    google_spreadsheet_id: str = "1TVjvzHo91e5ZmSCWns9L5WOvGwurEDIjFNK8SBN2yes"
    google_worksheet_name: str = "Applications"
    # Один из вариантов ниже должен быть задан
    google_service_account_json_path: str = "/root/backend_valles_bot/acoustic-spot-423313-g5-b9316d0f3544.json"  # путь к .json ключу сервисного аккаунта
    google_service_account_json: str = ""       # или содержимое JSON (можно через переменную окружения)
    
    class Config:
        env_file = ".env"

settings = Settings() 
