# FAQ & Tariffs Backend API

Декомпозированный FastAPI backend для системы FAQ и тарифов с расширенными возможностями управления контентом.

## 🏗️ Структура проекта

```
backend/
├── main.py          # Главное FastAPI приложение
├── config.py        # Конфигурация и настройки
├── models.py        # Pydantic модели данных
├── services.py      # Бизнес-логика (FAQService, TariffsService)
├── routers.py       # API роутеры
├── run.py           # Скрипт запуска сервера
├── faq_manager.py   # CLI для управления FAQ
├── requirements.txt # Зависимости Python
├── data/            # JSON файлы с данными
│   ├── faq.json     # FAQ данные
│   └── tariffs.json # Тарифы данные
└── README.md        # Документация
```

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 2. Запуск сервера
```bash
python run.py
```

Сервер будет доступен по адресу: **http://localhost:8000**

## 📚 API Endpoints

### FAQ Endpoints
- `GET /api/faq/` - Получить все FAQ
- `GET /api/faq/categories` - Получить категории FAQ
- `GET /api/faq/category/{category}` - FAQ по категории
- `GET /api/faq/search?q={query}` - Поиск по FAQ
- `GET /api/faq/{faq_id}` - FAQ по ID
- `GET /api/faq/popular?limit={limit}` - Популярные вопросы
- `GET /api/faq/recent?limit={limit}` - Недавние вопросы
- `GET /api/faq/keyword/{keyword}` - Вопросы по ключевому слову
- `GET /api/faq/stats` - Статистика FAQ

### Admin FAQ Endpoints (управление контентом)
- `POST /api/faq/admin/add` - Добавить новый вопрос
- `PUT /api/faq/admin/{faq_id}` - Обновить вопрос
- `DELETE /api/faq/admin/{faq_id}` - Удалить вопрос

### Tariffs Endpoints
- `GET /api/tariffs/` - Получить все тарифы
- `GET /api/tariffs/tariff/{tariff_id}` - Тариф по ID
- `GET /api/tariffs/popular` - Популярные тарифы
- `GET /api/tariffs/recommended` - Рекомендуемые тарифы
- `GET /api/tariffs/discounts` - Информация о скидках
- `GET /api/tariffs/trial-period` - Пробный период
- `GET /api/tariffs/calculate-price/{tariff_id}?period={period}` - Расчет цены со скидкой

### Общие Endpoints
- `GET /` - Информация о сервисе
- `GET /health` - Проверка здоровья сервиса
- `GET /docs` - Swagger документация
- `GET /redoc` - ReDoc документация

## 🔧 Управление FAQ

### Через CLI (рекомендуется)
```bash
# Показать все вопросы
python faq_manager.py list

# Показать вопросы по категории
python faq_manager.py list pricing

# Добавить новый вопрос
python faq_manager.py add

# Редактировать вопрос
python faq_manager.py edit 1

# Удалить вопрос
python faq_manager.py delete 1

# Показать статистику
python faq_manager.py stats

# Справка
python faq_manager.py help
```

### Через API
```bash
# Добавить вопрос
curl -X POST "http://localhost:8000/api/faq/admin/add" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Новый вопрос?",
    "answer": "Ответ на вопрос",
    "keywords": ["ключевое", "слово"],
    "category": "pricing",
    "priority": 1
  }'

# Обновить вопрос
curl -X PUT "http://localhost:8000/api/faq/admin/1" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Обновленный вопрос?"
  }'

# Удалить вопрос
curl -X DELETE "http://localhost:8000/api/faq/admin/1"
```

### Через JSON файл
Можно напрямую редактировать файл `data/faq.json`:

```json
{
  "faq": [
    {
      "id": 16,
      "question": "Новый вопрос?",
      "answer": "Ответ с **форматированием** и эмодзи ✅",
      "keywords": ["новый", "вопрос"],
      "category": "pricing",
      "priority": 16,
      "created_at": "2024-01-01",
      "updated_at": "2024-01-01"
    }
  ],
  "categories": {
    "pricing": "Цены и тарифы",
    "technical": "Технические вопросы",
    "support": "Поддержка",
    "security": "Безопасность"
  }
}
```

## 🎨 Форматирование ответов

Ответы поддерживают Markdown форматирование:

- **Жирный текст** - `**текст**`
- *Курсив* - `*текст*`
- Списки - `•` или `-`
- Эмодзи - ✅ ❌ 🔧 📞 💰
- Заголовки - `# Заголовок`
- Ссылки - `[текст](url)`

## 📊 Статистика и аналитика

API предоставляет статистику FAQ:

```json
{
  "total_questions": 15,
  "questions_by_category": {
    "pricing": 6,
    "technical": 5,
    "support": 3,
    "security": 1
  },
  "categories_count": 4,
  "popular_keywords": ["тариф", "цена", "поддержка"],
  "recent_additions": [...],
  "popular_questions": [...]
}
```

## 🛠️ Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **Pydantic** - валидация данных и сериализация
- **Uvicorn** - ASGI сервер
- **Python 3.8+**

## 📁 Структура данных

### FAQ (data/faq.json)
```json
{
  "faq": [
    {
      "id": 1,
      "question": "Вопрос?",
      "answer": "Ответ с **форматированием** ✅",
      "keywords": ["ключевые", "слова"],
      "category": "pricing",
      "priority": 1,
      "created_at": "2024-01-01",
      "updated_at": "2024-01-01"
    }
  ],
  "categories": {
    "pricing": "Цены и тарифы",
    "technical": "Технические вопросы",
    "support": "Поддержка",
    "security": "Безопасность"
  },
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-01-01",
    "total_questions": 15,
    "categories_count": 4
  }
}
```

### Tariffs (data/tariffs.json)
```json
{
  "tariffs": [
    {
      "id": "mini",
      "name": "Мини",
      "price": 5000,
      "currency": "₽",
      "period": "месяц",
      "description": "Описание тарифа",
      "features": ["Функция 1", "Функция 2"],
      "popular": false,
      "recommended": false
    }
  ],
  "discounts": {
    "quarterly": 5,
    "yearly": 20
  },
  "trial_period": 14
}
```

## 🔧 Разработка

### Архитектура
- **Модульная структура** - разделение на логические компоненты
- **Сервисы** - бизнес-логика в отдельных классах
- **Роутеры** - API endpoints
- **Модели** - Pydantic для валидации данных

### Добавление новых endpoints
1. Добавить метод в соответствующий сервис (`services.py`)
2. Создать endpoint в роутере (`routers.py`)
3. При необходимости добавить модель в `models.py`

### Конфигурация
Настройки в `config.py`:
- CORS origins
- Пути к файлам данных
- Режим отладки
- Префикс API

## 🚀 Деплой

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (опционально)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Лицензия

MIT License 