import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUser,
  deleteUser,
  changePassword,
  canManageUsers,
} from '../controllers/users.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', canManageUsers, getUsers);
router.post('/', canManageUsers, createUser);
router.get('/:id', canManageUsers, getUserById);
router.put('/:id', canManageUsers, updateUser);
router.patch('/:id/toggle', toggleUser);
router.delete('/:id', deleteUser);
router.put('/:id/password', changePassword);

export default router;