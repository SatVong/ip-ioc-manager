# Архитектура проекта IP & IOC Manager

## 📋 Общее описание

IP & IOC Manager — это система управления IP-адресами и индикаторами компрометации (IOC) для корпоративной системы информационной безопасности. Проект реализует веб-интерфейс на фронтенде и REST API на бэкенде с базой данных PostgreSQL.

---

## 🏗️ Общая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        Фронтенд (Nginx)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  index   │  │  ioc     │  │  users   │  │  profile │        │
│  │  html    │  │  html    │  │  html    │  │  html    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│        │             │              │              │            │
│        └─────────────┴──────────────┴──────────────┘            │
│                          │                                      │
│                  HTTP/HTTPS (80/443)                            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    Бэкенд (Node.js/Express)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    server.js                              │  │
│  │  ├── /api/auth/*      → auth.js                          │  │
│  │  ├── /api/users/*     → users.js                         │  │
│  │  ├── /api/records/*   → inline handlers                  │  │
│  │  ├── /api/ioc-records/* → inline handlers                │  │
│  │  └── /admin/*         → inline handlers                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                  ┌───────┴───────┐                              │
│                  │ JWT Auth      │                              │
│                  └───────────────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                   База данных (PostgreSQL)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   users      │  │ ip_records   │  │ ioc_records  │        │
│  │   user_logs  │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Структура проекта

```
ip-ioc-manager/
├── docker-compose.yml          # Оркестрация контейнеров
├── init.sql                    # Инициализация БД
├── ARCHITECTURE.md             # Этот файл
├── frontend/
│   ├── index.html              # Главная страница (IP источники)
│   ├── ioc.html                # Страница IOC хешей
│   ├── users.html              # Управление пользователями
│   ├── profile.html            # Профиль пользователя
│   ├── login.html              # Страница входа
│   ├── css/
│   │   └── style.css          # Общие стили
│   ├── js/
│   │   ├── config.js          # Конфигурация API
│   │   ├── app.js             # Общие функции
│   │   ├── auth/
│   │   │   ├── login.js       # Логика входа
│   │   │   ├── profile.js     # Логика профиля
│   │   │   └── users.js       # Логика управления пользователями
│   │   ├── ip/                # Логика IP источников
│   │   └── ioc/               # Логика IOC хешей
│   └── Dockerfile             # Сборка Nginx
├── backend/
│   ├── server.js              # Основной файл приложения
│   ├── auth.js                # Эндпоинты аутентификации
│   ├── users.js               # Эндпоинты управления пользователями
│   ├── db.js                  # Подключение к PostgreSQL
│   ├── .env                   # Конфигурация (секреты)
│   └── Dockerfile             # Сборка Node.js
└── README.md
```

---

## 🔐 Архитектура безопасности

### Аутентификация и авторизация

| Компонент | Описание |
|-----------|----------|
| **JWT Tokens** | JSON Web Tokens сроком действия 7 дней |
| **BCrypt** | Хеширование паролей с солью (10 rounds) |
| **Rate limiting** | Не реализовано (рекомендуется добавить) |
| **CORS** | Включён для всех доменов (рекомендуется ограничить) |
| **SQL Injection** | Защита через параметризованные запросы |

### Ролевая модель доступа

| Роль | can_create | can_edit | can_delete | can_import | can_export | can_manage_users |
|------|-----------|----------|------------|------------|------------|------------------|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **user** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### Уровни доступа

1. **Администратор** — полный доступ ко всем функциям
2. **Пользователь** — ограниченный доступ без прав управления пользователями и удаления

---

## 🗄️ Структура базы данных

### Таблица `users`

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| username | VARCHAR(64) | Логин (уникальный) |
| password_hash | TEXT | BCrypt хеш пароля |
| full_name | TEXT | Полное имя |
| position | TEXT | Должность |
| department | TEXT | Отдел |
| email | VARCHAR(255) | Email |
| role | VARCHAR(16) | 'admin' или 'user' |
| can_create | BOOLEAN | Создание записей |
| can_edit | BOOLEAN | Редактирование |
| can_delete | BOOLEAN | Удаление |
| can_import | BOOLEAN | Импорт CSV |
| can_export | BOOLEAN | Экспорт CSV |
| can_manage_users | BOOLEAN | Управление пользователями |
| last_login | TIMESTAMP | Последний вход |
| created_at | TIMESTAMP | Дата создания |
| is_active | BOOLEAN | Активен ли аккаунт |

### Таблица `ip_records`

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| mses | INT[] | Квадратики (массив 1-8) |
| date | DATE | Дата получения |
| from_source | VARCHAR(64) | Откуда получено |
| letter | VARCHAR(24) | Раздел письма |
| domain | VARCHAR(64) | Домен |
| ip | INET | IP-адрес |
| country | VARCHAR(2) | Страна (2 буквы) |
| owner | VARCHAR(64) | Владелец |
| mse_method | TEXT | Метод внесения на МСЭ |
| note_in | TEXT | Примечание к внесению |
| soib_infr | TEXT | Заявки/ infringements |
| date_in | DATE | Дата внесения |
| who_in | TEXT | Кто вносил |
| note_out | TEXT | Примечание к исключению |
| date_out | DATE | Дата исключения |
| who_out | TEXT | Кто исключил |

### Таблица `ioc_records`

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| mses | INT[] | Квадратики (массив 1-4) |
| date | DATE | Дата получения |
| from_source | VARCHAR(64) | Откуда получено |
| letter | VARCHAR(24) | Раздел письма |
| indicator | VARCHAR(128) | Индикатор (MD5/SHA1/SHA256/SHA512) |
| encoding | VARCHAR(16) | Кодировка хеша |
| status_opentip | VARCHAR(32) | Статус OpenTip |
| status_virustotal | VARCHAR(32) | Статус VirusTotal |
| note_in | TEXT | Примечание к внесению |
| date_in | DATE | Дата внесения |
| who_in | TEXT | Кто вносил |
| note_out | TEXT | Примечание к исключению |
| date_out | DATE | Дата исключения |
| who_out | TEXT | Кто исключил |

### Таблица `user_logs`

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| user_id | INT | ID пользователя (FK) |
| action | VARCHAR(32) | Действие (LOGIN, LOGOUT, CREATE_USER и т.д.) |
| details | TEXT | Дополнительные данные (JSON) |
| ip_address | INET | IP-адрес запроса |
| created_at | TIMESTAMP | Время действия |

---

## 🔄 API endpoints

### Аутентификация (`/api/auth/*`)

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|-------------------|
| POST | `/api/auth/login` | Вход в систему | ❌ |
| GET | `/api/auth/me` | Данные текущего пользователя | ✅ |
| POST | `/api/auth/logout` | Выход | ✅ |

### Управление пользователями (`/api/users/*`)

| Метод | Эндпоинт | Описание | Требует авторизации |
|-------|----------|----------|-------------------|
| GET | `/api/users` | Список всех пользователей | ✅ (can_manage_users) |
| GET | `/api/users/:id` | Данные одного пользователя | ✅ (can_manage_users) |
| POST | `/api/users` | Создать пользователя | ✅ (can_manage_users) |
| PUT | `/api/users/:id` | Обновить пользователя | ✅ (can_manage_users) |
| PATCH | `/api/users/:id/toggle` | Блокировка/разблокировка | ✅ (только админ) |
| DELETE | `/api/users/:id` | Удалить пользователя | ✅ (только админ) |
| PUT | `/api/users/:id/password` | Сменить пароль | ✅ (только свой) |

### IP записи (`/api/records/*`)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/records` | Все записи |
| GET | `/api/records/paginated` | С пагинацией, фильтрацией, сортировкой |
| GET | `/api/records/:id` | Одна запись |
| POST | `/api/records` | Создать запись |
| PUT | `/api/records/:id` | Обновить запись |
| DELETE | `/api/records/:id` | Удалить запись |

### IOC записи (`/api/ioc-records/*`)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/ioc-records` | Все записи |
| GET | `/api/ioc-records/paginated` | С пагинацией |
| GET | `/api/ioc-records/:id` | Одна запись |
| POST | `/api/ioc-records` | Создать запись |
| PUT | `/api/ioc-records/:id` | Обновить запись |
| DELETE | `/api/ioc-records/:id` | Удалить запись |

### Админские операции (`/api/admin/*`)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| DELETE | `/api/admin/clear-ip-records` | Очистить все IP записи |
| DELETE | `/api/admin/clear-ioc-records` | Очистить все IOC записи |
| DELETE | `/api/admin/clear-users` | Очистить всех пользователей (кроме админа) |

---

## 🛠️ Технологический стек

### Фронтенд
- **HTML5** — структура
- **CSS3** — стили (переменные CSS, Flexbox, Grid)
- **JavaScript (ES6+)** — логика
- **Font Awesome 6.4.0** — иконки
- **Nginx** — веб-сервер

### Бэкенд
- **Node.js 20** — runtime
- **Express.js 4.22** — веб-фреймворк
- **PostgreSQL 15+** — база данных
- **bcrypt 6.0** — хеширование паролей
- **jsonwebtoken 9.0** — JWT токены
- **express-validator 7.3** — валидация

---

## 🐳 Docker-архитектура

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres-ip-manager
      POSTGRES_PASSWORD: ...
      POSTGRES_DB: ipioc_db
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_USER: ...
      DB_PASSWORD: ...
      DB_NAME: ipioc_db
      JWT_SECRET: ...
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 🚀 Сценарии использования

### Сценарий 1: Вход в систему
1. Пользователь открывает `http://localhost/login.html`
2. Вводит логин и пароль
3. Фронтенд отправляет POST запрос на `/api/auth/login`
4. Бэкенд проверяет пароль через bcrypt
5. Возвращает JWT токен
6. Токен сохраняется в `localStorage`

### Сценарий 2: Добавление IP-адреса
1. Пользователь заходит на главную страницу
2. Нажимает "Добавить запись"
3. Заполняет форму (дата, источник, IP, страна, владелец и т.д.)
4. Фронтенд отправляет POST на `/api/records`
5. Бэкенд добавляет запись в `ip_records`
6. Возвращается созданный объект

### Сценарий 3: Импорт CSV
1. Пользователь выбирает файл CSV
2. Фронтенд читает файл и отправляет POST на `/api/import`
3. (Рекомендуется реализовать этот endpoint)
4. Данные добавляются в базу

### Сценарий 4: Управление пользователями (админ)
1. Админ заходит в "Управление пользователями"
2. Видит список всех пользователей
3. Может создавать, редактировать, удалять аккаунты
4. Все действия логируются в `user_logs`

---

## 📊 Основные функции

| Функция | Статус | Описание |
|---------|--------|----------|
| Аутентификация | ✅ | JWT token + bcrypt |
| Ролевая модель | ✅ | admin/user + права доступа |
| CRUD IP записей | ✅ | Полный цикл |
| CRUD IOC записей | ✅ | Полный цикл |
| Пагинация | ✅ | Настройка размера страницы |
| Фильтрация | ✅ | По колонкам + глобальный поиск |
| Сортировка | ✅ | По любой колонке |
| Темная тема | ✅ | Сохранение в localStorage |
| Экспорт CSV | ✅ | Скачивание данных |
| Импорт CSV | ⚠️ | Частично (нет backend endpoint) |
| Смена пароля | ✅ | Для своего аккаунта |
| Логирование действий | ✅ | user_logs |
| Очистка таблиц (админ) | ✅ | TRUNCATE + логирование |

---

## ⚠️ Рекомендации по улучшению

### Критичные (обязательно)

1. **Rate limiting** — ограничить количество запросов к `/api/auth/login`
   ```javascript
   // Пример с express-rate-limit
   const rateLimit = require('express-rate-limit');
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 минут
     max: 5 // 5 попыток входа
   });
   app.post('/api/auth/login', loginLimiter, authRoutes);
   ```

2. **CORS origin whitelist** — ограничить доступ к API
   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: ['http://localhost:80', 'https://yourdomain.com']
   }));
   ```

3. **HTTPS** — в production использовать HTTPS
   - Добавить Nginx с SSL сертификатом
   - Или использовать Let's Encrypt

### Важные (желательно)

4. **Валидация входных данных** — добавить express-validator на все POST/PUT
   ```javascript
   const { body, validationResult } = require('express-validator');
   app.post('/api/records', 
     [
       body('ip').isIP(),
       body('date').isDate(),
       body('from_source').isLength({ max: 64 })
     ],
     validate, handler
   );
   ```

5. **Валидация email при создании пользователя** — обновить `/api/users`
   - Проверка формата email
   - Проверка, что email уникален

6. **Валидация IP-адресов** — добавить валидацию при создании/редактировании
   ```javascript
   const { v4: uuidv4 } = require('uuid');
   const ipaddr = require('ipaddr.js');
   function isValidIP(ip) {
     try {
       return ipaddr.isValid(ip);
     } catch (e) { return false; }
   }
   ```

7. **Валидация хешей (MD5/SHA1/SHA256)** — добавить в `/api/ioc-records`
   ```javascript
   function isValidHash(hash, type) {
     const patterns = {
       md5: /^[a-f0-9]{32}$/i,
       sha1: /^[a-f0-9]{40}$/i,
       sha256: /^[a-f0-9]{64}$/i
     };
     return patterns[type]?.test(hash);
   }
   ```

### Желательные (оптимизация)

8. **Индексация в PostgreSQL** — добавить индексы для частых запросов
   ```sql
   CREATE INDEX idx_ip_records_ip ON ip_records(ip);
   CREATE INDEX idx_ip_records_date ON ip_records(date DESC);
   CREATE INDEX idx_ip_records_from_source ON ip_records(from_source);
   CREATE INDEX idx_users_username ON users(username);
   CREATE INDEX idx_user_logs_user_id ON user_logs(user_id);
   ```

9. **Кэширование** — использовать Redis для кэширования часто запрашиваемых данных

10. **Swagger/OpenAPI** — документировать все API endpoints

11. **Логирование** — добавить Winston или Pino для логирования
    ```javascript
    const winston = require('winston');
    const logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
      ]
    });
    ```

12. **Тесты** — добавить unit/integration тесты
    ```bash
    npm install --save-dev jest supertest
    ```

---

## 🔍 Текущие проблемы (из код-ревью)

| Категория | Проблема | Приоритет | Статус |
|-----------|----------|-----------|--------|
| Безопасность | Пароль в `.env` | 🔴 Критичный | ✅ Исправлено (используются переменные) |
| Безопасность | CORS для всех доменов | 🔴 Критичный | ⚠️ Рекомендация |
| Безопасность | Rate limiting не реализован | 🔴 Критичный | ⚠️ Рекомендация |
| Безопасность | SQL injection (исправлено) | 🟢 Безопасно | ✅ Использованы параметры |
| Безопасность | XSS (проверить на фронтенде) | 🟡 Важно | ⚠️ Рекомендация |
| Архитектура | Встроенные эндпоинты в server.js | 🟡 Важно | ⚠️ Рекомендация |
| Производительность | Отсутствие индексов | 🟡 Важно | ⚠️ Рекомендация |
| Производительность | No database pooling | 🟢 PostgreSQL сам управляет | ✅ OK |
| Читаемость | Отсутствие TypeScript | 🟢 JS допустим | ⚠️ Желательно |
| Читаемость | Отсутствие Swagger | 🟢 Не критично | ⚠️ Желательно |