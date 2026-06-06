const express = require('express');
const cors = require('cors');
// const pool = require('./db'); заменил строкой ниже
const { pool, ensureAdminExists } = require('./db');
const path = require('path');
const authRoutes = require('./auth');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const userRoutes = require('./users');

const app = express();
const port = process.env.PORT || 3000;

// Для логов с IP адресом
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Отдаём статические файлы из папки frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔑 Проверка токена:', token ? 'есть' : 'нет');
    console.log('📝 Заголовки:', req.headers);
    
    if (!token) {
        console.log('❌ Токен отсутствует');
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Ошибка верификации токена:', err.message);
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        console.log('✅ Токен валиден, пользователь:', user);
        req.user = user;
        next();
    });
};

// ==================== МАРШРУТЫ АВТОРИЗАЦИИ (НЕ ТРЕБУЮТ ТОКЕНА) ====================
// Подключаем маршруты авторизации
app.use('/api/auth', authRoutes);

// ==================== MIDDLEWARE ДЛЯ АВТОРИЗАЦИИ ====================
// Все следующие API маршруты требуют авторизацию
app.use('/api', authenticateToken);

// ==================== МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ ====================
app.use('/api/users', userRoutes);

// ==================== API ENDPOINTS ====================

// Получить все записи
app.get('/api/records', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ip_records ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении записей' });
    }
});

// ==================== API ДЛЯ IP RECORDS С ПАГИНАЦИЕЙ ====================

