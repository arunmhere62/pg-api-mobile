export const defaultPermissions = [
  // PG Location Permissions
  { screen_name: 'pg_location', action: 'CREATE', description: 'Create new PG locations' },
  { screen_name: 'pg_location', action: 'EDIT', description: 'Edit existing PG locations' },
  { screen_name: 'pg_location', action: 'DELETE', description: 'Delete PG locations' },
  { screen_name: 'pg_location', action: 'VIEW', description: 'View PG locations' },

  // Room Permissions
  { screen_name: 'room', action: 'CREATE', description: 'Create new rooms' },
  { screen_name: 'room', action: 'EDIT', description: 'Edit existing rooms' },
  { screen_name: 'room', action: 'DELETE', description: 'Delete rooms' },
  { screen_name: 'room', action: 'VIEW', description: 'View rooms' },

  // Bed Permissions
  { screen_name: 'bed', action: 'CREATE', description: 'Create new beds' },
  { screen_name: 'bed', action: 'EDIT', description: 'Edit existing beds' },
  { screen_name: 'bed', action: 'DELETE', description: 'Delete beds' },
  { screen_name: 'bed', action: 'VIEW', description: 'View beds' },

  // Tenant Permissions
  { screen_name: 'tenant', action: 'CREATE', description: 'Create new tenants' },
  { screen_name: 'tenant', action: 'EDIT', description: 'Edit existing tenants' },
  { screen_name: 'tenant', action: 'DELETE', description: 'Delete tenants' },
  { screen_name: 'tenant', action: 'VIEW', description: 'View tenants' },

  // Visitor Permissions
  { screen_name: 'visitor', action: 'CREATE', description: 'Create new visitors' },
  { screen_name: 'visitor', action: 'EDIT', description: 'Edit existing visitors' },
  { screen_name: 'visitor', action: 'DELETE', description: 'Delete visitors' },
  { screen_name: 'visitor', action: 'VIEW', description: 'View visitors' },

  // Rent Payment Permissions
  { screen_name: 'rent', action: 'CREATE', description: 'Create rent payments' },
  { screen_name: 'rent', action: 'EDIT', description: 'Edit rent payments' },
  { screen_name: 'rent', action: 'DELETE', description: 'Delete rent payments' },
  { screen_name: 'rent', action: 'VIEW', description: 'View rent payments' },

  // Advance Payment Permissions
  { screen_name: 'advance', action: 'CREATE', description: 'Create advance payments' },
  { screen_name: 'advance', action: 'EDIT', description: 'Edit advance payments' },
  { screen_name: 'advance', action: 'DELETE', description: 'Delete advance payments' },
  { screen_name: 'advance', action: 'VIEW', description: 'View advance payments' },

  // Refund Payment Permissions
  { screen_name: 'refund', action: 'CREATE', description: 'Create refund payments' },
  { screen_name: 'refund', action: 'EDIT', description: 'Edit refund payments' },
  { screen_name: 'refund', action: 'DELETE', description: 'Delete refund payments' },
  { screen_name: 'refund', action: 'VIEW', description: 'View refund payments' },

  // Expense Permissions
  { screen_name: 'expense', action: 'CREATE', description: 'Create expenses' },
  { screen_name: 'expense', action: 'EDIT', description: 'Edit expenses' },
  { screen_name: 'expense', action: 'DELETE', description: 'Delete expenses' },
  { screen_name: 'expense', action: 'VIEW', description: 'View expenses' },

  // Employee Permissions
  { screen_name: 'employee', action: 'CREATE', description: 'Create employees' },
  { screen_name: 'employee', action: 'EDIT', description: 'Edit employees' },
  { screen_name: 'employee', action: 'DELETE', description: 'Delete employees' },
  { screen_name: 'employee', action: 'VIEW', description: 'View employees' },

  // Employee Salary Permissions
  { screen_name: 'employee_salary', action: 'CREATE', description: 'Create employee salary records' },
  { screen_name: 'employee_salary', action: 'EDIT', description: 'Edit employee salary records' },
  { screen_name: 'employee_salary', action: 'DELETE', description: 'Delete employee salary records' },
  { screen_name: 'employee_salary', action: 'VIEW', description: 'View employee salary records' },

  // Recently Vacated Permissions
  { screen_name: 'recently_vacated', action: 'CREATE', description: 'Create recently vacated records' },
  { screen_name: 'recently_vacated', action: 'EDIT', description: 'Edit recently vacated records' },
  { screen_name: 'recently_vacated', action: 'DELETE', description: 'Delete recently vacated records' },
  { screen_name: 'recently_vacated', action: 'VIEW', description: 'View recently vacated records' },

  // Role & Permission Management
  { screen_name: 'role', action: 'CREATE', description: 'Create new roles' },
  { screen_name: 'role', action: 'EDIT', description: 'Edit existing roles' },
  { screen_name: 'role', action: 'DELETE', description: 'Delete roles' },
  { screen_name: 'role', action: 'VIEW', description: 'View roles' },
  { screen_name: 'permission', action: 'EDIT', description: 'Manage permissions' },

  // User Management
  { screen_name: 'user', action: 'CREATE', description: 'Create new users' },
  { screen_name: 'user', action: 'EDIT', description: 'Edit existing users' },
  { screen_name: 'user', action: 'DELETE', description: 'Delete users' },
  { screen_name: 'user', action: 'VIEW', description: 'View users' },

  // Organization Management
  { screen_name: 'organization', action: 'CREATE', description: 'Create organizations' },
  { screen_name: 'organization', action: 'EDIT', description: 'Edit organizations' },
  { screen_name: 'organization', action: 'DELETE', description: 'Delete organizations' },
  { screen_name: 'organization', action: 'VIEW', description: 'View organizations' },

  // Reports & Analytics
  { screen_name: 'reports', action: 'VIEW', description: 'View reports and analytics' },
  { screen_name: 'reports', action: 'EDIT', description: 'Export reports' },

  // Settings
  { screen_name: 'settings', action: 'VIEW', description: 'View system settings' },
  { screen_name: 'settings', action: 'EDIT', description: 'Edit system settings' },

  // Notifications
  { screen_name: 'notification', action: 'CREATE', description: 'Send notifications' },
  { screen_name: 'notification', action: 'VIEW', description: 'View notifications' },

  // Tickets/Issues
  { screen_name: 'ticket', action: 'CREATE', description: 'Create support tickets' },
  { screen_name: 'ticket', action: 'EDIT', description: 'Edit support tickets' },
  { screen_name: 'ticket', action: 'DELETE', description: 'Delete support tickets' },
  { screen_name: 'ticket', action: 'VIEW', description: 'View support tickets' },
  { screen_name: 'ticket', action: 'EDIT', description: 'Assign tickets to users' },
];
