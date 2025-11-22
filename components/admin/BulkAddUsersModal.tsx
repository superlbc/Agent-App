// ============================================================================
// BULK ADD USERS MODAL COMPONENT
// ============================================================================
// Modal for adding multiple users at once with role assignments

import React, { useState, useEffect } from 'react';
import { ManagerProfile } from '../ManagerSelector';
import ManagerSelector from '../ManagerSelector';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { UserRole } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BulkAddUsersModalProps {
  availableRoles: UserRole[];
  onAddUsers: (usersData: BulkUserData[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface BulkUserData {
  user: ManagerProfile;
  roles: UserRole[];
}

type AssignmentMode = 'same' | 'individual';

interface UserEntry {
  id: string;
  user: ManagerProfile;
  roles: Set<UserRole>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkAddUsersModal: React.FC<BulkAddUsersModalProps> = ({
  availableRoles,
  onAddUsers,
  onClose,
  isOpen,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [currentUser, setCurrentUser] = useState<ManagerProfile | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('same');
  const [commonRoles, setCommonRoles] = useState<Set<UserRole>>(new Set());
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [errors, setErrors] = useState<{
    user?: string;
    roles?: string;
    users?: string;
  }>({});

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentUser(null);
      setAssignmentMode('same');
      setCommonRoles(new Set());
      setUsers([]);
      setErrors({});
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleCommonRole = (role: UserRole) => {
    const newRoles = new Set(commonRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setCommonRoles(newRoles);

    // Clear error if at least one role selected
    if (newRoles.size > 0 && errors.roles) {
      setErrors({ ...errors, roles: undefined });
    }
  };

  const toggleUserRole = (userId: string, role: UserRole) => {
    setUsers(users.map(entry => {
      if (entry.id === userId) {
        const newRoles = new Set(entry.roles);
        if (newRoles.has(role)) {
          newRoles.delete(role);
        } else {
          newRoles.add(role);
        }
        return { ...entry, roles: newRoles };
      }
      return entry;
    }));
  };

  const handleAddUser = () => {
    if (!currentUser) {
      setErrors({ ...errors, user: 'Please select a user' });
      return;
    }

    // Check if user already added
    if (users.some(entry => entry.user.email === currentUser.email)) {
      setErrors({ ...errors, user: 'User already added to the list' });
      return;
    }

    // Add user with roles based on mode
    const newEntry: UserEntry = {
      id: `${Date.now()}-${currentUser.email}`,
      user: currentUser,
      roles: assignmentMode === 'same' ? new Set(commonRoles) : new Set(),
    };

    setUsers([...users, newEntry]);
    setCurrentUser(null);
    setErrors({ ...errors, user: undefined, users: undefined });
  };

  const handleRemoveUser = (userId: string) => {
    setUsers(users.filter(entry => entry.id !== userId));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (users.length === 0) {
      newErrors.users = 'Please add at least one user';
    }

    if (assignmentMode === 'same' && commonRoles.size === 0) {
      newErrors.roles = 'Please select at least one role for all users';
    }

    if (assignmentMode === 'individual') {
      const hasUserWithoutRoles = users.some(entry => entry.roles.size === 0);
      if (hasUserWithoutRoles) {
        newErrors.users = 'All users must have at least one role assigned';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const usersData: BulkUserData[] = users.map(entry => ({
      user: entry.user,
      roles: Array.from(entry.roles),
    }));

    onAddUsers(usersData);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

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

  const getRoleDisplayName = (role: UserRole): string => {
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Multiple Users
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add multiple users at once with role assignments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Assignment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Role Assignment Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`
                  flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${assignmentMode === 'same'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === 'same'}
                  onChange={() => setAssignmentMode('same')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    Same Roles for All
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assign the same roles to all users in the list
                  </span>
                </div>
              </label>

              <label
                className={`
                  flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${assignmentMode === 'individual'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === 'individual'}
                  onChange={() => setAssignmentMode('individual')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    Individual Roles
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assign different roles to each user
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Common Roles (Same Mode Only) */}
          {assignmentMode === 'same' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Roles for All Users <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {availableRoles.map((role) => {
                  const isSelected = commonRoles.has(role);
                  const color = getRoleBadgeColor(role);

                  return (
                    <label
                      key={role}
                      className={`
                        flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected
                          ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCommonRole(role)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                        {getRoleDisplayName(role)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.roles && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.roles}</p>
              )}
            </div>
          )}

          {/* Add User Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <ManagerSelector
                  label="Add User"
                  value={currentUser}
                  onChange={(user) => {
                    setCurrentUser(user);
                    if (user && errors.user) {
                      setErrors({ ...errors, user: undefined });
                    }
                  }}
                  placeholder="Search for user by name or email..."
                  error={errors.user}
                />
              </div>
              <Button onClick={handleAddUser} disabled={!currentUser}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Add to List
              </Button>
            </div>
          </div>

          {/* Users List */}
          {users.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Users to Add ({users.length})
                </label>
                {assignmentMode === 'individual' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click on roles to assign
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {users.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    {/* User Photo */}
                    {entry.user.photoUrl ? (
                      <img
                        src={entry.user.photoUrl}
                        alt={entry.user.displayName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                          {entry.user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.user.displayName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {entry.user.email}
                      </p>

                      {/* Roles */}
                      {assignmentMode === 'individual' ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableRoles.map((role) => {
                            const isSelected = entry.roles.has(role);
                            const color = getRoleBadgeColor(role);

                            return (
                              <button
                                key={role}
                                onClick={() => toggleUserRole(entry.id, role)}
                                className={`
                                  px-2 py-1 text-xs font-medium rounded transition-colors
                                  ${isSelected
                                    ? `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-200`
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }
                                `}
                              >
                                {getRoleDisplayName(role)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Array.from(entry.roles).map((role) => {
                            const color = getRoleBadgeColor(role);
                            return (
                              <span
                                key={role}
                                className={`
                                  px-2 py-1 text-xs font-medium rounded
                                  bg-${color}-100 text-${color}-800
                                  dark:bg-${color}-900/50 dark:text-${color}-200
                                `}
                              >
                                {getRoleDisplayName(role)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveUser(entry.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Remove user"
                    >
                      <Icon name="x" className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              {errors.users && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.users}</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {users.length === 0 && (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Icon name="users" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No users added yet. Search and add users to the list above.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {users.length > 0 ? (
              <span>Ready to add {users.length} user{users.length !== 1 ? 's' : ''}</span>
            ) : (
              <span>Add users to get started</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={users.length === 0}>
              <Icon name="check" className="w-4 h-4 mr-2" />
              Add All Users
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAddUsersModal;
