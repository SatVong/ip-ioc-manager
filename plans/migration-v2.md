# План миграции IP/IOC Manager v.2.0

## Цель

Миграция фронтенда с Vanilla JS (ES Modules) на React + TypeScript + Vite, внедрение дашборда, тестов и улучшение архитектуры бэкенда.

---

## 1. Анализ текущего состояния

### 1.1 Бэкенд (Node.js + Express)

**Файловая структура:**
- [`backend/server.js`](backend/server.js) — монолит: 982 строки, содержит ВСЕ роуты (IP, IOC, White IP, админка)
- [`backend/auth.js`](backend/auth.js) — авторизация (login, me, logout)
- [`backend/users.js`](backend/users.js) — CRUD пользователей
- [`backend/db.js`](backend/db.js) — подключение к PostgreSQL + `ensureAdminExists()`
- [`backend/swagger.js`](backend/swagger.js) — OpenAPI 3.0 документация (1025 строк)

**Проблемы:**
1. **Монолитный server.js** — все роуты в одном файле, дублирование кода для IP/IOC/White IP (paginated endpoints повторяются 3 раза с минимальными отличиями)
2. **Нет TypeScript** — всё на CommonJS (`require`)
3. **Нет тестов** — ни unit, ни integration
4. **Нет rate limiting** — уязвимость для брутфорса `/api/auth/login`
5. **Нет структурированного логирования** — только `console.log`
6. **Нет миграций БД** — только `init.sql` для первоначальной инициализации

### 1.2 Фронтенд (Vanilla JS)

**Файловая структура:**
```
frontend/js/
├── app.js, ioc.js, white-ip.js    # Точки входа (3 шт.)
├── api/
│   ├── client.js                   # Базовый HTTP-клиент
│   ├── records.js                  # API для IP
│   ├── ioc-records.js              # API для IOC
│   └── auth.js                     # API для авторизации
├── ui/
│   ├── ipTable.js, iocTable.js, whiteIpTable.js         # Таблицы (3 копии)
│   ├── ipFilters.js, iocFilters.js, whiteIpFilters.js   # Фильтры (3 копии)
│   ├── ipModals.js, iocModals.js, whiteIpModals.js      # Модалки (3 копии)
│   ├── ipExceptions.js, iocExceptions.js, whiteIpExceptions.js  # Исключения (3 копии)
│   ├── ipImportExport.js, iocImportExport.js, whiteIpImportExport.js  # CSV (3 копии)
│   └── ipValidation.js            # Валидация (1 шт.)
├── actions/
│   ├── ipActions.js, iocActions.js, whiteIpActions.js   # CRUD (3 копии)
├── pagination/
│   ├── ipPagination.js, iocPagination.js, whiteIpPagination.js  # Пагинация (3 копии)
├── validators/
│   ├── ip.js, hash.js, country.js, date.js, mse.js      # Валидаторы
├── serverPagination.js, serverPaginationIoc.js, serverPaginationWhiteIp.js  # Серверная пагинация (3 копии)
├── constants/index.js             # Константы
├── theme/theme.js                 # Тёмная/светлая тема
└── config.js                      # Конфигурация
```

**Проблемы:**
1. **Тройное дублирование** — IP, IOC, White IP имеют идентичную логику, скопированную 3 раза
2. **`window.*` экспорты** — все функции глобально доступны через `window`, нет изоляции
3. **Нет TypeScript** — отсутствие типов приводит к ошибкам (например, путаница между `from` и `from_source`)
4. **Прямые ES-импорты** — без сборщика, много HTTP-запросов за модулями
5. **Глобальный CSS** — нет изоляции стилей
6. **Нет тестов** — всё тестируется вручную

### 1.3 База данных

**Таблицы:**
- `users` — пользователи с ролевой моделью
- `ip_records` — IP источники (16 колонок)
- `ioc_records` — IOC хеши (14 колонок)
- `white_ip_records` — Белые IP (13 колонок)
- `user_logs` — логи действий

**Проблемы:**
- Даты хранятся как `VARCHAR` (формат `DD.MM.YYYY`) вместо `DATE`
- Массивы МСЭ хранятся как `INTEGER[]` — неудобно для аналитики
- Нет внешних ключей между записями и логами (кроме `user_id`)

### 1.4 Docker

- 3 контейнера: database (PostgreSQL 16), backend (Node.js), frontend (Nginx)
- Healthcheck для БД
- Bridge network

---

## 2. Целевая архитектура v.2.0

