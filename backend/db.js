const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres-ip-manager',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ipioc_db',
    password: process.env.DB_PASSWORD || 'vhtuajmsavdshs213fvsdcv',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
});

async function ensureAdminExists() {
    const bcrypt = require('bcrypt');
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        
        if (result.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);
            
            await pool.query(
                `INSERT INTO users (username, password_hash, full_name, email, role, can_manage_users, can_delete, can_import) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                ['admin', hash, 'Главный администратор', 'admin@local', 'admin', true, true, true]
            );
            console.log('✅ Администратор создан');
        } else {
            console.log('✅ Администратор уже существует');
        }
    } catch (err) {
        console.error('Ошибка при проверке администратора:', err.message);
    }
}

module.exports = { pool, ensureAdminExists };