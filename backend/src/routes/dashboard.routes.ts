import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  stats,
  topCountries,
  timeline,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticateToken);

router.get('/stats', stats);
router.get('/top-countries', topCountries);
router.get('/timeline', timeline);

export default router;