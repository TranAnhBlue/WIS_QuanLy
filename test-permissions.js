// Test permissions for group_admin role
const PERMISSIONS = {
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
};

function hasPermission(role, permission) {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) {
    console.log(`❌ Role "${role}" not found in PERMISSIONS`);
    return false;
  }
  
  const result = rolePermissions.includes(permission);
  console.log(`${result ? '✅' : '❌'} Role "${role}" ${result ? 'HAS' : 'DOES NOT HAVE'} permission "${permission}"`);
  return result;
}

console.log('\n🧪 Testing group_admin permissions:\n');

// Test cases
hasPermission('group_admin', 'manage_users');
hasPermission('group_admin', 'view_users');
hasPermission('group_admin', 'system_admin');
hasPermission('group_admin', 'manage_settings');
hasPermission('group_admin', 'invalid_permission');

console.log('\n📋 All permissions for group_admin:');
console.log(PERMISSIONS.group_admin);
