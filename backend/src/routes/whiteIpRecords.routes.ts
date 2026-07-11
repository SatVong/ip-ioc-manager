import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getWhiteIpRecordsPaginated,
  createWhiteIpRecord,
  updateWhiteIpRecord,
  deleteWhiteIpRecord,
  getMseCounts,
} from '../controllers/whiteIpRecords.controller';

const router = Router();

router.use(authenticateToken);

router.get('/paginated', getWhiteIpRecordsPaginated);
router.get('/mse-counts', getMseCounts);
router.post('/', createWhiteIpRecord);
router.put('/:id', updateWhiteIpRecord);
router.delete('/:id', deleteWhiteIpRecord);

export default router;