### 2.1 Общая схема

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                           │
│                                                          │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Frontend       │  │   Backend    │  │  Database  │  │
│  │   (Nginx)        │  │  (Express)   │  │  (PG 16)  │  │
│  │   React SPA      │  │  TypeScript  │  │           │  │
│  │   Vite Bundle    │  │  Routes/     │  │           │  │
│  │   Tailwind CSS   │  │  Controllers │  │           │  │
│  │   :80            │←─│  :3000       │──│  :5432    │  │
│  └──────────────────┘  └──────────────┘  └───────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Структура фронтенда (React + TypeScript + Vite)

```
frontend/
├── src/
│   ├── main.tsx                    # Точка входа
│   ├── App.tsx                     # Корневой компонент + роутинг
│   ├── routes.tsx                  # Конфигурация маршрутов
│   │
│   ├── api/                        # API-слой
│   │   ├── client.ts               # Axios/fetch instance с интерцепторами
│   │   ├── auth.ts                 # Auth API
│   │   ├── records.ts              # IP Records API
│   │   ├── iocRecords.ts           # IOC Records API
│   │   ├── whiteIpRecords.ts       # White IP Records API
│   │   ├── users.ts                # Users API
│   │   └── admin.ts                # Admin API
│   │
│   ├── types/                      # TypeScript типы
│   │   ├── index.ts                # Общие типы
│   │   ├── user.ts                 # User, LoginRequest, LoginResponse
│   │   ├── ipRecord.ts             # IpRecord, IpRecordFormData
│   │   ├── iocRecord.ts            # IocRecord, IocRecordFormData
│   │   ├── whiteIpRecord.ts        # WhiteIpRecord, WhiteIpRecordFormData
│   │   └── pagination.ts           # PaginatedResponse, PaginationState
│   │
│   ├── hooks/                      # React hooks
│   │   ├── useAuth.ts              # Хук авторизации
│   │   ├── usePagination.ts        # Хук пагинации
│   │   ├── useRecords.ts           # Хук для работы с записями (общий)
│   │   ├── useFilters.ts           # Хук фильтрации
│   │   ├── useTheme.ts             # Хук темы
│   │   └── usePermissions.ts       # Хук проверки прав
│   │
│   ├── context/                    # React Context
│   │   ├── AuthContext.tsx          # Контекст авторизации
│   │   ├── ThemeContext.tsx         # Контекст темы
│   │   └── NotificationContext.tsx  # Контекст уведомлений
│   │
│   ├── components/                 # Переиспользуемые компоненты
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Основной лейаут (шапка, сайдбар)
│   │   │   ├── Header.tsx          # Шапка с навигацией
│   │   │   ├── Sidebar.tsx         # Боковое меню
│   │   │   └── Footer.tsx          # Подвал
│   │   ├── table/
│   │   │   ├── DataTable.tsx       # Универсальная таблица (generic)
│   │   │   ├── TableHeader.tsx     # Заголовок с сортировкой
│   │   │   ├── TableRow.tsx        # Строка с редактированием
│   │   │   ├── EditableCell.tsx    # Редактируемая ячейка
│   │   │   └── MseBadges.tsx       # Бейджи МСЭ
│   │   ├── filters/
│   │   │   ├── FilterBar.tsx       # Панель фильтров
│   │   │   ├── ColumnFilter.tsx    # Фильтр по колонке
│   │   │   ├── GlobalSearch.tsx    # Глобальный поиск
│   │   │   └── SourceTabs.tsx      # Вкладки источников
│   │   ├── pagination/
│   │   │   └── Pagination.tsx      # Компонент пагинации
│   │   ├── modal/
│   │   │   ├── Modal.tsx           # Универсальное модальное окно
│   │   │   ├── AddRecordModal.tsx  # Модалка добавления записи
│   │   │   └── ExceptionModal.tsx  # Модалка исключения
│   │   ├── csv/
│   │   │   ├── CsvImport.tsx       # Импорт CSV
│   │   │   └── CsvExport.tsx       # Экспорт CSV
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Форма входа
│   │   │   ├── ProtectedRoute.tsx  # Защищённый маршрут
│   │   │   └── PermissionGate.tsx  # Проверка прав
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx       # Дашборд
│   │   │   ├── StatsCard.tsx       # Карточка статистики
│   │   │   ├── TopCountries.tsx    # Топ-5 стран
│   │   │   └── TimelineChart.tsx   # График поступлений
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Spinner.tsx
│   │       └── Toast.tsx
│   │
│   ├── pages/                      # Страницы
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx       # Новая страница
│   │   ├── IpRecordsPage.tsx
│   │   ├── IocRecordsPage.tsx
│   │   ├── WhiteIpRecordsPage.tsx
│   │   ├── UsersPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── utils/                      # Утилиты
│   │   ├── validators.ts           # Валидация полей
│   │   ├── formatters.ts           # Форматирование дат, IP
│   │   ├── csv.ts                  # Парсинг/генерация CSV
│   │   └── constants.ts            # Константы (MSE_NAMES, TABLE_COLUMNS)
│   │
│   └── styles/                     # Tailwind CSS
│       ├── index.css               # Глобальные стили + Tailwind directives
│       └── variables.css           # CSS-переменные для темы
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── Dockerfile                      # Многоступенчатая сборка
```

