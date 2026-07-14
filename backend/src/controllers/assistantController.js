import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import BusinessRecord from '../models/BusinessRecord.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const COMPANY_LINES = { WCERT: 'Line 2', SCT_VIET: 'Line 1', ICT_VIET: 'Line 3' };
const RESOURCE_NAMES = {
  employees: 'nhân sự', contracts: 'hợp đồng', quotations: 'báo giá', certifications: 'chứng nhận', rewards: 'khen thưởng',
  trainings: 'đào tạo', 'training-lessons': 'bài học', settings: 'thiết lập',
  'science-missions': 'nhiệm vụ khoa học', 'legal-records': 'hồ sơ pháp lý', 'vietgap-records': 'hồ sơ VietGAP',
};

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (vn) return new Date(Number(vn[3]), Number(vn[2]) - 1, Number(vn[1]));
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date) : 'chưa có ngày';
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function isGroupScope(user) {
  return ['group_ceo', 'group_director', 'group_admin'].includes(user.role);
}

function scopeSnapshot(snapshot, user) {
  if (isGroupScope(user)) return { ...snapshot, scope: 'toàn tập đoàn' };
  const line = COMPANY_LINES[user.company];
  const users = snapshot.users.filter((item) => item.company === user.company);
  const userIds = new Set(users.map((item) => String(item._id)));
  const projects = snapshot.projects.filter((item) => !line || item.line === line);
  const attendance = snapshot.attendance.filter((item) => userIds.has(String(item.userId)));
  const records = snapshot.records.filter((item) => {
    const data = item.data || {};
    if (data.line) return data.line === line;
    if (data.company) return data.company === user.company || data.company === line;
    if (item.resource === 'science-missions') return user.company === 'SCT_VIET';
    if (item.resource === 'vietgap-records') return user.company === 'ICT_VIET';
    return true;
  });
  return { ...snapshot, users, projects, attendance, records, scope: `công ty ${line || user.company}` };
}

async function loadSnapshot(user) {
  const [users, attendance, projects, records, notifications, conversations, messages] = await Promise.all([
    User.find({}).select('name email role company department status joinDate createdAt updatedAt').lean(),
    Attendance.find({}).select('userId date checkInTime checkOutTime status workingHours').lean(),
    Project.find({ isDeleted: false }).lean(),
    BusinessRecord.find({}).select('resource data createdAt updatedAt').lean(),
    Notification.find({ isDeleted: false }).select('title type category audience targetCompanies targetDepartments createdAt').lean(),
    Conversation.find({ isDeleted: false }).select('type name participants createdAt updatedAt').lean(),
    Message.find({ isDeleted: false }).select('conversation sender type createdAt').lean(),
  ]);
  return scopeSnapshot({ users, attendance, projects, records, notifications, conversations, messages }, user);
}

function recordsOf(snapshot, resource) {
  return snapshot.records.filter((item) => item.resource === resource).map((item) => ({ ...item.data, createdAt: item.createdAt, updatedAt: item.updatedAt }));
}

function overview(snapshot) {
  const resourceCounts = snapshot.records.reduce((result, item) => {
    result[item.resource] = (result[item.resource] || 0) + 1;
    return result;
  }, {});
  const modules = Object.entries(resourceCounts).map(([key, count]) => `${RESOURCE_NAMES[key] || key}: ${count}`).join('; ') || 'chưa có dữ liệu nghiệp vụ';
  const overdue = snapshot.projects.filter((item) => item.status === 'overdue').length;
  const activeUsers = snapshot.users.filter((item) => item.status === 'active').length;
  return `Tổng quan ${snapshot.scope}: ${activeUsers}/${snapshot.users.length} nhân sự đang hoạt động, ${snapshot.projects.length} dự án (${overdue} quá hạn), ${snapshot.notifications.length} thông báo, ${snapshot.conversations.length} cuộc trò chuyện và ${snapshot.messages.length} tin nhắn. Dữ liệu nghiệp vụ: ${modules}.`;
}

function answerRevenue(snapshot) {
  const contracts = recordsOf(snapshot, 'contracts');
  const now = new Date();
  const thisMonth = contracts.filter((item) => {
    const date = parseDate(item.signed || item.createdAt);
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const source = thisMonth.length ? thisMonth : contracts;
  const totals = source.reduce((result, item) => {
    const line = item.line || 'Chưa xác định';
    result[line] = (result[line] || 0) + Number(item.value || 0);
    return result;
  }, {});
  const rows = Object.entries(totals).sort((a, b) => a[1] - b[1]);
  if (!rows.length) return 'Chưa có hợp đồng nào để tính doanh thu.';
  const [lowest, amount] = rows[0];
  const period = thisMonth.length ? 'trong tháng này' : 'trên toàn bộ dữ liệu hợp đồng hiện có (tháng này chưa có hợp đồng)';
  return `${lowest} có doanh thu thấp nhất ${period}: ${formatMoney(amount)}. So sánh: ${rows.map(([line, value]) => `${line} ${formatMoney(value)}`).join(', ')}.`;
}

function answerOverdueProjects(snapshot, onlyIso) {
  const overdue = snapshot.projects.filter((item) => item.status === 'overdue' && (!onlyIso || normalize(`${item.code} ${item.name} ${item.description || ''}`).includes('iso')));
  if (!overdue.length) return `Không có dự án ${onlyIso ? 'ISO ' : ''}nào đang quá hạn trong dữ liệu hiện tại.`;
  return `Có ${overdue.length} dự án ${onlyIso ? 'ISO ' : ''}đang quá hạn: ${overdue.map((item) => `${item.code} – ${item.name} (phụ trách ${item.pm}, hạn ${item.due}, tiến độ ${item.progress}%)`).join('; ')}.`;
}

function answerCertifications(snapshot) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today); limit.setDate(limit.getDate() + 30);
  const expiring = recordsOf(snapshot, 'certifications').filter((item) => {
    const date = parseDate(item.expires);
    return date && date >= today && date <= limit;
  }).sort((a, b) => parseDate(a.expires) - parseDate(b.expires));
  if (!expiring.length) return 'Không có khách hàng nào hết hạn hoặc cần tái chứng nhận trong 30 ngày tới.';
  return `Có ${expiring.length} khách hàng cần theo dõi tái chứng nhận trong 30 ngày: ${expiring.map((item) => `${item.customer || item.title} – ${item.standard || 'chứng nhận'} (${formatDate(item.expires)})`).join('; ')}.`;
}

