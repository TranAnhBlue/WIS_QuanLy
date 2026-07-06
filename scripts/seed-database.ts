// Seed demo data to MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wis_database';

// Define User schema inline to avoid import issues
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String, required: true },
    department: { type: String, required: true },
    phone: String,
    avatar: String,
    joinDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Hash password before saving
import bcrypt from 'bcryptjs';

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', UserSchema);

// Demo users data
const DEMO_USERS = [
  {
    email: 'admin@wis.vn',
    password: 'admin123',
    name: 'Admin System',
    role: 'group_admin',
    company: 'WIS_GROUP',
    department: 'WIS_IT',
    phone: '0900000000',
    status: 'active',
  },
  {
    email: 'ceo@wis.vn',
    password: 'ceo123',
    name: 'Nguyễn Thị Lan Anh',
    role: 'group_ceo',
    company: 'WIS_GROUP',
    department: 'WIS_EXECUTIVE',
    phone: '0900000001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnh',
    status: 'active',
  },
  // WCERT
  {
    email: 'ceo.wcert@wis.vn',
    password: 'wcert123',
    name: 'Trần Văn Minh',
    role: 'company_ceo',
    company: 'WCERT',
    department: 'WCERT_TECHNICAL',
    phone: '0900000002',
    status: 'active',
  },
  {
    email: 'auditor@wcert.vn',
    password: 'auditor123',
    name: 'Lê Thị Hương',
    role: 'senior_specialist',
    company: 'WCERT',
    department: 'WCERT_TECHNICAL',
    phone: '0900000003',
    status: 'active',
  },
  {
    email: 'sales@wcert.vn',
    password: 'sales123',
    name: 'Phạm Quốc Tuấn',
    role: 'specialist',
    company: 'WCERT',
    department: 'WCERT_SALES',
    phone: '0900000004',
    status: 'active',
  },
  // SCT VIET
  {
    email: 'ceo.sct@wis.vn',
    password: 'sct123',
    name: 'Hoàng Minh Đức',
    role: 'company_ceo',
    company: 'SCT_VIET',
    department: 'SCT_CONSULTING',
    phone: '0900000005',
    status: 'active',
  },
  {
    email: 'tuanvu@sct.vn',
    password: 'tuanvu123',
    name: 'Tuấn Vũ',
    role: 'dept_manager',
    company: 'SCT_VIET',
    department: 'SCT_SCIENCE',
    phone: '0900000006',
    status: 'active',
  },
  {
    email: 'thuy@sct.vn',
    password: 'thuy123',
    name: 'Thùy',
    role: 'senior_specialist',
    company: 'SCT_VIET',
    department: 'SCT_SCIENCE',
    phone: '0900000007',
    status: 'active',
  },
  {
    email: 'duc@sct.vn',
    password: 'duc123',
    name: 'Đức',
    role: 'specialist',
    company: 'SCT_VIET',
    department: 'SCT_SCIENCE',
    phone: '0900000008',
    status: 'active',
  },
  {
    email: 'loc@sct.vn',
    password: 'loc123',
    name: 'Lộc',
    role: 'specialist',
    company: 'SCT_VIET',
    department: 'SCT_SCIENCE',
    phone: '0900000009',
    status: 'active',
  },
  {
    email: 'binh@sct.vn',
    password: 'binh123',
    name: 'Bình',
    role: 'dept_manager',
    company: 'SCT_VIET',
    department: 'SCT_LEGAL',
    phone: '0900000010',
    status: 'active',
  },
  {
    email: 'trainer@sct.vn',
    password: 'trainer123',
    name: 'Nguyễn Văn Thành',
    role: 'team_leader',
    company: 'SCT_VIET',
    department: 'SCT_TRAINING',
    phone: '0900000011',
    status: 'active',
  },
  // ICT VIET
  {
    email: 'ceo.ict@wis.vn',
    password: 'ict123',
    name: 'Vũ Thị Mai',
    role: 'company_ceo',
    company: 'ICT_VIET',
    department: 'ICT_TOURISM',
    phone: '0900000012',
    status: 'active',
  },
  {
    email: 'tour@ict.vn',
    password: 'tour123',
    name: 'Đỗ Minh Hà',
    role: 'specialist',
    company: 'ICT_VIET',
    department: 'ICT_TOURISM',
    phone: '0900000013',
    status: 'active',
  },
  {
    email: 'vietgap@ict.vn',
    password: 'vietgap123',
    name: 'Lý Văn Sơn',
    role: 'senior_specialist',
    company: 'ICT_VIET',
    department: 'ICT_VIETGAP',
    phone: '0900000014',
    status: 'active',
  },
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    console.log('📝 Creating demo users...');
    for (const userData of DEMO_USERS) {
      const user = new User(userData);
      await user.save();
      console.log(`   ✓ Created: ${userData.email}`);
    }

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log(`📊 Total users created: ${DEMO_USERS.length}`);
    console.log('');
    console.log('Demo accounts:');
    console.log('  Admin: admin@wis.vn / admin123');
    console.log('  CEO: ceo@wis.vn / ceo123');
    console.log('  Tuấn Vũ: tuanvu@sct.vn / tuanvu123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
