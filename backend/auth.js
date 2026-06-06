const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('./db');

// Секрет для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Вход в систему (упрощённая версия без валидации)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }
    
    try {
        // Ищем пользователя
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        const user = result.rows[0];
        
        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        
        // Создаём JWT токен
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        // Обновляем время последнего входа
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
        // Логируем вход
        await pool.query(
            'INSERT INTO user_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
            [user.id, 'LOGIN', req.ip]
        );
        
        // Отправляем данные пользователя (без пароля)
        const { password_hash, ...userData } = user;
        res.json({
            token,
            user: userData
        });
        
    } catch (err) {
        console.error('Ошибка при входе:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка токена и получение данных текущего пользователя
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query(
            'SELECT id, username, full_name, email, role, can_create, can_edit, can_delete, can_import, can_export, can_manage_users, last_login, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ error: 'Недействительный токен' });
    }
});

// Выход из системы (на клиенте просто удаляем токен)
router.post('/logout', (req, res) => {
    res.json({ message: 'Выход выполнен' });
});

module.exports = router;