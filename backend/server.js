const express = require('express');
const cors = require('cors');
// const pool = require('./db'); заменил строкой ниже
const { pool, ensureAdminExists } = require('./db');
const swaggerUi = require('swagger-ui-express'); // swagger
const swaggerSpec = require('./swagger');        // swagger
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

// Swagger документация (без авторизации)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IP/IOC Manager API Docs'
}));

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


// ==================== API ДЛЯ WHITE IP RECORDS С ПАГИНАЦИЕЙ ====================

// Получить White IP записи с пагинацией, сортировкой и фильтрацией
app.get('/api/white-ip-records/paginated', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'id';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        
        let filters = {};
        if (req.query.filters) {
            try {
                filters = JSON.parse(req.query.filters);
            } catch (e) {}
        }
        
        const globalSearch = req.query.globalSearch || '';
        
        const columnMap = {
            'id': 'id',
            'Где внесено': 'mses',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'IP-адресс': 'ip',
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
        
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
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
        
        if (globalSearch && globalSearch !== '') {
            const searchColumns = ['ip', 'from_source', 'soib_infr', 'note_in'];
            const searchConditions = searchColumns.map(col => `${col} ILIKE $${paramIndex}`);
            whereClauses.push(`(${searchConditions.join(' OR ')})`);
            queryParams.push(`%${globalSearch}%`);
            paramIndex++;
        }
        
        let whereStr = '';
        if (whereClauses.length > 0) {
            whereStr = ' WHERE ' + whereClauses.join(' AND ');
        }
        
        const query = `
            SELECT * FROM white_ip_records
            ${whereStr}
            ORDER BY ${dbSortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const countQuery = `
            SELECT COUNT(*) FROM white_ip_records
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
        console.error('❌ Ошибка в white IP paginated API:', err.message);
        res.status(500).json({ error: 'Ошибка при получении записей' });
    }
});