// Получить записи с пагинацией, сортировкой и фильтрацией
app.get('/api/records/paginated', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'id';
        const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        
        // Парсим фильтры из строки запроса
        let filters = {};
        if (req.query.filters) {
            try {
                filters = JSON.parse(req.query.filters);
            } catch (e) {
                console.error('Ошибка парсинга фильтров:', e);
            }
        }
        
        // Глобальный поиск
        const globalSearch = req.query.globalSearch || '';
        
        // Карта соответствия имён колонок в БД
        const columnMap = {
            'id': 'id',
            'Где внесено': 'mses',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'Домен': 'domain',
            'IP-адресс': 'ip',
            'Страна': 'country',
            'Владелец': 'owner',
            'Как внесено на МСЭ': 'mse_method',
            'Примечание к внесению': 'note_in',
            'Заявки': 'soib_infr',
            'Дата внесения': 'date_in',
            'Кто вносил': 'who_in',
            'Примечание к исключению': 'note_out',
            'Дата исключения': 'date_out',
            'Кто исключил': 'who_out'
        };
        
        const dbSortBy = columnMap[sortBy] || 'id';
        
        // Строим WHERE условия
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        // Фильтры по колонкам
        for (const [column, value] of Object.entries(filters)) {
            if (value && value !== '') {
                const dbColumn = columnMap[column];
                if (dbColumn) {
                    if (dbColumn === 'mses') {
                        // Для квадратиков: ищем по числам
                        const numbers = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        if (numbers.length > 0) {
                            whereClauses.push(`${dbColumn} && $${paramIndex}::int[]`);
                            queryParams.push(numbers);
                            paramIndex++;
                        }
                    } else {
                        whereClauses.push(`${dbColumn} ILIKE $${paramIndex}`);
                        queryParams.push(`%${value}%`);
                        paramIndex++;
                    }
                }
            }
        }
        
        // Глобальный поиск
        if (globalSearch && globalSearch !== '') {
            const searchColumns = ['ip', 'from_source', 'domain', 'owner', 'soib_infr', 'note_in'];
            const searchConditions = searchColumns.map(col => `${col} ILIKE $${paramIndex}`);
            whereClauses.push(`(${searchConditions.join(' OR ')})`);
            queryParams.push(`%${globalSearch}%`);
            paramIndex++;
        }
        
        // Собираем WHERE строку
        let whereStr = '';
        if (whereClauses.length > 0) {
            whereStr = ' WHERE ' + whereClauses.join(' AND ');
        }
        
        // Основной запрос с пагинацией
        const query = `
            SELECT * FROM ip_records
            ${whereStr}
            ORDER BY ${dbSortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        // Запрос для подсчёта общего количества
        const countQuery = `
            SELECT COUNT(*) FROM ip_records
            ${whereStr}
        `;
        
        const queryParamsWithLimit = [...queryParams, limit, offset];
        
        // Выполняем запросы
        const result = await pool.query(query, queryParamsWithLimit);
        const countResult = await pool.query(countQuery, queryParams);
        
        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: page,
            limit: limit,
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
        
    } catch (err) {
        console.error('❌ Ошибка в paginated API:', err.message);
        res.status(500).json({ error: 'Ошибка при получении записей' });
    }
});

// Получить одну запись по ID
app.get('/api/records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM ip_records WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении записи' });
    }
});

// Создать новую запись
app.post('/api/records', authenticateToken, async (req, res) => {
    try {
        const { 
            mses, date, from_source, letter, domain, ip, 
            country, owner, mse_method, note_in, soib_infr, date_in, who_in,
            note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `INSERT INTO ip_records 
            (mses, date, from_source, letter, domain, ip, country, owner, 
             mse_method, note_in, soib_infr, date_in, who_in, note_out, date_out, who_out) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING *`,
            [mses, date, from_source, letter, domain, ip, country, owner, 
             mse_method, note_in, soib_infr || '-', date_in, who_in, note_out, date_out, who_out]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при создании записи' });
    }
});

// Обновить запись
app.put('/api/records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            mses, date, from_source, letter, domain, ip, 
            country, owner, mse_method, note_in, soib_infr, date_in, who_in,
            note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `UPDATE ip_records 
            SET mses = $1, date = $2, from_source = $3, letter = $4, domain = $5, 
                ip = $6, country = $7, owner = $8, mse_method = $9,
                note_in = $10, soib_infr = $11, date_in = $12, who_in = $13,
                note_out = $14, date_out = $15, who_out = $16, updated_at = CURRENT_TIMESTAMP
            WHERE id = $17 
            RETURNING *`,
            [mses, date, from_source, letter, domain, ip, country, owner, 
             mse_method, note_in, soib_infr, date_in, who_in, note_out, date_out, who_out, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при обновлении записи' });
    }
});

// Удалить запись
app.delete('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM ip_records WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json({ message: 'Запись удалена', deleted: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при удалении записи' });
    }
});

// Тестовый endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Сервер работает!', time: new Date() });
});

// ==================== АДМИНСКИЕ ОПЕРАЦИИ ====================

// Очистить таблицу ip_records (только для админа)
app.delete('/api/admin/clear-ip-records', authenticateToken, async (req, res) => {
    try {
        // Проверяем, что пользователь админ
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Только администратор может выполнять эту операцию' });
        }
        
        // Получаем количество записей до удаления
        const countResult = await pool.query('SELECT COUNT(*) FROM ip_records');
        const count = parseInt(countResult.rows[0].count);
        
        // Очищаем таблицу
        await pool.query('TRUNCATE TABLE ip_records RESTART IDENTITY');
        
        // Логируем действие
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'CLEAR_IP_RECORDS', JSON.stringify({ deleted_count: count })]
        );
        
        res.json({ success: true, message: `Очищено ${count} записей из таблицы IP источников` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при очистке таблицы' });
    }
});

// Очистить таблицу ioc_records (только для админа)
app.delete('/api/admin/clear-ioc-records', authenticateToken, async (req, res) => {
    try {
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Только администратор может выполнять эту операцию' });
        }
        
        const countResult = await pool.query('SELECT COUNT(*) FROM ioc_records');
        const count = parseInt(countResult.rows[0].count);
        
        await pool.query('TRUNCATE TABLE ioc_records RESTART IDENTITY');
        
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'CLEAR_IOC_RECORDS', JSON.stringify({ deleted_count: count })]
        );
        
        res.json({ success: true, message: `Очищено ${count} записей из таблицы IOC хешей` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при очистке таблицы' });
    }
});

// Очистить всех пользователей (кроме текущего админа)
app.delete('/api/admin/clear-users', authenticateToken, async (req, res) => {
    try {
        // Проверяем, что пользователь админ
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Только администратор может выполнять эту операцию' });
        }
        
        // Получаем количество пользователей до удаления (кроме текущего админа)
        const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE id != $1', [req.user.userId]);
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
            return res.json({ success: true, message: 'Нет пользователей для очистки (кроме администратора)' });
        }
        
        // Начинаем транзакцию
        await pool.query('BEGIN');
        
        // Сначала удаляем связанные записи в user_logs для удаляемых пользователей
        await pool.query('DELETE FROM user_logs WHERE user_id IN (SELECT id FROM users WHERE id != $1)', [req.user.userId]);
        
        // Затем удаляем всех пользователей, кроме текущего админа
        await pool.query('DELETE FROM users WHERE id != $1', [req.user.userId]);
        
        // Сбрасываем последовательность ID
        await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 2');
        
        // Логируем действие
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'CLEAR_USERS', JSON.stringify({ deleted_count: count })]
        );
        
        // Завершаем транзакцию
        await pool.query('COMMIT');
        
        res.json({ success: true, message: `Очищено ${count} пользователей. Администратор сохранён.` });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Ошибка при очистке пользователей:', err.message);
        res.status(500).json({ error: 'Ошибка при очистке пользователей' });
    }
});



// ВАЖНО: этот маршрут ДОЛЖЕН быть ПОСЛЕ всех API маршрутов
// Перенаправляем все не-API запросы на index.html
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        next();
    }
});

// Запуск сервера
app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 Сервер запущен на http://192.168.52.145:${port}`);
    console.log(`📝 API endpoints:`);
    console.log(`   GET    /api/test`);
    console.log(`   GET    /api/records`);
    console.log(`   GET    /api/records/:id`);
    console.log(`   POST   /api/records`);
    console.log(`   PUT    /api/records/:id`);
    console.log(`   DELETE /api/records/:id`);
    console.log(`📁 Фронтенд доступен по адресу: http://192.168.52.145:${port}`);
    
    // Добавляем задержку перед проверкой администратора
    setTimeout(() => {
        ensureAdminExists();
    }, 3000);
});

