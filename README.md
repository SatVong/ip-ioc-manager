# IP/IOC Manager

Система управления IP-адресами и индикаторами компрометации (IOC) для мониторинга угроз кибербезопасности.

## 🚀 Быстрый старт

### Требования
- Docker и Docker Compose
- Свободные порты 80 и 5432

### Запуск одной командой

```bash
git clone <repo-url>
cd ip-ioc-manager
docker compose up -d
```

Открыть в браузере: http://localhost

### Учётные данные по умолчанию

| Поле   | Значение   |
| ------ | ---------- |
| Логин  | `admin`    |
| Пароль | `admin123` |
## 📖 Документация API

Swagger UI доступен после запуска: http://localhost/api-docs

## 🔧 Разработка

### Локальный запуск без Docker

1. Установить PostgreSQL 15+
2. Выполнить `docker/init.sql`
3. Создать `backend/.env` (пример ниже)
4. `cd backend && npm install && npm start`
5. Открыть `frontend/index.html` через nginx или Live Server

```env
DB_HOST=localhost
DB_USER=postgres-ip-manager
DB_PASSWORD=vhtuajmsavdshs213fvsdcv
DB_NAME=ipioc_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

## 📁 Структура проекта

```
ip-ioc-manager/
├── backend/                 # Node.js/Express API
│   ├── server.js            # Основной сервер
│   ├── auth.js              # Авторизация (JWT)
│   ├── users.js             # Управление пользователями
│   ├── db.js                # Подключение к PostgreSQL
│   └── swagger.js           # OpenAPI документация
├── frontend/                # Веб-интерфейс (Vanilla JS)
│   ├── js/                  # Модульный JavaScript
│   │   ├── api/             # API-клиенты
│   │   ├── ui/              # UI-компоненты
│   │   ├── actions/         # CRUD-операции
│   │   ├── validators/      # Валидация полей
│   │   └── pagination/      # Серверная пагинация
│   ├── css/                 # Модульные стили
│   └── *.html               # Страницы
├── docker/                  # Docker-конфигурация
│   └── init.sql             # Инициализация БД
├── docker-compose.yml       # Оркестрация контейнеров
├── ARCHITECTURE.md          # Архитектура проекта
├── REPORT.md                # История разработки
└── README.md                # Этот файл
```

## 📊 Возможности

- 🔐 JWT-авторизация с ролевой моделью (админ/пользователь)
- 📋 CRUD для IP источников, Белых IP, IOC хешей
- 🔍 Фильтрация, сортировка, глобальный поиск
- 📄 Пагинация на стороне сервера
- 📥 Импорт/экспорт CSV
- 🎨 Тёмная/светлая тема
- 🌱 Заполнение демо-данными (105 записей)
- 🗑️ Административная очистка таблиц
- 📖 Swagger/OpenAPI документация
- 🐳 Полная Docker-контейнеризация