// Создать новую White IP запись
app.post('/api/white-ip-records', authenticateToken, async (req, res) => {
    try {
        const { 
            mses, date, from_source, letter, ip, 
            mse_method, note_in, soib_infr, date_in, who_in,
            note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `INSERT INTO white_ip_records 
            (mses, date, from_source, letter, ip, 
             mse_method, note_in, soib_infr, date_in, who_in, note_out, date_out, who_out) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [mses, date, from_source, letter, ip, 
             mse_method, note_in, soib_infr || '-', date_in, who_in, note_out, date_out, who_out]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка при создании White IP записи:', err.message);
        res.status(500).json({ error: 'Ошибка при создании записи' });
    }
});

// Обновить White IP запись
app.put('/api/white-ip-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            mses, date, from_source, letter, ip, 
            mse_method, note_in, soib_infr, date_in, who_in,
            note_out, date_out, who_out 
        } = req.body;

        const result = await pool.query(
            `UPDATE white_ip_records 
            SET mses = $1, date = $2, from_source = $3, letter = $4, ip = $5,
                mse_method = $6, note_in = $7, soib_infr = $8, date_in = $9,
                who_in = $10, note_out = $11, date_out = $12, who_out = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14 
            RETURNING *`,
            [mses, date, from_source, letter, ip, 
             mse_method, note_in, soib_infr, date_in, who_in,
             note_out, date_out, who_out, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка при обновлении White IP записи:', err.message);
        res.status(500).json({ error: 'Ошибка при обновлении записи' });
    }
});

// Удалить White IP запись
app.delete('/api/white-ip-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM white_ip_records WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json({ message: 'Запись удалена', deleted: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при удалении записи' });
    }
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

// Заполнить демо-данными (только для админа)
app.post('/api/admin/seed-demo-data', authenticateToken, async (req, res) => {
    try {
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Только администратор может выполнять эту операцию' });
        }
        
        const counts = { ip: 0, white_ip: 0, ioc: 0 };
        
        // ==================== ГЕНЕРАТОРЫ ====================
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randomIP = () => `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
        const randomWhiteIP = () => {
            const nets = ['10', '172.16', '192.168'];
            const net = nets[randomInt(0, 2)];
            return net === '10' ? `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
                 : net === '172.16' ? `172.16.${randomInt(0, 255)}.${randomInt(1, 254)}`
                 : `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`;
        };
        const randomDate = () => {
            const d = new Date(2024, randomInt(0, 11), randomInt(1, 28));
            return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
        };
        const randomHash = () => {
            const chars = 'abcdef0123456789';
            const lengths = [32, 40, 64, 128];
            const len = lengths[randomInt(0, 3)];
            let hash = '';
            for (let i = 0; i < len; i++) hash += chars[randomInt(0, chars.length - 1)];
            return { hash, encoding: len === 32 ? 'md5' : len === 40 ? 'sha1' : len === 64 ? 'sha256' : 'sha512' };
        };
        
        const mseSources = [
            '1-PT AF', '2-NGENIX', '3-PT AF (DN)', '4-PT AF (GR)', '5-Mitigator (DN)',
            '6-Mitigator (GR)', '7-Континент', '8-UG', '9-Mitigator (IL)', '10-SIEM',
            '11-KATA', '12-SIEM', '13-KATA', '14-UG', '15-Mitigator'
        ];
        const iocMseSources = ['1-SIEM', '2-KATA', '3-PT Sandbox', '4-LOKI', '5-SIEM', '6-KATA'];
        const countries = ['RU', 'RU', 'RU', 'US', 'CN', 'DE', 'NL', 'FR', 'GB', 'JP'];
        const owners = ['Cloudflare, Inc.', 'Google LLC', 'Microsoft Corp.', 'Amazon AWS', 'Yandex LLC', 'VK Group', 'Rostelecom', '-'];
        const letters = ['п.4', 'п.5', 'Приложение к п.3', 'п.2.1', '-', 'п.7'];
        const domains = ['example.com', 'malware.test', 'phishing.net', 'botnet.org', 'c2-server.ru', '-', 'trojan.cn'];
        const statuses = ['Malicious', 'Suspicious', 'Clean', 'Unknown', 'Красный', 'Зеленый'];
        const whoUsers = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Admin', 'Смирнова А.В.'];
        const notes = [
            'Заблокирован по предписанию', 'Обнаружен в трафике', 'Подозрительная активность',
            'Фишинговая атака', 'C2 сервер', 'Вредоносное ПО', '-', 'DDoS атака'
        ];
        const soibInfrs = ['СОИБ-2024-001', 'СОИБ-2024-002', '-', 'СОИБ-2024-003', '-', '-', 'СОИБ-2024-004'];
        
        // ==================== IP RECORDS (35 записей) ====================
        for (let i = 0; i < 35; i++) {
            const mseCount = randomInt(1, 5);
            const mses = [];
            for (let j = 0; j < mseCount; j++) {
                const num = randomInt(1, 15);
                if (!mses.includes(num)) mses.push(num);
            }
            mses.sort((a, b) => a - b);
            
            const ip = randomIP();
            const date = randomDate();
            const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
            
            await pool.query(
                `INSERT INTO ip_records (mses, date, from_source, letter, domain, ip, country, owner, mse_method, note_in, soib_infr, date_in, who_in)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [mses, date, mseSources[randomInt(0, 14)], letters[randomInt(0, 5)], domains[randomInt(0, 6)],
                 ip, countries[randomInt(0, 9)], owners[randomInt(0, 7)], '-',
                 notes[randomInt(0, 7)], soibInfrs[randomInt(0, 6)], dateIn, whoUsers[randomInt(0, 4)]]
            );
            counts.ip++;
        }
        
        // ==================== WHITE IP RECORDS (35 записей) ====================
        for (let i = 0; i < 35; i++) {
            const mseCount = randomInt(1, 4);
            const mses = [];
            for (let j = 0; j < mseCount; j++) {
                const num = randomInt(1, 15);
                if (!mses.includes(num)) mses.push(num);
            }
            mses.sort((a, b) => a - b);
            
            const ip = randomWhiteIP();
            const date = randomDate();
            const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
            
            await pool.query(
                `INSERT INTO white_ip_records (mses, date, from_source, letter, ip, mse_method, note_in, soib_infr, date_in, who_in)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [mses, date, mseSources[randomInt(0, 14)], letters[randomInt(0, 5)],
                 ip, `${ip.split('.').slice(0, 3).join('.')}.0/${[8, 16, 24][randomInt(0, 2)]}`,
                 notes[randomInt(0, 7)], soibInfrs[randomInt(0, 6)], dateIn, whoUsers[randomInt(0, 4)]]
            );
            counts.white_ip++;
        }
        
        // ==================== IOC RECORDS (35 записей) ====================
        for (let i = 0; i < 35; i++) {
            const mseCount = randomInt(1, 3);
            const mses = [];
            for (let j = 0; j < mseCount; j++) {
                const num = randomInt(1, 6);
                if (!mses.includes(num)) mses.push(num);
            }
            mses.sort((a, b) => a - b);
            
            const { hash, encoding } = randomHash();
            const date = randomDate();
            const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
            
            await pool.query(
                `INSERT INTO ioc_records (mses, date, from_source, letter, indicator, encoding, status_opentip, status_virustotal, note_in, date_in, who_in)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [mses, date, iocMseSources[randomInt(0, 5)], letters[randomInt(0, 5)],
                 hash, encoding, statuses[randomInt(0, 5)], statuses[randomInt(0, 5)],
                 notes[randomInt(0, 7)], dateIn, whoUsers[randomInt(0, 4)]]
            );
            counts.ioc++;
        }
        
        // Логируем
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'SEED_DEMO_DATA', JSON.stringify(counts)]
        );
        
        res.json({ 
            success: true, 
            message: `✅ Демо-данные добавлены: IP источников — ${counts.ip}, Белых IP — ${counts.white_ip}, IOC хешей — ${counts.ioc}`,
            counts 
        });
        
    } catch (err) {
        console.error('❌ Ошибка при заполнении демо-данными:', err.message);
        res.status(500).json({ error: 'Ошибка при заполнении демо-данными' });
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
    console.log(`🚀 Сервер запущен на порту ${port}`);
    console.log(`📝 API endpoints:`);
    console.log(`   GET    /api/test`);
    console.log(`   GET    /api/records`);
    console.log(`   GET    /api/records/paginated`);
    console.log(`   POST   /api/records`);
    console.log(`   PUT    /api/records/:id`);
    console.log(`   DELETE /api/records/:id`);
    console.log(`   ... (полный список в /api-docs)`);
    
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