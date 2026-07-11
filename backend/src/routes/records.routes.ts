import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllRecords,
  getRecordsPaginated,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getMseCounts,
} from '../controllers/records.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllRecords);
router.get('/paginated', getRecordsPaginated);
router.get('/mse-counts', getMseCounts);
router.get('/:id', getRecordById);
router.post('/', createRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

export default router;