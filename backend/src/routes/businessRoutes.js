import express from 'express';
import BusinessRecord from '../models/BusinessRecord.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';

const router = express.Router();
const resources = new Set(['employees', 'contracts', 'quotations', 'certifications', 'rewards', 'trainings', 'training-lessons', 'settings']);
const resourceLabels = {
  employees: 'Nhân sự',
  contracts: 'Hợp đồng',
  quotations: 'Báo giá',
  certifications: 'Chứng nhận',
  rewards: 'Khen thưởng',
  trainings: 'Đào tạo',
  'training-lessons': 'Bài học đào tạo',
  settings: 'Thiết lập',
};

function getActivityTarget(record) {
  const data = record.data || {};
  const targetsByResource = {
    employees: data.name || data.email,
    contracts: data.title || data.customer,
    quotations: data.customer || data.title,
    certifications: data.standard || data.customer,
    rewards: data.name || data.employeeName || data.title,
    trainings: data.title || data.name,
    'training-lessons': data.title || data.name,
    settings: data.name || data.label,
  };

  return targetsByResource[record.resource]
    || data.name
    || data.title
    || data.standard
    || data.customer
    || data.code
    || record._id.toString();
}

// Vietnam is UTC+7 and does not use daylight saving time. Build an explicit
// UTC range so dashboard counts are stable regardless of the server timezone.
function getVietnamDayRange(now = new Date()) {
  const offsetMs = 7 * 60 * 60 * 1000;
  const vietnamNow = new Date(now.getTime() + offsetMs);
  const start = new Date(Date.UTC(
    vietnamNow.getUTCFullYear(),
    vietnamNow.getUTCMonth(),
    vietnamNow.getUTCDate(),
  ) - offsetMs);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

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
    const { start: todayStart, end: todayEnd } = getVietnamDayRange();
    const [users, usersByCompany, attendanceToday, projectRows, grouped, contracts, recent] = await Promise.all([
      User.countDocuments({}),
      User.aggregate([{ $group: { _id: '$company', count: { $sum: 1 } } }]),
      Attendance.countDocuments({ checkInTime: { $gte: todayStart, $lt: todayEnd } }),
      Project.find({ isDeleted: false }).sort('-updatedAt').limit(5).lean(),
      BusinessRecord.aggregate([{ $group: { _id: '$resource', count: { $sum: 1 } } }]),
      BusinessRecord.find({ resource: 'contracts' }).lean(),
      BusinessRecord.find().sort('-updatedAt').limit(5).lean(),
    ]);
    const resources = Object.fromEntries(grouped.map(x => [x._id, x.count]));
    // Nhân sự uses the User collection as its single source of truth.
    resources.employees = users;
    const companyUserCounts = Object.fromEntries(usersByCompany.map(x => [x._id, x.count]));
    const employeesByLine = {
      'Line 1': companyUserCounts.SCT_VIET || 0,
      'Line 2': companyUserCounts.WCERT || 0,
      'Line 3': companyUserCounts.ICT_VIET || 0,
    };
    const revenue = contracts.reduce((acc, row) => {
      const line = row.data?.line || 'Khác';
      acc[line] = (acc[line] || 0) + Number(row.data?.value || 0);
      return acc;
    }, {});
    res.json({ success: true, stats: {
      users, attendanceToday, projects: await Project.countDocuments({ isDeleted: false }), resources, revenue, employeesByLine,
      projectRows: projectRows.map(p => ({ id: p._id, code: p.code, name: p.name, company: p.line, pm: p.pm, progress: p.progress, status: p.status, due: p.due })),
      activities: recent.map(r => ({
        time: r.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
        actor: 'Hệ thống',
        action: `cập nhật ${resourceLabels[r.resource] || 'dữ liệu'}`,
        target: getActivityTarget(r),
        value: null,
        tone: 'info',
      })),
    } });
  } catch (error) { next(error); }
});

export default router;