// ==================== API ДЛЯ IOC RECORDS ====================

// Получить все IOC записи
app.get('/api/ioc-records', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ioc_records ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении IOC записей' });
    }
});

// ==================== API ДЛЯ IOC RECORDS С ПАГИНАЦИЕЙ ====================

// Получить IOC записи с пагинацией, сортировкой и фильтрацией
app.get('/api/ioc-records/paginated', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'id';
        const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        
        // Парсим фильтры из строки запроса
        let filters = {};
        if (req.query.filters) {
            try {
                filters = JSON.parse(req.query.filters);
            } catch (e) {
                console.error('Ошибка парсинга фильтров:', e);
            }
        }
        
        // Глобальный поиск
        const globalSearch = req.query.globalSearch || '';
        
        // Карта соответствия имён колонок в БД
        const columnMap = {
            'id': 'id',
            'Где внесено': 'mses',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'Индикатор компрометации': 'indicator',
            'Кодировка': 'encoding',
            'Статус OpenTip': 'status_opentip',
            'Статус VirusTotal': 'status_virustotal',
            'Примечание к внесению': 'note_in',
            'Дата внесения': 'date_in',
            'Кто вносил': 'who_in',
            'Примечание к исключению': 'note_out',
            'Дата исключения': 'date_out',
            'Кто исключил': 'who_out'
        };
        
        const dbSortBy = columnMap[sortBy] || 'id';
        
        // Строим WHERE условия
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        // Фильтры по колонкам
        for (const [column, value] of Object.entries(filters)) {
            if (value && value !== '') {
                const dbColumn = columnMap[column];
                if (dbColumn) {
                    if (dbColumn === 'mses') {
                        const numbers = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        if (numbers.length > 0) {
                            whereClauses.push(`${dbColumn} && $${paramIndex}::int[]`);
                            queryParams.push(numbers);
                            paramIndex++;
                        }
                    } else {
                        whereClauses.push(`${dbColumn} ILIKE $${paramIndex}`);
                        queryParams.push(`%${value}%`);
                        paramIndex++;
                    }
                }
            }
        }
        
        // Глобальный поиск
        if (globalSearch && globalSearch !== '') {
            const searchColumns = ['indicator', 'from_source', 'note_in'];
            const searchConditions = searchColumns.map(col => `${col} ILIKE $${paramIndex}`);
            whereClauses.push(`(${searchConditions.join(' OR ')})`);
            queryParams.push(`%${globalSearch}%`);
            paramIndex++;
        }
        
        // Собираем WHERE строку
        let whereStr = '';
        if (whereClauses.length > 0) {
            whereStr = ' WHERE ' + whereClauses.join(' AND ');
        }
        
        // Основной запрос с пагинацией
        const query = `
            SELECT * FROM ioc_records
            ${whereStr}
            ORDER BY ${dbSortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        // Запрос для подсчёта общего количества
        const countQuery = `
            SELECT COUNT(*) FROM ioc_records
            ${whereStr}
        `;
        
        const queryParamsWithLimit = [...queryParams, limit, offset];
        
        const result = await pool.query(query, queryParamsWithLimit);
        const countResult = await pool.query(countQuery, queryParams);
        
        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: page,
            limit: limit,
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
        
    } catch (err) {
        console.error('❌ Ошибка в IOC paginated API:', err.message);
        res.status(500).json({ error: 'Ошибка при получении записей' });
    }
});

// Получить одну IOC запись по ID
app.get('/api/ioc-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM ioc_records WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Запись не найдена' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении записи' });
    }
});

// Создать новую IOC запись
app.post('/api/ioc-records', authenticateToken, async (req, res) => {
    try {
        const { 
            mses, date, from_source, letter, indicator, encoding,
            status_opentip, status_virustotal, note_in, date_in,
            who_in, note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `INSERT INTO ioc_records 
            (mses, date, from_source, letter, indicator, encoding,
             status_opentip, status_virustotal, note_in, date_in,
             who_in, note_out, date_out, who_out) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            RETURNING *`,
            [mses, date, from_source, letter, indicator, encoding,
             status_opentip, status_virustotal, note_in, date_in,
             who_in, note_out, date_out, who_out]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при создании IOC записи' });
    }
});

// Обновить IOC запись
app.put('/api/ioc-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            mses, date, from_source, letter, indicator, encoding,
            status_opentip, status_virustotal, note_in, date_in,
            who_in, note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `UPDATE ioc_records 
            SET mses = $1, date = $2, from_source = $3, letter = $4,
                indicator = $5, encoding = $6, status_opentip = $7,
                status_virustotal = $8, note_in = $9, date_in = $10,
                who_in = $11, note_out = $12, date_out = $13,
                who_out = $14, updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 
            RETURNING *`,
            [mses, date, from_source, letter, indicator, encoding,
             status_opentip, status_virustotal, note_in, date_in,
             who_in, note_out, date_out, who_out, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при обновлении IOC записи' });
    }
});

// Удалить IOC запись
app.delete('/api/ioc-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM ioc_records WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json({ message: 'Запись удалена', deleted: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при удалении записи' });
    }
});