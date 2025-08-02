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
        "http://localhost:5173",  # Vite dev server (если используется)
        "http://127.0.0.1:5173",  # Vite dev server alternative
    ]
    
    # Data files
    faq_data_path: str = "data/faq.json"
    tariffs_data_path: str = "data/tariffs.json"
    
    class Config:
        env_file = ".env"

settings = Settings() 