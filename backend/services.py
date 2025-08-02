import json
import os
import time
import logging
from typing import List, Optional, Dict
from datetime import datetime
from models import FAQData, FAQItem, FAQCategories, FAQMetadata, TariffsData, Tariff, TariffDiscounts, FAQCreate, FAQUpdate
from config import settings
import time
import logging

logger = logging.getLogger(__name__)

class FAQService:
    def __init__(self):
        self.data_path = settings.faq_data_path
        self._data = None
    
    def _load_data(self) -> FAQData:
        """Load FAQ data from JSON file"""
        if self._data is None:
            try:
                # Get the absolute path to the data file
                import os
                current_dir = os.path.dirname(os.path.abspath(__file__))
                data_file_path = os.path.join(current_dir, self.data_path)
                
                with open(data_file_path, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                    self._data = FAQData(**raw_data)
            except Exception as e:
                logger.error(f"Failed to load FAQ data from {self.data_path}: {e}")
                raise Exception(f"Failed to load FAQ data: {e}")
        return self._data
    
    def get_all_faq(self) -> FAQData:
        """Get all FAQ data"""
        return self._load_data()
    
    def get_faq_by_category(self, category: str) -> List[FAQItem]:
        """Get FAQ items by category"""
        data = self._load_data()
        return [item for item in data.faq if item.category == category]
    
    def search_faq(self, query: str) -> List[FAQItem]:
        """Search FAQ by keywords or question text"""
        try:
            data = self._load_data()
            query_lower = query.lower().strip()
            
            # Разбиваем запрос на слова (включая короткие)
            query_words = query_lower.split()
            

            
            results = []
            for item in data.faq:
                score = 0
                
                # Поиск в вопросе (высший приоритет)
                question_lower = item.question.lower()
                if query_lower in question_lower:
                    score += 1000  # Точное совпадение
                
                # Поиск отдельных слов в вопросе
                for word in query_words:
                    if word in question_lower:
                        score += 100
                
                # Поиск в ключевых словах (средний приоритет)
                if item.keywords and isinstance(item.keywords, list):
                    for keyword in item.keywords:
                        keyword_lower = keyword.lower()
                        if query_lower in keyword_lower:
                            score += 500  # Точное совпадение с ключевым словом
                        
                        # Поиск отдельных слов в ключевых словах
                        for word in query_words:
                            if word in keyword_lower:
                                score += 50
                
                # Поиск в ответе (низший приоритет)
                answer_lower = item.answer.lower()
                if query_lower in answer_lower:
                    score += 10
                
                # Поиск отдельных слов в ответе
                for word in query_words:
                    if word in answer_lower:
                        score += 1
                
                # Бонус за приоритет вопроса
                if item.priority:
                    score += (21 - item.priority) * 5  # Более высокий приоритет = больше баллов
                
                if score > 0:
                    results.append((item, score))
            
            # Сортируем по релевантности
            results.sort(key=lambda x: x[1], reverse=True)
            
            # Возвращаем только FAQ элементы (без score)
            return [item for item, score in results]
        except Exception as e:
            logger.error(f"Error in search_faq: {e}")
            # Return empty list instead of raising exception
            return []
    
    def get_faq_by_id(self, faq_id: int) -> Optional[FAQItem]:
        """Get FAQ item by ID"""
        data = self._load_data()
        for item in data.faq:
            if item.id == faq_id:
                return item
        return None
    
    def get_categories(self) -> FAQCategories:
        """Get FAQ categories"""
        data = self._load_data()
        return data.categories
    
    def get_popular_questions(self, limit: int = 5) -> List[FAQItem]:
        """Get popular questions by priority"""
        data = self._load_data()
        sorted_items = sorted(data.faq, key=lambda x: x.priority or 999, reverse=True)
        return sorted_items[:limit]
    
    def get_recent_questions(self, limit: int = 5) -> List[FAQItem]:
        """Get recent questions by creation date"""
        data = self._load_data()
        sorted_items = sorted(data.faq, key=lambda x: x.created_at or "", reverse=True)
        return sorted_items[:limit]
    
    def get_questions_by_keyword(self, keyword: str) -> List[FAQItem]:
        """Get questions containing specific keyword"""
        data = self._load_data()
        keyword_lower = keyword.lower()
        return [item for item in data.faq if any(keyword_lower in k.lower() for k in item.keywords)]
    
    def get_faq_stats(self) -> Dict:
        """Get FAQ statistics"""
        data = self._load_data()
        
        # Count by category
        questions_by_category = {}
        for item in data.faq:
            category = item.category
            questions_by_category[category] = questions_by_category.get(category, 0) + 1
        
        # Get all keywords
        all_keywords = []
        for item in data.faq:
            all_keywords.extend(item.keywords)
        
        # Count keyword frequency
        keyword_count = {}
        for keyword in all_keywords:
            keyword_count[keyword] = keyword_count.get(keyword, 0) + 1
        
        # Get top keywords
        popular_keywords = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:10]
        popular_keywords = [kw[0] for kw in popular_keywords]
        
        return {
            "total_questions": len(data.faq),
            "questions_by_category": questions_by_category,
            "categories_count": len(data.categories.dict()),
            "popular_keywords": popular_keywords,
            "recent_additions": self.get_recent_questions(5),
            "popular_questions": self.get_popular_questions(5)
        }
    
    def add_faq_item(self, faq_item: FAQCreate) -> FAQItem:
        """Add new FAQ item (admin function)"""
        data = self._load_data()
        
        # Generate new ID
        new_id = max([item.id for item in data.faq]) + 1 if data.faq else 1
        
        # Create new item
        new_item = FAQItem(
            id=new_id,
            question=faq_item.question,
            answer=faq_item.answer,
            keywords=faq_item.keywords,
            category=faq_item.category,
            priority=faq_item.priority or len(data.faq) + 1,
            created_at=datetime.now().strftime("%Y-%m-%d"),
            updated_at=datetime.now().strftime("%Y-%m-%d")
        )
        
        # Add to data
        data.faq.append(new_item)
        
        # Save to file
        self._save_data(data)
        
        return new_item
    
    def update_faq_item(self, faq_id: int, update_data: FAQUpdate) -> Optional[FAQItem]:
        """Update FAQ item (admin function)"""
        data = self._load_data()
        
        for item in data.faq:
            if item.id == faq_id:
                # Update fields
                if update_data.question is not None:
                    item.question = update_data.question
                if update_data.answer is not None:
                    item.answer = update_data.answer
                if update_data.keywords is not None:
                    item.keywords = update_data.keywords
                if update_data.category is not None:
                    item.category = update_data.category
                if update_data.priority is not None:
                    item.priority = update_data.priority
                
                item.updated_at = datetime.now().strftime("%Y-%m-%d")
                
                # Save to file
                self._save_data(data)
                
                return item
        
        return None
    
    def delete_faq_item(self, faq_id: int) -> bool:
        """Delete FAQ item (admin function)"""
        data = self._load_data()
        
        for i, item in enumerate(data.faq):
            if item.id == faq_id:
                del data.faq[i]
                self._save_data(data)
                return True
        
        return False
    
    def _save_data(self, data: FAQData):
        """Save FAQ data to JSON file"""
        try:
            # Update metadata
            data.metadata = FAQMetadata(
                version="1.0",
                last_updated=datetime.now().strftime("%Y-%m-%d"),
                total_questions=len(data.faq),
                categories_count=len(data.categories.dict())
            )
            
            # Get the absolute path to the data file
            import os
            current_dir = os.path.dirname(os.path.abspath(__file__))
            data_file_path = os.path.join(current_dir, self.data_path)
            
            with open(data_file_path, 'w', encoding='utf-8') as f:
                json.dump(data.dict(), f, ensure_ascii=False, indent=2)
            
            # Reset cache
            self._data = None
        except Exception as e:
            raise Exception(f"Failed to save FAQ data: {e}")

