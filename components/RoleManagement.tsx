// ============================================================================
// ROLE MANAGEMENT COMPONENT
// ============================================================================
// Admin UI for managing roles, permissions, and user role assignments
// Only accessible to users with ADMIN_ROLE_MANAGE permission

import React, { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';
import { Select } from './ui/Select';
import { ConfirmModal } from './ui/ConfirmModal';
import { RoleEditor } from './admin/RoleEditor';
import { UserRoleAssignment } from './admin/UserRoleAssignment';
import { PermissionMatrix } from './admin/PermissionMatrix';
import { useRole } from '../contexts/RoleContext';
import type { Role, UserRole, Permission } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RoleManagementProps {
  className?: string;
}

type ViewMode = 'roles' | 'users' | 'permissions';

// ============================================================================
// COMPONENT
// ============================================================================

export const RoleManagement: React.FC<RoleManagementProps> = ({
  className = '',
}) => {
  // ============================================================================
  // CONTEXT & STATE
  // ============================================================================

  const { hasPermission, userRoles, permissions } = useRole();

  // Check if user has admin permission
  const canManageRoles = hasPermission('ADMIN_ROLE_MANAGE');
  const canManageUsers = hasPermission('ADMIN_USER_MANAGE');

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('roles');

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isRoleEditorOpen, setIsRoleEditorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Mock data - TODO: Replace with API calls
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'role-hr',
      name: 'HR',
      displayName: 'Human Resources',
      description: 'Create pre-hires, view hardware/software (cannot create), create exception packages',
      permissions: permissions.filter(p =>
        ['PREHIRE_CREATE', 'PREHIRE_READ', 'HARDWARE_READ', 'PACKAGE_CREATE_EXCEPTION'].includes(p)
      ),
      isSystemRole: true,
      createdDate: new Date('2025-01-01'),
      modifiedDate: new Date('2025-01-01'),
    },
    {
      id: 'role-it',
      name: 'IT',
      displayName: 'IT Administrator',
      description: 'Manage hardware, process Helix tickets, assign software',
      permissions: permissions.filter(p =>
        ['HARDWARE_CREATE', 'HARDWARE_UPDATE', 'SOFTWARE_ASSIGN', 'HELIX_CREATE_TICKET'].includes(p)
      ),
      isSystemRole: true,
      createdDate: new Date('2025-01-01'),
      modifiedDate: new Date('2025-01-01'),
    },
    {
      id: 'role-admin',
      name: 'ADMIN',
      displayName: 'System Administrator',
      description: 'Full system access + user management',
      permissions: permissions,
      isSystemRole: true,
      createdDate: new Date('2025-01-01'),
      modifiedDate: new Date('2025-01-01'),
    },
  ]);

  // ============================================================================
  // FILTERING (MUST BE BEFORE CONDITIONAL RETURNS)
  // ============================================================================

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      // Search filter
      const matchesSearch = !searchQuery ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Active status filter
      const matchesStatus = filterActive === 'all' ||
        (filterActive === 'active' && true) || // TODO: Add isActive field when backend ready
        (filterActive === 'inactive' && false);

      return matchesSearch && matchesStatus;
    });
  }, [roles, searchQuery, filterActive]);

  // ============================================================================
  // ACCESS CONTROL (AFTER ALL HOOKS)
  // ============================================================================

  if (!canManageRoles && !canManageUsers) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <Card className="max-w-md p-8 text-center">
          <Icon name="alert-triangle" className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You do not have permission to access role management.
            Contact your administrator if you need access.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Required permissions: ADMIN_ROLE_MANAGE or ADMIN_USER_MANAGE
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCreateRole = () => {
    setSelectedRole(undefined);
    setIsRoleEditorOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleEditorOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoleToDelete(roleId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(prev => prev.filter(r => r.id !== roleToDelete));
      setRoleToDelete(null);
    }
  };

  const handleSaveRole = (role: Role) => {
    if (selectedRole) {
      // Update existing role
      setRoles(prev => prev.map(r => r.id === role.id ? role : r));
    } else {
      // Create new role
      setRoles(prev => [...prev, role]);
    }
    setIsRoleEditorOpen(false);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Get role-specific icon
  const getRoleIcon = (roleName: string): string => {
    const name = roleName.toLowerCase();
    if (name.includes('hr') || name.includes('human')) return 'users';
    if (name.includes('it') || name.includes('tech')) return 'wrench';
    if (name.includes('admin') || name.includes('system')) return 'shield-check';
    if (name.includes('manager')) return 'briefcase';
    return 'shield';
  };

  // Get role-specific color
  const getRoleColor = (roleName: string): string => {
    const name = roleName.toLowerCase();
    if (name.includes('hr') || name.includes('human')) return 'blue';
    if (name.includes('it') || name.includes('tech')) return 'purple';
    if (name.includes('admin') || name.includes('system')) return 'red';
    if (name.includes('manager')) return 'green';
    return 'gray';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Role Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage system roles, permissions, and user access control
          </p>
        </div>

        <div className="flex gap-2">
          {canManageRoles && (
            <Button onClick={handleCreateRole}>
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('roles')}
          className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
            viewMode === 'roles'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon name="shield" className="w-5 h-5 inline mr-2" />
          Roles
        </button>
        {canManageUsers && (
          <button
            onClick={() => setViewMode('users')}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              viewMode === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon name="users" className="w-5 h-5 inline mr-2" />
            User Assignments
          </button>
        )}
        <button
          onClick={() => setViewMode('permissions')}
          className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
            viewMode === 'permissions'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon name="key" className="w-5 h-5 inline mr-2" />
          Permission Matrix
        </button>
      </div>

      {/* Roles View */}
      {viewMode === 'roles' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Search Roles"
                id="search-roles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, display name, or description..."
                icon="search"
              />
            </div>
            <div className="w-48">
              <Select
                label="Status"
                id="filter-status"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
              />
            </div>
            <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Grid view"
              >
                <Icon name="grid" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-2 rounded transition-colors ${
                  layoutMode === 'list'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="List view"
              >
                <Icon name="list" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Role Cards - Grid View */}
          {layoutMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRoles.map((role) => {
                const roleIcon = getRoleIcon(role.name);
                const roleColor = getRoleColor(role.name);
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                  gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
                };

                return (
                  <Card key={role.id} className="p-4 hover:shadow-md transition-all hover:scale-[1.02]">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[roleColor as keyof typeof colorClasses]}`}>
                        <Icon name={roleIcon as any} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {role.displayName}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                          {role.name}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {role.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {role.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <Icon name="key" className="w-3.5 h-3.5" />
                        <span className="font-medium">{role.permissions.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="users" className="w-3.5 h-3.5" />
                        <span className="font-medium">0</span>
                      </div>
                      {role.isSystemRole && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                          SYSTEM
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {canManageRoles && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                            className="flex-1 text-xs h-8"
                          >
                            <Icon name="edit" className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          {!role.isSystemRole && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-700 w-8 h-8 p-0"
                            >
                              <Icon name="trash" className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Role Cards - List View */}
          {layoutMode === 'list' && (
            <div className="space-y-2">
              {filteredRoles.map((role) => {
                const roleIcon = getRoleIcon(role.name);
                const roleColor = getRoleColor(role.name);
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                  gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
                };

                return (
                  <Card key={role.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[roleColor as keyof typeof colorClasses]}`}>
                          <Icon name={roleIcon as any} className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {role.displayName}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {role.name}
                          </span>
                          {role.isSystemRole && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                              SYSTEM
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {role.description}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Icon name="key" className="w-3.5 h-3.5" />
                          <span className="font-medium">{role.permissions.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon name="users" className="w-3.5 h-3.5" />
                          <span className="font-medium">0</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {canManageRoles && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                              className="text-xs h-8"
                            >
                              <Icon name="edit" className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            {!role.isSystemRole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRole(role.id)}
                                className="text-red-600 hover:text-red-700 w-8 h-8 p-0"
                              >
                                <Icon name="trash" className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredRoles.length === 0 && (
            <Card className="p-12 text-center">
              <Icon name="search" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No roles found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Create your first custom role to get started'}
              </p>
              {!searchQuery && canManageRoles && (
                <Button onClick={handleCreateRole}>
                  <Icon name="plus" className="w-5 h-5 mr-2" />
                  Create Role
                </Button>
              )}
            </Card>
          )}
        </div>
      )}

      {/* User Assignments View */}
      {viewMode === 'users' && canManageUsers && (
        <div className="mt-6">
          <UserRoleAssignment
            onClose={() => {}} // Empty function since it's inline, not a modal
          />
        </div>
      )}

      {/* Permission Matrix View */}
      {viewMode === 'permissions' && (
        <div className="mt-6">
          <PermissionMatrix
            roles={roles}
            onClose={() => {}} // Empty function since it's inline, not a modal
          />
        </div>
      )}

      {/* Modals */}
      {isRoleEditorOpen && (
        <RoleEditor
          role={selectedRole}
          onSave={handleSaveRole}
          onClose={() => setIsRoleEditorOpen(false)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDeleteRole}
        title="Delete Role?"
        message={`Are you sure you want to delete this role? This action cannot be undone. Users assigned to this role will lose their permissions.`}
        confirmText="Delete Role"
        variant="danger"
      />
    </div>
  );
};
