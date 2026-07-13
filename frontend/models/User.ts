// User Model for MongoDB
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Company, Department, Role } from '@/lib/permissions';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: Role;
  company: Company;
  department: Department;
  phone?: string;
  avatar?: string;
  joinDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
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
      required: true,
      enum: ['WCERT', 'SCT_VIET', 'ICT_VIET', 'WIS_GROUP'],
    },
    department: {
      type: String,
      required: true,
      enum: [
        'WCERT_TECHNICAL',
        'WCERT_SALES',
        'WCERT_ACCOUNTING',
        'WCERT_OFFICE',
        'SCT_CONSULTING',
        'SCT_TRAINING',
        'SCT_SCIENCE',
        'SCT_LEGAL',
        'ICT_TOURISM',
        'ICT_CONSULTING',
        'ICT_VIETGAP',
        'ICT_TRADEMARK',
        'ICT_LEGAL',
        'WIS_EXECUTIVE',
        'WIS_IT',
        'WIS_HR',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
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
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Prevent model recompilation in development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