### 2.3 Структура бэкенда (TypeScript)

```
backend/
├── src/
│   ├── index.ts                    # Точка входа
│   ├── app.ts                      # Express app setup
│   ├── config/
│   │   └── index.ts                # Конфигурация (env)
│   ├── db/
│   │   ├── pool.ts                 # Пул подключений
│   │   ├── migrations/             # Миграции
│   │   └── seeds/                  # Сиды
│   ├── middleware/
│   │   ├── auth.ts                 # JWT проверка
│   │   ├── permissions.ts          # Проверка прав
│   │   ├── rateLimiter.ts          # Rate limiting
│   │   ├── errorHandler.ts         # Обработка ошибок
│   │   └── logger.ts              # Логирование
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── records.routes.ts       # IP Records
│   │   ├── iocRecords.routes.ts    # IOC Records
│   │   ├── whiteIpRecords.routes.ts
│   │   ├── admin.routes.ts
│   │   └── dashboard.routes.ts     # НОВОЕ: дашборд
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── records.controller.ts
│   │   ├── iocRecords.controller.ts
│   │   ├── whiteIpRecords.controller.ts
│   │   ├── admin.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── records.service.ts      # Общая логика для записей
│   │   ├── iocRecords.service.ts
│   │   ├── whiteIpRecords.service.ts
│   │   ├── dashboard.service.ts
│   │   └── pagination.service.ts   # Общая пагинация
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── record.ts               # IpRecord, IocRecord, WhiteIpRecord
│   │   └── pagination.ts
│   └── utils/
│       ├── validators.ts
│       └── helpers.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

### 2.4 Маршрутизация (React Router v6)

```
/login                  → LoginPage
/                       → DashboardPage       (новая)
/records                → IpRecordsPage
/ioc-records            → IocRecordsPage
/white-ip-records       → WhiteIpRecordsPage
/users                  → UsersPage
/profile                → ProfilePage
```

### 2.5 State Management

**Рекомендация: React Context + useReducer (без Redux)**

Почему:
- Приложение не настолько сложное, чтобы требовать Redux
- Основные состояния: auth, theme, pagination — хорошо ложатся на Context
- Данные таблиц — server state, их не нужно хранить в глобальном store

**Контексты:**
- `AuthContext` — токен, пользователь, права
- `ThemeContext` — тёмная/светлая тема
- `NotificationContext` — toast-уведомления

**Для server state:** обычные `useState` + `useEffect` в хуках (`useRecords`, `usePagination`)

### 2.6 API-слой

**Рекомендация: Axios с интерцепторами**

```typescript
// api/client.ts
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2.7 Дашборд (новая функциональность)

**API endpoints (новые):**
- `GET /api/dashboard/stats` — общая статистика
- `GET /api/dashboard/top-countries` — топ-5 стран
- `GET /api/dashboard/timeline` — периодичность поступлений

**Компоненты дашборда:**
- `StatsCard` — карточки: всего IP, всего IOC, всего White IP, активных пользователей
- `TopCountries` — таблица/бар-чарт топ-5 стран
- `TimelineChart` — линейный график поступлений по месяцам

**Библиотека для графиков:** Recharts (лёгкая, React-native)

### 2.8 Тестирование

**Бэкенд:**
- Jest + Supertest (интеграционные тесты API)
- Jest (unit-тесты сервисов)

**Фронтенд:**
- Vitest (unit-тесты)
- React Testing Library (компонентные тесты)