class TariffsService:
    def __init__(self):
        self.data_path = settings.tariffs_data_path
        self._data = None
    
    def _load_data(self) -> TariffsData:
        """Load tariffs data from JSON file"""
        if self._data is None:
            try:
                # Get the absolute path to the data file
                import os
                current_dir = os.path.dirname(os.path.abspath(__file__))
                data_file_path = os.path.join(current_dir, self.data_path)
                
                with open(data_file_path, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                    self._data = TariffsData(**raw_data)
            except Exception as e:
                logger.error(f"Failed to load tariffs data from {self.data_path}: {e}")
                raise Exception(f"Failed to load tariffs data: {e}")
        return self._data
    
    def get_all_tariffs(self) -> TariffsData:
        """Get all tariffs data"""
        return self._load_data()
    
    def get_tariff_by_id(self, tariff_id: str) -> Optional[Tariff]:
        """Get tariff by ID"""
        data = self._load_data()
        for tariff in data.tariffs:
            if tariff.id == tariff_id:
                return tariff
        return None
    
    def get_popular_tariffs(self) -> List[Tariff]:
        """Get popular tariffs"""
        data = self._load_data()
        return [tariff for tariff in data.tariffs if tariff.popular]
    
    def get_recommended_tariffs(self) -> List[Tariff]:
        """Get recommended tariffs"""
        data = self._load_data()
        return [tariff for tariff in data.tariffs if tariff.recommended]
    
    def get_discounts(self) -> TariffDiscounts:
        """Get discount information"""
        data = self._load_data()
        return data.discounts
    
    def get_trial_period(self) -> int:
        """Get trial period days"""
        data = self._load_data()
        return data.trial_period
    
    def calculate_price_with_discount(self, tariff_id: str, period: str) -> Optional[dict]:
        """Calculate price with discount for different periods"""
        tariff = self.get_tariff_by_id(tariff_id)
        if not tariff:
            return None
        
        discounts = self.get_discounts()
        base_price = tariff.price
        
        if period == "monthly":
            return {
                "period": "месяц",
                "price": base_price,
                "discount": 0,
                "final_price": base_price
            }
        elif period == "quarterly":
            discount_percent = discounts.quarterly
            discount_amount = base_price * discount_percent / 100
            final_price = base_price - discount_amount
            return {
                "period": "квартал",
                "price": base_price * 3,
                "discount": discount_percent,
                "final_price": final_price * 3
            }
        elif period == "yearly":
            discount_percent = discounts.yearly
            discount_amount = base_price * discount_percent / 100
            final_price = base_price - discount_amount
            return {
                "period": "год",
                "price": base_price * 12,
                "discount": discount_percent,
                "final_price": final_price * 12
            }
        
        return None 

class ApplicationService:
    """Сервис для обработки заявок"""
    
    def __init__(self):
        self.admin_email = "admin@example.com"  # В продакшене брать из конфига
        self.telegram_bot_token = "YOUR_BOT_TOKEN"  # В продакшене брать из конфига
        self.telegram_chat_id = "YOUR_CHAT_ID"  # В продакшене брать из конфига
    
    async def submit_application(self, application_data: dict) -> dict:
        """Отправка заявки на email и в Telegram"""
        try:
            # Генерируем ID заявки
            application_id = f"APP-{int(time.time())}"
            
            # Формируем сообщение
            message = self._format_application_message(application_data, application_id)
            
            # Отправляем на email (в продакшене использовать реальный email сервис)
            await self._send_email_notification(message)
            
            # Отправляем в Telegram (в продакшене использовать реальный Telegram API)
            await self._send_telegram_notification(message)
            
            return {
                "success": True,
                "message": "Заявка успешно отправлена",
                "application_id": application_id
            }
            
        except Exception as e:
            logger.error(f"Ошибка при отправке заявки: {e}")
            return {
                "success": False,
                "message": "Ошибка при отправке заявки"
            }
    
    def _format_application_message(self, data: dict, app_id: str) -> str:
        """Форматирование сообщения заявки"""
        return f"""
🔔 Новая заявка #{app_id}

👤 Имя: {data.get('name', 'Не указано')}
📧 Email: {data.get('email', 'Не указано')}
📱 Телефон: {data.get('phone', 'Не указано')}
📋 Выбранный тариф: {data.get('selectedTariff', 'Не указано')}
💬 Дополнительное сообщение: {data.get('message', 'Не указано')}

⏰ Время подачи: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """.strip()
    
    async def _send_email_notification(self, message: str):
        """Отправка уведомления на email (заглушка)"""
        # В продакшене здесь будет реальная отправка email
        logger.info(f"Email notification: {message}")
        pass
    
    async def _send_telegram_notification(self, message: str):
        """Отправка уведомления в Telegram (заглушка)"""
        # В продакшене здесь будет реальная отправка в Telegram
        logger.info(f"Telegram notification: {message}")
        pass

# Создаем экземпляр сервиса
application_service = ApplicationService() 