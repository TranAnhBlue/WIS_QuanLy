// User Model - MongoDB Schema
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Vai trò là bắt buộc'],
      enum: [
        'group_ceo',
        'group_director',
        'group_admin',
        'company_ceo',
        'company_deputy',
        'dept_manager',
        'dept_deputy',
        'team_leader',
        'senior_specialist',
        'specialist',
        'staff',
        'intern',
      ],
      default: 'staff',
    },
    company: {
      type: String,
      required: [true, 'Công ty là bắt buộc'],
      enum: ['WCERT', 'SCT_VIET', 'ICT_VIET', 'WIS_GROUP'],
    },
    department: {
      type: String,
      required: [true, 'Phòng ban là bắt buộc'],
      enum: [
        'WCERT_TECHNICAL',
        'WCERT_SALES',
        'WCERT_ACCOUNTING',
        'WCERT_OFFICE',
        'WCERT_AUDIT',
        'WCERT_TRAINING',
        'SCT_CONSULTING',
        'SCT_TRAINING',
        'SCT_SCIENCE',
        'SCT_LEGAL',
        'ICT_TOURISM',
        'ICT_CONSULTING',
        'ICT_VIETGAP',
        'ICT_TRADEMARK',
        'ICT_LEGAL',
        'ICT_ORGANIC',
        'ICT_ADMIN',
        'WIS_EXECUTIVE',
        'WIS_IT',
        'WIS_HR',
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ company: 1, department: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Lỗi xác thực mật khẩu');
  }
};

// Method to get public profile (without password)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
