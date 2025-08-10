from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
    email: str
    phone: str
    selectedTariff: str
    message: Optional[str] = None

class ApplicationResponse(BaseModel):
    success: bool
    message: str
    application_id: Optional[str] = None 