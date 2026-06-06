const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('./db');

// Middleware для проверки прав на управление пользователями
const canManageUsers = async (req, res, next) => {
    try {
        // ✅ ЗАЩИТА ОТ ОТСУТСТВИЯ req.user
        if (!req.user || !req.user.userId) {
            console.log('❌ Пользователь не авторизован');
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        
        console.log('👤 Проверка прав для пользователя:', req.user);
        
        const result = await pool.query(
            'SELECT role, can_manage_users FROM users WHERE id = $1', 
            [req.user.userId]
        );
        
        console.log('📊 Результат запроса:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('❌ Пользователь не найден');
            return res.status(403).json({ error: 'Доступ запрещён' });
        }
        
        const user = result.rows[0];
        
        // Админ имеет полный доступ
        if (user.role === 'admin') {
            console.log('✅ Админ, доступ разрешён');
            req.canEdit = true;
            return next();
        }
        
        // ✅ Защита от null: проверяем === true
        const canManage = user.can_manage_users === true;
        
        if (canManage) {
            console.log('✅ Есть право can_manage_users, доступ разрешён (только просмотр)');
            req.canEdit = false;
            return next();
        }
        
        console.log('❌ Нет прав на управление пользователями');
        res.status(403).json({ error: 'Недостаточно прав' });
    } catch (err) {
        console.error('❌ Ошибка в canManageUsers:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Получить всех пользователей (только для админа)
router.get('/', canManageUsers, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, full_name, position, department, email, role, 
                    can_create, can_edit, can_delete, can_import, can_export,
                    can_manage_users, created_at, last_login, is_active 
             FROM users ORDER BY id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
});

// ==================== Получить одного пользователя ====================
router.get('/:id', canManageUsers, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, username, full_name, position, department, email, role,
                    can_create, can_edit, can_delete, can_import, can_export,
                    can_manage_users, created_at, last_login, is_active 
             FROM users WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при получении пользователя' });
    }
});

// ==================== Создать нового пользователя ====================
router.post('/', canManageUsers, async (req, res) => {
    // Проверяем, что пользователь имеет право на создание (админ)
    if (!req.canEdit) {
        return res.status(403).json({ error: 'Только администратор может создавать пользователей' });
    }
    
    try {
        const { 
            username, password, full_name, position, department, email, role,
            can_create, can_edit, can_delete, can_import, can_export,
            can_manage_users 
        } = req.body;

        // ✅ ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ
        if (!username || !password) {
            return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }
        
        // ✅ ВАЛИДАЦИЯ EMAIL (если передан)
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Неверный формат email' });
            }
        }

        // Проверяем, не существует ли пользователь
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        // Хешируем пароль с try-catch
        let hash;
        try {
            const salt = await bcrypt.genSalt(10);
            hash = await bcrypt.hash(password, salt);
        } catch (err) {
            console.error('Ошибка хеширования пароля:', err);
            return res.status(500).json({ error: 'Ошибка при создании пользователя' });
        }

        // Преобразуем булевы значения
        const bool_can_create = can_create === true || can_create === 'true' || can_create === 1;
        const bool_can_edit = can_edit === true || can_edit === 'true' || can_edit === 1;
        const bool_can_delete = can_delete === true || can_delete === 'true' || can_delete === 1;
        const bool_can_import = can_import === true || can_import === 'true' || can_import === 1;
        const bool_can_export = can_export === true || can_export === 'true' || can_export === 1;
        const bool_can_manage_users = can_manage_users === true || can_manage_users === 'true' || can_manage_users === 1;

        const result = await pool.query(
            `INSERT INTO users 
             (username, password_hash, full_name, position, department, email, role,
              can_create, can_edit, can_delete, can_import, can_export,
              can_manage_users) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
             RETURNING id, username, full_name, position, department, email, role`,
            [username, hash, full_name, position || null, department || null, email || null, role || 'user',
             bool_can_create, bool_can_edit, bool_can_delete,
             bool_can_import, bool_can_export, bool_can_manage_users]
        );

        // Логируем действие
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'CREATE_USER', JSON.stringify({ username, role, position, department })]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка при создании пользователя:', err.message);
        res.status(500).json({ error: 'Ошибка при создании пользователя' });
    }
});

