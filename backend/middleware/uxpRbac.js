/**
 * UXP RBAC Middleware
 *
 * Enforces role-based access control for UXP API endpoints.
 * Works in conjunction with auth middleware to validate permissions.
 */

const { hasPermission, getUserRolesFromGroups, getDepartmentRole } = require('../config/uxpRbac');
const { find } = require('../database/azureSqlDb');

/**
 * Require specific permission(s) to access endpoint
 *
 * @param {string|Array<string>} requiredPermissions - Permission(s) required
 * @returns {Function} Express middleware function
 */
function requirePermission(requiredPermissions) {
  // Normalize to array
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (req, res, next) => {
    try {
      // User info should be added by auth middleware
      if (!req.user) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Authentication required',
        });
      }

      const { email, groups } = req.user;

      // Get user roles from database
      let userRoles = [];

      try {
        // Check if user has explicit roles in UserRoles table
        const roleAssignments = await find('UserRoles', { userId: email });

        if (roleAssignments && roleAssignments.length > 0) {
          userRoles = roleAssignments.map(r => r.roleName);
          console.log(`[RBAC] User ${email} has database roles:`, userRoles);
        } else {
          // Fallback: Check Azure AD groups for ADMIN
          userRoles = getUserRolesFromGroups(groups);

          // If not admin, try to infer role from department
          if (userRoles.length === 0 || userRoles[0] === 'VIEWER') {
            const department = req.user.department;
            if (department) {
              const departmentRole = getDepartmentRole(department);
              userRoles = [departmentRole];
              console.log(`[RBAC] User ${email} assigned ${departmentRole} based on department: ${department}`);
            }
          }
        }
      } catch (dbError) {
        console.error('[RBAC] Error fetching user roles from database:', dbError.message);
        // Fallback to Azure AD groups
        userRoles = getUserRolesFromGroups(groups);
      }

      // Attach roles to request for logging/debugging
      req.userRoles = userRoles;

      // Check if user has at least one of the required permissions
      const hasAccess = permissions.some(permission =>
        hasPermission(userRoles, permission)
      );

      if (!hasAccess) {
        console.log(`[RBAC] ❌ Access denied for ${email}. Required: ${permissions.join(' OR ')}, User roles: ${userRoles.join(', ')}`);
        return res.status(403).json({
          error: 'forbidden',
          message: 'You do not have permission to perform this action',
          details: {
            requiredPermissions: permissions,
            userRoles: userRoles,
          },
        });
      }

      console.log(`[RBAC] ✅ Access granted for ${email}. Permission: ${permissions[0]}`);
      next();
    } catch (error) {
      console.error('[RBAC] Middleware error:', error);
      return res.status(500).json({
        error: 'internal_error',
        message: 'Error checking permissions',
      });
    }
  };
}

/**
 * Require specific role(s) to access endpoint
 *
 * @param {string|Array<string>} requiredRoles - Role(s) required
 * @returns {Function} Express middleware function
 */
function requireRole(requiredRoles) {
  // Normalize to array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req, res, next) => {
    try {
      // User info should be added by auth middleware
      if (!req.user) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Authentication required',
        });
      }

      const { email, groups } = req.user;

      // Get user roles from database
      let userRoles = [];

      try {
        const roleAssignments = await find('UserRoles', { userId: email });

        if (roleAssignments && roleAssignments.length > 0) {
          userRoles = roleAssignments.map(r => r.roleName);
        } else {
          userRoles = getUserRolesFromGroups(groups);

          if (userRoles.length === 0 || userRoles[0] === 'VIEWER') {
            const department = req.user.department;
            if (department) {
              userRoles = [getDepartmentRole(department)];
            }
          }
        }
      } catch (dbError) {
        console.error('[RBAC] Error fetching user roles:', dbError.message);
        userRoles = getUserRolesFromGroups(groups);
      }

      // Attach roles to request
      req.userRoles = userRoles;

      // Check if user has at least one of the required roles
      const hasAccess = roles.some(role => userRoles.includes(role));

      if (!hasAccess) {
        console.log(`[RBAC] ❌ Access denied for ${email}. Required roles: ${roles.join(' OR ')}, User roles: ${userRoles.join(', ')}`);
        return res.status(403).json({
          error: 'forbidden',
          message: 'You do not have the required role to perform this action',
          details: {
            requiredRoles: roles,
            userRoles: userRoles,
          },
        });
      }

      console.log(`[RBAC] ✅ Access granted for ${email}. Role: ${userRoles[0]}`);
      next();
    } catch (error) {
      console.error('[RBAC] Middleware error:', error);
      return res.status(500).json({
        error: 'internal_error',
        message: 'Error checking role',
      });
    }
  };
}

/**
 * Check if user owns the resource (campaign or event owner)
 *
 * @param {string} resourceType - 'campaign' or 'event'
 * @returns {Function} Express middleware function
 */
function requireOwnership(resourceType) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Authentication required',
        });
      }

      const { email } = req.user;
      const { id } = req.params;

      // Admin and Marketing Lead bypass ownership check
      if (req.userRoles && (req.userRoles.includes('ADMIN') || req.userRoles.includes('MARKETING_LEAD'))) {
        return next();
      }

      // Check ownership based on resource type
      let resource;
      if (resourceType === 'campaign') {
        const { findById } = require('../database/azureSqlDb');
        resource = await findById('Campaigns', id);

        if (!resource) {
          return res.status(404).json({
            error: 'not_found',
            message: 'Campaign not found',
          });
        }

        if (resource.campaignOwner !== email) {
          return res.status(403).json({
            error: 'forbidden',
            message: 'You do not own this campaign',
          });
        }
      } else if (resourceType === 'event') {
        const { findById } = require('../database/azureSqlDb');
        resource = await findById('Events', id);

        if (!resource) {
          return res.status(404).json({
            error: 'not_found',
            message: 'Event not found',
          });
        }

        if (resource.owner !== email) {
          return res.status(403).json({
            error: 'forbidden',
            message: 'You do not own this event',
          });
        }
      }

      console.log(`[RBAC] ✅ Ownership verified for ${email} on ${resourceType} ${id}`);
      next();
    } catch (error) {
      console.error('[RBAC] Ownership check error:', error);
      return res.status(500).json({
        error: 'internal_error',
        message: 'Error checking resource ownership',
      });
    }
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireOwnership,
};
