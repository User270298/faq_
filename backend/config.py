from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "FAQ & Tariffs API"
    debug: bool = True
    api_prefix: str = "/api"
    
    # CORS settings
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Data files
    faq_data_path: str = "data/faq.json"
    tariffs_data_path: str = "data/tariffs.json"
    
    class Config:
        env_file = ".env"

settings = Settings() 