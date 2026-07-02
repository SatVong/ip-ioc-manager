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

#### Frontend (React + TypeScript + Vite) — Этап 5 (UsersPage)
- `frontend/src/pages/UsersPage.tsx` — **обновлён** с заглушки до полной CRUD страницы управления пользователями

### ИЗМЕНЁННЫЕ ФАЙЛЫ
- `backend/package.json` — добавлены скрипты (build, dev, test, lint), зависимости (typescript, jest, supertest, express-rate-limit, @types/*)
- `docker-compose.yml` — добавлен healthcheck для backend сервиса
- `frontend/src/pages/IpRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (DataTable, FilterBar, Pagination, AddRecordModal, ExceptionModal, CsvImport, CsvExport, usePagination, useRecords, usePermissions)
- `frontend/src/pages/IocRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (тот же паттерн)
- `frontend/src/pages/WhiteIpRecordsPage.tsx` — **обновлён** с заглушки до полной CRUD страницы (тот же паттерн)
- `frontend/src/pages/UsersPage.tsx` — **обновлён** с заглушки до полной CRUD страницы управления пользователями

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

### [В ПРОЦЕССЕ] — частично сделано
- 🔄 **Этап 6 (Дашборд с Recharts)**: DashboardPage уже создана, но использует простые HTML-бары вместо Recharts
- 🔄 **Этап 7 (Тесты фронтенда)**: не начат
- 🔄 **Этап 8 (Docker + деплой)**: Dockerfile обновлён, но multi-stage не протестирован в полном цикле

### [В ПЛАНЕ] — обсуждали, но не начали
- 📋 Дашборд с Recharts (StatsCard, TopCountries, TimelineChart компоненты)
- 📋 Тесты фронтенда (Vitest + React Testing Library)
- 📋 Полное удаление старого Vanilla JS фронтенда
- 📋 Финальное тестирование Docker-сборки

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
- ❓ **Старый Vanilla JS фронтенд**: файлы в `frontend/js/`, `frontend/css/`, `frontend/*.html` всё ещё существуют рядом с новыми React-файлами

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

Текущий статус: завершён Этап 5 (UsersPage с полным CRUD). Созданы: DataTable<T>, FilterBar, Pagination, Modal, CSV, хуки usePagination/useRecords<T>/usePermissions, 3 страницы записей (IpRecordsPage, IocRecordsPage, WhiteIpRecordsPage) с полным CRUD, UsersPage с таблицей пользователей и 3 модальными окнами (create/edit/password). TypeScript компилируется без ошибок, Vite build успешен (119 modules, 349KB JS + 20KB CSS).

Структура фронтенда: frontend/src/ (main.tsx, App.tsx, types/, api/, context/, hooks/, utils/, components/{layout,ui,table,filters,pagination,modal,csv}, pages/).

Остановились на том, что нужно переходить к Этапу 6 (Дашборд с Recharts).

План миграции: plans/migration-v2.md
Анализ проекта: New-project-README.md
Полный лог сессии: plans/session-log.md
```

---

*Сгенерирован: 2026-07-02T17:19 UTC+3 (обновлён: Этап 5 — UsersPage с полным CRUD)*