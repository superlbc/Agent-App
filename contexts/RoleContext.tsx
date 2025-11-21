import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  Permission,
  UserRoleAssignment,
  PermissionCheckResult,
  RoleContextState
} from '../types';
import { useAuth } from './AuthContext';

// ============================================================================
// DEFAULT ROLE PERMISSIONS MATRIX
// ============================================================================

/**
 * Default permissions for each role
 * These can be overridden by custom role definitions in the database
 */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // EMPLOYEE - View own data only
  EMPLOYEE: [
    "EMPLOYEE_READ_OWN",
    "EMPLOYEE_UPDATE_OWN",
  ],

  // HIRING_MANAGER - Create pre-hires for own team
  HIRING_MANAGER: [
    "EMPLOYEE_READ_OWN",
    "EMPLOYEE_UPDATE_OWN",
    "EMPLOYEE_READ_TEAM",
    "PREHIRE_CREATE",
    "PREHIRE_READ_OWN",
    "PREHIRE_UPDATE",
    "PREHIRE_ASSIGN_PACKAGE",
    "PACKAGE_READ",
    "HARDWARE_READ",
    "SOFTWARE_READ",
    "APPROVAL_CREATE",
    "APPROVAL_READ",
  ],

  // MANAGER - Approve team equipment requests
  MANAGER: [
    "EMPLOYEE_READ_OWN",
    "EMPLOYEE_UPDATE_OWN",
    "EMPLOYEE_READ_TEAM",
    "PREHIRE_READ_OWN",
    "PACKAGE_READ",
    "HARDWARE_READ",
    "SOFTWARE_READ",
    "APPROVAL_READ",
    "APPROVAL_APPROVE_OWN_TEAM",
    "APPROVAL_REJECT",
  ],

  // IT - Manage hardware, process Helix tickets
  IT: [
    "EMPLOYEE_READ",
    "PREHIRE_READ",
    "PACKAGE_READ",
    "HARDWARE_CREATE",
    "HARDWARE_READ",
    "HARDWARE_UPDATE",
    "HARDWARE_ASSIGN",
    "HARDWARE_MAINTENANCE",
    "HARDWARE_RETIRE",
    "HARDWARE_EXPORT",
    "SOFTWARE_READ",
    "SOFTWARE_ASSIGN",
    "SOFTWARE_REVOKE",
    "LICENSE_ASSIGN",
    "LICENSE_RECLAIM",
    "LICENSE_VIEW_UTILIZATION",
    "APPROVAL_READ",
    "HELIX_CREATE_TICKET",
    "HELIX_READ_TICKET",
    "HELIX_UPDATE_TICKET",
    "HELIX_CLOSE_TICKET",
  ],

  // FINANCE - View costs, approve >$5K purchases
  FINANCE: [
    "EMPLOYEE_READ",
    "PACKAGE_READ",
    "HARDWARE_READ",
    "HARDWARE_VIEW_COST",
    "HARDWARE_REFRESH_VIEW",
    "SOFTWARE_READ",
    "SOFTWARE_VIEW_COST",
    "LICENSE_VIEW_UTILIZATION",
    "APPROVAL_READ",
    "APPROVAL_APPROVE", // For high-value purchases
  ],

  // HR - Create pre-hires, manage pre-hires, VIEW hardware/software (CANNOT create)
  HR: [
    "EMPLOYEE_READ",
    "EMPLOYEE_UPDATE",
    "EMPLOYEE_EXPORT",
    "PREHIRE_CREATE",
    "PREHIRE_READ",
    "PREHIRE_UPDATE",
    "PREHIRE_DELETE",
    "PREHIRE_ASSIGN_PACKAGE",
    "PREHIRE_LINK_EMPLOYEE",
    "PREHIRE_EXPORT",
    "PACKAGE_READ",
    "PACKAGE_ASSIGN",
    "PACKAGE_CREATE_EXCEPTION", // HR can create exception packages (require approval)
    "HARDWARE_READ",
    "HARDWARE_VIEW_COST",
    "SOFTWARE_READ",
    "SOFTWARE_VIEW_COST",
    "LICENSE_VIEW_UTILIZATION",
    "APPROVAL_CREATE",
    "APPROVAL_READ",
    "FREEZEPERIOD_READ",
    "FREEZEPERIOD_SEND_EMAIL",
  ],

  // DIRECTOR - Full HR access + create packages + all approvals
  DIRECTOR: [
    "EMPLOYEE_READ",
    "EMPLOYEE_UPDATE",
    "EMPLOYEE_DELETE",
    "EMPLOYEE_EXPORT",
    "PREHIRE_CREATE",
    "PREHIRE_READ",
    "PREHIRE_UPDATE",
    "PREHIRE_DELETE",
    "PREHIRE_ASSIGN_PACKAGE",
    "PREHIRE_LINK_EMPLOYEE",
    "PREHIRE_EXPORT",
    "PACKAGE_CREATE",
    "PACKAGE_CREATE_STANDARD",
    "PACKAGE_CREATE_EXCEPTION",
    "PACKAGE_READ",
    "PACKAGE_UPDATE",
    "PACKAGE_DELETE",
    "PACKAGE_ASSIGN",
    "PACKAGE_EXPORT",
    "HARDWARE_READ",
    "HARDWARE_UPDATE",
    "HARDWARE_VIEW_COST",
    "HARDWARE_REFRESH_VIEW",
    "HARDWARE_EXPORT",
    "SOFTWARE_READ",
    "SOFTWARE_UPDATE",
    "SOFTWARE_VIEW_COST",
    "LICENSE_VIEW_UTILIZATION",
    "APPROVAL_CREATE",
    "APPROVAL_READ",
    "APPROVAL_APPROVE_ALL",
    "APPROVAL_REJECT",
    "APPROVAL_CANCEL",
    "APPROVAL_ESCALATE",
    "FREEZEPERIOD_CREATE",
    "FREEZEPERIOD_READ",
    "FREEZEPERIOD_UPDATE",
    "FREEZEPERIOD_DELETE",
    "FREEZEPERIOD_SEND_EMAIL",
  ],

  // ADMIN - Full system access + user management
  ADMIN: [
    // All permissions (full access)
    "PREHIRE_CREATE",
    "PREHIRE_READ",
    "PREHIRE_READ_OWN",
    "PREHIRE_UPDATE",
    "PREHIRE_DELETE",
    "PREHIRE_ASSIGN_PACKAGE",
    "PREHIRE_LINK_EMPLOYEE",
    "PREHIRE_EXPORT",
    "PACKAGE_CREATE",
    "PACKAGE_CREATE_STANDARD",
    "PACKAGE_CREATE_EXCEPTION",
    "PACKAGE_READ",
    "PACKAGE_UPDATE",
    "PACKAGE_DELETE",
    "PACKAGE_ASSIGN",
    "PACKAGE_EXPORT",
    "HARDWARE_CREATE",
    "HARDWARE_READ",
    "HARDWARE_UPDATE",
    "HARDWARE_DELETE",
    "HARDWARE_ASSIGN",
    "HARDWARE_MAINTENANCE",
    "HARDWARE_RETIRE",
    "HARDWARE_EXPORT",
    "HARDWARE_VIEW_COST",
    "HARDWARE_REFRESH_VIEW",
    "SOFTWARE_CREATE",
    "SOFTWARE_READ",
    "SOFTWARE_UPDATE",
    "SOFTWARE_DELETE",
    "SOFTWARE_ASSIGN",
    "SOFTWARE_REVOKE",
    "SOFTWARE_VIEW_COST",
    "LICENSE_CREATE",
    "LICENSE_ASSIGN",
    "LICENSE_RECLAIM",
    "LICENSE_VIEW_UTILIZATION",
    "EMPLOYEE_READ",
    "EMPLOYEE_READ_OWN",
    "EMPLOYEE_READ_TEAM",
    "EMPLOYEE_UPDATE",
    "EMPLOYEE_UPDATE_OWN",
    "EMPLOYEE_DELETE",
    "EMPLOYEE_EXPORT",
    "APPROVAL_CREATE",
    "APPROVAL_READ",
    "APPROVAL_APPROVE",
    "APPROVAL_APPROVE_OWN_TEAM",
    "APPROVAL_APPROVE_ALL",
    "APPROVAL_REJECT",
    "APPROVAL_CANCEL",
    "APPROVAL_ESCALATE",
    "FREEZEPERIOD_CREATE",
    "FREEZEPERIOD_READ",
    "FREEZEPERIOD_UPDATE",
    "FREEZEPERIOD_DELETE",
    "FREEZEPERIOD_SEND_EMAIL",
    "HELIX_CREATE_TICKET",
    "HELIX_READ_TICKET",
    "HELIX_UPDATE_TICKET",
    "HELIX_CLOSE_TICKET",
    "ADMIN_USER_MANAGE",
    "ADMIN_ROLE_MANAGE",
    "ADMIN_PERMISSION_MANAGE",
    "ADMIN_SYSTEM_CONFIG",
    "ADMIN_AUDIT_LOG",
    "ADMIN_EXPORT_ALL",
  ],
};

