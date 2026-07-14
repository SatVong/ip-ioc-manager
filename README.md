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

> ⚠️ **Важно**: пароль по умолчанию — `admin123` (не `admin123`). Создаётся автоматически при первом запуске БД.

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
│   │   ├── db/pool.ts              # PostgreSQL pool
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT-аутентификация
│   │   │   ├── rateLimiter.ts      # Rate limiting
│   │   │   └── errorHandler.ts     # Обработка ошибок
│   │   ├── routes/                 # 7 роутов (auth, users, records, ioc, white-ip, admin, dashboard)
│   │   ├── controllers/            # 8 контроллеров
│   │   ├── services/
│   │   │   ├── pagination.service.ts  # Универсальная пагинация
│   │   │   └── dashboard.service.ts   # Статистика дашборда
│   │   ├── types/                  # TypeScript типы
│   │   └── utils/validators.ts     # express-validator схемы
│   ├── tests/                      # Jest-тесты
│   ├── Dockerfile                  # Multi-stage build (tsc → node:20-alpine)
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                       # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── main.tsx                # Точка входа React
│   │   ├── App.tsx                 # Корневой компонент + роутинг
│   │   ├── index.css               # Tailwind CSS v4 + CSS-переменные темы
│   │   ├── types/index.ts          # Все TypeScript типы
│   │   ├── api/                    # 8 API-модулей (client, auth, records, ioc, white-ip, users, dashboard, admin)
│   │   ├── context/                # 3 контекста (Auth, Theme, Notification)
│   │   ├── hooks/                  # 7 хуков (useAuth, useTheme, useNotification, usePagination, useRecords, usePermissions, useScrollPreservation)
│   │   ├── utils/
│   │   │   ├── constants.ts        # ColumnDef, MSE_NAMES, колонки таблиц
│   │   │   └── formatters.ts       # Форматирование дат, MSE, truncate
│   │   ├── components/
│   │   │   ├── layout/             # AppLayout, Header, Sidebar
│   │   │   ├── ui/                 # Toast
│   │   │   ├── table/              # DataTable<T>, TableHeader, TableRow, EditableCell, MseBadges
│   │   │   ├── filters/            # FilterBar, ColumnFilter, GlobalSearch, SourceTabs
│   │   │   ├── pagination/         # Pagination
│   │   │   ├── modal/              # Modal, AddRecordModal, ExceptionModal
│   │   │   ├── csv/                # CsvImport, CsvExport
│   │   │   └── dashboard/          # StatsCard, TopCountriesChart, TimelineChart, AppearanceChart
│   │   ├── pages/                  # 7 страниц (Login, Dashboard, IpRecords, IocRecords, WhiteIp, Users, Profile)
│   │   └── test/                   # Vitest-тесты (24 теста)
│   ├── Dockerfile                  # Multi-stage build (Vite → Nginx:alpine)
│   ├── nginx.conf                  # SPA routing + proxy API
│   ├── vite.config.ts
│   └── package.json
│
├── docker/
│   └── init.sql                    # Инициализация БД
├── docker-compose.yml              # 3 сервиса (database, backend, frontend)
├── plans/
│   ├── migration-v2.md             # План миграции на v2
│   └── session-log.md              # Полный лог всех изменений и FIX
└── README.md                       # Этот файл
```

---

## 📊 Возможности

### Основные
- 🔐 **JWT-авторизация** с ролевой моделью (admin/user)
- 📋 **CRUD** для IP источников, IOC хешей, Белых IP
- 👥 **Управление пользователями** (создание, редактирование, блокировка, смена пароля)
- 📊 **Дашборд** со статистикой, топ-5 стран, таймлайном, графиками появления

### Таблицы
- 🔍 **Фильтрация** по каждой колонке + глобальный поиск
- 🔃 **Сортировка** по любому столбцу
-  **Серверная пагинация** (10/25/50/100 записей)
- ✏️ **Inline-редактирование** ячеек (Enter — сохранить, Escape — отмена)
- 🎯 **SourceTabs** — фильтрация по источнику МСЭ (1-15)
- 🚫 **Исключение записей** с note_out/date_out/who_out (штриховка строк)

### CSV
- 📥 **Импорт CSV** с разделителем `;`, автоопределением заголовков, валидацией, прогресс-модалом
- 📤 **Экспорт CSV** с BOM для Excel, датой в имени файла

### Интерфейс
- 🌓 **Тёмная/светлая тема** (сохранение в localStorage)
- 📱 **Адаптивный дизайн** (Tailwind CSS)
- 🔔 **Toast-уведомления** об операциях

### Администрирование
- 🌱 **Заполнение демо-данными** (105+ записей)
- 🗑️ **Очистка таблиц** (IP, IOC, White IP, пользователи)
- 📖 **Swagger/OpenAPI документация**

### Безопасность
- 🛡️ **Rate limiting** (2000 запросов/15мин общий, 2000 для /api/auth/login)
- 🔑 **Bcrypt** (10 rounds) для паролей
- 🎭 **JWT** (7 дней) с middleware-проверкой

---

## 🐳 Архитектура Docker

```
Browser → Nginx (:80) → Express (:3000) → PostgreSQL (:5432)
              ↕
        Swagger UI (/api-docs)
```

- **Nginx**: раздаёт статику React SPA, проксирует `/api/` и `/api-docs` на бэкенд, кеширует статику на 1 год
- **Backend**: multi-stage (tsc → node:20-alpine), healthcheck
- **Frontend**: multi-stage (Vite build → nginx:alpine)
- **Database**: PostgreSQL 16 с healthcheck, инициализация через `init.sql`

---

## 📚 Дополнительная документация

- [`plans/migration-v2.md`](plans/migration-v2.md) — план миграции с Vanilla JS на React
- [`plans/session-log.md`](plans/session-log.md) — полный лог всех изменений (81 FIX)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — детальное описание архитектуры