**Структура тестов:**
```
backend/tests/
├── integration/
│   ├── auth.test.ts
│   ├── records.test.ts
│   ├── iocRecords.test.ts
│   └── admin.test.ts
└── unit/
    └── pagination.test.ts

frontend/src/
├── components/__tests__/
│   ├── DataTable.test.tsx
│   ├── Pagination.test.tsx
│   └── LoginForm.test.tsx
└── hooks/__tests__/
    ├── useAuth.test.ts
    └── usePagination.test.ts
```

### 2.9 Docker (обновлённый)

```yaml
services:
  database:
    # без изменений

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    # + healthcheck для backend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    # Многоступенчатая сборка:
    #   Stage 1: node:20-alpine — npm install + npm run build
    #   Stage 2: nginx:alpine — копировать dist/ в /usr/share/nginx/html
```

---

## 3. Пошаговый план миграции

### Этап 1: Подготовка бэкенда (без изменения API)

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 1.1 | Установить TypeScript, настроить `tsconfig.json` | `backend/tsconfig.json`, `backend/package.json` |
| 1.2 | Разделить `server.js` на роуты + контроллеры | `backend/src/routes/*.routes.ts`, `backend/src/controllers/*.controller.ts` |
| 1.3 | Вынести общую логику пагинации в `pagination.service.ts` | `backend/src/services/pagination.service.ts` |
| 1.4 | Добавить rate limiter на `/api/auth/login` | `backend/src/middleware/rateLimiter.ts` |
| 1.5 | Добавить `express-validator` схемы | `backend/src/utils/validators.ts` |
| 1.6 | Написать тесты на существующие API | `backend/tests/integration/*.test.ts` |
| 1.7 | Добавить healthcheck для backend в docker-compose | `docker-compose.yml` |

**Результат:** Бэкенд на TypeScript, разбитый на модули, с тестами. API не изменился.

### Этап 2: Дашборд (бэкенд)

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 2.1 | Создать `dashboard.controller.ts` и `dashboard.service.ts` | `backend/src/controllers/dashboard.controller.ts`, `backend/src/services/dashboard.service.ts` |
| 2.2 | Создать `GET /api/dashboard/stats` | Возвращает количество записей в каждой таблице |
| 2.3 | Создать `GET /api/dashboard/top-countries` | Топ-5 стран из `ip_records` |
| 2.4 | Создать `GET /api/dashboard/timeline` | Группировка по месяцам |
| 2.5 | Написать тесты на dashboard API | `backend/tests/integration/dashboard.test.ts` |

**Результат:** Новые API-эндпоинты для дашборда.

### Этап 3: Фронтенд — инициализация React + Vite

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 3.1 | Создать React-проект через `npm create vite@latest` | `frontend/package.json`, `vite.config.ts`, `tsconfig.json` |
| 3.2 | Настроить Tailwind CSS | `tailwind.config.js`, `postcss.config.js` |
| 3.3 | Создать базовый лейаут (Header, Sidebar, роутинг) | `App.tsx`, `routes.tsx`, `components/layout/*` |
| 3.4 | Перенести API-клиент (Axios) | `src/api/client.ts` |
| 3.5 | Создать AuthContext + LoginPage | `src/context/AuthContext.tsx`, `src/pages/LoginPage.tsx` |
| 3.6 | Создать ThemeContext | `src/context/ThemeContext.tsx` |

**Результат:** React-приложение с роутингом, авторизацией и темой.

### Этап 4: Фронтенд — универсальная таблица

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 4.1 | Создать generic-компонент `DataTable<T>` | `src/components/table/DataTable.tsx` |
| 4.2 | Создать `FilterBar` + `ColumnFilter` | `src/components/filters/*` |
| 4.3 | Создать `Pagination` | `src/components/pagination/Pagination.tsx` |
| 4.4 | Создать `Modal` + `AddRecordModal` + `ExceptionModal` | `src/components/modal/*` |
| 4.5 | Создать `CsvImport` + `CsvExport` | `src/components/csv/*` |
| 4.6 | Создать хук `useRecords<T>` (общий для IP/IOC/White IP) | `src/hooks/useRecords.ts` |
| 4.7 | Создать хук `usePagination` | `src/hooks/usePagination.ts` |

**Результат:** Универсальные компоненты, которые переиспользуются для всех трёх сущностей.

### Этап 5: Фронтенд — страницы

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 5.1 | Создать `IpRecordsPage` | `src/pages/IpRecordsPage.tsx` |
| 5.2 | Создать `IocRecordsPage` | `src/pages/IocRecordsPage.tsx` |
| 5.3 | Создать `WhiteIpRecordsPage` | `src/pages/WhiteIpRecordsPage.tsx` |
| 5.4 | Создать `UsersPage` | `src/pages/UsersPage.tsx` |
| 5.5 | Создать `ProfilePage` | `src/pages/ProfilePage.tsx` |

