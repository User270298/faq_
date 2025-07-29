# FAQ System

Простая система FAQ с чат-ботом для сайта. Пользователи задают вопросы, получают ответы из базы знаний, могут оставить заявку.

## Что умеет

- 🤖 **Чат-бот** - отвечает на вопросы пользователей
- 🔍 **Умный поиск** - находит ответы по ключевым словам  
- 📝 **Форма заявок** - сбор контактов и выбор тарифа
- 📱 **Адаптивный дизайн** - работает на всех устройствах
- ⚡ **Быстрый старт** - запуск одной командой

## Технологии

**Frontend:** Next.js + TypeScript + Tailwind CSS  
**Backend:** FastAPI + Python

## Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone <your-repo>
cd FAQ
```

### 2. Запустите проект
```bash
# Windows
start.bat

# Или вручную:
# Backend
cd backend
pip install -r requirements.txt
python run.py

# Frontend (в новом терминале)
cd frontend  
npm install
npm run dev
```

### 3. Откройте в браузере
- **Сайт:** http://localhost:3000
- **API:** http://localhost:8000/docs

## Структура проекта

```
FAQ/
├── backend/          # FastAPI сервер
│   ├── data/        # JSON с вопросами и тарифами
│   └── main.py      # Точка входа
├── frontend/        # Next.js приложение
│   └── src/         # React компоненты
└── start.bat        # Скрипт запуска
```

## Как добавить вопрос

### Через CLI
```bash
cd backend
python faq_manager.py add
```

### Через API
```bash
curl -X POST "http://localhost:8000/api/faq/admin/add" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Как установить систему?",
    "answer": "Установка происходит в несколько этапов...",
    "keywords": ["установка", "настройка"],
    "category": "technical"
  }'
```

## Настройка

Создайте `.env` файлы:

**Backend (.env):**
```env
APP_NAME=FAQ System
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Основные команды

```bash
# Запуск всего проекта
start.bat

# Управление FAQ
cd backend
python faq_manager.py list    # показать все вопросы
python faq_manager.py add     # добавить вопрос
python faq_manager.py edit 1  # редактировать вопрос

# Тестирование API
python test_api.py
```


---

**FAQ System** - простое решение для поддержки клиентов! 🚀 