import express from 'express';
import BusinessRecord from '../models/BusinessRecord.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';

const router = express.Router();
const resources = new Set([
  'employees', 'contracts', 'quotations', 'certifications', 'rewards',
  'trainings', 'training-lessons', 'settings',
  'science-missions', 'legal-records', 'vietgap-records',
]);
const resourceLabels = {
  employees: 'Nhân sự',
  contracts: 'Hợp đồng',
  quotations: 'Báo giá',
  certifications: 'Chứng nhận',
  rewards: 'Khen thưởng',
  trainings: 'Đào tạo',
  'training-lessons': 'Bài học đào tạo',
  settings: 'Thiết lập',
  'science-missions': 'Nhiệm vụ khoa học',
  'legal-records': 'Bảo hộ và pháp lý',
  'vietgap-records': 'VietGAP',
};

const requiredFields = {
  'science-missions': ['code', 'title', 'manager', 'startDate', 'endDate', 'status'],
  'legal-records': ['code', 'title', 'category', 'owner', 'filingDate', 'status'],
  'vietgap-records': ['code', 'title', 'customer', 'standard', 'owner', 'startDate', 'status'],
};

function parseBusinessDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const vietnamese = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const parts = vietnamese
    ? [Number(vietnamese[3]), Number(vietnamese[2]), Number(vietnamese[1])]
    : iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : null;
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date : null;
}

function validateBusinessData(resource, data) {
  const missing = (requiredFields[resource] || []).filter((field) => {
    const value = data[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length) return `Thiếu trường bắt buộc: ${missing.join(', ')}`;

  if (data.progress !== undefined) {
    const progress = Number(data.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) return 'Tiến độ phải từ 0 đến 100';
  }
  for (const field of ['budget', 'area']) {
    if (data[field] !== undefined && data[field] !== '') {
      const value = Number(data[field]);
      if (!Number.isFinite(value) || value < 0) return `${field === 'budget' ? 'Kinh phí' : 'Diện tích'} không hợp lệ`;
    }
  }
  const dateFields = ['startDate', 'endDate', 'filingDate', 'deadline', 'auditDate', 'expiryDate'];
  for (const field of dateFields) {
    if (data[field] && !parseBusinessDate(data[field])) return `Ngày tại trường ${field} không hợp lệ`;
  }
  const ranges = [['startDate', 'endDate'], ['filingDate', 'deadline'], ['auditDate', 'expiryDate']];
  for (const [startField, endField] of ranges) {
    const start = parseBusinessDate(data[startField]);
    const end = parseBusinessDate(data[endField]);
    if (start && end && end < start) return 'Ngày kết thúc không được trước ngày bắt đầu';
  }
  return null;
}

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
    'science-missions': data.title || data.code,
    'legal-records': data.title || data.code,
    'vietgap-records': data.title || data.customer || data.code,
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

router.get('/business/:resource/:id', valid, async (req, res, next) => {
  try {
    const record = await BusinessRecord.findOne({ _id: req.params.id, resource: req.params.resource }).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Dữ liệu không tồn tại' });
    const { _id, data, createdAt, updatedAt } = record;
    res.json({ success: true, item: { ...data, id: _id.toString(), createdAt, updatedAt } });
  } catch (error) { next(error); }
});

router.get('/rewards/members/:memberId', async (req, res, next) => {
  try {
    const record = await BusinessRecord.findOne({ resource: 'rewards', 'data.members.id': req.params.memberId }).lean();
    const member = record?.data?.members?.find(item => item.id === req.params.memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Nhân sự khen thưởng không tồn tại' });
    const activities = (record.data.activities || []).filter(item => item.memberId === member.id || item.who === member.name);
    res.json({ success: true, member, activities, updatedAt: record.updatedAt });
  } catch (error) { next(error); }
});

router.post('/business/:resource', valid, async (req, res, next) => {
  try {
    const { id, _id, createdAt, updatedAt, ...data } = req.body;
    const validationError = validateBusinessData(req.params.resource, data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (data.code) {
      const duplicate = await BusinessRecord.exists({ resource: req.params.resource, 'data.code': data.code });
      if (duplicate) return res.status(409).json({ success: false, message: 'Mã hồ sơ đã tồn tại' });
    }
    const record = await BusinessRecord.create({ resource: req.params.resource, data, createdBy: req.user.id });
    res.status(201).json({ success: true, item: { ...record.data, id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt } });
  } catch (error) { next(error); }
});

router.put('/business/:resource/:id', valid, async (req, res, next) => {
  try {
    const { id, _id, createdAt, updatedAt, ...data } = req.body;
    const validationError = validateBusinessData(req.params.resource, data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (data.code) {
      const duplicate = await BusinessRecord.exists({
        _id: { $ne: req.params.id }, resource: req.params.resource, 'data.code': data.code,
      });
      if (duplicate) return res.status(409).json({ success: false, message: 'Mã hồ sơ đã tồn tại' });
    }
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
