# FAQ System

Полнофункциональная система FAQ с интерактивным чат-ботом, формой заявок и управлением контентом.

## 🚀 Возможности

### Frontend (React + Next.js)
- **Интерактивный FAQ чат** - пользователи могут задавать вопросы и получать ответы
- **Умный поиск** - система находит релевантные ответы из базы знаний
- **Форма заявок** - выбор тарифа и сбор контактной информации
- **Автоматическое открытие/скрытие** - виджет автоматически появляется и скрывается
- **Адаптивный дизайн** - работает на всех устройствах
- **Markdown поддержка** - красивое форматирование ответов

### Backend (FastAPI)
- **RESTful API** - полный набор эндпоинтов для FAQ и тарифов
- **Умный поиск** - поиск по ключевым словам и контексту
- **Управление контентом** - CRUD операции для FAQ через API и CLI
- **Статистика** - аналитика популярных вопросов и тем
- **Markdown поддержка** - форматирование ответов
- **Отправка заявок** - интеграция с email и Telegram

## 🛠 Технологии

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - утилитарный CSS фреймворк
- **Axios** - HTTP клиент для API запросов
- **Lucide React** - иконки
- **React Markdown** - рендеринг Markdown

### Backend
- **FastAPI** - современный Python веб-фреймворк
- **Pydantic** - валидация данных и сериализация
- **Uvicorn** - ASGI сервер
- **Python 3.8+** - язык программирования

## 📁 Структура проекта

```
FAQ/
├── backend/                 # FastAPI бэкенд
│   ├── main.py             # Точка входа приложения
│   ├── config.py           # Конфигурация
│   ├── models.py           # Pydantic модели
│   ├── services.py         # Бизнес-логика
│   ├── routers.py          # API роутеры
│   ├── requirements.txt    # Python зависимости
│   ├── run.py              # Скрипт запуска
│   ├── faq_manager.py      # CLI для управления FAQ
│   ├── test_api.py         # Тесты API
│   └── data/               # JSON данные
│       ├── faq.json        # FAQ контент
│       └── tariffs.json    # Тарифы
├── frontend/               # Next.js фронтенд
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React компоненты
│   │   └── lib/           # Утилиты и API
│   ├── package.json       # Node.js зависимости
│   └── next.config.ts     # Конфигурация Next.js
├── start.bat              # Скрипт запуска (Windows)
└── README.md              # Документация
```

## 🚀 Быстрый старт

### Предварительные требования

- **Python 3.8+** с pip
- **Node.js 18+** с npm
- **Git**

### Установка и запуск

#### Вариант 1: Автоматический запуск (Windows)

```bash
# Клонирование репозитория
git clone <repository-url>
cd FAQ

# Запуск всего проекта
start.bat
```

#### Вариант 2: Ручной запуск

```bash
# 1. Запуск бэкенда
cd backend
pip install -r requirements.txt
python run.py

# 2. В новом терминале - запуск фронтенда
cd frontend
npm install
npm run dev
```

### Доступные URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📖 Документация

### Backend API

#### FAQ Endpoints

```bash
# Получить все FAQ
GET /api/faq/

# Поиск по FAQ
GET /api/faq/search?q=вопрос

# FAQ по категории
GET /api/faq/category/pricing

# Популярные вопросы
GET /api/faq/popular?limit=5

# Статистика FAQ
GET /api/faq/stats

# Админ: добавить FAQ
POST /api/faq/admin/add

# Админ: обновить FAQ
PUT /api/faq/admin/{id}

# Админ: удалить FAQ
DELETE /api/faq/admin/{id}
```

#### Tariffs Endpoints

```bash
# Получить все тарифы
GET /api/tariffs/

# Получить тариф по ID
GET /api/tariffs/{id}

# Расчет цены
GET /api/tariffs/calculate?tariff_id=1&period=monthly&quantity=1
```

#### Applications Endpoints

```bash
# Отправить заявку
POST /api/applications/submit
{
  "name": "Имя",
  "email": "email@example.com",
  "phone": "+7 (999) 123-45-67",
  "selectedTariff": "tariff_id"
}
```