function answerPeople(snapshot, question) {
  const byCompany = snapshot.users.reduce((result, item) => { result[item.company] = (result[item.company] || 0) + 1; return result; }, {});
  const byDepartment = snapshot.users.reduce((result, item) => { result[item.department] = (result[item.department] || 0) + 1; return result; }, {});
  if (normalize(question).includes('phong')) return `Nhân sự theo phòng ban: ${Object.entries(byDepartment).sort((a, b) => b[1] - a[1]).map(([name, count]) => `${name}: ${count}`).join(', ')}.`;
  return `Có ${snapshot.users.length} nhân sự trong phạm vi dữ liệu. Theo công ty: ${Object.entries(byCompany).map(([name, count]) => `${name}: ${count}`).join(', ')}.`;
}

function answerAttendance(snapshot) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const rows = snapshot.attendance.filter((item) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.date)) === today);
  const late = rows.filter((item) => item.status === 'late').length;
  return `Hôm nay có ${rows.length} bản ghi chấm công trong ${snapshot.scope}, trong đó ${late} trường hợp đi muộn.`;
}

function answerKpi(snapshot) {
  const kpiRecords = snapshot.records.filter((item) => item.resource === 'kpi' || item.resource === 'kpis');
  if (!kpiRecords.length) return 'Module KPI hiện chưa có bản ghi MongoDB nên chưa thể xác định phòng ban có KPI thấp nhất. Các module còn lại đã được đọc bình thường.';
  return `Đã tìm thấy ${kpiRecords.length} bản ghi KPI, nhưng cấu trúc hiện tại chưa có trường điểm phòng ban thống nhất để xếp hạng chính xác.`;
}

function answerSearch(snapshot, question) {
  const tokens = normalize(question).split(/[^a-z0-9]+/).filter((token) => token.length >= 3 && !['bao', 'nhieu', 'nao', 'dang', 'trong', 'hien', 'tai', 'thang', 'cong', 'viec'].includes(token));
  const candidates = [
    ...snapshot.projects.map((item) => ({ type: 'Dự án', title: `${item.code} – ${item.name}`, value: item })),
    ...snapshot.records.map((item) => ({ type: RESOURCE_NAMES[item.resource] || item.resource, title: item.data?.title || item.data?.name || item.data?.customer || item.data?.code, value: item.data })),
    ...snapshot.users.map((item) => ({ type: 'Nhân sự', title: item.name, value: item })),
  ].filter((item) => item.title && tokens.some((token) => normalize(JSON.stringify(item.value)).includes(token))).slice(0, 8);
  if (!candidates.length) return `${overview(snapshot)} Tôi chưa tìm thấy bản ghi khớp trực tiếp với câu hỏi này.`;
  return `Tìm thấy ${candidates.length} kết quả liên quan: ${candidates.map((item) => `${item.type}: ${item.title}`).join('; ')}.`;
}

function buildAnswer(snapshot, question) {
  const q = normalize(question);
  if (q.includes('doanh thu')) return answerRevenue(snapshot);
  if (q.includes('tai chung nhan') || q.includes('sap het han') || q.includes('30 ngay')) return answerCertifications(snapshot);
  if (q.includes('kpi')) return answerKpi(snapshot);
  if (q.includes('cham cong') || q.includes('di muon')) return answerAttendance(snapshot);
  if (q.includes('nhan su') || q.includes('nhan vien')) return answerPeople(snapshot, question);
  if (q.includes('du an') && (q.includes('tre') || q.includes('qua han'))) return answerOverdueProjects(snapshot, q.includes('iso'));
  if (q.includes('tong quan') || q.includes('toan bo') || q.includes('tinh hinh')) return overview(snapshot);
  return answerSearch(snapshot, question);
}

export async function queryAssistant(req, res, next) {
  try {
    const question = String(req.body?.question || '').trim();
    if (question.length < 3 || question.length > 500) return res.status(400).json({ success: false, message: 'Câu hỏi phải có từ 3 đến 500 ký tự' });
    const snapshot = await loadSnapshot(req.user);
    const sources = {
      users: snapshot.users.length, attendance: snapshot.attendance.length, projects: snapshot.projects.length,
      businessRecords: snapshot.records.length, notifications: snapshot.notifications.length,
      conversations: snapshot.conversations.length, messages: snapshot.messages.length,
    };
    res.json({ success: true, answer: buildAnswer(snapshot, question), scope: snapshot.scope, sources, readAt: new Date().toISOString() });
  } catch (error) { next(error); }
}
