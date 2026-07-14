import Notification from "../models/Notification.js";
import User from "../models/User.js";

const MANAGE_ROLES = new Set(["group_admin", "group_director", "group_ceo"]);

async function currentUser(req) {
  return User.findById(req.user.id).select("name role company department");
}

function visibleTo(user) {
  return [
    { audience: "all" },
    { audience: "company", targetCompanies: user.company },
    { audience: "department", targetDepartments: user.department },
    { audience: "users", targetUsers: user._id },
  ];
}

function publicNotification(notification, user) {
  const data = notification.toObject ? notification.toObject() : notification;
  return {
    ...data,
    id: String(data._id),
    isRead: (data.readBy || []).some((receipt) => String(receipt.user) === String(user._id)),
    canManage:
      MANAGE_ROLES.has(user.role) || String(data.createdBy?._id || data.createdBy) === String(user._id),
    _id: undefined,
    __v: undefined,
    readBy: undefined,
  };
}

function validateAudience(body) {
  if (body.audience === "company" && !body.targetCompanies?.length) return "Vui lòng chọn ít nhất một Line";
  if (body.audience === "department" && !body.targetDepartments?.length) return "Vui lòng chọn ít nhất một phòng ban";
  if (body.audience === "users" && !body.targetUsers?.length) return "Vui lòng chọn ít nhất một người nhận";
  return null;
}

function normalizedLink(value) {
  const link = value?.trim();
  if (!link) return undefined;
  if (/^\/(?!\/)/.test(link) || /^https?:\/\//i.test(link)) return link;
  throw new Error("Đường dẫn phải bắt đầu bằng /, http:// hoặc https://");
}

export async function listNotifications(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });

    const conditions = [{ isDeleted: false }, { $or: visibleTo(user) }];
    if (req.query.category && req.query.category !== "all") conditions.push({ category: req.query.category });
    if (req.query.type && req.query.type !== "all") conditions.push({ type: req.query.type });
    if (req.query.status === "unread") conditions.push({ "readBy.user": { $ne: user._id } });
    if (req.query.status === "read") conditions.push({ "readBy.user": user._id });
    if (req.query.search?.trim()) {
      const search = req.query.search.trim();
      conditions.push({ $or: [{ title: { $regex: search, $options: "i" } }, { message: { $regex: search, $options: "i" } }] });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const notifications = await Notification.find({ $and: conditions })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);

    const unread = await Notification.countDocuments({
      $and: [{ isDeleted: false }, { $or: visibleTo(user) }, { "readBy.user": { $ne: user._id } }],
    });

    res.json({
      success: true,
      notifications: notifications.map((item) => publicNotification(item, user)),
      unread,
      canCreate: MANAGE_ROLES.has(user.role),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function unreadCount(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    const count = await Notification.countDocuments({
      $and: [{ isDeleted: false }, { $or: visibleTo(user) }, { "readBy.user": { $ne: user._id } }],
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getNotification(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    const notification = await Notification.findOne({
      $and: [{ _id: req.params.id }, { isDeleted: false }, { $or: visibleTo(user) }],
    }).populate("createdBy", "name email");
    if (!notification) {
      return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc bạn không có quyền xem" });
    }
    res.json({ success: true, notification: publicNotification(notification, user) });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: error.message });
  }
}

export async function createNotification(req, res) {
  try {
    const user = await currentUser(req);
    if (!user || !MANAGE_ROLES.has(user.role)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền tạo thông báo" });
    }
    if (!req.body.title?.trim() || !req.body.message?.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc" });
    }
    const audienceError = validateAudience(req.body);
    if (audienceError) return res.status(400).json({ success: false, message: audienceError });

    const notification = await Notification.create({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || "info",
      category: req.body.category || "general",
      link: normalizedLink(req.body.link),
      audience: req.body.audience || "all",
      targetCompanies: req.body.targetCompanies || [],
      targetDepartments: req.body.targetDepartments || [],
      targetUsers: req.body.targetUsers || [],
      createdBy: user._id,
    });
    await notification.populate("createdBy", "name email");
    res.status(201).json({ success: true, notification: publicNotification(notification, user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateNotification(req, res) {
  try {
    const user = await currentUser(req);
    const notification = await Notification.findOne({ _id: req.params.id, isDeleted: false });
    if (!notification) return res.status(404).json({ success: false, message: "Thông báo không tồn tại" });
    if (!user || (!MANAGE_ROLES.has(user.role) && String(notification.createdBy) !== String(user._id))) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa thông báo" });
    }
    if (req.body.title !== undefined && !req.body.title.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề không được để trống" });
    }
    if (req.body.message !== undefined && !req.body.message.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung không được để trống" });
    }
    const audienceError = validateAudience(req.body);
    if (audienceError) return res.status(400).json({ success: false, message: audienceError });

    for (const field of ["title", "message", "type", "category", "link", "audience", "targetCompanies", "targetDepartments", "targetUsers"]) {
      if (req.body[field] !== undefined) notification[field] = field === "link" ? normalizedLink(req.body[field]) : req.body[field];
    }
    await notification.save();
    await notification.populate("createdBy", "name email");
    res.json({ success: true, notification: publicNotification(notification, user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    const notification = await Notification.findOne({
      $and: [{ _id: req.params.id }, { isDeleted: false }, { $or: visibleTo(user) }],
    });
    if (!notification) return res.status(404).json({ success: false, message: "Thông báo không tồn tại" });
    if (!notification.readBy.some((receipt) => String(receipt.user) === String(user._id))) {
      notification.readBy.push({ user: user._id, readAt: new Date() });
      await notification.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    const result = await Notification.updateMany(
      { $and: [{ isDeleted: false }, { $or: visibleTo(user) }, { "readBy.user": { $ne: user._id } }] },
      { $push: { readBy: { user: user._id, readAt: new Date() } } },
    );
    res.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const user = await currentUser(req);
    const notification = await Notification.findOne({ _id: req.params.id, isDeleted: false });
    if (!notification) return res.status(404).json({ success: false, message: "Thông báo không tồn tại" });
    if (!user || (!MANAGE_ROLES.has(user.role) && String(notification.createdBy) !== String(user._id))) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa thông báo" });
    }
    notification.isDeleted = true;
    await notification.save();
    res.json({ success: true, message: "Đã xóa thông báo" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
