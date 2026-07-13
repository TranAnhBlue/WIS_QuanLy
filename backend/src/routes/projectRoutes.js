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

const router = express.Router();

// Project routes
router.get('/projects', getProjects);
router.get('/projects/stats', getProjectStats);
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.patch('/projects/:id/progress', updateProgress);
router.delete('/projects/:id', deleteProject);
router.post('/projects/bulk-delete', bulkDeleteProjects);

export default router;
