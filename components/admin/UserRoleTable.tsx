// ============================================================================
// USER ROLE TABLE COMPONENT
// ============================================================================
// Modern table view showing all users with their assigned roles
// Supports filtering, sorting, bulk operations, and user management

import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { UserRole } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserWithRoles {
  userId: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  jobTitle?: string;
  department?: string;
  roles: {
    roleName: UserRole;
    assignedDate: Date;
    expirationDate?: Date;
    isActive: boolean;
  }[];
  createdDate: Date;
  lastModified: Date;
}

interface UserRoleTableProps {
  users: UserWithRoles[];
  availableRoles: UserRole[];
  onAddUser: () => void;
  onAddBulk: () => void;
  onImportCSV: () => void;
  onEditUser: (user: UserWithRoles) => void;
  onDeleteUser: (userId: string) => void;
  onBulkAssignRole: (userIds: string[], role: UserRole) => void;
  onBulkRemoveRole: (userIds: string[], role: UserRole) => void;
  onBulkDelete: (userIds: string[]) => void;
  className?: string;
}

type SortField = 'displayName' | 'email' | 'department' | 'roles';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPONENT
// ============================================================================

export const UserRoleTable: React.FC<UserRoleTableProps> = ({
  users,
  availableRoles,
  onAddUser,
  onAddBulk,
  onImportCSV,
  onEditUser,
  onDeleteUser,
  onBulkAssignRole,
  onBulkRemoveRole,
  onBulkDelete,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Bulk selection
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.jobTitle?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) =>
        user.roles.some((r) => r.roleName === roleFilter && r.isActive)
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((user) => user.department === departmentFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'displayName':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'department':
          comparison = (a.department || '').localeCompare(b.department || '');
          break;
        case 'roles':
          const aRoles = a.roles.filter((r) => r.isActive).length;
          const bRoles = b.roles.filter((r) => r.isActive).length;
          comparison = aRoles - bRoles;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchQuery, roleFilter, departmentFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(users.map((u) => u.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(paginatedUsers.map((u) => u.userId)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedUserIds);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete);
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete(Array.from(selectedUserIds));
    setSelectedUserIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      EMPLOYEE: 'gray',
      HIRING_MANAGER: 'green',
      MANAGER: 'blue',
      IT: 'purple',
      FINANCE: 'yellow',
      HR: 'indigo',
      DIRECTOR: 'orange',
      ADMIN: 'red',
    };
    return roleColors[role] || 'gray';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {/* Filters & Actions */}
      <div className="mb-6 space-y-4">
        {/* Search and Filters Row */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <Input
              label="Search Users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or job title..."
              icon="search"
            />
          </div>

          <div className="w-48">
            <Select
              label="Filter by Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-48">
            <Select
              label="Filter by Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="ghost"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="mb-1"
          >
            <Icon name="filter" className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onAddUser}>
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Add User
          </Button>

          <Button variant="secondary" onClick={onAddBulk}>
            <Icon name="users" className="w-4 h-4 mr-2" />
            Add Bulk
          </Button>

          <Button variant="secondary" onClick={onImportCSV}>
            <Icon name="upload" className="w-4 h-4 mr-2" />
            Import CSV
          </Button>

          {selectedUserIds.size > 0 && (
            <>
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400 py-2">
                {selectedUserIds.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
                <Icon name="trash" className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {/* Select All Checkbox */}
                <th scope="col" className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every((u) => selectedUserIds.has(u.userId))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>

                {/* Photo */}
                <th scope="col" className="px-4 py-3 w-16"></th>

                {/* Name */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('displayName')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {sortField === 'displayName' && (
                      <Icon
                        name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>

                {/* Email */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {sortField === 'email' && (
                      <Icon
                        name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>

                {/* Department */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-2">
                    Department
                    {sortField === 'department' && (
                      <Icon
                        name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>

                {/* Roles */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('roles')}
                >
                  <div className="flex items-center gap-2">
                    Roles
                    {sortField === 'roles' && (
                      <Icon
                        name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>

                {/* Actions */}
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Icon
                      name="users"
                      className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all'
                        ? 'No users found matching your filters'
                        : 'No users yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const activeRoles = user.roles.filter((r) => r.isActive);
                  const isSelected = selectedUserIds.has(user.userId);

                  return (
                    <tr
                      key={user.userId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectUser(user.userId, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-4">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user.displayName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName}
                        </div>
                        {user.jobTitle && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {user.jobTitle}
                          </div>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.department || '—'}
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {activeRoles.length === 0 ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              No roles
                            </span>
                          ) : (
                            activeRoles.map((role) => (
                              <StatusBadge
                                key={role.roleName}
                                status={role.roleName}
                                variant={getRoleBadgeColor(role.roleName) as any}
                                size="sm"
                              />
                            ))
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditUser(user)}
                          >
                            <Icon name="edit" className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.userId)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of{' '}
                {filteredAndSortedUsers.length} users
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon name="chevron-left" className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="px-2 text-gray-500 dark:text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Icon name="chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User?"
        message="Are you sure you want to delete this user? All role assignments will be removed."
        confirmText="Delete User"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Users?"
        message={`Are you sure you want to delete ${selectedUserIds.size} user(s)? All role assignments will be removed.`}
        confirmText={`Delete ${selectedUserIds.size} Users`}
        variant="danger"
      />
    </div>
  );
};
