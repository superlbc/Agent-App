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

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isRoleEditorOpen, setIsRoleEditorOpen] = useState(false);
  const [isUserAssignmentOpen, setIsUserAssignmentOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);

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
  // ACCESS CONTROL
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
  // FILTERING
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
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
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
  // RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Role Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage system roles, permissions, and user access control
          </p>
        </div>

        <div className="flex gap-2">
          {canManageRoles && (
            <Button onClick={handleCreateRole}>
              <Icon name="plus" className="w-5 h-5 mr-2" />
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
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Search Roles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, display name, or description..."
                icon="search"
              />
            </div>
            <div className="w-48">
              <Select
                label="Status"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Roles</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Select>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {role.displayName}
                      </h3>
                      {role.isSystemRole && (
                        <StatusBadge status="info" size="sm">
                          System
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.name}
                    </p>
                  </div>
                  <Icon name="shield" className="w-6 h-6 text-blue-500" />
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Icon name="key" className="w-4 h-4" />
                    <span>{role.permissions.length} permissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="users" className="w-4 h-4" />
                    <span>0 users</span> {/* TODO: Add user count */}
                  </div>
                </div>

                <div className="flex gap-2">
                  {canManageRoles && !role.isSystemRole && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                      >
                        <Icon name="edit" className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {role.isSystemRole && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      className="flex-1"
                    >
                      <Icon name="eye" className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

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
        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-400">
              User role assignment interface coming soon...
            </p>
            <Button
              onClick={() => setIsUserAssignmentOpen(true)}
              className="mt-4"
            >
              <Icon name="user-plus" className="w-5 h-5 mr-2" />
              Assign Roles to Users
            </Button>
          </Card>
        </div>
      )}

      {/* Permission Matrix View */}
      {viewMode === 'permissions' && (
        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Permission matrix showing all roles and their permissions coming soon...
            </p>
            <Button
              onClick={() => setIsPermissionMatrixOpen(true)}
              className="mt-4"
            >
              <Icon name="grid" className="w-5 h-5 mr-2" />
              View Permission Matrix
            </Button>
          </Card>
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

      {isUserAssignmentOpen && (
        <UserRoleAssignment
          onClose={() => setIsUserAssignmentOpen(false)}
        />
      )}

      {isPermissionMatrixOpen && (
        <PermissionMatrix
          roles={roles}
          onClose={() => setIsPermissionMatrixOpen(false)}
        />
      )}
    </div>
  );
};
