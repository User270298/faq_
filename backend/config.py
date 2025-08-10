from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "FAQ & Tariffs API"
    debug: bool = True
    api_prefix: str = "/api"
    
    # CORS settings - разрешаем запросы с фронтенда
    cors_origins: List[str] = ["*"
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
    admin_email: str = "admin@example.com"  # Email администратора для уведомлений
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""  # Если пусто, использовать smtp_user
    smtp_use_tls: bool = True  # STARTTLS (порт 587); для SSL (465) установите False и используйте SMTP_SSL

    # Telegram settings
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Google Sheets settings
    google_sheets_enabled: bool = False
    google_spreadsheet_id: str = ""
    google_worksheet_name: str = "Applications"
    # Один из вариантов ниже должен быть задан
    google_service_account_json_path: str = ""  # путь к .json ключу сервисного аккаунта
    google_service_account_json: str = ""       # или содержимое JSON (можно через переменную окружения)
    
    class Config:
        env_file = ".env"

settings = Settings() 
