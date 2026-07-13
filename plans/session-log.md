# ПАСПОРТ ПРОЕКТА: IP/IOC Manager v.2.0 (миграция)

## 1. ВСЕ ФАЙЛЫ (созданные / изменённые в сессии)

### НОВЫЕ ФАЙЛЫ

#### Корень проекта
- `New-project-README.md` — анализ текущего состояния проекта, сильные/слабые стороны, рекомендации
- `plans/migration-v2.md` — детальный план миграции на v.2.0 (8 этапов, архитектура, риски, критерии)

#### Backend (TypeScript) — src/
- `backend/tsconfig.json` — конфигурация TypeScript (target ES2020, commonjs, strict)
- `backend/jest.config.js` — конфигурация Jest (ts-jest, node env, coverage)
- `backend/src/config/index.ts` — конфигурация приложения из env (port, db, jwt, rateLimit)
- `backend/src/db/pool.ts` — пул подключений PostgreSQL + `ensureAdminExists()` (создаёт admin при старте)
- `backend/src/types/user.ts` — типы: `User`, `UserPublic`, `LoginRequest/Response`, `CreateUserRequest`, `JwtPayload`
- `backend/src/types/record.ts` — типы: `IpRecord`, `IocRecord`, `WhiteIpRecord` + Create-версии
- `backend/src/types/pagination.ts` — типы: `PaginationQuery`, `PaginatedResponse<T>`, `PaginationOptions`
- `backend/src/middleware/auth.ts` — `authenticateToken` (JWT verification) + расширение Express.Request
- `backend/src/middleware/rateLimiter.ts` — `apiLimiter` (100/15min) + `authLimiter` (10/15min)
- `backend/src/middleware/errorHandler.ts` — `errorHandler` + `createError` helper
- `backend/src/services/pagination.service.ts` — **универсальная пагинация**: `getPaginatedData<T>(options, query)` — один метод для всех таблиц
- `backend/src/services/dashboard.service.ts` — **дашборд**: `getDashboardStats()`, `getTopCountries(limit)`, `getTimeline()` — 3 аналитических запроса
- `backend/src/controllers/auth.controller.ts` — `login`, `getMe`, `logout`
- `backend/src/controllers/users.controller.ts` — `canManageUsers`, `getUsers`, `getUserById`, `createUser`, `updateUser`, `toggleUser`, `deleteUser`, `changePassword`
- `backend/src/controllers/records.controller.ts` — `getAllRecords`, `getRecordsPaginated`, `getRecordById`, `createRecord`, `updateRecord`, `deleteRecord`
- `backend/src/controllers/iocRecords.controller.ts` — `getAllIocRecords`, `getIocRecordsPaginated`, `getIocRecordById`, `createIocRecord`, `updateIocRecord`, `deleteIocRecord`
- `backend/src/controllers/whiteIpRecords.controller.ts` — `getWhiteIpRecordsPaginated`, `createWhiteIpRecord`, `updateWhiteIpRecord`, `deleteWhiteIpRecord`
- `backend/src/controllers/admin.controller.ts` — `seedDemoData`, `clearIpRecords`, `clearIocRecords`, `clearUsers`
- `backend/src/controllers/dashboard.controller.ts` — `stats`, `topCountries`, `timeline` — 3 handler'а для дашборда
- `backend/src/routes/auth.routes.ts` — POST /login (с authLimiter), GET /me, POST /logout
- `backend/src/routes/users.routes.ts` — CRUD пользователей (все под authenticateToken)
- `backend/src/routes/records.routes.ts` — CRUD IP записей + /paginated
- `backend/src/routes/iocRecords.routes.ts` — CRUD IOC записей + /paginated
- `backend/src/routes/whiteIpRecords.routes.ts` — CRUD White IP + /paginated
- `backend/src/routes/admin.routes.ts` — seed-demo-data, clear-* (все под authenticateToken)
- `backend/src/routes/dashboard.routes.ts` — GET /stats, GET /top-countries, GET /timeline (все под authenticateToken)
- `backend/src/index.ts` — точка входа: Express app, middleware, роуты, Swagger, статика, healthcheck, errorHandler
- `backend/src/swagger.ts` — OpenAPI 3.0 документация (сокращённая версия, все основные endpoint'ы)
- `backend/src/utils/validators.ts` — express-validator схемы: `loginValidation`, `createUserValidation`, `updateUserValidation`, `changePasswordValidation`, `idParamValidation`, `paginationValidation`

#### Backend — тесты
- `backend/tests/unit/pagination.test.ts` — 3 unit-теста на типы пагинации
- `backend/tests/integration/api.test.ts` — 4 integration-теста (test, health, login, records)
- `backend/tests/integration/dashboard.test.ts` — 7 integration-тестов (stats, top-countries, timeline — успех + ошибка)

#### Backend — Docker
- `backend/Dockerfile` — multi-stage build: Stage 1 (builder) компилирует TS, Stage 2 (production) — только dist + production deps + HEALTHCHECK

#### Frontend (React + TypeScript + Vite) — Этап 3 (инициализация)
- `frontend/package.json` — зависимости: React 19, React Router 7, Axios, Recharts, Tailwind CSS v4, Vitest
- `frontend/vite.config.ts` — Vite config: React plugin, Tailwind CSS v4 plugin, proxy `/api` → `localhost:3000`
- `frontend/tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` — TypeScript config (bundler mode, react-jsx)
- `frontend/index.html` — точка входа SPA
- `frontend/src/index.css` — Tailwind CSS v4 `@import "tailwindcss"` + CSS-переменные для темы (светлая/тёмная)
- `frontend/src/main.tsx` — точка входа React: BrowserRouter + AuthProvider + ThemeProvider + NotificationProvider
- `frontend/src/App.tsx` — корневой компонент: роутинг (React Router v6), ProtectedRoute, 7 страниц
- `frontend/src/types/index.ts` — все TypeScript типы: User, IpRecord, IocRecord, WhiteIpRecord, PaginatedResponse, DashboardStats, TopCountry, TimelineItem, Notification
- `frontend/src/api/client.ts` — Axios instance с интерцепторами (JWT + 401 redirect)
- `frontend/src/api/auth.ts` — login, getMe, logout
- `frontend/src/api/records.ts` — CRUD IP Records + paginated
- `frontend/src/api/iocRecords.ts` — CRUD IOC Records + paginated
- `frontend/src/api/whiteIpRecords.ts` — CRUD White IP Records + paginated
- `frontend/src/api/users.ts` — CRUD Users + toggle + changePassword
- `frontend/src/api/dashboard.ts` — getDashboardStats, getTopCountries, getTimeline
- `frontend/src/api/admin.ts` — seedDemoData, clearIpRecords, clearIocRecords, clearUsers
- `frontend/src/context/AuthContext.tsx` — контекст авторизации: login, logout, hasPermission, проверка токена при загрузке
- `frontend/src/context/ThemeContext.tsx` — контекст темы: тёмная/светлая, сохранение в localStorage
- `frontend/src/context/NotificationContext.tsx` — контекст уведомлений: toast-сообщения с авто-удалением
- `frontend/src/hooks/useAuth.ts` — хук для AuthContext
- `frontend/src/hooks/useTheme.ts` — хук для ThemeContext
- `frontend/src/hooks/useNotification.ts` — хук для NotificationContext
- `frontend/src/components/layout/AppLayout.tsx` — основной лейаут: Sidebar + Header + Outlet + Toast
- `frontend/src/components/layout/Header.tsx` — шапка: название, переключатель темы, профиль, кнопка выхода
- `frontend/src/components/layout/Sidebar.tsx` — боковое меню: 6 пунктов (Дашборд, IP, IOC, White IP, Пользователи, Профиль)
- `frontend/src/components/ui/Toast.tsx` — компонент toast-уведомлений
- `frontend/src/pages/LoginPage.tsx` — страница входа: форма логина, валидация, обработка ошибок
- `frontend/src/pages/DashboardPage.tsx` — дашборд: 5 карточек статистики, топ-5 стран (бары), таймлайн (бары)
- `frontend/src/pages/ProfilePage.tsx` — страница профиля: отображение всех полей пользователя

#### Frontend (React + TypeScript + Vite) — Этап 4 (универсальная таблица)
- `frontend/src/utils/constants.ts` — `ColumnDef<T>` тип, `MSE_NAMES` (1-15), `IOC_SOURCE_NAMES` (1-6), `IP_RECORD_COLUMNS` (16 колонок), `IOC_RECORD_COLUMNS` (14 колонок), `WHITE_IP_RECORD_COLUMNS` (13 колонок), карты сортировки
- `frontend/src/utils/formatters.ts` — `formatDate`, `formatDateTime`, `getMseName`, `msesToString`, `truncate`
- `frontend/src/hooks/usePagination.ts` — управление состоянием пагинации (page, limit, sortBy, sortOrder, filters, globalSearch) с методами setPage, setLimit, setSort, toggleSort, setFilter, clearFilters, setGlobalSearch, reset
- `frontend/src/hooks/useRecords.ts` — generic хук `useRecords<T>({ fetchFn, pagination, errorMessage })` для загрузки пагинированных данных с автообновлением
- `frontend/src/hooks/usePermissions.ts` — `canCreate`, `canEdit`, `canDelete`, `canImport`, `canExport`, `canManageUsers`, `isAdmin` на основе роли пользователя
- `frontend/src/components/table/MseBadges.tsx` — цветные бейджи для номеров МСЭ (1-15) с вариантами ip/ioc
- `frontend/src/components/table/EditableCell.tsx` — inline-редактирование с Enter/Escape
- `frontend/src/components/table/TableHeader.tsx` — сортируемые заголовки колонок с индикатором направления
- `frontend/src/components/table/TableRow.tsx` — строка с inline-редактированием, бейджами МСЭ/encoding/status, кнопками действий (toggle MSE, delete), двойным кликом для исключения, подсветкой исключённых строк
- `frontend/src/components/table/DataTable.tsx` — generic `DataTable<T extends { id: number }>` с loading spinner, empty state, рендерингом таблицы
- `frontend/src/components/filters/GlobalSearch.tsx` — поиск с Enter
- `frontend/src/components/filters/ColumnFilter.tsx` — фильтр по колонке
- `frontend/src/components/filters/FilterBar.tsx` — объединённые GlobalSearch + ColumnFilter (до 6 filterable колонок) + кнопка сброса + общее количество
- `frontend/src/components/filters/SourceTabs.tsx` — табы-фильтры по источнику
- `frontend/src/components/pagination/Pagination.tsx` — навигация с эллипсисом, выбор размера страницы, общее количество
- `frontend/src/components/modal/Modal.tsx` — переиспользуемый модал с backdrop, Escape, scroll lock
- `frontend/src/components/modal/AddRecordModal.tsx` — форма добавления записи с редактируемыми колонками
- `frontend/src/components/modal/ExceptionModal.tsx` — форма исключения записи (note_out, date_out, who_out)
- `frontend/src/components/csv/CsvImport.tsx` — импорт CSV с парсингом
- `frontend/src/components/csv/CsvExport.tsx` — экспорт CSV с BOM для Excel

#### Frontend (React + TypeScript + Vite) — Этап 7 (Тесты фронтенда)
- `frontend/vitest.config.ts` — конфигурация Vitest (jsdom, globals, setup)
- `frontend/src/test/setup.ts` — setup-файл с `@testing-library/jest-dom`
- `frontend/src/test/usePagination.test.ts` — 8 unit-тестов для хука usePagination
- `frontend/src/test/Modal.test.tsx` — 5 тестов для компонента Modal
- `frontend/src/test/Pagination.test.tsx` — 7 тестов для компонента Pagination
- `frontend/src/test/StatsCard.test.tsx` — 4 теста для компонента StatsCard

#### Frontend (React + TypeScript + Vite) — Этап 5 (UsersPage)
- `frontend/src/pages/UsersPage.tsx` — **обновлён** с заглушки до полной CRUD страницы управления пользователями

#### Frontend (React + TypeScript + Vite) — Этап 6 (Дашборд с Recharts)
- `frontend/src/components/dashboard/StatsCard.tsx` — карточка статистики с SVG-иконкой и цветным индикатором
- `frontend/src/components/dashboard/TopCountriesChart.tsx` — горизонтальный BarChart (Recharts) для топ-5 стран с цветными барами
- `frontend/src/components/dashboard/TimelineChart.tsx` — вертикальный BarChart (Recharts) для поступлений по месяцам

#### Frontend — Docker (Этап 8)
- `frontend/Dockerfile` — multi-stage build: Stage 1 (builder) Vite build, Stage 2 (production) Nginx + dist
- `frontend/nginx.conf` — Nginx config: SPA routing (try_files /index.html), proxy /api/ и /api-docs → backend, кеширование статики 1 год

### ИЗМЕНЁННЫЕ ФАЙЛЫ
- `backend/package.json` — добавлены скрипты (build, dev, test, lint), зависимости (typescript, jest, supertest, express-rate-limit, @types/*)
- `docker-compose.yml` — добавлен healthcheck для backend сервиса
- `frontend/src/pages/IpRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (DataTable, FilterBar, Pagination, AddRecordModal, ExceptionModal, CsvImport, CsvExport, usePagination, useRecords, usePermissions)
- `frontend/src/pages/IocRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (тот же паттерн)
- `frontend/src/pages/WhiteIpRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (тот же паттерн)
- `frontend/src/pages/UsersPage.tsx` — **обновлён** с заглушки до полной CRUD страницы управления пользователями
- `backend/Dockerfile` — **обновлён** (убрана строка копирования старого фронтенда)
- `frontend/Dockerfile` — **обновлён** (переписан на multi-stage: Vite build → Nginx)

### УДАЛЁННЫЕ ФАЙЛЫ (Этап 8 — старый Vanilla JS фронтенд)
- `frontend/js/` — вся папка (25+ файлов: app.js, ioc.js, white-ip.js, config.js, serverPagination*.js, actions/*, api/*, auth/*, pagination/*, theme/*, ui/*, validators/*, constants/*)
- `frontend/css/` — вся папка (15+ файлов: style.css, responsive.css, auth/*, base/*, components/*, pages/*)
- `frontend/login.html` — старая страница входа
- `frontend/ioc.html` — старая страница IOC
- `frontend/white-ip.html` — старая страница White IP
- `frontend/users.html` — старая страница пользователей
- `frontend/profile.html` — старая страница профиля

---

## 2. ТЕКУЩАЯ АРХИТЕКТУРА

### Стек технологий
| Слой | Технология | Версия |
|------|-----------|--------|
| Backend | Node.js + Express.js (TypeScript) | 20+ |
| База данных | PostgreSQL | 16 |
| Frontend (старый) | Vanilla JS (ES Modules) | — |
| Frontend (новый) | React + TypeScript + Vite | React 19 / Vite 8 |
| CSS | Tailwind CSS v4 + CSS-переменные | — |
| Контейнеризация | Docker + Docker Compose | — |
| Тесты (backend) | Jest + Supertest + ts-jest | — |

### Связи компонентов
```
Browser → Nginx (:80) → Express (:3000) → PostgreSQL (:5432)
                              ↕
                        Swagger UI (/api-docs)
```

### Структура бэкенда (новая, TypeScript)
```
backend/src/
├── index.ts              ← точка входа: Express app
├── config/index.ts       ← env-конфигурация
├── db/pool.ts            ← PostgreSQL pool
├── middleware/
│   ├── auth.ts           ← JWT проверка
│   ├── rateLimiter.ts    ← rate limiting
│   └── errorHandler.ts   ← ошибки
├── routes/               ← 7 роутов (auth, users, records, ioc, white-ip, admin, dashboard)
├── controllers/          ← 8 контроллеров
├── services/
│   ├── pagination.service.ts  ← общая пагинация
│   └── dashboard.service.ts   ← дашборд
├── types/                ← TypeScript типы
└── utils/
    └── validators.ts     ← express-validator схемы
```

### Структура фронтенда (новая, React + Vite)
```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── src/
│   ├── main.tsx              ← точка входа
│   ├── App.tsx               ← корневой компонент + роутинг
│   ├── index.css             ← Tailwind + CSS-переменные
│   ├── types/index.ts        ← все TypeScript типы
│   ├── api/                  ← 7 API-модулей (client, auth, records, ioc, white-ip, users, dashboard, admin)
│   ├── context/              ← 3 контекста (Auth, Theme, Notification)
│   ├── hooks/                ← 6 хуков (useAuth, useTheme, useNotification, usePagination, useRecords, usePermissions)
│   ├── utils/
│   │   ├── constants.ts      ← ColumnDef, MSE_NAMES, колонки для всех 3 таблиц
│   │   └── formatters.ts     ← formatDate, formatDateTime, getMseName, msesToString, truncate
│   ├── components/
│   │   ├── layout/           ← AppLayout, Header, Sidebar
│   │   ├── ui/               ← Toast
│   │   ├── table/            ← DataTable<T>, TableHeader, TableRow, EditableCell, MseBadges
│   │   ├── filters/          ← FilterBar, ColumnFilter, GlobalSearch, SourceTabs
│   │   ├── pagination/       ← Pagination
│   │   ├── modal/            ← Modal, AddRecordModal, ExceptionModal
│   │   └── csv/              ← CsvImport, CsvExport
│   └── pages/                ← 7 страниц (Login, Dashboard, IpRecords, IocRecords, WhiteIp, Users, Profile)
└── dist/                     ← скомпилированный bundle (Vite build)
```

### Поток данных (DataTable<T>)
```
Page (usePagination + useRecords<T> + usePermissions)
  ├── FilterBar (GlobalSearch + ColumnFilter × N + clear + total)
  ├── DataTable<T> (loading/empty/table)
  │     ├── TableHeader (sortable columns)
  │     └── TableRow × N (EditableCell, MseBadges, actions)
  ├── Pagination (page nav + page size)
  ├── AddRecordModal (create form)
  ├── ExceptionModal (exclusion form)
  ├── CsvImport (file upload)
  └── CsvExport (download)
```

### Где хранятся данные
- **Постоянные**: PostgreSQL (5 таблиц: users, ip_records, ioc_records, white_ip_records, user_logs)
- **Сессия**: JWT токен в localStorage (фронтенд)
- **Конфигурация**: `.env` файл (backend) + переменные окружения Docker

---

## 3. СТАТУС ПО ЗАДАЧАМ

### [ГОТОВО] — полностью работает
- ✅ Анализ проекта сохранён в `New-project-README.md`
- ✅ План миграции v.2.0 создан в `plans/migration-v2.md`
- ✅ TypeScript установлен и настроен (tsconfig.json, компиляция без ошибок)
- ✅ `server.js` (982 строки) разбит на 6 роутов + 7 контроллеров
- ✅ Общая пагинация вынесена в `pagination.service.ts` (один generic-метод вместо трёх копий)
- ✅ Rate limiter добавлен (100 общих запросов, 10 для /api/auth/login)
- ✅ express-validator схемы созданы (6 схем)
- ✅ 14 тестов написаны и проходят (3 unit + 11 integration)
- ✅ React-фронтенд инициализирован: Vite + React 19 + TypeScript 6 + Tailwind CSS v4
- ✅ TypeScript компилируется без ошибок (`npx tsc -b --noEmit` — exit 0)
- ✅ Vite build успешен (118 modules, 330KB JS + 20KB CSS)
- ✅ Базовый лейаут: Sidebar (6 пунктов) + Header (тема, профиль, выход) + Toast
- ✅ API-слой: Axios с JWT-интерцептором + 7 API-модулей
- ✅ AuthContext: login, logout, hasPermission, проверка токена при загрузке
- ✅ ThemeContext: тёмная/светлая тема с сохранением в localStorage
- ✅ LoginPage: форма входа с валидацией и обработкой ошибок
- ✅ DashboardPage: 5 карточек статистики + топ-5 стран + таймлайн (все через API)
- ✅ ProfilePage: отображение всех полей пользователя
- ✅ Healthcheck endpoint (`/api/health`) + Docker HEALTHCHECK
- ✅ Dockerfile обновлён (multi-stage build)
- ✅ docker-compose.yml обновлён (healthcheck для backend)
- ✅ Старый `server.js` сохранён для обратной совместимости
- ✅ **DataTable<T>** — generic компонент таблицы с loading/empty/table состояниями
- ✅ **TableHeader** — сортируемые заголовки с индикатором направления
- ✅ **TableRow** — строка с inline-редактированием, бейджами, кнопками действий, двойным кликом для исключения
- ✅ **EditableCell** — inline-редактирование с Enter/Escape
- ✅ **MseBadges** — цветные бейджи для номеров МСЭ (1-15)
- ✅ **FilterBar** — GlobalSearch + ColumnFilter (до 6 filterable колонок) + сброс + общее количество
- ✅ **ColumnFilter** — фильтр по колонке
- ✅ **GlobalSearch** — поиск с Enter
- ✅ **SourceTabs** — табы-фильтры по источнику
- ✅ **Pagination** — навигация с эллипсисом, выбор размера страницы, общее количество
- ✅ **Modal** — переиспользуемый модал с backdrop, Escape, scroll lock
- ✅ **AddRecordModal** — форма добавления записи с редактируемыми колонками
- ✅ **ExceptionModal** — форма исключения записи (note_out, date_out, who_out)
- ✅ **CsvImport** — импорт CSV с парсингом
- ✅ **CsvExport** — экспорт CSV с BOM для Excel
- ✅ **usePagination** — хук управления состоянием пагинации
- ✅ **useRecords<T>** — generic хук загрузки пагинированных данных
- ✅ **usePermissions** — хук проверки прав доступа
- ✅ **IpRecordsPage** — полная CRUD страница (IP Источники)
- ✅ **IocRecordsPage** — полная CRUD страница (IOC Хеши)
- ✅ **WhiteIpRecordsPage** — полная CRUD страница (Белые IP)
- ✅ **UsersPage** — полная CRUD страница управления пользователями (таблица, create/edit/toggle/password/delete, 3 модальных окна)
- ✅ **StatsCard** — карточка статистики с SVG-иконкой и цветным индикатором
- ✅ **TopCountriesChart** — горизонтальный BarChart (Recharts) для топ-5 стран
- ✅ **TimelineChart** — вертикальный BarChart (Recharts) для поступлений по месяцам
- ✅ **DashboardPage** — обновлена с HTML-баров на Recharts компоненты
- ✅ **24 frontend-теста** — все проходят (Vitest + React Testing Library)
- ✅ **vitest.config.ts** — настроен Vitest (jsdom, globals, setup)
- ✅ **usePagination.test.ts** — 8 тестов (инициализация, setPage, setLimit, toggleSort, setFilter, clearFilters, setGlobalSearch, reset)
- ✅ **Modal.test.tsx** — 5 тестов (рендер, backdrop, Escape, custom width)
- ✅ **Pagination.test.tsx** — 7 тестов (page info, total, limit, prev/next disabled, ellipsis, single page)
- ✅ **StatsCard.test.tsx** — 4 теста (label/value, locale formatting, zero, icon types)

### [ГОТОВО] — Этап 8 (Docker + финальный деплой)
- ✅ Frontend Dockerfile переписан на multi-stage build (Vite build → Nginx)
- ✅ Backend Dockerfile очищен от копирования старого фронтенда
- ✅ Старый Vanilla JS фронтенд полностью удалён (frontend/js/, frontend/css/, 5 HTML-файлов)
- ✅ Nginx настроен: SPA routing (try_files /index.html), proxy /api/ и /api-docs → backend, кеширование статики 1 год
- ✅ docker-compose.yml: 3 сервиса (database, backend, frontend), healthcheck для БД и backend
- ✅ Осталось: запустить `docker compose build` локально для финальной проверки

---

## 4. ОТКРЫТЫЕ ПРОБЛЕМЫ

### Известные баги / ошибки
- ❌ **Нет**: TypeScript компилируется без ошибок (`npx tsc -b --noEmit` — exit 0)
- ❌ **Нет**: все 14 backend-тестов проходят (`npx jest` — exit 0)
- ❌ **Нет**: Vite build успешен (`npx vite build` — exit 0, 118 modules)
- ⚠️ **Предупреждение npm**: `glob@11.1.0 deprecated`, `inflight@1.0.6 deprecated` — не влияют на работу
- ⚠️ **bcrypt install scripts**: не настроены `allowScripts` — может влиять на Docker-сборку

### Нерешённые архитектурные вопросы
- ❓ **Старый server.js всё ещё работает**: новый TypeScript-код дублирует функциональность. Нужно решить, когда переключать трафик на новый код и удалять старый
- ❓ **Путь к frontend в index.ts**: `path.join(__dirname, '../../frontend')` — при запуске из `dist/` может не совпадать. Нужно протестировать в Docker
- ❓ **Типы для jsonwebtoken**: пришлось использовать числовой `expiresIn` (7 дней в секундах) вместо строки `'7d'` из-за несовместимости типов TypeScript 6
- ❓ **Тесты с реальной БД**: текущие integration-тесты не подключаются к реальной PostgreSQL. Для полноценного тестирования API нужен testcontainers или mock
- ❓ **Docker build не протестирован**: на машине разработки не установлен Docker. Нужно запустить `docker compose build` локально

---

## 5. КОНФИГУРАЦИЯ / ОКРУЖЕНИЕ

### Переменные окружения (backend/.env)
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

### Зависимости (новые, установленные в сессии)
**Production:**
- `express-rate-limit@^7.5.0` — rate limiting

**Dev:**
- `typescript@^6.0.3` — TypeScript
- `ts-node@^10.9.2` — запуск TS напрямую
- `nodemon@^3.1.14` — авто-перезапуск
- `jest@^29.7.0` + `ts-jest@^29.3.2` — тесты
- `supertest@^7.1.0` + `@types/supertest` — HTTP-тесты
- `@types/*` — все TypeScript-тайпинги (express, node, bcrypt, jsonwebtoken, pg, cors, swagger, jest)

### Команды для запуска
```bash
# Backend (новый, TypeScript)
cd backend
npm run dev              # разработка (nodemon + ts-node)
npm run build            # компиляция в dist/
npm start                # запуск скомпилированного кода (node dist/index.js)
npm test                 # запуск тестов (jest)
npm run lint             # проверка TypeScript (tsc --noEmit)

# Frontend (React + Vite)
cd frontend
npm run dev              # разработка (Vite dev server с proxy /api → localhost:3000)
npm run build            # production сборка (Vite build)
npm run preview          # предпросмотр production сборки
npm run lint             # проверка TypeScript (tsc -b --noEmit)

# Backend (старый, JS — для обратной совместимости)
node backend/server.js

# Docker
docker compose up -d     # полный запуск (БД + backend + frontend)
```

---

## 6. БЫСТРЫЙ СТАРТ ДЛЯ НОВОГО ЧАТА

Скопируй и вставь это в новый чат:

```
Я работаю над проектом IP/IOC Manager — системой управления IP-адресами и индикаторами компрометации (IOC) для кибербезопасности. Это трёхкомпонентное веб-приложение (Nginx → Express → PostgreSQL).

Текущий статус: **все 8 этапов миграции завершены**. Backend полностью переписан на TypeScript (модульная архитектура: 7 роутов, 8 контроллеров, 2 сервиса, 3 middleware, 14 тестов). Frontend полностью переписан на React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 (60+ файлов: DataTable<T>, FilterBar, Pagination, Modal, CSV, хуки usePagination/useRecords<T>/usePermissions, 3 страницы записей с полным CRUD, UsersPage, DashboardPage с Recharts, 24 теста). Docker: multi-stage build для frontend (Vite → Nginx) и backend (tsc → node), Nginx с SPA routing и проксированием API. Старый Vanilla JS фронтенд удалён.

Структура: frontend/src/ (main.tsx, App.tsx, types/, api/, context/, hooks/, utils/, components/{layout,ui,table,filters,pagination,modal,csv,dashboard}, pages/, test/).

Остановились на том, что нужно запустить `docker compose build` для финальной проверки сборки.

План миграции: plans/migration-v2.md
Анализ проекта: New-project-README.md
Полный лог сессии: plans/session-log.md
```

---

## 7. ЖУРНАЛ ИСПРАВЛЕНИЙ (FIX)

### FIX 1-19 (Round 1-2) — Исправления после деплоя
- **FIX 1**: `crypto.randomUUID()` → `Date.now().toString(36) + Math.random().toString(36).slice(2, 10)` (NotificationContext)
- **FIX 2**: SourceTabs — группировка по Организация №1 (1-11 IP, 1-3 IOC) и Организация №2 (12-15 IP, 4-6 IOC)
- **FIX 3**: MseBadges — toggle-режим с активными квадратиками
- **FIX 4**: ExceptionModal — полный редизайн (note_out textarea, date_out/who_out read-only, кнопка очистки)
- **FIX 5**: AddRecordModal — левая/правая колонки, правильный порядок полей
- **FIX 6**: UsersPage — поля full_name, email, is_active, can_* permissions
- **FIX 7**: ProfilePage — права доступа для admin
- **FIX 8**: CSV экспорт — разделитель `;` (точка с запятой)
- **FIX 9**: clearWhiteIpRecords — исправлен endpoint
- **FIX 10**: FilterBar — filterable колонки вынесены в TableHeader
- **FIX 11**: TypeScript build — исправлены ошибки
- **FIX 12**: SourceTabs — исправлен лейаут (скролл, отступы)
- **FIX 13**: FilterBar — перенесён в шапку таблицы, индивидуальные кнопки сброса
- **FIX 14**: GlobalSearch — debounce 400ms, расширенные колонки поиска
- **FIX 15**: Backend inline editing — merge через `??` (частичное обновление)
- **FIX 16**: AddRecordModal — словарь стран, real-time валидация, правильный порядок полей, авто date_in/who_in
- **FIX 17**: "IP-адресс" → "IP-адрес" (исправление опечатки везде)

### FIX 18-30 (Round 3) — Исправления после тестирования
- **FIX 18**: Rate limiter 429 — `authMax` увеличен с 10 до 20
- **FIX 19**: Column filters single-char — выделен `FilterInput` с локальным состоянием + debounce 400ms
- **FIX 20**: Missing column filters — `filterable: true` добавлен всем колонкам, убрано ограничение по типу
- **FIX 21**: AddRecordModal порядок полей — note_in, date_in*, who_in
- **FIX 22**: note_in как textarea — `rows={3}`, `maxLength={128}`
- **FIX 23**: Date auto-fill — поле `date` автозаполняется текущей датой
- **FIX 24**: Required field highlighting — `*` у обязательных полей
- **FIX 25**: Inline validation — ip/date/country в EditableCell
- **FIX 26**: Enter scroll — `e.preventDefault()` в EditableCell
- **FIX 27**: mse_method — тип изменён на `readonly`
- **FIX 28**: note_out — тип изменён на `readonly`
- **FIX 29**: FilterInput debounce — исправлен useEffect (local !== value)
- **FIX 30**: date_in hint — обновлён

### FIX 31-39 (Round 4, часть 1) — Исправления после тестирования
- **FIX 31**: Column filters — `useRef` для стабилизации `onChange` в FilterInput
- **FIX 32**: mse_method — readonly рендеринг исправлен (сырое значение вместо formatDate)
- **FIX 33**: Page position jumps — scroll preservation в useRecords (save/restore через ref)
- **FIX 34**: Page position jumps — то же исправление (покрывает edit/delete/mse toggle)
- **FIX 35**: AddRecordModal — добавлены date_out/who_out поля
- **FIX 36**: note_in textarea — `rows={3}` → `rows={6}`
- **FIX 37**: Truncate — 40 → 16 символов, `block truncate` CSS
- **FIX 38**: Fixed table widths — `table-layout: fixed`, `width` вместо `maxWidth`, `overflow-hidden`
- **FIX 39**: date_in формат — `getCurrentDateTime()` (ДД.ММ.ГГГГ ЧЧ:ММ), валидация даты с временем

### FIX 40-47 (Round 4, часть 2) — Исправления после тестирования
- **FIX 40**: Rate limiter — `authMax` 20 → 200, Retry-After таймер в уведомлении (client.ts + LoginPage)
- **FIX 41**: Column filters — `FilterInput` переписан: `colKey` + `onFilterChange` как отдельные props через refs; `DataTable` переписан: `TableHeader` всегда виден, спиннер только в `<tbody>`
- **FIX 42**: mse_method — тип `readonly` → `cidr`, валидация `xxx.xxx.xxx.xxx/xx` или `-`
- **FIX 43**: date_out/who_out — убраны из авто-заполнения AddRecordModal (только при исключении)
- **FIX 44**: IOC indicator — валидация hex в EditableCell (тип `hash`)
- **FIX 45**: Auto-detect encoding — по длине хеша (MD5=32, SHA1=40, SHA256=64) на бэке и фронте
- **FIX 46**: ExceptionModal — исправлен raw JSX в label (строка → React-элемент)
- **FIX 47**: date_out/who_out — убраны из модалок добавления записей

### FIX 48-53 (Round 5) — Исправления после тестирования
- **FIX 48**: `useRecords` — переписан механизм загрузки: стабильная `load()` через `paginationRef`, отслеживание изменений через сериализованную строку `currentParamsKey`. Решена проблема бесконечного ре-рендера из-за нового объекта `pagination.filters` при каждом рендере. Теперь `load()` вызывается только при реальном изменении параметров (page, limit, sortBy, sortOrder, filters, globalSearch)
- **FIX 49**: Column filters — исправлены через FIX 48 (теперь `setFilter` корректно триггерит `load()` без лишних ре-рендеров)
- **FIX 50**: SourceTabs counts — добавлены бэкенд-endpoint'ы `GET /api/records/mse-counts`, `GET /api/ioc-records/mse-counts`, `GET /api/white-ip-records/mse-counts`. Фронтенд загружает counts со всего сервера (не только с текущей страницы). Добавлен `mseRefreshCounter` для обновления counts после мутаций (add/edit/delete/toggleMse)
- **FIX 51**: Scroll preservation — исправлен через FIX 48 (теперь `load()` вызывается только при изменении параметров, scroll не сбрасывается на каждом ре-рендере)
- **FIX 52**: Scroll preservation — то же, что FIX 51 (покрывает пагинацию)
- **FIX 53**: Scroll preservation — то же, что FIX 51 (покрывает inline edit)
- **FIX 54**: AddRecordModal — удалены `FIELD_HINTS` для `date_out`/`who_out`, удалена валидация `date_out` из `validateField`
- **FIX 55**: Backend `mse` filter — добавлена обработка query-параметра `mse` в `getRecordsPaginated`, `getIocRecordsPaginated`, `getWhiteIpRecordsPaginated` (добавляется в `filters` как `'Где внесено'`)

### FIX 56-62 (Round 6) — Финальные исправления после тестирования
- **FIX 56**: `useRecords` — ПОЛНОСТЬЮ ПЕРЕПИСАН. Убран `paginationRef`/`currentParamsKey` подход (ломавший SourceTabs). Новая версия: стабильная `load()` через refs (`fetchFnRef`, `addNotificationRef`, `errorMessageRef`), `useEffect` с правильными зависимостями: `[pagination.page, pagination.limit, pagination.sortBy, pagination.sortOrder, JSON.stringify(pagination.filters), pagination.globalSearch, fetchFn]`. `fetchFn` включён в зависимости — это чинит SourceTabs, т.к. при изменении `activeMse` → `extraParams` → `fetchFn` → `load()` вызывается. Scroll preservation через отдельный `useEffect` на `loading`.
- **FIX 57**: Column filters — добавлен `filterKeyMap` в `useRecords`. `IP_FILTER_KEY_MAP`, `IOC_FILTER_KEY_MAP`, `WHITE_IP_FILTER_KEY_MAP` в `constants.ts` мапят английские ключи колонок (`ip`, `country`, `date` и т.д.) в русские (`IP-адрес`, `Страна`, `Дата получения`), которые ожидает бэкенд в `columnMap`. Без этого маппинга бэкенд не находил колонку и игнорировал фильтр.
- **FIX 58**: SourceTabs — починены через FIX 56. `fetchFn` теперь в зависимостях `useEffect`, поэтому при клике на вкладку (`activeMse` меняется → `extraParams` меняется → `fetchRecords` пересоздаётся) `load()` вызывается с новыми параметрами.
- **FIX 59**: AddRecordModal — проверено: `IP_RIGHT_FIELDS = ['note_in', 'date_in', 'who_in']`, `date_out`/`who_out` отсутствуют. `date_in`/`who_in` присутствуют и авто-заполняются. Всё корректно.
- **FIX 60**: Rate limiter — `authMax` увеличен с 200 до 2000 (20 человек × 100 попыток). Убран Retry-After таймер из `client.ts` (теперь просто "Слишком много запросов, попробуйте позже" без вычисления минут). Упрощён `LoginPage.tsx` — убран `_rateLimitMessage`, показывается простое сообщение.
- **FIX 61**: Scroll preservation — починен через FIX 56. Стабильная `load()` + правильные зависимости `useEffect` гарантируют, что `load()` вызывается только при реальном изменении параметров. Scroll сохраняется через `scrollPosRef` и восстанавливается через `requestAnimationFrame` после `loading = false`.

### FIX 63-65 (Round 7) — Исправления после повторного тестирования
- **FIX 63**: Rate limiter — общий `max` увеличен с 100 до 2000 запросов за 15 минут. Ранее был увеличен только `authMax` (для `/api/auth/login`), но общий лимит в 100 запросов быстро исчерпывался при активном тестировании (редактирование ячеек = PUT, загрузка страниц = GET).
- **FIX 64**: `useRecords` — исправлен критический баг: стабильная `load()` (пустые зависимости `[]`) читала `pagination.page`, `pagination.limit`, `pagination.filters`, `pagination.globalSearch` и `filterKeyMap` **напрямую из замыкания первого рендера**. Когда параметры менялись, `useEffect` вызывал `load()`, но она использовала старые значения. **Решение**: добавлен `paginationRef` (обновляется каждый рендер) и `filterKeyMapRef`. `load()` читает всё через refs, поэтому всегда использует актуальные значения.
- **FIX 65**: AddRecordModal — `editableColumns` фильтровал `col.type !== 'readonly'`, из-за чего `date_in`/`who_in` (тип `readonly`) не отображались в модалке. **Решение**: убран фильтр `type !== 'readonly'`. Read-only поля теперь отображаются как заблокированные (серый фон, `readOnly={true}`), что уже было реализовано в `renderField` через `isAutoField`.

### FIX 66-70 (Round 8) — Новые доработки после тестирования
- **FIX 66**: AddRecordModal (IOC) — добавлен счётчик символов под полем "Индикатор компрометации" и радиобаттоны md5/sha1/sha256/sha512. При вводе хеша автоматически определяется кодировка по длине: 32 → md5, 40 → sha1, 64 → sha256, 128 → sha512. Радиобаттоны нередактируемые (readOnly), загораются автоматически.
- **FIX 67**: ProfilePage — исправлен статус "Заблокирован" у активного админа. Проблема была в `backend/src/db/pool.ts`: `ensureAdminExists()` создавал админа без поля `is_active`, из-за чего в БД проставлялся `DEFAULT false`. Добавлен `is_active = true` в INSERT запрос.
- **FIX 68**: UsersPage — убраны дублированные поля (Должность, Отдел, Email, Активен были продублированы в модальном окне создания пользователя). Добавлена валидация: логин ≥4 символов, пароль ≥16 символов, ФИО обязательно для заполнения. Без этих 3 полей создание пользователя запрещено.
- **FIX 69**: CsvExport — в имя файла добавлена дата и время: `ip-records_14.07.26_1530.csv`. Формат: `_dd.mm.yy_hhmm.csv`.
- **FIX 70**: CsvImport — добавлена полная валидация перед импортом. **Исправления после тестирования**:
  - **Маппинг заголовков**: CSV-файл содержит русские заголовки колонок ("IP-адрес", "Страна"), а код проверял по английским ключам (`ip`, `country`). Добавлен `headerToKeyMap`: русский заголовок → английский ключ через `columns[].label`. Теперь `record` содержит английские ключи, и валидация работает.
  - **Авто-заполнение**: Если в CSV отсутствуют `date_in` и `who_in`, они автоматически заполняются текущей датой/временем и именем текущего пользователя (`currentUser`). Добавлен проп `currentUser` в `CsvImportProps`.
  - **Улучшена валидация длины**: теперь показывает сколько символов введено: "максимум 64 символа (введено 65)".
  - Убран проп `variant` из `CsvImportProps` (не используется).
  - Обновлены все 3 страницы: передают `currentUser` в `CsvImport`.
  - **FIX 70 (Round 8 — повторное тестирование)**: Полная переработка CsvImport:
    - **Разделитель `;`**: переписан парсер на `parseCSVLine()` из оригинального Vanilla JS (разделитель `;`, поддержка кавычек `"`). Ранее использовался `line.split(',')` (запятая), из-за чего вся строка парсилась как одно поле.
    - **Нечёткое сопоставление заголовков (`fuzzyMatchHeader`)**: если точное совпадение `col.label === header` не найдено, пробуются: (1) case-insensitive сравнение, (2) известные опечатки (`"IP-адресс"` → `"IP-адрес"`, два 'с' → один 'с'), (3) поиск по ключевым словам (`"адрес"` → `ip`, `"страна"` → `country`).
    - **BOM-обработка**: если первый символ файла — BOM (`0xFEFF`), он удаляется перед парсингом.
    - **Поиск заголовка**: больше не предполагается, что заголовок — строка `lines[0]`. Код ищет первую непустую строку в файле.
    - **Фильтрация пустых записей**: добавлена `isRecordEmpty()` — запись считается пустой, если ВСЕ её поля пусты. Такие записи отбрасываются перед валидацией.
    - **Расширенное логирование**: `console.log()` выводит: первые 200 символов файла, индекс строки заголовка, распарсенные заголовки, `headerToKeyMap`, количество записей до/после фильтрации, пример первой записи в JSON.

### FIX 71 (Round 8 — FIX 70 тестирование) — CSV импорт: ошибка 500 "malformed array literal"
- **Проблема**: после исправления парсинга CSV (FIX 70) импорт стал возвращать `POST /api/records 500 (Internal Server Error)`. В логах бэкенда: `malformed array literal: ""`.
- **Причина**: поле `mses` в CSV было пустым (`""`), а в БД `mses` имеет тип `int[]` (массив целых чисел). PostgreSQL не может преобразовать пустую строку в массив.
- **Исправление на бэкенде** (3 контроллера):
  - [`backend/src/controllers/records.controller.ts`](backend/src/controllers/records.controller.ts:115) — `const mses = data.mses ?? null`
  - [`backend/src/controllers/iocRecords.controller.ts`](backend/src/controllers/iocRecords.controller.ts:113) — `const mses = data.mses ?? null`
  - [`backend/src/controllers/whiteIpRecords.controller.ts`](backend/src/controllers/whiteIpRecords.controller.ts:77) — `const mses = data.mses ?? null`
- **Исправление на фронтенде** ([`frontend/src/components/csv/CsvImport.tsx`](frontend/src/components/csv/CsvImport.tsx:378)):
  - Добавлена очистка пустого `mses` перед отправкой: `if (record.mses === '') { delete record.mses }`

### FIX 72-75 (Round 9) — Доработки CSV импорта/экспорта после тестирования
- **FIX 72**: CsvExport — квадратики `mses` разделялись `;` (точка с запятой), что ломало импорт. Изменено на `,` (запятая): [`frontend/src/components/csv/CsvExport.tsx`](frontend/src/components/csv/CsvExport.tsx:41) — `value.join(',')`.
- **FIX 73**: CsvImport — добавлена проверка обязательных полей ("золотой минимум"):
  - IP / White-IP: `date`, `from_source`, `ip`, `note_in`
  - IOC: `date`, `from_source`, `indicator`, `note_in`
  - Если хотя бы одно из обязательных полей пустое — импорт блокируется, показывается лог ошибок.
- **FIX 74**: CsvImport — добавлено:
  - **Автоопределение кодировки IOC**: если поле `encoding` пустое, а `indicator` заполнен, кодировка определяется по длине хеша (32→md5, 40→sha1, 64→sha256, 128→sha512).
  - **Валидация длины хеша**: проверка, что длина `indicator` равна 32, 40, 64 или 128. Если нет — ошибка с подсказкой: "По длине N определена кодировка X, но ожидается Y символов".
  - **Прогресс-бар**: индикатор загрузки под кнопкой импорта (0% → 30% → 70% → 90% → 100%). Кнопка блокируется на время импорта.
  - **Возвращён prop `variant`** в `CsvImportProps` (ip/ioc/white-ip) для определения списка обязательных полей.
- **FIX 75**: Обновлены все 3 страницы — добавлен `variant` в `<CsvImport>`:
  - [`IpRecordsPage.tsx`](frontend/src/pages/IpRecordsPage.tsx:179) — `variant="ip"`
  - [`IocRecordsPage.tsx`](frontend/src/pages/IocRecordsPage.tsx:178) — `variant="ioc"`
  - [`WhiteIpRecordsPage.tsx`](frontend/src/pages/WhiteIpRecordsPage.tsx:178) — `variant="white-ip"`
- **FIX 76**: CsvImport — парсинг `mses` из строки `"3,5,7"` в массив чисел. **Критический баг**: изначально использовался `JSON.stringify(parts)`, который отправлял строку `"[3,5,7]"` вместо массива `[3,5,7]`. Бэкенд ожидает `number[]`. Исправлено на прямое присваивание массива через приведение типа: `;(record as unknown as Record<string, unknown>).mses = parts`. Также добавлена фильтрация `n >= 1 && n <= 15` (как в оригинальном Vanilla JS).
- **FIX 77**: CsvImport — модальное окно прогресса по центру экрана с счётчиком "Загружено N из M". Прогресс-бар под кнопкой заменён на модальное окно. `onImport` теперь асинхронный с callback `onProgress(current, total)`. Все 3 страницы обновлены.
- **FIX 78**: CsvImport — `handleCsvImport` на всех страницах теперь вызывает `onProgress(i + 1, records.length)` после каждой отправленной записи, что обновляет модальное окно прогресса в реальном времени.
- **FIX 79**: Docker build — исправлена ошибка `TS6133: 'progress' is declared but its value is never read`. Удалены неиспользуемые `progress`/`setProgress` из состояния CsvImport. Все вызовы `setProgress(...)` заменены на `setImportProgress(...)`.

### FIX 79 (Round 9 — Docker build) — TS6133: unused variable 'progress'
- **Проблема**: при сборке Docker (`docker compose build frontend`) TypeScript 6 выдавал ошибку `TS6133: 'progress' is declared but its value is never read`.
- **Причина**: в [`CsvImport.tsx`](frontend/src/components/csv/CsvImport.tsx) остались неиспользуемые переменные состояния `progress`/`setProgress` от старой реализации прогресс-бара (FIX 74). После замены на модальное окно (FIX 77) эти переменные не использовались, но не были удалены.
- **Исправление**: удалены `progress`/`setProgress` из `useState`. Все вызовы `setProgress(...)` заменены на `setImportProgress(...)`.
- **Текущий статус**: код готов к тестированию. Пользователю нужно выполнить `docker compose build frontend && docker compose up -d` и проверить импорт CSV с `"1,2,4"` в колонке "Где внесено".

---

*Сгенерирован: 2026-07-09T14:49 UTC+3 (обновлён: 2026-07-13T17:54 UTC+3 — Round 9: FIX 72-78)*