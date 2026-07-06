import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
      index: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'early_leave', 'half_day'],
      default: 'absent',
    },
    notes: String,
    workingHours: {
      type: Number,
      default: 0, // Tính bằng giờ
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để tìm attendance của user trong một ngày
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Method để tính working hours
attendanceSchema.methods.calculateWorkingHours = function () {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2; // Round to 0.5 hour
  }
  return this.workingHours;
};

// Method để lấy dữ liệu công khai
attendanceSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    userId: this.userId,
    date: this.date,
    checkInTime: this.checkInTime,
    checkOutTime: this.checkOutTime,
    status: this.status,
    workingHours: this.workingHours,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Attendance', attendanceSchema);
