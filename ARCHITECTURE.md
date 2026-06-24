# Архитектура IP/IOC Manager

## Обзор

Трёхкомпонентное веб-приложение для управления списками IP-адресов и хешами индикаторов компрометации.

## Стек технологий

| Слой            | Технология                              | Версия |
| --------------- | --------------------------------------- | ------ |
| Backend         | Node.js + Express.js                    | 20+    |
| База данных     | PostgreSQL                              | 16     |
| Frontend        | Vanilla JavaScript (ES Modules)         | —      |
| CSS             | Custom Properties + модульная структура | —      |
| Контейнеризация | Docker + Docker Compose                 | —      |

## Диаграмма развёртывания

```
┌──────────────────────────────────────────┐
│              Docker Host                  │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Frontend │  │ Backend  │  │Database│ │
│  │ (Nginx)  │  │(Express) │  │ (PG)   │ │
│  │  :80     │←─│  :3000   │──│ :5432  │ │
│  └──────────┘  └──────────┘  └────────┘ │
│       │                              │   │
└───────┼──────────────────────────────┼───┘
        │                              │
    Browser                    Volume (data)
```

## Структура базы данных

```
users              — Пользователи и права
ip_records         — IP источники (15 МСЭ)
white_ip_records   — Белые IP адреса
ioc_records        — IOC хеши (6 МСЭ)
user_logs          — Логи действий
```

## API Endpoints (31 метод)

### Авторизация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь
- `POST /api/auth/logout` — выход

### Пользователи (7 методов)
- `GET/POST /api/users` — список/создание
- `GET/PUT/DELETE /api/users/:id` — CRUD
- `PUT /api/users/:id/password` — смена пароля
- `PATCH /api/users/:id/toggle` — блокировка

### IP Источники (6 методов)
- `GET/POST /api/records` — список/создание
- `GET /api/records/paginated` — пагинация с фильтрами
- `GET/PUT/DELETE /api/records/:id` — CRUD

### IOC Хеши (6 методов)
- `GET/POST /api/ioc-records` — список/создание
- `GET /api/ioc-records/paginated` — пагинация с фильтрами
- `GET/PUT/DELETE /api/ioc-records/:id` — CRUD

### Белые IP (4 метода)
- `GET /api/white-ip-records/paginated` — пагинация
- `POST /api/white-ip-records` — создание
- `PUT/DELETE /api/white-ip-records/:id` — CRUD

### Администрирование (4 метода)
- `POST /api/admin/seed-demo-data` — заполнение демо-данными
- `DELETE /api/admin/clear-ip-records` — очистка IP
- `DELETE /api/admin/clear-ioc-records` — очистка IOC
- `DELETE /api/admin/clear-users` — очистка пользователей

## Архитектура Frontend

```
app.js ── точка входа для IP источников
  ├── ui/ipTable.js        — отрисовка таблицы
  ├── ui/ipFilters.js      — фильтры и поиск
  ├── ui/ipModals.js       — модальные окна
  ├── ui/ipExceptions.js   — исключение записей
  ├── ui/ipImportExport.js — CSV импорт/экспорт
  ├── ui/ipValidation.js   — валидация полей
  └── actions/ipActions.js — CRUD, MSE, пагинация

ioc.js ── точка входа для IOC хешей (аналогичная структура)

white-ip.js ── точка входа для Белых IP (аналогичная структура)
```

## Потоки данных

### Аутентификация
```
Browser → POST /api/auth/login → Backend → PostgreSQL (users)
         ← JWT token ← Backend ← user data
```

### Загрузка данных таблицы
```
Browser → GET /api/records/paginated?page=1&limit=10&sortBy=id&sortOrder=desc&filters={}&globalSearch=
         ← {data: [...], total: N, page: 1, totalPages: M}
```

### Редактирование ячейки
```
Browser → PUT /api/records/:id {field: newValue} → Backend → PostgreSQL
         ← 200 OK
```

## Безопасность

- JWT токены с экспирацией (7 дней)
- Пароли хешированы bcrypt (10 раундов)
- Ролевая модель: admin (полный доступ), user (по правам)
- CORS middleware
- Nginx проксирует запросы

## План развития (v.2.0)

### Что будем добавлять
- ✅ Миграция frontend на React + TypeScript
- ✅ Сборщик Vite вместо прямых импортов ES-модулей
- ✅ CSS Modules / Tailwind CSS для изоляции стилей
- ✅ Unit/интеграционные тесты (Jest + Supertest)
- ✅ Дашборт-сводная (содержит количество всех записей, Топ 5 стран, периодичность поступления IP)

### От чего отказываемся
- ❌ Vanilla JS → React (компонентный подход)
- ❌ Глобальный CSS → CSS Modules (изоляция)
- ❌ Прямые ES-импорты → Vite bundle (производительность)
- ❌ Ручное тестирование → Автоматические тесты
- ❌ `window.*` экспорты → React state management