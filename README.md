# IP/IOC Manager

Система управления IP-адресами и индикаторами компрометации (IOC) для мониторинга угроз кибербезопасности.

**Стек**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 (фронтенд) / Node.js + Express.js + TypeScript 6 (бэкенд) / PostgreSQL 16 / Nginx / Docker Compose

---

## 🚀 Быстрый старт (Docker)

### Требования
- Docker и Docker Compose
- Свободные порты 80 (фронтенд) и 5432 (БД)

### Запуск одной командой

```bash
git clone <repo-url>
cd ip-ioc-manager
docker compose up -d
```

После запуска:
- **Веб-интерфейс**: http://localhost
- **Swagger API-документация**: http://localhost/api-docs

### Учётные данные по умолчанию

| Поле   | Значение   |
| ------ | ---------- |
| Логин  | `admin`    |
| Пароль | `admin123` |

> ⚠️ **Важно**: пароль по умолчанию — `admin123`. Пользователь `admin` создаётся автоматически при первом запуске БД. Рекомендуется сменить пароль после первого входа.

### Пересборка после изменений

```bash
docker compose build frontend   # пересобрать фронтенд
docker compose build backend    # пересобрать бэкенд
docker compose up -d            # перезапустить контейнеры
```

---

## 🔧 Разработка (локально, без Docker)

### Требования
- Node.js 20+
- PostgreSQL 16+

### 1. База данных

```bash
# Создать БД и выполнить инициализацию
psql -U postgres -c "CREATE DATABASE ipioc_db;"
psql -U postgres -d ipioc_db -f docker/init.sql
```

### 2. Бэкенд

```bash
cd backend
cp .env.example .env   # или создать .env вручную
npm install
npm run dev            # nodemon + ts-node, порт 3000
```

**Переменные окружения** (`.env`):

```env
DB_HOST=localhost
DB_USER=postgres-ip-manager
DB_PASSWORD=vhtuajmsavdshs213fvsdcv
DB_NAME=ipioc_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 3. Фронтенд

```bash
cd frontend
npm install
npm run dev            # Vite dev server, порт 5173
```

Vite автоматически проксирует запросы `/api/` на `localhost:3000`.

### 4. Доступ

- Фронтенд: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api-docs

---

## 🧪 Тестирование

```bash
# Бэкенд (Jest + Supertest)
cd backend && npm test          # 14 тестов (3 unit + 11 integration)

# Фронтенд (Vitest + React Testing Library)
cd frontend && npm test         # 24 теста

