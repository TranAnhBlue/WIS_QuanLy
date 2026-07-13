import Project from '../models/Project.js';
import User from '../models/User.js';

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const { 
      line, 
      status, 
      search, 
      sort = '-createdAt', 
      page = 1, 
      limit = 100 
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (line) {
      query.line = line;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } },
        { pm: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const projects = await Project.find(query)
      .populate('pmUserId', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Project.countDocuments(query);

    // Get statistics
    const stats = await Project.getStatistics();

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      projects: projects.map(p => p.getPublicProfile()),
      stats,
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ _id: id, isDeleted: false })
      .populate('pmUserId', 'name email avatar role department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      project: project.getPublicProfile(),
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      code,
      name,
      customer,
      line,
      pm,
      pmUserId,
      status = 'planning',
      start,
      due,
      budget,
      tasksTotal = 0,
      tasksDone = 0,
      description,
      notes,
    } = req.body;

    // Validate required fields
    if (!code || !name || !customer || !line || !pm || !start || !due || budget === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, name, customer, line, pm, start, due, budget',
      });
    }

    // Check if code already exists
    const existingProject = await Project.findOne({ code: code.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: `Project code ${code} already exists`,
      });
    }

    // Create project
    const project = await Project.create({
      code: code.toUpperCase(),
      name,
      customer,
      line,
      pm,
      pmUserId,
      status,
      start,
      due,
      budget,
      tasksTotal,
      tasksDone,
      description,
      notes,
      createdBy: userId,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('pmUserId', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject.getPublicProfile(),
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      code,
      name,
      customer,
      line,
      pm,
      pmUserId,
      status,
      start,
      due,
      budget,
      tasksTotal,
      tasksDone,
      description,
      notes,
    } = req.body;

    const project = await Project.findOne({ _id: id, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if new code conflicts with another project
    if (code && code.toUpperCase() !== project.code) {
      const existingProject = await Project.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: `Project code ${code} already exists`,
        });
      }
    }

    // Update fields
    if (code) project.code = code.toUpperCase();
    if (name) project.name = name;
    if (customer) project.customer = customer;
    if (line) project.line = line;
    if (pm) project.pm = pm;
    if (pmUserId !== undefined) project.pmUserId = pmUserId;
    if (status) project.status = status;
    if (start) project.start = start;
    if (due) project.due = due;
    if (budget !== undefined) project.budget = budget;
    if (tasksTotal !== undefined) project.tasksTotal = tasksTotal;
    if (tasksDone !== undefined) project.tasksDone = tasksDone;
    if (description !== undefined) project.description = description;
    if (notes !== undefined) project.notes = notes;

    project.updatedBy = userId;
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('pmUserId', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: populatedProject.getPublicProfile(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project (soft delete)
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const project = await Project.findOne({ _id: id, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.isDeleted = true;
    project.deletedAt = new Date();
    project.deletedBy = userId;
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project progress
export const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { tasksDone, tasksTotal } = req.body;

    const project = await Project.findOne({ _id: id, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (tasksDone !== undefined) project.tasksDone = tasksDone;
    if (tasksTotal !== undefined) project.tasksTotal = tasksTotal;
    project.updatedBy = userId;

    await project.save(); // Pre-save hook will auto-calculate progress

    const populatedProject = await Project.findById(project._id)
      .populate('pmUserId', 'name email avatar');

    res.json({
      success: true,
      message: 'Progress updated successfully',
      project: populatedProject.getPublicProfile(),
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk delete projects
export const bulkDeleteProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required',
      });
    }

    const result = await Project.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      }
    );

    res.json({
      success: true,
      message: `Deleted ${result.modifiedCount} projects`,
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error bulk deleting projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get project statistics
export const getProjectStats = async (req, res) => {
  try {
    const stats = await Project.getStatistics();

    // Additional calculations
    const allProjects = await Project.find({ isDeleted: false });
    
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const avgProgress = allProjects.length > 0 
      ? Math.round(allProjects.reduce((sum, p) => sum + p.progress, 0) / allProjects.length)
      : 0;

    res.json({
      success: true,
      stats: {
        ...stats,
        totalBudget,
        avgProgress,
      },
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
