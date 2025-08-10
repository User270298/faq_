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
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import requests
import gspread
from google.oauth2.service_account import Credentials

logger = logging.getLogger(__name__)

def _mask_secret(value: str, keep: int = 4) -> str:
    try:
        if not value:
            return "<empty>"
        if len(value) <= keep:
            return "*" * len(value)
        masked = "*" * (len(value) - keep) + value[-keep:]
        return masked
    except Exception:
        return "<hidden>"

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

    def ai_search(self, query: str) -> dict:
        """AI-like search without external libs: simple weighted scoring and suggestions"""
        data = self._load_data()
        q = query.strip()
        if not q:
            return {"success": False, "query": query, "results_count": 0, "matches": [], "suggestions": [], "message": "Empty query"}

        def normalize(text: str) -> str:
            return text.lower().replace('ё', 'е')

        def tokenize(text: str) -> List[str]:
            import re
            t = normalize(text)
            return [tok for tok in re.split(r"[^a-zа-я0-9]+", t) if tok]

        qnorm = normalize(q)
        qtokens = set(tokenize(q))

        scored: List[tuple[FAQItem, float, str]] = []
        for item in data.faq:
            question = normalize(item.question)
            answer = normalize(item.answer)
            keywords = [normalize(k) for k in (item.keywords or [])]

            # Простые баллы: точные вхождения и пересечения токенов
            question_score = 0.0
            if qnorm and qnorm in question:
                question_score += 80.0
            qtokens_item = set(tokenize(item.question))
            if qtokens_item:
                overlap_q = len(qtokens & qtokens_item) / len(qtokens_item)
                question_score += overlap_q * 40.0

            keyword_score = 0.0
            if keywords:
                kw_overlap = 0
                for kw in keywords:
                    if kw in qnorm:
                        keyword_score += 30.0
                    kw_tokens = set(tokenize(kw))
                    if kw_tokens & qtokens:
                        kw_overlap += 1
                if len(keywords) > 0:
                    keyword_score += (kw_overlap / len(keywords)) * 40.0

            answer_score = 0.0
            if qnorm in answer:
                answer_score += 10.0

            score = question_score * 0.6 + keyword_score * 0.3 + answer_score * 0.1
            if score > 1:
                # Определяем тип совпадения по наибольшему компоненту
                mtype = "question"
                if keyword_score >= question_score and keyword_score >= answer_score:
                    mtype = "keywords"
                elif answer_score >= question_score and answer_score >= keyword_score:
                    mtype = "answer"
                scored.append((item, score, mtype))

        scored.sort(key=lambda x: x[1], reverse=True)

        matches = [
            {
                "id": item.id,
                "question": item.question,
                "answer": item.answer,
                "keywords": item.keywords,
                "category": item.category,
                "relevance_score": int(round(min(score, 100))),
                "match_type": mtype,
            }
            for item, score, mtype in scored[:10]
        ]

        if len(scored) > 1:
            suggestions = [it.question for it, _, _ in scored[1:6]]
        else:
            suggestions = [it.question for it in self.get_popular_questions(5)]

        return {
            "success": True,
            "query": query,
            "results_count": len(matches),
            "matches": matches,
            "suggestions": suggestions,
        }
    
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
        self.admin_email = settings.admin_email
        self.telegram_bot_token = settings.telegram_bot_token
        self.telegram_chat_id = settings.telegram_chat_id
    
    async def submit_application(self, application_data: dict) -> dict:
        """Отправка заявки на email и в Telegram"""
        try:
            # Генерируем ID заявки
            application_id = f"APP-{int(time.time())}"
            
            # Формируем сообщение
            message = self._format_application_message(application_data, application_id)
            logger.info(
                "[APP] Start submit | id=%s | email_to=%s | tg_chat=%s | gs_enabled=%s",
                application_id,
                self.admin_email,
                self.telegram_chat_id,
                getattr(settings, "google_sheets_enabled", False),
            )
            
            # Отправляем на email (в продакшене использовать реальный email сервис)
            logger.info(
                "[EMAIL] Prepare | host=%s | port=%s | tls=%s | from=%s | to=%s",
                getattr(settings, "smtp_host", ""),
                getattr(settings, "smtp_port", ""),
                getattr(settings, "smtp_use_tls", ""),
                getattr(settings, "smtp_from", '') or getattr(settings, "smtp_user", ''),
                self.admin_email,
            )
            await self._send_email_notification(message)
            
            # Отправляем в Telegram (в продакшене использовать реальный Telegram API)
            logger.info(
                "[TG] Prepare | chat_id=%s | token=%s | text_len=%d",
                self.telegram_chat_id,
                _mask_secret(self.telegram_bot_token),
                len(message),
            )
            await self._send_telegram_notification(message)
            
            # Пишем в Google Sheets (если включено)
            try:
                if settings.google_sheets_enabled:
                    logger.info(
                        "[GS] Append begin | spreadsheet_id=%s | worksheet=%s",
                        getattr(settings, "google_spreadsheet_id", ""),
                        getattr(settings, "google_worksheet_name", ""),
                    )
                    self._append_to_google_sheets(application_data, application_id)
                    logger.info("[GS] Append done | id=%s", application_id)
            except Exception as gs_err:
                logger.error(f"Google Sheets append failed: {gs_err}")
            
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

    def _get_gs_client(self) -> gspread.Client:
        logger.info("[GS] Build client | json_path=%s | json_inline=%s",
                    bool(getattr(settings, 'google_service_account_json_path', '')),
                    bool(getattr(settings, 'google_service_account_json', '')))
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        if settings.google_service_account_json:
            import json as _json
            info = _json.loads(settings.google_service_account_json)
            creds = Credentials.from_service_account_info(info, scopes=scopes)
        elif settings.google_service_account_json_path:
            creds = Credentials.from_service_account_file(settings.google_service_account_json_path, scopes=scopes)
        else:
            raise RuntimeError('Google service account credentials not configured')
        return gspread.authorize(creds)

    def _append_to_google_sheets(self, data: dict, app_id: str) -> None:
        if not settings.google_spreadsheet_id:
            raise RuntimeError('google_spreadsheet_id is empty')
        client = self._get_gs_client()
        sh = client.open_by_key(settings.google_spreadsheet_id)
        try:
            ws = sh.worksheet(settings.google_worksheet_name)
        except gspread.WorksheetNotFound:
            logger.info("[GS] Worksheet missing, creating | title=%s", settings.google_worksheet_name)
            ws = sh.add_worksheet(title=settings.google_worksheet_name, rows=1000, cols=20)
            # Заголовки
            ws.append_row(['ID', 'Имя', 'Email', 'Телефон', 'Тариф', 'Сообщение', 'IP', 'User-Agent', 'Время'])
        row = [
            app_id,
            data.get('name', ''),
            data.get('email', ''),
            data.get('phone', ''),
            data.get('selectedTariff', ''),
            data.get('message', ''),
            data.get('client_ip', ''),
            data.get('user_agent', ''),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ]
        logger.info("[GS] Append row | cols=%d | id=%s", len(row), app_id)
        ws.append_row(row)
    
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
        """Отправка уведомления на email через SMTP"""
        try:
            if not self.admin_email or not settings.smtp_host or not (settings.smtp_user or settings.smtp_from):
                logger.warning("[EMAIL] Skipped: missing settings admin_email/smtp_host/smtp_user|smtp_from")
                return

            subject = "Новая заявка"
            from_addr = settings.smtp_from or settings.smtp_user
            to_addr = self.admin_email

            mime_msg = MIMEText(message, _charset='utf-8')
            mime_msg['Subject'] = Header(subject, 'utf-8')
            mime_msg['From'] = from_addr
            mime_msg['To'] = to_addr

            # TLS (587) или SSL (465)
            if settings.smtp_use_tls and settings.smtp_port == 587:
                logger.info("[EMAIL] Using STARTTLS | host=%s:%s", settings.smtp_host, settings.smtp_port)
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
                server.ehlo()
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            else:
                logger.info("[EMAIL] Using SSL | host=%s:%s", settings.smtp_host, settings.smtp_port)
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
                server.login(settings.smtp_user, settings.smtp_password)

            server.sendmail(from_addr, [to_addr], mime_msg.as_string())
            server.quit()
            logger.info("[EMAIL] Sent | from=%s | to=%s", from_addr, to_addr)
        except Exception as e:
            logger.error(f"[EMAIL] Failed: {e}")
    
    async def _send_telegram_notification(self, message: str):
        """Отправка уведомления в Telegram через Bot API"""
        try:
            if not self.telegram_bot_token or not self.telegram_chat_id:
                logger.warning("[TG] Skipped: missing bot_token or chat_id")
                return
            url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            payload = {
                'chat_id': self.telegram_chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            logger.info("[TG] POST %s | chat_id=%s | text_len=%d", url, self.telegram_chat_id, len(message))
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code != 200:
                logger.error("[TG] Failed | status=%s | body=%s", resp.status_code, resp.text[:200].replace('\n',' '))
            else:
                logger.info("[TG] Sent | status=%s", resp.status_code)
        except Exception as e:
            logger.error(f"[TG] Exception: {e}")

# Создаем экземпляр сервиса
application_service = ApplicationService() 