# Проверка TypeScript
cd frontend && npm run lint     # tsc -b --noEmit
cd backend && npx tsc --noEmit
```

---

## 📁 Структура проекта

```
ip-ioc-manager/
├── backend/                        # Node.js + Express (TypeScript)
│   ├── src/
│   │   ├── index.ts                # Точка входа Express
│   │   ├── config/index.ts         # Конфигурация из env
│   │   ├── db/pool.ts              # PostgreSQL pool + ensureAdminExists()
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT-аутентификация
│   │   │   ├── rateLimiter.ts      # Rate limiting (2000/15мин общий, 2000 для /api/auth/login)
│   │   │   └── errorHandler.ts     # Обработка ошибок
│   │   ├── routes/                 # 7 роутов (auth, users, records, ioc, white-ip, admin, dashboard)
│   │   ├── controllers/            # 8 контроллеров
│   │   ├── services/
│   │   │   ├── pagination.service.ts  # Универсальная пагинация getPaginatedData<T>()
│   │   │   └── dashboard.service.ts   # Статистика дашборда + getAppearance()
│   │   ├── types/                  # TypeScript типы (user, record, pagination)
│   │   └── utils/validators.ts     # express-validator схемы (6 схем)
│   ├── tests/                      # Jest-тесты (3 unit + 11 integration)
│   │   ├── unit/pagination.test.ts
│   │   └── integration/
│   │       ├── api.test.ts
│   │       └── dashboard.test.ts
│   ├── Dockerfile                  # Multi-stage build (tsc → node:20-alpine)
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                       # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── main.tsx                # Точка входа React (BrowserRouter + 3 контекста)
│   │   ├── App.tsx                 # Корневой компонент + роутинг (7 страниц)
│   │   ├── index.css               # Tailwind CSS v4 + CSS-переменные темы + hatching
│   │   ├── 404.html                # Кастомная страница 404 (Nginx)
│   │   ├── types/index.ts          # Все TypeScript типы (User, IpRecord, IocRecord, WhiteIpRecord, PaginatedResponse, DashboardStats, AppearanceData и др.)
│   │   ├── api/                    # 8 API-модулей (client, auth, records, ioc, white-ip, users, dashboard, admin)
│   │   ├── context/                # 3 контекста (Auth, Theme, Notification)
│   │   ├── hooks/                  # 7 хуков (useAuth, useTheme, useNotification, usePagination, useRecords, usePermissions, useScrollPreservation)
│   │   ├── utils/
│   │   │   ├── constants.ts        # ColumnDef<T>, MSE_NAMES (1-15), IOC_SOURCE_NAMES (1-6), колонки таблиц, filterKeyMap
│   │   │   └── formatters.ts       # formatDate, formatDateTime, msesToString, truncate
│   │   ├── components/
│   │   │   ├── layout/             # AppLayout, Header, Sidebar
│   │   │   ├── ui/                 # Toast (уведомления)
│   │   │   ├── table/              # DataTable<T>, TableHeader, TableRow, EditableCell, MseBadges
│   │   │   ├── filters/            # FilterBar, ColumnFilter, GlobalSearch, SourceTabs
│   │   │   ├── pagination/         # Pagination (10/25/50/100)
│   │   │   ├── modal/              # Modal, AddRecordModal, ExceptionModal
│   │   │   ├── csv/                # CsvImport, CsvExport, csvValidation
│   │   │   └── dashboard/          # StatsCard, TopCountriesChart, TimelineChart, AppearanceChart
│   │   ├── pages/                  # 7 страниц (Login, Dashboard, IpRecords, IocRecords, WhiteIp, Users, Profile)
│   │   └── test/                   # Vitest-тесты (24 теста: usePagination 8, Modal 5, Pagination 7, StatsCard 4)
│   ├── Dockerfile                  # Multi-stage build (Vite → Nginx:alpine)
│   ├── nginx.conf                  # SPA routing + proxy API + ^~ модификаторы + кеширование
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
│
├── docker/
│   └── init.sql                    # Инициализация БД (5 таблиц)
├── docker-compose.yml              # 3 сервиса (database, backend, frontend) + healthcheck
├── plans/
│   ├── migration-v2.md             # План миграции на v2 (8 этапов)
│   └── session-log.md              # Полный лог всех изменений (89 FIX)
├── ARCHITECTURE.md                 # Детальное описание архитектуры
└── README.md                       # Этот файл
```

---

## 📊 Возможности

### Основные
- 🔐 **JWT-авторизация** с ролевой моделью (admin/user) и правами доступа (can_create, can_edit, can_delete, can_import, can_export, can_manage_users)
- 📋 **CRUD** для IP источников, IOC хешей, Белых IP (3 таблицы, 15/6 источников МСЭ)
- 👥 **Управление пользователями** (создание, редактирование, блокировка, смена пароля, права доступа)
- 📊 **Дашборд** со статистикой, топ-5 стран, таймлайном, 3 графиками появления (IP/IOC/White IP) с фильтром периода

### Таблицы
- 🔍 **Фильтрация** по каждой колонке (FilterInput с debounce 400ms) + глобальный поиск
- 🔃 **Сортировка** по любому столбцу (asc/desc)
- 📄 **Серверная пагинация** (10/25/50/100 записей) с эллипсисом
- ✏️ **Inline-редактирование** ячеек (Enter — сохранить, Escape — отмена) с валидацией IP/даты/CIDR/хеша
- 🎯 **SourceTabs** — фильтрация по источнику МСЭ с группировкой по организациям (№1: 1-11 IP, 1-3 IOC; №2: 12-15 IP, 4-6 IOC) + счётчики
- 🚫 **Исключение записей** с note_out/date_out/who_out (диагональная штриховка строк)
- 🎨 **MseBadges** — цветные бейджи для номеров МСЭ с toggle-режимом

### CSV
- 📥 **Импорт CSV** с разделителем `;`, поддержкой кавычек, BOM-обработкой, нечётким сопоставлением заголовков (fuzzyMatchHeader), валидацией обязательных полей ("золотой минимум"), автоопределением кодировки IOC, прогресс-модалом
- 📤 **Экспорт CSV** с BOM для Excel, датой/временем в имени файла, разделителем `;`

### Интерфейс
- 🌓 **Тёмная/светлая тема** (сохранение в localStorage)
- 📱 **Адаптивный дизайн** (Tailwind CSS)
- 🔔 **Toast-уведомления** об операциях с авто-удалением
- 🖼️ **Кастомная страница 404** с плейсхолдером для изображения

### Администрирование
- 📖 **Swagger/OpenAPI документация** (все endpoint'ы, схемы, авторизация Bearer)
- 🌱 **Заполнение демо-данными** (Записи: IP, IOC, White IP, загрузку демо-данных реализовал через swagger, пройти авторизацию вставить ключ, который высветится и найти 3 раздела ниже по списку, можно добалять любое количество демо-данных)
- 🗑️ **Очистка таблиц** (IP, IOC, White IP, пользователи) — 4 endpoint'а

### Безопасность
- 🛡️ **Rate limiting** (2000 запросов/15мин общий, 2000 для /api/auth/login)
- 🔑 **Bcrypt** (10 rounds) для паролей
- 🎭 **JWT** (7 дней) с middleware-проверкой
- 🔒 **Пароль**: минимум 16 символов (единая валидация на бэкенде и фронтенде)
- 🔐 **Смена пароля**: два режима — администратор (без текущего пароля) и пользователь (с текущим паролем)

### Дашборд (Recharts)
- 📊 **StatsCard** — 3 карточки: IP записи, IOC хеши, Белые IP (с форматированием чисел)
- 🌍 **TopCountriesChart** — горизонтальный BarChart топ-5 стран с цветными барами
- 📈 **TimelineChart** — вертикальный BarChart поступлений по месяцам
- 📉 **AppearanceChart** — 3 графика появления (IP/IOC/White IP) с фильтром периода (Неделя/Месяц/Квартал/Год)

---

## 🐳 Архитектура Docker

```
Browser → Nginx (:80) → Express (:3000) → PostgreSQL (:5432)
              ↕
        Swagger UI (/api-docs)
