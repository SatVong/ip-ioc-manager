import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  stats,
  topCountries,
  timeline,
  appearance,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticateToken);

router.get('/stats', stats);
router.get('/top-countries', topCountries);
router.get('/timeline', timeline);
router.get('/appearance', appearance);

export default router;