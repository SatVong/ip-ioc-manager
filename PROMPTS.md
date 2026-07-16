# PROMPTS — IP/IOC Manager

> Полный список промптов (запросов) пользователя в хронологическом порядке.
> Сгенерирован: 2026-07-16

---

## Этап 1: Анализ проекта и планирование миграции

### Prompt 1 — Анализ текущего состояния
> Изучи проект ip-ioc-manager. Напиши анализ текущего состояния: что работает, что нет, слабые и сильные стороны, рекомендации по улучшению. Результат сохрани в файл New-project-README.md.

### Prompt 2 — План миграции на v2
> На основе анализа составь детальный план миграции на v.2.0. Разбей на этапы, укажи сроки, риски, зависимости. Сохрани в plans/migration-v2.md.

---

## Этап 2: Миграция бэкенда на TypeScript

### Prompt 3 — Stage 1: Backend TypeScript
> Приступаем к Stage 1. Перепиши backend с Vanilla JS на TypeScript. Разбей server.js (982 строки) на модульную архитектуру: routes, controllers, services, middleware. Сохрани server.js для обратной совместимости. Добавь rate limiting, express-validator, 14 тестов (Jest + Supertest).

### Prompt 4 — Stage 2: Dashboard backend
> Stage 2. Добавь на бэкенд 3 endpoint'а для дашборда: stats, top-countries, timeline. Создай dashboard.service.ts с 3 аналитическими SQL-запросами. Напиши 7 integration-тестов.

---

## Этап 3: Миграция фронтенда на React

### Prompt 5 — Stage 3: React + Vite + TypeScript + Tailwind
> Stage 3. Инициализируй React-фронтенд: Vite 8 + React 19 + TypeScript 6 + Tailwind CSS v4. Создай 35+ файлов: main.tsx, App.tsx, 3 контекста (Auth, Theme, Notification), 7 хуков, 7 страниц (заглушки), API-слой (Axios + JWT), лейаут (Sidebar + Header + Toast).

### Prompt 6 — Stage 4: DataTable<T> компонент
> Stage 4. Создай универсальный DataTable<T> с FilterBar, Pagination, Modal, CSV, хуками usePagination/useRecords/usePermissions. Все компоненты должны быть generic и переиспользуемыми.

### Prompt 7 — Stage 5: UsersPage
> Stage 5. Реализуй UsersPage с полным CRUD: таблица пользователей, create/edit/toggle/password/delete, 3 модальных окна.

### Prompt 8 — Stage 6: Dashboard с Recharts
> Stage 6. Обнови DashboardPage: замени HTML-бары на Recharts (StatsCard, TopCountriesChart, TimelineChart).

### Prompt 9 — Stage 7: Frontend тесты
> Stage 7. Напиши 24 frontend-теста (Vitest + React Testing Library): usePagination (8), Modal (5), Pagination (7), StatsCard (4).

---

## Этап 4: Docker и деплой

### Prompt 10 — Stage 8: Docker + deploy
> Stage 8. Создай Dockerfile для фронтенда (multi-stage Vite → Nginx), обнови backend Dockerfile, настрой Nginx (SPA routing + proxy API), удали старый Vanilla JS фронтенд. Обнови session-log.md.

---

## Этап 5: Исправления после деплоя (Rounds 1-14)

### Prompt 11 — Round 1: Первые баги
> После деплоя обнаружились проблемы: SourceTabs не работают, MseBadges не переключаются, ExceptionModal кривой, AddRecordModal с неправильным порядком полей. Исправь.

### Prompt 12 — Round 2: Продолжение исправлений
> UsersPage не показывает все поля, ProfilePage пустой, CSV экспорт с неправильным разделителем, clearWhiteIpRecords не работает. Исправь.

### Prompt 13 — Round 3: Фильтры и валидация
> Rate limiter слишком жёсткий (429), column filters не работают с одним символом, AddRecordModal не хватает полей, inline validation не работает. Исправь.

### Prompt 14 — Round 4 (часть 1): Scroll и фильтры
> Column filters теряют фокус, mse_method отображается как дата, страница прыгает при загрузке, truncate слишком длинный. Исправь.

### Prompt 15 — Round 4 (часть 2): Rate limiter и типы
> Rate limiter блокирует нормальную работу, column filters не отправляют запрос, mse_method должен быть CIDR, IOC encoding не определяется. Исправь.

### Prompt 16 — Round 5: useRecords и SourceTabs
> useRecords вызывает бесконечные ре-рендеры, SourceTabs не обновляют данные при клике, scroll preservation не работает. Полностью перепиши useRecords.

### Prompt 17 — Round 6: Финальные исправления
> useRecords всё ещё ломает SourceTabs, column filters не мапятся на русские ключи, rate limiter снова блокирует. Исправь фундаментально.

### Prompt 18 — Round 7: Рефакторинг useRecords
> useRecords использует старые значения из замыкания. Добавь refs для всех параметров. AddRecordModal не показывает readonly поля. Исправь.

### Prompt 19 — Round 8: CSV и новые доработки
> Добавь автоопределение кодировки IOC в AddRecordModal, исправь ProfilePage (админ заблокирован), UsersPage (дубли полей), CSV export (дата в имени), CSV import (полная переработка).

### Prompt 20 — Round 8 (FIX 70 тестирование): CSV import 500
> CSV импорт возвращает 500 "malformed array literal". Пустое поле mses ломает PostgreSQL. Исправь на бэкенде и фронтенде.

### Prompt 21 — Round 9: CSV доработки
> CSV export использует `;` для mses (конфликт с разделителем), CSV import не проверяет обязательные поля, нет прогресс-бара, mses парсится как строка. Исправь.

### Prompt 22 — Round 9 (Docker build): TS6133
> Docker build падает с TS6133: unused variable 'progress'. Удали неиспользуемые переменные.

### Prompt 23 — Round 10: Штриховка и дашборд
> Исключённые строки нечитаемы в тёмной теме. Замени сплошную заливку на диагональную штриховку. Удали лишние карточки с дашборда. Добавь 3 графика появления с фильтром периода.

### Prompt 24 — Round 11: Docker build tsc not found
> На свежем git clone Docker build падает с "tsc: not found". Исправь Dockerfile: добавь --include=dev и npx tsc.

### Prompt 25 — Round 12: Swagger UI 404
> Swagger UI не загружается (404 на ассеты). Проблема в Nginx: regex location перехватывает запросы к /api-docs/. Исправь Nginx конфиг, добавь 404.html, исправь Swagger server URL.

### Prompt 26 — Round 13: createUser, changePassword, ProfilePage
> createUser не передаёт is_active, changePassword возвращает 403 для админа, ProfilePage не имеет смены пароля, валидация пароля разная (6 vs 16). Исправь всё.

### Prompt 27 — Round 14: createUser сбрасывает is_active
> При создании пользователя с отметкой "Активен" пользователь создаётся неактивным. Проблема: updateUser после createUser не передаёт is_active, и toBool(undefined) возвращает false. Исправь. Также добавь в Swagger недостающий endpoint clear-white-ip-records.

---

## Этап 6: Финальные задачи

### Prompt 28 — Обновить README.md
> Перечитай файл 'README.md' и актуализируй его в соответствии с функционалом и возможностями проекта.

### Prompt 29 — Сохранить промпты
> Сохрани все промпты что я тебе писал в отдельный файл PROMPTS.MD в корне.

---

*Конец списка промптов.*