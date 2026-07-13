import express from 'express';
import BusinessRecord from '../models/BusinessRecord.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';

const router = express.Router();
const resources = new Set(['employees', 'contracts', 'quotations', 'certifications', 'rewards', 'trainings', 'training-lessons', 'settings']);

const valid = (req, res, next) => resources.has(req.params.resource)
  ? next()
  : res.status(404).json({ success: false, message: 'Phân hệ không tồn tại' });

router.get('/business/:resource', valid, async (req, res, next) => {
  try {
    const records = await BusinessRecord.find({ resource: req.params.resource }).sort('-createdAt').lean();
    res.json({ success: true, items: records.map(({ _id, data, createdAt, updatedAt }) => ({ ...data, id: _id.toString(), createdAt, updatedAt })) });
  } catch (error) { next(error); }
});

router.post('/business/:resource', valid, async (req, res, next) => {
  try {
    const { id, _id, createdAt, updatedAt, ...data } = req.body;
    const record = await BusinessRecord.create({ resource: req.params.resource, data, createdBy: req.user.id });
    res.status(201).json({ success: true, item: { ...record.data, id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt } });
  } catch (error) { next(error); }
});

router.put('/business/:resource/:id', valid, async (req, res, next) => {
  try {
    const { id, _id, createdAt, updatedAt, ...data } = req.body;
    const record = await BusinessRecord.findOneAndUpdate(
      { _id: req.params.id, resource: req.params.resource },
      { data, updatedBy: req.user.id }, { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Dữ liệu không tồn tại' });
    res.json({ success: true, item: { ...record.data, id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt } });
  } catch (error) { next(error); }
});

router.delete('/business/:resource/:id', valid, async (req, res, next) => {
  try {
    const record = await BusinessRecord.findOneAndDelete({ _id: req.params.id, resource: req.params.resource });
    if (!record) return res.status(404).json({ success: false, message: 'Dữ liệu không tồn tại' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const [users, attendanceToday, projectRows, grouped, contracts, recent] = await Promise.all([
      User.countDocuments({ isActive: { $ne: false } }),
      Attendance.countDocuments({ date: new Date().toISOString().slice(0, 10) }),
      Project.find({ isDeleted: false }).sort('-updatedAt').limit(5).lean(),
      BusinessRecord.aggregate([{ $group: { _id: '$resource', count: { $sum: 1 } } }]),
      BusinessRecord.find({ resource: 'contracts' }).lean(),
      BusinessRecord.find().sort('-updatedAt').limit(5).lean(),
    ]);
    const resources = Object.fromEntries(grouped.map(x => [x._id, x.count]));
    const revenue = contracts.reduce((acc, row) => {
      const line = row.data?.line || 'Khác';
      acc[line] = (acc[line] || 0) + Number(row.data?.value || 0);
      return acc;
    }, {});
    res.json({ success: true, stats: {
      users, attendanceToday, projects: await Project.countDocuments({ isDeleted: false }), resources, revenue,
      projectRows: projectRows.map(p => ({ id: p._id, code: p.code, name: p.name, company: p.line, pm: p.pm, progress: p.progress, status: p.status, due: p.due })),
      activities: recent.map(r => ({ time: r.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), actor: 'Hệ thống', action: `cập nhật ${r.resource}`, target: r.data?.code || r.data?.name || r._id.toString(), value: null, tone: 'info' })),
    } });
  } catch (error) { next(error); }
});

export default router;
