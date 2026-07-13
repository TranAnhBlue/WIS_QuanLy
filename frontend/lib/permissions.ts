// ==========================================
// ROLES - Vai trò trong hệ thống
// ==========================================
export type Role =
  | "intern"              // Level 10 - Thực tập sinh
  | "staff"               // Level 20 - Nhân viên
  | "specialist"          // Level 30 - Chuyên viên
  | "senior_specialist"   // Level 40 - Chuyên viên cao cấp
  | "team_leader"         // Level 50 - Trưởng nhóm
  | "dept_deputy"         // Level 60 - Phó phòng
  | "dept_manager"        // Level 70 - Trưởng phòng
  | "company_deputy"      // Level 75 - Phó Giám đốc công ty
  | "company_ceo"         // Level 80 - Giám đốc công ty
  | "group_admin"         // Level 90 - Quản trị hệ thống
  | "group_director"      // Level 95 - Giám đốc điều hành
  | "group_ceo";          // Level 100 - Tổng Giám đốc

// ==========================================
// ROLE HIERARCHY - Cấp bậc vai trò
// ==========================================
export const ROLE_HIERARCHY: Record<Role, number> = {
  intern: 10,
  staff: 20,
  specialist: 30,
  senior_specialist: 40,
  team_leader: 50,
  dept_deputy: 60,
  dept_manager: 70,
  company_deputy: 75,
  company_ceo: 80,
  group_admin: 90,
  group_director: 95,
  group_ceo: 100,
};

// ==========================================
// COMPANIES - Công ty trong tập đoàn
// ==========================================
export type Company = "WIS_GROUP" | "WCERT" | "SCT_VIET" | "ICT_VIET";

// ==========================================
// DEPARTMENTS - Phòng ban
// ==========================================
export type Department =
  // WIS Group Departments
  | "WIS_ADMIN"
  | "WIS_IT"
  | "WIS_FINANCE"
  // WCERT Departments (Tầng 5)
  | "WCERT_CERT"
  | "WCERT_AUDIT"
  | "WCERT_TRAINING"
  // SCT VIET Departments (Tầng 3)
  | "SCT_CONSULTING"
  | "SCT_TRAINING"
  | "SCT_SCIENCE"
  | "SCT_LEGAL"
  | "SCT_ADMIN"
  // ICT VIET Departments (Tầng 2)
  | "ICT_VIETGAP"
  | "ICT_ORGANIC"
  | "ICT_TOURISM"
  | "ICT_ADMIN";

// ==========================================
// COMPANY INFO - Thông tin công ty
// ==========================================
export const COMPANY_INFO: Record<Company, { name: string; floor: string; departments: Department[] }> = {
  WIS_GROUP: {
    name: "WIS Group",
    floor: "Tầng Điều hành",
    departments: ["WIS_ADMIN", "WIS_IT", "WIS_FINANCE"],
  },
  WCERT: {
    name: "WCERT",
    floor: "Tầng 5",
    departments: ["WCERT_CERT", "WCERT_AUDIT", "WCERT_TRAINING"],
  },
  SCT_VIET: {
    name: "SCT VIET",
    floor: "Tầng 3",
    departments: ["SCT_CONSULTING", "SCT_TRAINING", "SCT_SCIENCE", "SCT_LEGAL", "SCT_ADMIN"],
  },
  ICT_VIET: {
    name: "ICT VIET",
    floor: "Tầng 2",
    departments: ["ICT_VIETGAP", "ICT_ORGANIC", "ICT_TOURISM", "ICT_ADMIN"],
  },
};

// ==========================================
// DEPARTMENT INFO - Thông tin phòng ban
// ==========================================
export const DEPARTMENT_INFO: Record<Department, { name: string; company: Company }> = {
  // WIS Group
  WIS_ADMIN: { name: "Ban Điều hành", company: "WIS_GROUP" },
  WIS_IT: { name: "Phòng IT", company: "WIS_GROUP" },
  WIS_FINANCE: { name: "Phòng Tài chính", company: "WIS_GROUP" },
  // WCERT
  WCERT_CERT: { name: "Phòng Phạm vi tiêu chuẩn quy chuẩn", company: "WCERT" },
  WCERT_AUDIT: { name: "Phòng Đánh giá", company: "WCERT" },
  WCERT_TRAINING: { name: "Phòng Đào tạo", company: "WCERT" },
  // SCT VIET
  SCT_CONSULTING: { name: "Phòng Tư vấn", company: "SCT_VIET" },
  SCT_TRAINING: { name: "Phòng Đào tạo", company: "SCT_VIET" },
  SCT_SCIENCE: { name: "Phòng Nhiệm vụ KH", company: "SCT_VIET" },
  SCT_LEGAL: { name: "Phòng Bảo hộ", company: "SCT_VIET" },
  SCT_ADMIN: { name: "Phòng Hành chính", company: "SCT_VIET" },
  // ICT VIET
  ICT_VIETGAP: { name: "Phòng VietGAP", company: "ICT_VIET" },
  ICT_ORGANIC: { name: "Phòng Hữu cơ", company: "ICT_VIET" },
  ICT_TOURISM: { name: "Phòng Du lịch", company: "ICT_VIET" },
  ICT_ADMIN: { name: "Phòng Hành chính", company: "ICT_VIET" },
};

