-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    can_create BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT true,
    can_delete BOOLEAN DEFAULT false,
    can_import BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT true,
    can_manage_users BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Таблица IP записей
CREATE TABLE IF NOT EXISTS ip_records (
    id SERIAL PRIMARY KEY,
    mses INTEGER[] DEFAULT '{}',
    date VARCHAR(10),
    from_source VARCHAR(64),
    letter VARCHAR(24),
    domain VARCHAR(64),
    ip VARCHAR(15),
    mask VARCHAR(3),
    country VARCHAR(2),
    owner VARCHAR(64),
    mse_method VARCHAR(100),
    note_in VARCHAR(128),
    date_in VARCHAR(16),
    who_in VARCHAR(100),
    note_out VARCHAR(128),
    date_out VARCHAR(16),
    who_out VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов
CREATE TABLE IF NOT EXISTS user_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ip_records_ip ON ip_records(ip);
CREATE INDEX IF NOT EXISTS idx_ip_records_date ON ip_records(date);

-- Создаём администратора
INSERT INTO users (username, password_hash, full_name, email, role, can_manage_users, can_delete, can_import)
SELECT 'admin', '$2b$10$pdPIQ4VGZHsilAWvtYoG3uA6hdCOJLggitQVL4Ih8H1Iy9X3FKrmG', 'Главный администратор', 'admin@local', 'admin', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');