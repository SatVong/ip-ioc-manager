const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres-ip-manager',
    host: 'localhost',
    database: 'ipioc_db',
    password: 'vhtuajmsavdshs213fvsdcv',
    port: 5432,
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