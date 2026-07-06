// Script to seed demo users into MongoDB database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wis_database';

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema(
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
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Demo users data
const demoUsers = [
  // WIS GROUP
  {
    email: 'admin@wis.vn',
    password: 'admin123',
    name: 'Admin System',
    role: 'group_admin',
    company: 'WIS_GROUP',
    department: 'WIS_IT',
    phone: '0900000000',
    joinDate: new Date('2020-01-01'),
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
    joinDate: new Date('2020-01-01'),
    status: 'active',
  },

  // WCERT - Tầng 5
  {
    email: 'ceo.wcert@wis.vn',
    password: 'wcert123',
    name: 'Trần Văn Minh',
    role: 'company_ceo',
    company: 'WCERT',
    department: 'WCERT_TECHNICAL',
    phone: '0900000002',
    joinDate: new Date('2021-01-15'),
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
    joinDate: new Date('2021-03-20'),
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
    joinDate: new Date('2021-06-10'),
    status: 'active',
  },

  // SCT VIET - Tầng 3
  {
    email: 'ceo.sct@wis.vn',
    password: 'sct123',
    name: 'Hoàng Minh Đức',
    role: 'company_ceo',
    company: 'SCT_VIET',
    department: 'SCT_CONSULTING',
    phone: '0900000005',
    joinDate: new Date('2020-08-01'),
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
    joinDate: new Date('2020-09-15'),
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
    joinDate: new Date('2021-01-10'),
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
    joinDate: new Date('2021-02-20'),
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
    joinDate: new Date('2021-03-15'),
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
    joinDate: new Date('2020-10-01'),
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
    joinDate: new Date('2021-04-01'),
    status: 'active',
  },

  // ICT VIET - Tầng 2
  {
    email: 'ceo.ict@wis.vn',
    password: 'ict123',
    name: 'Vũ Thị Mai',
    role: 'company_ceo',
    company: 'ICT_VIET',
    department: 'ICT_TOURISM',
    phone: '0900000012',
    joinDate: new Date('2020-07-01'),
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
    joinDate: new Date('2021-05-15'),
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
    joinDate: new Date('2021-06-20'),
    status: 'active',
  },
];

async function seedUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    console.log('📝 Creating demo users...');
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`  ✓ Created user: ${userData.email}`);
    }

    console.log(`\n🎉 Successfully seeded ${demoUsers.length} users to database!`);
    console.log('\n📋 Demo accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('WIS GROUP:');
    console.log('  • ceo@wis.vn / ceo123 (Group CEO)');
    console.log('  • admin@wis.vn / admin123 (Admin)');
    console.log('\nWCERT - Tầng 5:');
    console.log('  • ceo.wcert@wis.vn / wcert123 (Company CEO)');
    console.log('  • auditor@wcert.vn / auditor123 (Senior Specialist)');
    console.log('  • sales@wcert.vn / sales123 (Specialist)');
    console.log('\nSCT VIET - Tầng 3:');
    console.log('  • ceo.sct@wis.vn / sct123 (Company CEO)');
    console.log('  • tuanvu@sct.vn / tuanvu123 (Team 302 Manager)');
    console.log('  • thuy@sct.vn / thuy123 (Team 302)');
    console.log('  • duc@sct.vn / duc123 (Team 302)');
    console.log('  • loc@sct.vn / loc123 (Team 302)');
    console.log('  • binh@sct.vn / binh123 (Legal Manager)');
    console.log('  • trainer@sct.vn / trainer123 (Training Team Leader)');
    console.log('\nICT VIET - Tầng 2:');
    console.log('  • ceo.ict@wis.vn / ict123 (Company CEO)');
    console.log('  • tour@ict.vn / tour123 (Tourism Specialist)');
    console.log('  • vietgap@ict.vn / vietgap123 (VietGAP Senior Specialist)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers();
