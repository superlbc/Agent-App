// ============================================================================
// PERMISSION MATRIX COMPONENT
// ============================================================================
// Visual matrix showing all roles and their assigned permissions

import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Role, Permission } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PermissionMatrixProps {
  roles: Role[];
  onClose: () => void;
}

// Permission modules for grouping
const PERMISSION_MODULES = [
  'PREHIRE',
  'PACKAGE',
  'HARDWARE',
  'SOFTWARE',
  'LICENSE',
  'EMPLOYEE',
  'APPROVAL',
  'FREEZEPERIOD',
  'HELIX',
  'ADMIN',
] as const;

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
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // ============================================================================
  // ALL PERMISSIONS
  // ============================================================================

  const allPermissions = useMemo(() => {
    const permSet = new Set<Permission>();
    roles.forEach(role => {
      role.permissions.forEach(perm => permSet.add(perm));
    });
    return Array.from(permSet).sort();
  }, [roles]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter(permission => {
      // Search filter
      const matchesSearch = !searchQuery ||
        permission.toLowerCase().includes(searchQuery.toLowerCase());

      // Module filter
      const matchesModule = selectedModule === 'all' ||
        permission.startsWith(selectedModule + '_');

      // Show only differences filter
      if (showOnlyDifferences) {
        const rolesWithPerm = roles.filter(r => r.permissions.includes(permission)).length;
        const hasDifference = rolesWithPerm > 0 && rolesWithPerm < roles.length;
        return matchesSearch && matchesModule && hasDifference;
      }

      return matchesSearch && matchesModule;
    });
  }, [allPermissions, searchQuery, selectedModule, showOnlyDifferences, roles]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Permission Matrix
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Visual overview of permissions across all roles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search Permissions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by permission name..."
              icon="search"
            />
            <Select
              label="Module"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="all">All Modules</option>
              {PERMISSION_MODULES.map(module => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </Select>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyDifferences}
                  onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Show only differences
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Matrix */}
        <div className="flex-1 overflow-auto p-6">
          {filteredPermissions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <Icon name="search" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No permissions match your filters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, permissions]) => (
                <div key={module} className="space-y-2">
                  {/* Module Header */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                    {module} ({permissions.length})
                  </h3>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                      {/* Table Header */}
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <th className="border border-gray-200 dark:border-gray-700 p-3 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-20 min-w-[300px]">
                            Permission
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 p-3 text-center font-semibold text-gray-900 dark:text-white min-w-[80px]">
                            Coverage
                          </th>
                          {roles.map(role => (
                            <th
                              key={role.id}
                              className="border border-gray-200 dark:border-gray-700 p-3 text-center font-semibold text-gray-900 dark:text-white min-w-[120px]"
                            >
                              <div className="flex flex-col items-center">
                                <Icon name="shield" className="w-5 h-5 mb-1 text-blue-500" />
                                <span className="text-xs">{role.displayName}</span>
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
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              {/* Permission Name */}
                              <td className="border border-gray-200 dark:border-gray-700 p-3 font-mono text-sm text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10">
                                {permission}
                              </td>

                              {/* Coverage Percentage */}
                              <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all"
                                      style={{ width: `${coverage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {coverage}%
                                  </span>
                                </div>
                              </td>

                              {/* Role Checkmarks */}
                              {roles.map(role => (
                                <td
                                  key={role.id}
                                  className="border border-gray-200 dark:border-gray-700 p-3 text-center"
                                >
                                  {hasPermission(role, permission) ? (
                                    <Icon
                                      name="check"
                                      className="w-5 h-5 mx-auto text-green-500"
                                    />
                                  ) : (
                                    <Icon
                                      name="x"
                                      className="w-5 h-5 mx-auto text-gray-300 dark:text-gray-600"
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredPermissions.length} of {allPermissions.length} permissions
            across {roles.length} roles
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