```

- **Nginx**: раздаёт статику React SPA, проксирует `/api/` и `/api-docs` на бэкенд (с `^~` модификатором для приоритета над regex), кеширует статику на 1 год, кастомная страница 404
- **Backend**: multi-stage (tsc → node:20-alpine), healthcheck, `npm install --include=dev` для dev-зависимостей
- **Frontend**: multi-stage (Vite build → nginx:alpine)
- **Database**: PostgreSQL 16 с healthcheck, инициализация через `init.sql`

---

## 📚 Дополнительная документация

- [`plans/migration-v2.md`](plans/migration-v2.md) — план миграции с Vanilla JS на React (8 этапов)
- [`plans/session-log.md`](plans/session-log.md) — полный лог всех изменений (89 FIX)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — детальное описание архитектуры

---

## 🛠️ История исправлений (FIX 1-89)

Проект прошёл 14 раундов тестирования и исправлений после первичного деплоя:

| Раунд | FIX | Описание |
|-------|-----|----------|
| 1-2 | 1-17 | SourceTabs, MseBadges, ExceptionModal, AddRecordModal, UsersPage, ProfilePage, CSV, FilterBar, валидация |
| 3 | 18-30 | Rate limiter, Column filters, AddRecordModal поля, date auto-fill, inline validation, scroll |
| 4 (ч.1) | 31-39 | Column filters стабилизация, mse_method readonly, scroll preservation, truncate, fixed widths |
| 4 (ч.2) | 40-47 | Rate limiter 200, FilterInput переписан, CIDR тип, IOC hex validation, auto-detect encoding |
| 5 | 48-55 | useRecords переписан, SourceTabs counts, scroll preservation, mse filter |
| 6 | 56-62 | useRecords полный рефакторинг, filterKeyMap, SourceTabs починены, rate limiter 2000 |
| 7 | 63-65 | Rate limiter общий 2000, useRecords refs, AddRecordModal readonly поля |
| 8 | 66-71 | IOC encoding detection, ProfilePage статус, UsersPage валидация, CSV export/import полный рефакторинг |
| 9 | 72-79 | CSV mses запятые, "золотой минимум" полей, auto-detect encoding, прогресс-модал, Docker TS6133 |
| 10 | 80-81 | Штриховка исключённых строк, ширина колонок, дашборд, AppearanceChart |
| 11 | 82 | Docker build — tsc: not found (`--include=dev`, `npx tsc`) |
| 12 | 83 | Swagger UI 404 — Nginx `^~` модификатор, 404.html, Swagger server URL `/` |
| 13 | 84-87 | createUser is_active, changePassword два режима, ProfilePage смена пароля, валидация 16 символов |
| 14 | 88-89 | createUser→updateUser сброс is_active, Swagger clear-white-ip-records |

Подробное описание каждого FIX — в [`plans/session-log.md`](plans/session-log.md).