// ==================== Обновить пользователя ====================
router.put('/:id', canManageUsers, async (req, res) => {
    // Проверяем, что пользователь имеет право на редактирование
    if (!req.canEdit) {
        return res.status(403).json({ error: 'Только администратор может редактировать пользователей' });
    }
    
    try {
        const { id } = req.params;
        const { 
            full_name, position, department, email, role, password,
            can_create, can_edit, can_delete, can_import, can_export,
            can_manage_users, is_active 
        } = req.body;

        // ✅ ВАЛИДАЦИЯ EMAIL (если передан)
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Неверный формат email' });
            }
        }

        console.log('📝 Обновление пользователя:', {
            id, full_name, position, department, email, role,
            can_create, can_edit, can_delete, can_import, can_export,
            can_manage_users, is_active, password: password ? '***' : undefined
        });

        // Преобразуем все булевы значения в правильный формат для PostgreSQL
        const bool_can_create = can_create === true || can_create === 'true' || can_create === 1;
        const bool_can_edit = can_edit === true || can_edit === 'true' || can_edit === 1;
        const bool_can_delete = can_delete === true || can_delete === 'true' || can_delete === 1;
        const bool_can_import = can_import === true || can_import === 'true' || can_import === 1;
        const bool_can_export = can_export === true || can_export === 'true' || can_export === 1;
        const bool_can_manage_users = can_manage_users === true || can_manage_users === 'true' || can_manage_users === 1;
        const bool_is_active = is_active === true || is_active === 'true' || is_active === 1;

        let query;
        let values;

        if (password) {
            // Если меняем пароль
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            
            query = `UPDATE users SET 
                full_name = $1, position = $2, department = $3, email = $4, role = $5,
                can_create = $6, can_edit = $7, can_delete = $8,
                can_import = $9, can_export = $10, can_manage_users = $11,
                is_active = $12, password_hash = $13, updated_at = CURRENT_TIMESTAMP
                WHERE id = $14 
                RETURNING id, username, full_name, position, department, email, role`;
            
            values = [
                full_name, position, department, email, role,
                bool_can_create, bool_can_edit, bool_can_delete,
                bool_can_import, bool_can_export, bool_can_manage_users,
                bool_is_active, hash, id
            ];
        } else {
            // Без смены пароля
            query = `UPDATE users SET 
                full_name = $1, position = $2, department = $3, email = $4, role = $5,
                can_create = $6, can_edit = $7, can_delete = $8,
                can_import = $9, can_export = $10, can_manage_users = $11,
                is_active = $12, updated_at = CURRENT_TIMESTAMP
                WHERE id = $13 
                RETURNING id, username, full_name, position, department, email, role`;
            
            values = [
                full_name, position, department, email, role,
                bool_can_create, bool_can_edit, bool_can_delete,
                bool_can_import, bool_can_export, bool_can_manage_users,
                bool_is_active, id
            ];
        }

        console.log('📊 SQL запрос:', query);
        console.log('📊 Значения:', values);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка при обновлении пользователя:', err.message);
        res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
    }
});

// ==================== Удалить пользователя (деактивировать) ====================
// Блокировка/разблокировка пользователя (НЕ удаление)
router.patch('/:id/toggle', async (req, res) => {
    // Проверяем, что это админ
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Только администратор может блокировать пользователей' });
    }
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        const result = await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ 
            message: `Пользователь ${is_active ? 'разблокирован' : 'заблокирован'}`,
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка при изменении статуса' });
    }
});

// ПОЛНОЕ удаление пользователя (не только деактивация)
router.delete('/:id', async (req, res) => {
    // Проверяем, что это админ
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Только администратор может удалять пользователей' });
    }
    try {
        const { id } = req.params;
        
        // Не даём удалить самого себя
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Нельзя удалить самого себя' });
        }

        // Проверяем, существует ли пользователь
        const checkUser = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const username = checkUser.rows[0].username;

        // Начинаем транзакцию
        await pool.query('BEGIN');

        // Сначала удаляем связанные записи в user_logs
        await pool.query('DELETE FROM user_logs WHERE user_id = $1', [id]);
        
        // Затем удаляем самого пользователя
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);

        // Логируем действие
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'DELETE_USER', JSON.stringify({ deleted_user_id: id, username })]
        );

        // Завершаем транзакцию
        await pool.query('COMMIT');

        res.json({ 
            message: 'Пользователь полностью удалён', 
            deleted: { id, username } 
        });
        
    } catch (err) {
        // В случае ошибки откатываем транзакцию
        await pool.query('ROLLBACK');
        console.error('❌ Ошибка при удалении пользователя:', err.message);
        res.status(500).json({ error: 'Ошибка при удалении пользователя' });
    }
});

// ==================== Смена пароля самим пользователем (НЕ ТРЕБУЕТ ПРАВ АДМИНА) ====================
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Проверяем, что пользователь меняет свой пароль
        if (parseInt(id) !== req.user.userId) {
            return res.status(403).json({ error: 'Нельзя менять пароль другого пользователя' });
        }

        // Получаем текущие данные пользователя
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];

        // Проверяем текущий пароль
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный текущий пароль' });
        }

        // Хешируем новый пароль
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // Обновляем пароль
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hash, id]
        );

        // Логируем действие
        await pool.query(
            'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.userId, 'CHANGE_PASSWORD', JSON.stringify({ changed_by_self: true })]
        );

        res.json({ message: 'Пароль успешно изменён' });

    } catch (err) {
        console.error('❌ Ошибка при смене пароля:', err.message);
        res.status(500).json({ error: 'Ошибка при смене пароля' });
    }
});

module.exports = router;