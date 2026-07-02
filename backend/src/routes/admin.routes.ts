import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  seedDemoData,
  clearIpRecords,
  clearIocRecords,
  clearUsers,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticateToken);

router.post('/seed-demo-data', seedDemoData);
router.delete('/clear-ip-records', clearIpRecords);
router.delete('/clear-ioc-records', clearIocRecords);
router.delete('/clear-users', clearUsers);

export default router;