### Управление FAQ

#### Через CLI

```bash
cd backend

# Показать все вопросы
python faq_manager.py list

# Добавить новый вопрос
python faq_manager.py add

# Редактировать вопрос
python faq_manager.py edit 1

# Удалить вопрос
python faq_manager.py delete 1

# Показать статистику
python faq_manager.py stats
```

#### Через API

```bash
# Добавить FAQ
curl -X POST "http://localhost:8000/api/faq/admin/add" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Новый вопрос?",
    "answer": "Ответ на вопрос",
    "keywords": ["ключевое", "слово"],
    "category": "pricing",
    "priority": 1
  }'
```

### Frontend Components

#### FAQWidget

Основной компонент виджета с кнопкой в правом нижнем углу.

```tsx
<FAQWidget 
  autoOpenDelay={3000} 
  autoHideDelay={60000} 
/>
```

#### FAQChat

Компонент чата для взаимодействия с FAQ.

```tsx
<FAQChat 
  onShowApplication={handleShowApplication}
  onActivity={handleActivity}
/>
```

#### ApplicationForm

Форма для сбора заявок с выбором тарифа.

```tsx
<ApplicationForm 
  onBack={handleBack}
  onActivity={handleActivity}
/>
```

## 🔧 Конфигурация

### Backend

Создайте файл `.env` в папке `backend/`:

```env
# Настройки приложения
APP_NAME=FAQ & Tariffs API
DEBUG=true
API_PREFIX=/api

# CORS настройки
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Пути к данным
FAQ_DATA_PATH=data/faq.json
TARIFFS_DATA_PATH=data/tariffs.json

# Email настройки (для продакшена)
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Telegram настройки (для продакшена)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Frontend

Создайте файл `.env.local` в папке `frontend/`:

```env
# URL бэкенда
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Тестирование

### Backend

```bash
cd backend

# Запуск тестов API
python test_api.py

# Тестирование CLI
python faq_manager.py stats
```

### Frontend

```bash
cd frontend

# Запуск линтера
npm run lint

# Проверка типов
npm run type-check
```

## 📦 Развертывание

### Backend (Production)

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск с Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Production)

```bash
# Сборка
npm run build

# Запуск
npm start
```

### Docker (опционально)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Безопасность

- **CORS** - настроен для безопасных доменов
- **Валидация данных** - Pydantic модели на бэкенде
- **XSS защита** - React Markdown с санитизацией
- **Rate limiting** - можно добавить для API
- **Аутентификация** - можно добавить для админ функций

## 📈 Производительность

### Backend
- **Асинхронность** - FastAPI с async/await
- **Кэширование** - можно добавить Redis
- **Оптимизация запросов** - индексы для поиска

### Frontend
- **SSR/SSG** - Next.js оптимизации
- **Code splitting** - автоматическое разделение кода
- **Image optimization** - оптимизация изображений
- **Bundle analysis** - анализ размера бандла

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Внесите изменения и закоммитьте (`git commit -m 'Add amazing feature'`)
4. Запушьте в ветку (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

### Частые проблемы

1. **CORS ошибки** - проверьте настройки CORS в `backend/config.py`
2. **API недоступен** - убедитесь, что бэкенд запущен на порту 8000
3. **Ошибки поиска** - проверьте формат данных в `data/faq.json`

### Получение помощи

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Создайте новый Issue с описанием проблемы
3. Приложите логи и скриншоты

## 🎯 Roadmap

### Планируемые функции

- [ ] **Аутентификация** - JWT токены для админ панели
- [ ] **Аналитика** - детальная статистика использования
- [ ] **Многоязычность** - поддержка разных языков
- [ ] **Уведомления** - push уведомления в браузере
- [ ] **Кэширование** - Redis для улучшения производительности
- [ ] **Тесты** - unit и integration тесты
- [ ] **CI/CD** - автоматическое развертывание
- [ ] **Мониторинг** - логирование и метрики

---

**FAQ System** - современное решение для интерактивной поддержки клиентов! 🚀 