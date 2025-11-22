// ============================================================================
// USER ROLE ASSIGNMENT COMPONENT
// ============================================================================
// Modal for assigning and revoking roles to/from users

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { GraphService } from '../../services/graphService';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { UserRoleAssignment as UserRoleAssignmentType, UserRole, Role } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserRoleAssignmentProps {
  roles?: Role[];
  onClose: () => void;
}

interface UserWithRoles {
  userId: string;
  userEmail: string;
  userName: string;
  department?: string;
  jobTitle?: string;
  roles: UserRoleAssignmentType[];
}

interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  roles = [],
  onClose,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [expirationDate, setExpirationDate] = useState<string>('');

  // Graph API search
  const [graphSearchQuery, setGraphSearchQuery] = useState('');
  const [graphSearchResults, setGraphSearchResults] = useState<GraphUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const graphService = useMemo(() => GraphService.getInstance(), []);

  // User database with role assignments
  // Confirmation modal state
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeData, setRevokeData] = useState<{ userId: string; roleId: string } | null>(null);

  // Mock data - TODO: Replace with API calls
  const [users, setUsers] = useState<UserWithRoles[]>([
    {
      userId: 'camille@momentumww.com',
      userEmail: 'camille@momentumww.com',
      userName: 'Camille Harper',
      department: 'Human Resources',
      jobTitle: 'HR Manager',
      roles: [
        {
          id: 'ur-001',
          userId: 'camille@momentumww.com',
          userEmail: 'camille@momentumww.com',
          userName: 'Camille Harper',
          roleId: 'role-hr',
          roleName: 'HR',
          assignedBy: 'admin@momentumww.com',
          assignedDate: new Date('2025-01-01'),
          isActive: true,
        },
      ],
    },
    {
      userId: 'luis.bustos@momentumww.com',
      userEmail: 'luis.bustos@momentumww.com',
      userName: 'Luis Bustos',
      department: 'Technology',
      jobTitle: 'AI & Technology Director',
      roles: [
        {
          id: 'ur-002',
          userId: 'luis.bustos@momentumww.com',
          userEmail: 'luis.bustos@momentumww.com',
          userName: 'Luis Bustos',
          roleId: 'role-admin',
          roleName: 'ADMIN',
          assignedBy: 'admin@momentumww.com',
          assignedDate: new Date('2025-01-01'),
          isActive: true,
        },
      ],
    },
  ]);

  // Derive available roles from passed roles prop, or use fallback hardcoded list
  const availableRoles: UserRole[] = roles.length > 0
    ? roles.map(role => role.name as UserRole)
    : [
        'EMPLOYEE',
        'HIRING_MANAGER',
        'MANAGER',
        'IT',
        'FINANCE',
        'HR',
        'DIRECTOR',
        'ADMIN',
      ];

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery ||
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' ||
        user.roles.some(r => r.roleName === roleFilter && r.isActive);

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // ============================================================================
  // GRAPH API SEARCH
  // ============================================================================

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!graphSearchQuery || graphSearchQuery.length < 2) {
      setGraphSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await graphService.searchUsers(graphSearchQuery);
        setGraphSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('User search failed:', error);
        setGraphSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [graphSearchQuery, graphService]);

  // Click outside handler to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  const handleSelectGraphUser = (graphUser: GraphUser) => {
    // Check if user already exists in our database
    const existingUser = users.find(u => u.userEmail === graphUser.mail);

    if (existingUser) {
      // Select existing user
      setSelectedUser(existingUser);
    } else {
      // Create new user entry
      const newUser: UserWithRoles = {
        userId: graphUser.mail,
        userEmail: graphUser.mail,
        userName: graphUser.displayName,
        department: graphUser.department,
        jobTitle: graphUser.jobTitle,
        roles: [],
      };
      setUsers(prev => [...prev, newUser]);
      setSelectedUser(newUser);
    }

    // Clear search
    setGraphSearchQuery('');
    setShowSearchResults(false);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return;

    const newAssignment: UserRoleAssignmentType = {
      id: `ur-${Date.now()}`,
      userId: selectedUser.userId,
      userEmail: selectedUser.userEmail,
      userName: selectedUser.userName,
      roleId: `role-${selectedRole.toLowerCase()}`,
      roleName: selectedRole,
      assignedBy: 'current-user@momentumww.com', // TODO: Get from auth context
      assignedDate: new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      isActive: true,
    };

    setUsers(prev => prev.map(u =>
      u.userId === selectedUser.userId
        ? { ...u, roles: [...u.roles, newAssignment] }
        : u
    ));

    // Reset form
    setSelectedUser(null);
    setSelectedRole('');
    setExpirationDate('');
  };

  const handleRevokeRole = (userId: string, roleId: string) => {
    setRevokeData({ userId, roleId });
    setShowRevokeConfirm(true);
  };

  const confirmRevokeRole = () => {
    if (revokeData) {
      setUsers(prev => prev.map(u =>
        u.userId === revokeData.userId
          ? {
              ...u,
              roles: u.roles.map(r =>
                r.id === revokeData.roleId ? { ...r, isActive: false } : r
              ),
            }
          : u
      ));
      setRevokeData(null);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Role Assignments
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Assign or revoke roles for users in the system
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: User List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Users
              </h3>

              {/* Add New User from Graph API */}
              <div className="relative" ref={searchDropdownRef}>
                <Input
                  label="Add New User"
                  value={graphSearchQuery}
                  onChange={(e) => setGraphSearchQuery(e.target.value)}
                  placeholder="Search organization directory..."
                  icon={isSearching ? 'loader' : 'search'}
                />

                {/* Search Results Dropdown */}
                {showSearchResults && graphSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {graphSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectGraphUser(user)}
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.displayName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.mail || user.userPrincipalName}
                        </div>
                        {(user.jobTitle || user.department) && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {user.jobTitle}
                            {user.jobTitle && user.department && ' • '}
                            {user.department}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {showSearchResults && graphSearchResults.length === 0 && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    No users found matching "{graphSearchQuery}"
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Filter Existing Users
                </h4>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <Input
                  label="Search Users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  icon="search"
                />
                <Select
                  label="Filter by Role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Select>
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.userId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.userId === user.userId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.userName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.userEmail}
                        </div>
                      </div>
                      <Icon name="user" className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.roles.filter(r => r.isActive).map(role => (
                        <StatusBadge key={role.id} status="info" size="sm">
                          {role.roleName}
                        </StatusBadge>
                      ))}
                      {user.roles.filter(r => r.isActive).length === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          No active roles
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Role Assignment */}
            <div className="space-y-4">
              {selectedUser ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Manage Roles for {selectedUser.userName}
                  </h3>

                  {/* Assign New Role Form */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Assign New Role
                    </h4>

                    <Select
                      label="Role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      required
                    >
                      <option value="">Select a role...</option>
                      {availableRoles
                        .filter(role =>
                          !selectedUser.roles.some(
                            r => r.roleName === role && r.isActive
                          )
                        )
                        .map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                    </Select>

                    <Input
                      label="Expiration Date (Optional)"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />

                    <Button
                      onClick={handleAssignRole}
                      disabled={!selectedRole}
                      className="w-full"
                    >
                      <Icon name="user-plus" className="w-5 h-5 mr-2" />
                      Assign Role
                    </Button>
                  </div>

                  {/* Current Role Assignments */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Current Role Assignments
                    </h4>

                    {selectedUser.roles.length === 0 ? (
                      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                        <Icon name="info" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No role assignments</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.roles.map(role => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {role.roleName}
                                </span>
                                <StatusBadge
                                  status={role.isActive ? 'success' : 'error'}
                                  size="sm"
                                >
                                  {role.isActive ? 'Active' : 'Revoked'}
                                </StatusBadge>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Assigned on {role.assignedDate.toLocaleDateString()}
                                {role.expirationDate &&
                                  ` • Expires ${role.expirationDate.toLocaleDateString()}`}
                              </div>
                            </div>
                            {role.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeRole(selectedUser.userId, role.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Icon name="x" className="w-4 h-4" />
                                Revoke
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                  <div className="text-center">
                    <Icon name="user" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a user to manage their role assignments</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeConfirm}
        onClose={() => {
          setShowRevokeConfirm(false);
          setRevokeData(null);
        }}
        onConfirm={confirmRevokeRole}
        title="Revoke Role Assignment?"
        message="Are you sure you want to revoke this role assignment? The user will immediately lose access to permissions associated with this role."
        confirmText="Revoke Role"
        variant="danger"
      />
    </div>
  );
};
