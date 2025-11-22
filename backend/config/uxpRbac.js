/**
 * UXP Role-Based Access Control (RBAC) Configuration
 *
 * Defines roles and their permissions for the UXP Platform.
 */

// Role Definitions
const ROLES = {
  ADMIN: 'ADMIN',
  MARKETING_LEAD: 'MARKETING_LEAD',
  FIELD_OPS: 'FIELD_OPS',
  AGENCY: 'AGENCY',
  FINANCE: 'FINANCE',
  VIEWER: 'VIEWER',
};

// Permission Definitions
const PERMISSIONS = {
  // Campaign Permissions
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATE',
  CAMPAIGN_READ: 'CAMPAIGN_READ',
  CAMPAIGN_UPDATE: 'CAMPAIGN_UPDATE',
  CAMPAIGN_DELETE: 'CAMPAIGN_DELETE',
  CAMPAIGN_UPDATE_BUDGET: 'CAMPAIGN_UPDATE_BUDGET',

  // Event Permissions
  EVENT_CREATE: 'EVENT_CREATE',
  EVENT_READ: 'EVENT_READ',
  EVENT_UPDATE: 'EVENT_UPDATE',
  EVENT_DELETE: 'EVENT_DELETE',
  EVENT_CHECKIN: 'EVENT_CHECKIN',
  EVENT_CHECKOUT: 'EVENT_CHECKOUT',

  // Venue Permissions
  VENUE_CREATE: 'VENUE_CREATE',
  VENUE_READ: 'VENUE_READ',
  VENUE_UPDATE: 'VENUE_UPDATE',
  VENUE_DELETE: 'VENUE_DELETE',

  // People Assignment Permissions
  ASSIGNMENT_CREATE: 'ASSIGNMENT_CREATE',
  ASSIGNMENT_READ: 'ASSIGNMENT_READ',
  ASSIGNMENT_DELETE: 'ASSIGNMENT_DELETE',

  // QR Code Permissions
  QRCODE_CREATE: 'QRCODE_CREATE',
  QRCODE_READ: 'QRCODE_READ',
  QRCODE_DELETE: 'QRCODE_DELETE',

  // Analytics & Reporting
  ANALYTICS_READ: 'ANALYTICS_READ',
  PLACER_DATA_READ: 'PLACER_DATA_READ',

  // Admin Permissions
  ADMIN_ROLE_MANAGE: 'ADMIN_ROLE_MANAGE',
  ADMIN_SETTINGS: 'ADMIN_SETTINGS',
};

// Role-Permission Mappings
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Full access

  [ROLES.MARKETING_LEAD]: [
    PERMISSIONS.CAMPAIGN_CREATE,
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.CAMPAIGN_UPDATE,
    PERMISSIONS.CAMPAIGN_DELETE,
    PERMISSIONS.CAMPAIGN_UPDATE_BUDGET,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.VENUE_CREATE,
    PERMISSIONS.VENUE_READ,
    PERMISSIONS.VENUE_UPDATE,
    PERMISSIONS.ASSIGNMENT_CREATE,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.ASSIGNMENT_DELETE,
    PERMISSIONS.QRCODE_CREATE,
    PERMISSIONS.QRCODE_READ,
    PERMISSIONS.QRCODE_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.PLACER_DATA_READ,
  ],

  [ROLES.FIELD_OPS]: [
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.EVENT_CHECKIN,
    PERMISSIONS.EVENT_CHECKOUT,
    PERMISSIONS.VENUE_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.QRCODE_CREATE,
    PERMISSIONS.QRCODE_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.AGENCY]: [
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.VENUE_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.QRCODE_READ,
  ],

  [ROLES.FINANCE]: [
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.CAMPAIGN_UPDATE_BUDGET,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.VENUE_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.VENUE_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.QRCODE_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.PLACER_DATA_READ,
  ],
};

/**
 * Get permissions for a role
 */
function getRolePermissions(roleName) {
  return ROLE_PERMISSIONS[roleName] || [];
}

/**
 * Check if a user has a specific permission
 */
function hasPermission(userRoles, permission) {
  if (!Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }

  // Get all permissions for all user roles
  const allPermissions = userRoles.flatMap(role => getRolePermissions(role));

  return allPermissions.includes(permission);
}

/**
 * Get user roles from Azure AD groups and database
 *
 * Priority:
 * 1. Azure AD Group → ADMIN
 * 2. Database UserRoles table → MARKETING_LEAD, FIELD_OPS, AGENCY, FINANCE
 * 3. Default → VIEWER
 */
function getUserRolesFromGroups(groups) {
  // ADMIN role from Azure AD group
  const ADMIN_GROUP_ID = '1322ab5f-d86d-4c9e-b863-fba031615857';
  if (groups && groups.includes(ADMIN_GROUP_ID)) {
    return [ROLES.ADMIN];
  }

  // Note: Additional roles will be fetched from database in middleware
  // For now, default to VIEWER role
  return [ROLES.VIEWER];
}

/**
 * Map department to UXP role (fallback if no database role assigned)
 */
function getDepartmentRole(department) {
  const departmentRoleMap = {
    'Marketing': ROLES.MARKETING_LEAD,
    'Field Operations': ROLES.FIELD_OPS,
    'Finance': ROLES.FINANCE,
    'Creative': ROLES.AGENCY,
    'Strategy': ROLES.MARKETING_LEAD,
  };

  return departmentRoleMap[department] || ROLES.VIEWER;
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  getUserRolesFromGroups,
  getDepartmentRole,
};
