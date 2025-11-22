// ============================================================================
// PERMISSION MATRIX COMPONENT
// ============================================================================
// Visual matrix interface showing all roles and their assigned permissions

import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import type { Role, Permission } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PermissionMatrixProps {
  roles: Role[];
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles,
  onClose,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // ALL PERMISSIONS
  // ============================================================================

  const allPermissions = useMemo(() => {
    const permSet = new Set<Permission>();
    roles.forEach(role => {
      role.permissions.forEach(perm => permSet.add(perm));
    });
    const perms = Array.from(permSet).sort();
    console.log('[PermissionMatrix] All permissions extracted:', perms.length, perms);
    console.log('[PermissionMatrix] Roles:', roles.length, roles.map(r => ({name: r.displayName, perms: r.permissions.length})));
    return perms;
  }, [roles]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredPermissions = useMemo(() => {
    const filtered = allPermissions.filter(permission => {
      // Search filter only
      return !searchQuery || permission.toLowerCase().includes(searchQuery.toLowerCase());
    });
    console.log('[PermissionMatrix] Filtered permissions:', filtered.length, '/ Total:', allPermissions.length, '| Search:', searchQuery);
    return filtered;
  }, [allPermissions, searchQuery]);

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};

    filteredPermissions.forEach(permission => {
      const module = permission.split('_')[0];
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permission);
    });

    return grouped;
  }, [filteredPermissions]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const hasPermission = (role: Role, permission: Permission): boolean => {
    return role.permissions.includes(permission);
  };

  const getPermissionCoverage = (permission: Permission): number => {
    const count = roles.filter(r => hasPermission(r, permission)).length;
    return Math.round((count / roles.length) * 100);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permission Matrix
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visual overview of permissions across all roles
          </p>
        </div>
      </div>

        {/* Search Filter */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-md">
            <Input
              label="Search Permissions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by permission name..."
              icon="search"
            />
          </div>
        </div>

        {/* Matrix */}
        <div className="flex-1 overflow-auto p-6">
          {filteredPermissions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <Icon name="search" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No permissions match your search</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, permissions]) => (
                <div key={module} className="space-y-3">
                  {/* Module Header - Fully opaque sticky header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-800 py-3 z-30 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {module} <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">({permissions.length})</span>
                    </h3>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                      {/* Table Header */}
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                          <th className="border border-gray-200 dark:border-gray-700 p-2 text-left font-semibold text-gray-900 dark:text-white min-w-[250px] text-sm bg-gray-50 dark:bg-gray-800">
                            Permission
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 p-2 text-center font-semibold text-gray-900 dark:text-white min-w-[100px] text-sm bg-gray-50 dark:bg-gray-800">
                            Coverage
                          </th>
                          {roles.map(role => (
                            <th
                              key={role.id}
                              className="border border-gray-200 dark:border-gray-700 p-2 text-center font-semibold text-gray-900 dark:text-white min-w-[140px] bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Icon name="shield" className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <span className="text-xs leading-tight">{role.displayName}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody>
                        {permissions.map(permission => {
                          const coverage = getPermissionCoverage(permission);

                          return (
                            <tr
                              key={permission}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                              {/* Permission Name - Sticky left column */}
                              <td className="border border-gray-200 dark:border-gray-700 p-2 font-mono text-xs text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 group-hover:bg-gray-50 group-hover:dark:bg-gray-700/30">
                                {permission}
                              </td>

                              {/* Coverage Percentage */}
                              <td className="border border-gray-200 dark:border-gray-700 p-2 text-center bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
                                      style={{ width: `${coverage}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium min-w-[32px]">
                                    {coverage}%
                                  </span>
                                </div>
                              </td>

                              {/* Role Checkmarks */}
                              {roles.map(role => (
                                <td
                                  key={role.id}
                                  className="border border-gray-200 dark:border-gray-700 p-2 text-center bg-white dark:bg-gray-800"
                                >
                                  {hasPermission(role, permission) ? (
                                    <Icon
                                      name="check"
                                      className="w-4 h-4 mx-auto text-green-500 dark:text-green-400"
                                    />
                                  ) : (
                                    <Icon
                                      name="x"
                                      className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600"
                                    />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {searchQuery ? (
            <>Showing {filteredPermissions.length} of {allPermissions.length} permissions across {roles.length} roles</>
          ) : (
            <>{allPermissions.length} permissions across {roles.length} roles</>
          )}
        </div>
      </div>
    </div>
  );
};
