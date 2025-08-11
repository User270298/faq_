from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
import re

# FAQ Models
class FAQItem(BaseModel):
    id: int
    question: str
    answer: str
    keywords: List[str]
    category: str
    priority: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class FAQCategories(BaseModel):
    pricing: str
    technical: str
    support: str
    security: str

class FAQMetadata(BaseModel):
    version: str
    last_updated: str
    total_questions: int
    categories_count: int

class FAQData(BaseModel):
    faq: List[FAQItem]
    categories: FAQCategories
    metadata: Optional[FAQMetadata] = None

class FAQResponse(BaseModel):
    success: bool
    data: Optional[FAQData] = None
    message: Optional[str] = None

class AISearchResult(BaseModel):
    id: int
    question: str
    answer: str
    keywords: List[str]
    category: str
    relevance_score: int
    match_type: str

class AISearchResponse(BaseModel):
    success: bool
    query: str
    results_count: int
    matches: List[AISearchResult]
    suggestions: List[str]
    message: Optional[str] = None

# Tariffs Models
class Tariff(BaseModel):
    id: str
    name: str
    price: int
    currency: str
    period: str
    description: str
    features: List[str]
    popular: bool
    recommended: bool

class TariffDiscounts(BaseModel):
    quarterly: int
    yearly: int

class TariffsData(BaseModel):
    tariffs: List[Tariff]
    discounts: TariffDiscounts
    trial_period: int

class TariffsResponse(BaseModel):
    success: bool
    data: Optional[TariffsData] = None
    message: Optional[str] = None

class PriceCalculation(BaseModel):
    period: str
    price: int
    discount: int
    final_price: int

# Admin Models for FAQ Management
class FAQCreate(BaseModel):
    question: str
    answer: str
    keywords: List[str]
    category: str
    priority: Optional[int] = None

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[List[str]] = None
    category: Optional[str] = None
    priority: Optional[int] = None

class FAQStats(BaseModel):
    total_questions: int
    questions_by_category: dict
    recent_additions: List[FAQItem]
    popular_keywords: List[str] 

# Application Models
class ApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    selectedTariff: str
    message: Optional[str] = None

    # Валидация номера телефона (разрешаем пробелы, дефисы, скобки; проверяем количество цифр)
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Некорректный тип телефона")

        phone_raw = value.strip()
        if not phone_raw:
            raise ValueError("Телефон обязателен")

        # Оставляем только цифры для подсчёта количества
        digits = re.sub(r"\D", "", phone_raw)

        # Должно быть от 10 до 15 цифр (международный формат E.164 допускает до 15)
        if not (10 <= len(digits) <= 15):
            raise ValueError("Некорректный номер телефона. Укажите от 10 до 15 цифр.")

        # Проверяем расположение знака '+' (если он есть, то только в начале и один раз)
        if "+" in phone_raw:
            if not phone_raw.startswith("+"):
                raise ValueError("Символ '+' допускается только в начале номера")
            if phone_raw.count("+") > 1:
                raise ValueError("Символ '+' допускается только один раз")

        return value

class ApplicationResponse(BaseModel):
    success: bool
    message: str
    application_id: Optional[str] = None 