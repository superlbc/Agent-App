// ============================================================================
// ROLE EDITOR COMPONENT
// ============================================================================
// Modal for creating and editing roles with permission selection

import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { Role, Permission } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RoleEditorProps {
  role?: Role;
  onSave: (role: Role) => void;
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

// All available permissions (from types.ts)
const ALL_PERMISSIONS: Permission[] = [
  // Pre-hire permissions
  'PREHIRE_CREATE',
  'PREHIRE_READ',
  'PREHIRE_READ_OWN',
  'PREHIRE_UPDATE',
  'PREHIRE_DELETE',
  'PREHIRE_ASSIGN_PACKAGE',
  'PREHIRE_LINK_EMPLOYEE',
  'PREHIRE_EXPORT',
  // Package permissions
  'PACKAGE_CREATE',
  'PACKAGE_CREATE_STANDARD',
  'PACKAGE_CREATE_EXCEPTION',
  'PACKAGE_READ',
  'PACKAGE_UPDATE',
  'PACKAGE_DELETE',
  'PACKAGE_ASSIGN',
  'PACKAGE_EXPORT',
  // Hardware permissions
  'HARDWARE_CREATE',
  'HARDWARE_READ',
  'HARDWARE_UPDATE',
  'HARDWARE_DELETE',
  'HARDWARE_ASSIGN',
  'HARDWARE_MAINTENANCE',
  'HARDWARE_RETIRE',
  'HARDWARE_EXPORT',
  'HARDWARE_VIEW_COST',
  'HARDWARE_REFRESH_VIEW',
  // Software permissions
  'SOFTWARE_CREATE',
  'SOFTWARE_READ',
  'SOFTWARE_UPDATE',
  'SOFTWARE_DELETE',
  'SOFTWARE_ASSIGN',
  'SOFTWARE_REVOKE',
  'SOFTWARE_VIEW_COST',
  // License permissions
  'LICENSE_CREATE',
  'LICENSE_ASSIGN',
  'LICENSE_RECLAIM',
  'LICENSE_VIEW_UTILIZATION',
  // Employee permissions
  'EMPLOYEE_READ',
  'EMPLOYEE_READ_OWN',
  'EMPLOYEE_READ_TEAM',
  'EMPLOYEE_UPDATE',
  'EMPLOYEE_UPDATE_OWN',
  'EMPLOYEE_DELETE',
  'EMPLOYEE_EXPORT',
  // Approval permissions
  'APPROVAL_CREATE',
  'APPROVAL_READ',
  'APPROVAL_APPROVE',
  'APPROVAL_APPROVE_OWN_TEAM',
  'APPROVAL_APPROVE_ALL',
  'APPROVAL_REJECT',
  'APPROVAL_CANCEL',
  'APPROVAL_ESCALATE',
  // Freeze period permissions
  'FREEZEPERIOD_CREATE',
  'FREEZEPERIOD_READ',
  'FREEZEPERIOD_UPDATE',
  'FREEZEPERIOD_DELETE',
  'FREEZEPERIOD_SEND_EMAIL',
  // Helix permissions
  'HELIX_CREATE_TICKET',
  'HELIX_READ_TICKET',
  'HELIX_UPDATE_TICKET',
  'HELIX_CLOSE_TICKET',
  // Admin permissions
  'ADMIN_USER_MANAGE',
  'ADMIN_ROLE_MANAGE',
  'ADMIN_PERMISSION_MANAGE',
  'ADMIN_SYSTEM_CONFIG',
  'ADMIN_AUDIT_LOG',
  'ADMIN_EXPORT_ALL',
];

// ============================================================================
// COMPONENT
// ============================================================================

export const RoleEditor: React.FC<RoleEditorProps> = ({
  role,
  onSave,
  onClose,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [name, setName] = useState(role?.name || '');
  const [displayName, setDisplayName] = useState(role?.displayName || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    role?.permissions || []
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const isValid = useMemo(() => {
    return name.trim() !== '' &&
           displayName.trim() !== '' &&
           selectedPermissions.length > 0;
  }, [name, displayName, selectedPermissions]);

  // ============================================================================
  // PERMISSION GROUPING
  // ============================================================================

  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};

    PERMISSION_MODULES.forEach(module => {
      grouped[module] = ALL_PERMISSIONS.filter(perm => perm.startsWith(module + '_'));
    });

    return grouped;
  }, []);

  // Filtered permissions based on search
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return permissionsByModule;

    const filtered: Record<string, Permission[]> = {};
    const lowerQuery = searchQuery.toLowerCase();

    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      const matchingPerms = perms.filter(perm =>
        perm.toLowerCase().includes(lowerQuery)
      );
      if (matchingPerms.length > 0) {
        filtered[module] = matchingPerms;
      }
    });

    return filtered;
  }, [permissionsByModule, searchQuery]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  const togglePermission = (permission: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const selectAllInModule = (module: string) => {
    const modulePerms = permissionsByModule[module];
    const allSelected = modulePerms.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions(prev =>
        prev.filter(p => !modulePerms.includes(p))
      );
    } else {
      setSelectedPermissions(prev => [
        ...prev.filter(p => !modulePerms.includes(p)),
        ...modulePerms,
      ]);
    }
  };

  const handleSave = () => {
    if (!isValid) return;

    const savedRole: Role = {
      id: role?.id || `role-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: name.toUpperCase().replace(/\s+/g, '_'),
      displayName,
      description,
      permissions: selectedPermissions,
      isSystemRole: role?.isSystemRole || false,
      createdDate: role?.createdDate || new Date(),
      modifiedDate: new Date(),
    };

    onSave(savedRole);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {role ? 'Edit Role' : 'Create New Role'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {role?.isSystemRole
                ? 'System roles cannot be modified'
                : 'Define role details and assign permissions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Role Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Role Details
            </h3>

            <Input
              label="Role Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., PROJECT_MANAGER"
              disabled={role?.isSystemRole}
              required
            />

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Project Manager"
              disabled={role?.isSystemRole}
              required
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role's responsibilities and scope..."
              rows={3}
              disabled={role?.isSystemRole}
            />
          </div>

          {/* Permission Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Permissions ({selectedPermissions.length} selected)
              </h3>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search permissions..."
                icon="search"
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              {Object.entries(filteredPermissions).map(([module, perms]) => {
                const isExpanded = expandedModules.has(module);
                const selectedCount = perms.filter(p => selectedPermissions.includes(p)).length;
                const allSelected = perms.length === selectedCount;

                return (
                  <div
                    key={module}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
                      <button
                        onClick={() => toggleModule(module)}
                        className="flex items-center gap-2 flex-1"
                      >
                        <Icon
                          name={isExpanded ? 'chevron-down' : 'chevron-right'}
                          className="w-5 h-5 text-gray-600 dark:text-gray-400"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {module}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({selectedCount}/{perms.length})
                        </span>
                      </button>
                      {!role?.isSystemRole && (
                        <button
                          onClick={() => selectAllInModule(module)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Module Permissions */}
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {perms.map(permission => (
                          <label
                            key={permission}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              disabled={role?.isSystemRole}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                              {permission}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {Object.keys(filteredPermissions).length === 0 && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Icon name="search" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No permissions match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedPermissions.length} of {ALL_PERMISSIONS.length} permissions selected
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || role?.isSystemRole}
            >
              <Icon name="check" className="w-5 h-5 mr-2" />
              {role ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
