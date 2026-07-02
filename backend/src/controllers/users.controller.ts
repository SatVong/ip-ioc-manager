import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import { User, UserPublic } from '../types/user';

// Middleware для проверки прав на управление пользователями
export async function canManageUsers(req: Request, res: Response, next: Function): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const result = await pool.query(
      'SELECT role, can_manage_users FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Доступ запрещён' });
      return;
    }

    const user = result.rows[0];

    if (user.role === 'admin') {
      req.canEdit = true;
      next();
      return;
    }

    if (user.can_manage_users === true) {
      req.canEdit = false;
      next();
      return;
    }

    res.status(403).json({ error: 'Недостаточно прав' });
  } catch (err) {
    console.error('Ошибка в canManageUsers:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Получить всех пользователей
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, position, department, email, role, 
              can_create, can_edit, can_delete, can_import, can_export,
              can_manage_users, created_at, last_login, is_active 
       FROM users ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
}

// Получить одного пользователя
export async function getUserById(req: Request, res: Response): Promise<void> {
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
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении пользователя' });
  }
}

// Создать пользователя
export async function createUser(req: Request, res: Response): Promise<void> {
  if (!req.canEdit) {
    res.status(403).json({ error: 'Только администратор может создавать пользователей' });
    return;
  }

  try {
    const {
      username, password, full_name, position, department, email, role,
      can_create, can_edit, can_delete, can_import, can_export, can_manage_users,
    } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
      return;
    }

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Неверный формат email' });
        return;
      }
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Пользователь уже существует' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const toBool = (val: any): boolean => val === true || val === 'true' || val === 1;

    const result = await pool.query(
      `INSERT INTO users 
       (username, password_hash, full_name, position, department, email, role,
        can_create, can_edit, can_delete, can_import, can_export, can_manage_users) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING id, username, full_name, position, department, email, role`,
      [username, hash, full_name, position || null, department || null, email || null, role || 'user',
       toBool(can_create), toBool(can_edit), toBool(can_delete),
       toBool(can_import), toBool(can_export), toBool(can_manage_users)]
    );

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'CREATE_USER', JSON.stringify({ username, role, position, department })]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании пользователя:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при создании пользователя' });
  }
}

// Обновить пользователя
export async function updateUser(req: Request, res: Response): Promise<void> {
  if (!req.canEdit) {
    res.status(403).json({ error: 'Только администратор может редактировать пользователей' });
    return;
  }

  try {
    const { id } = req.params;
    const {
      full_name, position, department, email, role, password,
      can_create, can_edit, can_delete, can_import, can_export,
      can_manage_users, is_active,
    } = req.body;

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Неверный формат email' });
        return;
      }
    }

    const toBool = (val: any): boolean => val === true || val === 'true' || val === 1;

    let query: string;
    let values: any[];

    if (password) {
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
        toBool(can_create), toBool(can_edit), toBool(can_delete),
        toBool(can_import), toBool(can_export), toBool(can_manage_users),
        toBool(is_active), hash, id,
      ];
    } else {
      query = `UPDATE users SET 
        full_name = $1, position = $2, department = $3, email = $4, role = $5,
        can_create = $6, can_edit = $7, can_delete = $8,
        can_import = $9, can_export = $10, can_manage_users = $11,
        is_active = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13 
        RETURNING id, username, full_name, position, department, email, role`;

      values = [
        full_name, position, department, email, role,
        toBool(can_create), toBool(can_edit), toBool(can_delete),
        toBool(can_import), toBool(can_export), toBool(can_manage_users),
        toBool(is_active), id,
      ];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении пользователя:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
  }
}

// Блокировка/разблокировка пользователя
export async function toggleUser(req: Request, res: Response): Promise<void> {
  try {
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Только администратор может блокировать пользователей' });
      return;
    }

    const { id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_active',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({
      message: `Пользователь ${is_active ? 'разблокирован' : 'заблокирован'}`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при изменении статуса' });
  }
}

// Удалить пользователя
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Только администратор может удалять пользователей' });
      return;
    }

    const id = req.params.id as string;

    if (parseInt(id) === req.user!.userId) {
      res.status(400).json({ error: 'Нельзя удалить самого себя' });
      return;
    }

    const checkUser = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const username = checkUser.rows[0].username;

    await pool.query('BEGIN');
    await pool.query('DELETE FROM user_logs WHERE user_id = $1', [id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'DELETE_USER', JSON.stringify({ deleted_user_id: id, username })]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Пользователь полностью удалён', deleted: { id, username } });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при удалении пользователя:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
}

// Смена пароля
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { currentPassword, newPassword } = req.body;

    if (parseInt(id) !== req.user!.userId) {
      res.status(403).json({ error: 'Нельзя менять пароль другого пользователя' });
      return;
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = userResult.rows[0] as User;
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!validPassword) {
      res.status(401).json({ error: 'Неверный текущий пароль' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hash, id]
    );

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'CHANGE_PASSWORD', JSON.stringify({ changed_by_self: true })]
    );

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Ошибка при смене пароля:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при смене пароля' });
  }
}