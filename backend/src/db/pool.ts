import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
});

export async function ensureAdminExists(): Promise<void> {
  const bcrypt = await import('bcrypt');

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (result.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);

      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, email, role, is_active, can_manage_users, can_delete, can_import)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['admin', hash, 'Главный администратор', 'admin@local', 'admin', true, true, true, true]
      );
      console.log('✅ Администратор создан');
    } else {
      console.log('✅ Администратор уже существует');
    }
  } catch (err) {
    console.error('Ошибка при проверке администратора:', (err as Error).message);
  }
}