import dotenv from "dotenv";
import mongoose from "mongoose";
import Notification from "../../src/models/Notification.js";
import User from "../../src/models/User.js";

dotenv.config();

const marker = `[WIS notification integration ${Date.now()}]`;

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ status: "active" }).select("_id company department");
  if (!user) throw new Error("Không có tài khoản đang hoạt động để kiểm tra");

  const created = await Notification.create({
    title: marker,
    message: "Bản ghi kiểm tra tự động và sẽ được xóa ngay.",
    type: "info",
    category: "system",
    audience: "users",
    targetUsers: [user._id],
    createdBy: user._id,
  });

  const visible = await Notification.findOne({ _id: created._id, targetUsers: user._id });
  if (!visible) throw new Error("Không truy vấn được thông báo vừa tạo");
  if (visible.readBy.length !== 0) throw new Error("Thông báo mới không được ở trạng thái đã đọc");

  visible.readBy.push({ user: user._id, readAt: new Date() });
  await visible.save();
  const read = await Notification.exists({ _id: created._id, "readBy.user": user._id });
  if (!read) throw new Error("Không lưu được trạng thái đã đọc");

  console.log("Notification MongoDB integration test: OK");
} finally {
  if (mongoose.connection.readyState) {
    await Notification.deleteMany({ title: marker });
    await mongoose.disconnect();
  }
}
