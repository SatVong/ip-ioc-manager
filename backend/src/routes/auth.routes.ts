import { Router } from 'express';
import { login, getMe, logout } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;