**Результат:** Все страницы работают через универсальные компоненты.

### Этап 6: Фронтенд — дашборд

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 6.1 | Установить Recharts | `package.json` |
| 6.2 | Создать `DashboardPage` | `src/pages/DashboardPage.tsx` |
| 6.3 | Создать `StatsCard` | `src/components/dashboard/StatsCard.tsx` |
| 6.4 | Создать `TopCountries` | `src/components/dashboard/TopCountries.tsx` |
| 6.5 | Создать `TimelineChart` | `src/components/dashboard/TimelineChart.tsx` |

**Результат:** Дашборд со статистикой, графиками.

### Этап 7: Тестирование фронтенда

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 7.1 | Настроить Vitest + React Testing Library | `vite.config.ts`, `src/test/setup.ts` |
| 7.2 | Написать тесты для `DataTable` | `src/components/__tests__/DataTable.test.tsx` |
| 7.3 | Написать тесты для `Pagination` | `src/components/__tests__/Pagination.test.tsx` |
| 7.4 | Написать тесты для `LoginForm` | `src/components/__tests__/LoginForm.test.tsx` |
| 7.5 | Написать тесты для хуков | `src/hooks/__tests__/*.test.ts` |

### Этап 8: Docker + деплой

| Шаг | Действие | Файлы |
|-----|----------|-------|
| 8.1 | Обновить `frontend/Dockerfile` (multi-stage build) | `frontend/Dockerfile` |
| 8.2 | Обновить `backend/Dockerfile` (TypeScript build) | `backend/Dockerfile` |
| 8.3 | Обновить `docker-compose.yml` | `docker-compose.yml` |
| 8.4 | Протестировать полный цикл `docker compose up -d` | — |

---

## 4. Ключевые решения

### 4.1 Почему React Context, а не Redux/Zustand?
- Приложение имеет 3 основных состояния: auth, theme, notifications
- Данные таблиц — server state, не нужно хранить в глобальном store
- Context + useReducer достаточно для текущей сложности
- Если в будущем понадобится — легко мигрировать на Zustand

### 4.2 Почему Axios, а не fetch?
- Интерцепторы для автоматической подстановки токена
- Интерцепторы для обработки 401 (редирект на login)
- Лучшая обработка ошибок
- Поддержка отмены запросов (cancel token)

### 4.3 Почему Tailwind, а не CSS Modules?
- Быстрая разработка (utility-first)
- Встроенная поддержка тёмной темы (`dark:`)
- Меньше файлов (не нужно писать отдельные CSS-файлы)
- Легко поддерживать и масштабировать

### 4.4 Почему Recharts, а не D3/Chart.js?
- React-native (компоненты, а не императивный API)
- Лёгкая (меньше зависимостей)
- Достаточно функциональности для дашборда
- Простая настройка

---

## 5. Риски и mitigation

| Риск | Вероятность | Влияние | Mitigation |
|------|-------------|---------|------------|
| Поломка существующего API при рефакторинге бэкенда | Средняя | Высокое | Покрыть API тестами ДО рефакторинга |
| Потеря функциональности при переписывании фронтенда | Высокая | Высокое | Делать итеративно: сначала универсальные компоненты, потом страницы |
| Долгое время миграции | Средняя | Среднее | Разделить на 8 этапов, каждый этап — рабочий инкремент |
| Конфликты при параллельной работе старого и нового фронтенда | Низкая | Среднее | Новый фронтенд на новых URL (v2.domain.com) или через feature-flag |
| Проблемы с производительностью React | Низкая | Низкое | Vite + code splitting + lazy loading |

---

## 6. Критерии завершения v.2.0

- [ ] Бэкенд полностью на TypeScript, разбит на модули
- [ ] Все API покрыты интеграционными тестами
- [ ] Rate limiting на auth-эндпоинтах
- [ ] React-фронтенд с Vite и Tailwind CSS
- [ ] Универсальная таблица `DataTable<T>` переиспользуется для IP, IOC, White IP
- [ ] Дашборд со статистикой, топ-5 стран, графиком поступлений
- [ ] Фронтенд покрыт unit-тестами (Vitest + RTL)
- [ ] Docker multi-stage build работает
- [ ] Старый Vanilla JS фронтенд удалён
- [ ] `window.*` экспорты отсутствуют