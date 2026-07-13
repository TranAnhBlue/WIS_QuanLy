import mongoose from "mongoose";

const readReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["general", "system", "project", "attendance", "contract", "quotation", "hr", "chat", "training"],
      default: "general",
    },
    link: { type: String, trim: true, maxlength: 500 },
    audience: {
      type: String,
      enum: ["all", "company", "department", "users"],
      default: "all",
    },
    targetCompanies: [{ type: String, enum: ["WIS_GROUP", "WCERT", "SCT_VIET", "ICT_VIET"] }],
    targetDepartments: [{ type: String, trim: true }],
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readBy: [readReceiptSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ audience: 1, targetCompanies: 1 });
notificationSchema.index({ audience: 1, targetDepartments: 1 });
notificationSchema.index({ "readBy.user": 1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
