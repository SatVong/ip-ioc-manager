import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { config } from '../config';
import { User, LoginResponse, JwtPayload } from '../types/user';

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      return;
    }

    const user = result.rows[0] as User;
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      return;
    }

    const expiresInSeconds = 7 * 24 * 60 * 60; // 7 дней в секундах
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role } as JwtPayload,
      config.jwt.secret,
      { expiresIn: expiresInSeconds }
    );

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    await pool.query(
      'INSERT INTO user_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'LOGIN', req.ip]
    );

    const { password_hash, ...userData } = user;
    const response: LoginResponse = { token, user: userData };
    res.json(response);
  } catch (err) {
    console.error('Ошибка при входе:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const result = await pool.query(
      `SELECT id, username, full_name, email, role, can_create, can_edit, can_delete, 
              can_import, can_export, can_manage_users, last_login, created_at 
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

export function logout(req: Request, res: Response): void {
  res.json({ message: 'Выход выполнен' });
}