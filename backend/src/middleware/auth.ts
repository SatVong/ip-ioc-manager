import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types/user';

// Расширяем Express Request для хранения данных пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      canEdit?: boolean;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Недействительный токен' });
      return;
    }
    req.user = decoded as JwtPayload;
    next();
  });
}