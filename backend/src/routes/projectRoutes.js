import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProgress,
  bulkDeleteProjects,
  getProjectStats,
} from '../controllers/projectController.js';
import User from '../models/User.js';

const router = express.Router();
const projectManageRoles = new Set(['group_ceo', 'group_director', 'group_admin', 'company_ceo', 'company_deputy', 'dept_manager', 'dept_deputy', 'team_leader', 'senior_specialist']);
const canManageProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user) return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
    if (!projectManageRoles.has(user.role)) return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý dự án' });
    next();
  } catch (error) { next(error); }
};

// Project routes
router.get('/projects', getProjects);
router.get('/projects/stats', getProjectStats);
router.get('/projects/:id', getProjectById);
router.post('/projects', canManageProjects, createProject);
router.put('/projects/:id', canManageProjects, updateProject);
router.patch('/projects/:id/progress', canManageProjects, updateProgress);
router.delete('/projects/:id', canManageProjects, deleteProject);
router.post('/projects/bulk-delete', canManageProjects, bulkDeleteProjects);

export default router;
