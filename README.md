## Проект FAQ — Backend (FastAPI) + Frontend (Next.js)

### О проекте
Небольшой проект с бэкендом на FastAPI и фронтендом на Next.js. Есть чат‑помощник по FAQ, поиск по вопросам/ключевым словам, страницы тарифов и отправка заявок на почту/в Telegram/Google Sheets.


### Что потребуется
- Python 3.10+ (желательно 3.11)
- Node.js 18+ (рекомендуется LTS)
- Git (по желанию)

### Структура
```
backend/            # FastAPI backend (API, бизнес-логика, данные)
  config.py         # Настройки (можно переопределять через .env)
  data/             # JSON-данные FAQ и тарифов
  main.py           # Точка входа FastAPI
  models.py         # Pydantic модели
  routers.py        # Маршруты API
  services.py       # Сервисы (поиск, заявки и т.д.)
  requirements.txt  # Зависимости Python

frontend/           # Next.js frontend (чат, страницы, UI)
  config/api.ts     # Базовый URL бэкенда и пути API
  src/              # Код приложения
  package.json      # Скрипты и зависимости
```


### Быстрый старт локально (Windows)

1) Запуск бэкенда (FastAPI)
- Откройте PowerShell в папке проекта `FAQ`
- Перейдите в `backend` и создайте виртуальное окружение:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```
- Запустите сервер (вариант 1 — через main.py):
```powershell
python main.py
```
- или (вариант 2 — через uvicorn):
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Проверьте: `http://localhost:8000/` должно вернуть JSON c информацией о сервисе.
- Документация API: `http://localhost:8000/docs` (Swagger) или `http://localhost:8000/redoc`.

2) Запуск фронтенда (Next.js)
- В новом окне PowerShell откройте папку `frontend`:
```powershell
cd frontend
npm install
```
- Включите локальный режим API для разработки. В файле `frontend/config/api.ts` смените конфиг на development (см. раздел «Настройка» ниже).
- Запустите дев-сервер:
```powershell
npm run dev
```
- Откройте `http://localhost:3000`


### Настройка

1) Бэкенд: переменные окружения (.env)
- Файл `backend/config.py` использует `pydantic-settings` и читает `.env` (см. `class Settings`).
- Рекомендуется НЕ хранить секреты в `config.py`. Создайте файл `backend/.env`:
```env
APP_NAME="FAQ & Tariffs API"
DEBUG=true
API_PREFIX="/api"

# Разрешённые источники CORS для фронтенда
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Пути к данным (по умолчанию уже настроены)
FAQ_DATA_PATH="data/faq.json"
TARIFFS_DATA_PATH="data/tariffs.json"

# Email
ADMIN_EMAIL="you@example.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="you@example.com"
SMTP_PASSWORD="your_password"
SMTP_FROM="you@example.com"
SMTP_USE_TLS=true

# Telegram
TELEGRAM_BOT_TOKEN="XXXXXXXX:YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"
TELEGRAM_CHAT_ID="-1001234567890"

# Google Sheets
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SPREADSHEET_ID=""
GOOGLE_WORKSHEET_NAME="Applications"
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=""
GOOGLE_SERVICE_ACCOUNT_JSON=""
```
- Примечание: все названия переменных соответствуют полям `Settings`. Если оставите пустыми — будут использованы значения по умолчанию из `config.py`.

2) Фронтенд: базовый URL API
- По умолчанию `frontend/config/api.ts` жёстко использует production URL. Для локальной разработки переключите на development. Найдите:
```ts
export const getApiConfig = () => {
  // Для продакшена используем VPS сервер
  return API_CONFIG.production;
};
```
- И замените на:
```ts
export const getApiConfig = () => {
  return API_CONFIG.development; // локальный backend http://localhost:8000
};
```
- В продакшене верните обратно или подставьте ваш домен/API шлюз.


### Полезные команды

- Backend (в папке `backend`):
```powershell
.\.venv\Scripts\Activate   # активировать venv
python main.py               # запустить API (или: uvicorn main:app --reload)
```

- Frontend (в папке `frontend`):
```powershell
npm run dev     # режим разработки
npm run build   # сборка
npm run start   # запуск прод-сборки
```

- Управление FAQ через CLI (опционально, если используете):
```powershell
cd backend
python faq_manager.py list          # показать все вопросы
python faq_manager.py add           # добавить вопрос (интерактивно)
python faq_manager.py edit 1        # отредактировать вопрос с id=1
python faq_manager.py delete 1      # удалить вопрос с id=1
python faq_manager.py stats         # статистика
```


### API кратко
- Базовый путь: `http://localhost:8000/api`
- FAQ: `/faq/`, `/faq/categories`, `/faq/category/{category}`, `/faq/search?q=...`, `/faq/{id}`, `/faq/popular`, `/faq/recent`, `/faq/keyword/{kw}`, `/faq/stats`
- Tariffs: `/tariffs/`, `/tariffs/{id}`, `/tariffs/discounts`, `/tariffs/trial-period`, `/tariffs/calculate-price/{tariff_id}?period=...`
- Applications: `/applications/submit` (отправка заявки)


### Частые проблемы и решения
- CORS ошибка в браузере:
  - Добавьте ваш фронтенд-адрес в `CORS_ORIGINS` (или в `settings.cors_origins`) и перезапустите бэкенд.
- 500 Internal Server Error при отправке заявки:
  - Проверьте SMTP/Telegram/Google Sheets параметры. Если не используете — отключите соответствующие блоки в `.env` (например, `GOOGLE_SHEETS_ENABLED=false`).
- Frontend не видит backend локально:
  - Убедитесь, что в `frontend/config/api.ts` выбран `development` и бэкенд запущен на `http://localhost:8000`.
- Windows: uvicorn не найден
  - Убедитесь, что активировано виртуальное окружение и выполнен `pip install -r requirements.txt`.


### Что дальше
- Наполните `backend/data/faq.json` и `frontend/src/data/faq.json` актуальными вопросами.
- Настройте `config/api.ts` под ваш домен в продакшене.
- Перенесите секреты в `.env` и исключите их из репозитория.


Если что-то не запускается — напишите кратко, что делали, и приложите сообщения об ошибке (скрин/копипаста поможет).