// ==========================================
// PERMISSIONS - Quyền hạn trong hệ thống
// ==========================================
export type Permission =
  // User Management
  | "manage_users"
  | "view_users"
  | "edit_own_profile"
  // Company Management
  | "manage_company"
  | "view_company_data"
  // Department Management
  | "manage_department"
  | "view_department_data"
  // CRM
  | "manage_customers"
  | "view_customers"
  | "manage_quotations"
  | "view_quotations"
  | "manage_contracts"
  | "view_contracts"
  // Projects
  | "manage_projects"
  | "view_projects"
  | "manage_tasks"
  | "view_tasks"
  // Certifications
  | "manage_certifications"
  | "view_certifications"
  // Training
  | "manage_training"
  | "view_training"
  | "enroll_training"
  // Science
  | "manage_science_missions"
  | "view_science_missions"
  // Legal
  | "manage_legal"
  | "view_legal"
  // VietGAP
  | "manage_vietgap"
  | "view_vietgap"
  // HR
  | "manage_hr"
  | "view_hr"
  | "manage_kpi"
  | "view_kpi"
  | "manage_rewards"
  | "view_rewards"
  // Documents
  | "manage_documents"
  | "view_documents"
  // System
  | "system_admin"
  | "view_analytics"
  | "manage_settings";

// ==========================================
// ROLE PERMISSIONS MAPPING
// ==========================================
export const PERMISSIONS: Record<Role, Permission[]> = {
  // Level 10 - Intern
  intern: [
    "edit_own_profile",
    "view_department_data",
    "view_customers",
    "view_quotations",
    "view_projects",
    "view_tasks",
    "view_documents",
    "enroll_training",
  ],

  // Level 20 - Staff
  staff: [
    "edit_own_profile",
    "view_department_data",
    "view_customers",
    "view_quotations",
    "view_contracts",
    "view_projects",
    "view_tasks",
    "view_certifications",
    "view_training",
    "enroll_training",
    "view_documents",
    "view_hr",
    "view_kpi",
  ],

  // Level 30 - Specialist
  specialist: [
    "edit_own_profile",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "view_projects",
    "view_certifications",
    "view_training",
    "enroll_training",
    "view_science_missions",
    "view_legal",
    "view_vietgap",
    "view_documents",
    "view_hr",
    "view_kpi",
  ],

  // Level 40 - Senior Specialist
  senior_specialist: [
    "edit_own_profile",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "enroll_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "view_hr",
    "view_kpi",
  ],

  // Level 50 - Team Leader
  team_leader: [
    "edit_own_profile",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "enroll_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "view_rewards",
  ],

  // Level 60 - Department Deputy
  dept_deputy: [
    "edit_own_profile",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
  ],

  // Level 70 - Department Manager
  dept_manager: [
    "edit_own_profile",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
  ],

  // Level 75 - Company Deputy
  company_deputy: [
    "edit_own_profile",
    "manage_company",
    "view_company_data",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
  ],

  // Level 80 - Company CEO
  company_ceo: [
    "edit_own_profile",
    "manage_company",
    "view_company_data",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
    "manage_settings",
  ],

  // Level 90 - Group Admin
  group_admin: [
    "edit_own_profile",
    "manage_users",
    "view_users",
    "manage_company",
    "view_company_data",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
    "system_admin",
    "manage_settings",
  ],

  // Level 95 - Group Director
  group_director: [
    "edit_own_profile",
    "manage_company",
    "view_company_data",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
    "system_admin",
    "manage_settings",
  ],

  // Level 100 - Group CEO
  group_ceo: [
    "edit_own_profile",
    "manage_company",
    "view_company_data",
    "manage_department",
    "view_department_data",
    "manage_customers",
    "view_customers",
    "manage_quotations",
    "view_quotations",
    "manage_contracts",
    "view_contracts",
    "manage_tasks",
    "view_tasks",
    "manage_projects",
    "view_projects",
    "manage_certifications",
    "view_certifications",
    "manage_training",
    "view_training",
    "manage_science_missions",
    "view_science_missions",
    "manage_legal",
    "view_legal",
    "manage_vietgap",
    "view_vietgap",
    "manage_documents",
    "view_documents",
    "manage_hr",
    "view_hr",
    "manage_kpi",
    "view_kpi",
    "manage_rewards",
    "view_rewards",
    "view_analytics",
    "system_admin",
    "manage_settings",
  ],
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user's role is higher or equal to another role
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return PERMISSIONS[role];
}

/**
 * Get department name by key
 */
export function getDepartmentName(department: Department): string {
  return DEPARTMENT_INFO[department]?.name || department;
}

/**
 * Get company name by key
 */
export function getCompanyName(company: Company): string {
  return COMPANY_INFO[company]?.name || company;
}
