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

### ИЗМЕНЁННЫЕ ФАЙЛЫ
- `backend/package.json` — добавлены скрипты (build, dev, test, lint), зависимости (typescript, jest, supertest, express-rate-limit, @types/*)
- `docker-compose.yml` — добавлен healthcheck для backend сервиса

---

## 2. ТЕКУЩАЯ АРХИТЕКТУРА

### Стек технологий
| Слой | Технология | Версия |
|------|-----------|--------|
| Backend | Node.js + Express.js (TypeScript) | 20+ |
| База данных | PostgreSQL | 16 |
| Frontend (старый) | Vanilla JS (ES Modules) | — |
| Frontend (новый) | React + TypeScript + Vite | **в плане** |
| CSS | Custom Properties + модульная структура | — |
| Контейнеризация | Docker + Docker Compose | — |
| Тесты | Jest + Supertest + ts-jest | — |

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
├── controllers/          ← 8 контроллеров (логика запросов)
├── services/
│   ├── pagination.service.ts  ← общая пагинация
│   └── dashboard.service.ts   ← дашборд (stats, top-countries, timeline)
├── types/                ← TypeScript типы
└── utils/
    └── validators.ts     ← express-validator схемы
```

### Поток данных
1. Запрос → `index.ts` → rate limiter → auth routes (без токена) или authenticateToken → роут → контроллер → сервис/БД → ответ
2. Пагинация: все три таблицы (ip_records, ioc_records, white_ip_records) используют один `getPaginatedData<T>()` с разными columnMap/searchColumns

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
- ✅ Healthcheck endpoint (`/api/health`) + Docker HEALTHCHECK
- ✅ Dockerfile обновлён (multi-stage build)
- ✅ docker-compose.yml обновлён (healthcheck для backend)
- ✅ Старый `server.js` сохранён для обратной совместимости

### [В ПРОЦЕССЕ] — частично сделано
- 🔄 **Этап 3-6 (React-фронтенд)**: не начат. Нужно инициализировать Vite + React + Tailwind, создать компоненты
- 🔄 **Этап 7 (Тесты фронтенда)**: не начат
- 🔄 **Этап 8 (Docker + деплой)**: Dockerfile обновлён, но multi-stage не протестирован в полном цикле

### [В ПЛАНЕ] — обсуждали, но не начали
- 📋 Миграция фронтенда на React + TypeScript + Vite
- 📋 Универсальная таблица `DataTable<T>` (вместо 3 копий)
- 📋 Дашборд со статистикой (Recharts)
- 📋 Tailwind CSS
- 📋 Тесты фронтенда (Vitest + React Testing Library)
- 📋 Полное удаление старого Vanilla JS фронтенда

---

## 4. ОТКРЫТЫЕ ПРОБЛЕМЫ

### Известные баги / ошибки
- ❌ **Нет**: TypeScript компилируется без ошибок (`npx tsc --noEmit` — exit 0)
- ❌ **Нет**: все 14 тестов проходят (`npx jest` — exit 0)
- ⚠️ **Предупреждение npm**: `glob@11.1.0 deprecated`, `inflight@1.0.6 deprecated` — не влияют на работу
- ⚠️ **bcrypt install scripts**: не настроены `allowScripts` — может влиять на Docker-сборку

### Нерешённые архитектурные вопросы
- ❓ **Старый server.js всё ещё работает**: новый TypeScript-код дублирует функциональность. Нужно решить, когда переключать трафик на новый код и удалять старый
- ❓ **Путь к frontend в index.ts**: `path.join(__dirname, '../../frontend')` — при запуске из `dist/` может не совпадать. Нужно протестировать в Docker
- ❓ **Типы для jsonwebtoken**: пришлось использовать числовой `expiresIn` (7 дней в секундах) вместо строки `'7d'` из-за несовместимости типов TypeScript 6
- ❓ **Тесты с реальной БД**: текущие integration-тесты не подключаются к реальной PostgreSQL. Для полноценного тестирования API нужен testcontainers или mock

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

Текущий статус: завершён Этап 1 миграции на v.2.0. Бэкенд переведён на TypeScript, разбит на модули (6 роутов + 7 контроллеров + сервис пагинации), добавлен rate limiter, express-validator, 7 тестов (все проходят), healthcheck, multi-stage Dockerfile. Старый server.js сохранён для обратной совместимости.

Структура нового бэкенда: backend/src/ (index.ts, config/, db/, middleware/, routes/, controllers/, services/pagination.service.ts, types/, utils/validators.ts).

Остановились на том, что нужно переходить к Этапу 3 (React-фронтенд: Vite + React + TypeScript + Tailwind).

План миграции: plans/migration-v2.md
Анализ проекта: New-project-README.md
Полный лог сессии: plans/session-log.md
```

---

*Сгенерирован: 2026-07-02T12:15 UTC+3 (обновлён: добавлен дашборд)*