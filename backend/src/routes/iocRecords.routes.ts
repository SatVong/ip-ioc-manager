import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllIocRecords,
  getIocRecordsPaginated,
  getIocRecordById,
  createIocRecord,
  updateIocRecord,
  deleteIocRecord,
} from '../controllers/iocRecords.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllIocRecords);
router.get('/paginated', getIocRecordsPaginated);
router.get('/:id', getIocRecordById);
router.post('/', createIocRecord);
router.put('/:id', updateIocRecord);
router.delete('/:id', deleteIocRecord);

export default router;