// ============================================================================
// ROLE CONTEXT
// ============================================================================

interface RoleContextType extends RoleContextState {
  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  checkPermission: (permission: Permission) => PermissionCheckResult;

  // Role checking
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // Role management (for admin)
  assignRole: (userId: string, role: UserRole) => Promise<void>;
  revokeRole: (userId: string, role: UserRole) => Promise<void>;

  // Reload roles/permissions
  refreshRoles: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// ============================================================================
// ROLE PROVIDER
// ============================================================================

interface RoleProviderProps {
  children: React.ReactNode;
  mockRoles?: UserRole[]; // For testing/demo purposes
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children, mockRoles }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [state, setState] = useState<RoleContextState>({
    userRoles: [],
    permissions: [],
    isLoading: true,
    error: undefined,
    currentUser: undefined,
  });

  /**
   * Load user roles and permissions from backend (or mock data)
   */
  const loadRoles = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState({
        userRoles: [],
        permissions: [],
        isLoading: false,
        error: undefined,
        currentUser: undefined,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // TODO: Replace with actual API call to backend
      // const response = await fetch(`/api/users/${user.localAccountId}/roles`);
      // const roles = await response.json();

      // For now, use mock data
      let assignedRoles: UserRoleAssignment[] = [];

      if (mockRoles && mockRoles.length > 0) {
        // Use provided mock roles
        assignedRoles = mockRoles.map((roleName, index) => ({
          id: `mock-assignment-${index}`,
          userId: user.localAccountId || user.username,
          userEmail: user.username,
          userName: user.name || user.username,
          roleId: `role-${roleName.toLowerCase()}`,
          roleName,
          assignedBy: "System",
          assignedDate: new Date(),
          isActive: true,
        }));
      } else if (isAdmin) {
        // User is in Admin Azure AD group - grant ADMIN role automatically
        assignedRoles = [{
          id: "admin-ad-group-assignment",
          userId: user.localAccountId || user.username,
          userEmail: user.username,
          userName: user.name || user.username,
          roleId: "role-admin",
          roleName: "ADMIN",
          assignedBy: "Azure AD Group (MOM Tech Admin Users SG)",
          assignedDate: new Date(),
          isActive: true,
        }];
        console.log('[RoleContext] 🔐 User is in Admin AD group - granting ADMIN role');
      } else {
        // Default: Assign EMPLOYEE role to all authenticated users
        assignedRoles = [{
          id: "default-assignment",
          userId: user.localAccountId || user.username,
          userEmail: user.username,
          userName: user.name || user.username,
          roleId: "role-employee",
          roleName: "EMPLOYEE",
          assignedBy: "System",
          assignedDate: new Date(),
          isActive: true,
        }];
      }

      // Flatten all permissions from all assigned roles
      const allPermissions: Permission[] = [];
      assignedRoles.forEach(assignment => {
        if (assignment.isActive) {
          const rolePermissions = DEFAULT_ROLE_PERMISSIONS[assignment.roleName] || [];
          rolePermissions.forEach(perm => {
            if (!allPermissions.includes(perm)) {
              allPermissions.push(perm);
            }
          });
        }
      });

      setState({
        currentUser: {
          id: user.localAccountId || user.username,
          email: user.username,
          name: user.name || user.username,
        },
        userRoles: assignedRoles,
        permissions: allPermissions,
        isLoading: false,
        error: undefined,
      });

      console.log('[RoleContext] Loaded roles:', assignedRoles.map(r => r.roleName));
      console.log('[RoleContext] Total permissions:', allPermissions.length);
    } catch (error) {
      console.error('[RoleContext] Failed to load roles:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load roles',
      }));
    }
  }, [isAuthenticated, user, isAdmin, mockRoles]);

  // Load roles on mount and when authentication changes
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  /**
   * Check if user has ANY of the provided permissions
   */
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(perm => state.permissions.includes(perm));
  }, [state.permissions]);

  /**
   * Check if user has ALL of the provided permissions
   */
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(perm => state.permissions.includes(perm));
  }, [state.permissions]);

  /**
   * Check permission with detailed result
   */
  const checkPermission = useCallback((permission: Permission): PermissionCheckResult => {
    const hasPermission = state.permissions.includes(permission);
    const roles = state.userRoles.map(r => r.roleName);

    return {
      hasPermission,
      roles,
      reason: hasPermission
        ? undefined
        : `User does not have ${permission} permission. Current roles: ${roles.join(', ')}`,
    };
  }, [state.permissions, state.userRoles]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return state.userRoles.some(r => r.roleName === role && r.isActive);
  }, [state.userRoles]);

  /**
   * Check if user has ANY of the provided roles
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => state.userRoles.some(r => r.roleName === role && r.isActive));
  }, [state.userRoles]);

  /**
   * Assign a role to a user (Admin only)
   */
  const assignRole = useCallback(async (userId: string, role: UserRole): Promise<void> => {
    if (!hasPermission("ADMIN_USER_MANAGE")) {
      throw new Error("Insufficient permissions to assign roles");
    }

    // TODO: Implement API call
    // await fetch(`/api/users/${userId}/roles`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ role }),
    // });

    console.log(`[RoleContext] Would assign ${role} to user ${userId}`);

    // Refresh roles after assignment
    await loadRoles();
  }, [hasPermission, loadRoles]);

  /**
   * Revoke a role from a user (Admin only)
   */
  const revokeRole = useCallback(async (userId: string, role: UserRole): Promise<void> => {
    if (!hasPermission("ADMIN_USER_MANAGE")) {
      throw new Error("Insufficient permissions to revoke roles");
    }

    // TODO: Implement API call
    // await fetch(`/api/users/${userId}/roles/${role}`, {
    //   method: 'DELETE',
    // });

    console.log(`[RoleContext] Would revoke ${role} from user ${userId}`);

    // Refresh roles after revocation
    await loadRoles();
  }, [hasPermission, loadRoles]);

  /**
   * Manually refresh roles/permissions
   */
  const refreshRoles = useCallback(async (): Promise<void> => {
    await loadRoles();
  }, [loadRoles]);

  const contextValue: RoleContextType = {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    hasRole,
    hasAnyRole,
    assignRole,
    revokeRole,
    refreshRoles,
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Use Role Context hook
 * Provides access to user roles and permission checking functions
 *
 * @example
 * const { hasPermission, hasRole } = useRole();
 *
 * if (hasPermission("PREHIRE_CREATE")) {
 *   // Show create pre-hire button
 * }
 *
 * if (hasRole("ADMIN")) {
 *   // Show admin menu
 * }
 */
export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { DEFAULT_ROLE_PERMISSIONS };
