import express from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  markAbsent,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (for all employees)
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/history', getAttendanceHistory);

// Manager/Admin routes
router.get('/stats', getAttendanceStats);
router.post('/mark-absent', markAbsent); // Admin only

export default router;
