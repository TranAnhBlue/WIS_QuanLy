// User Management Routes (Admin Only)
import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(isAdmin);

// User CRUD routes
router.route('/')
  .get(getUsers)
  .post(createUser);

router.get('/stats', getUserStats);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

export default router;
