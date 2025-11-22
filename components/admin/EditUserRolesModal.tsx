// ============================================================================
// EDIT USER ROLES MODAL COMPONENT
// ============================================================================
// Modal for editing an existing user's role assignments

import React, { useState, useEffect } from 'react';
import { UserWithRoles } from './UserRoleTable';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { UserRole } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EditUserRolesModalProps {
  user: UserWithRoles | null;
  availableRoles: UserRole[];
  onSave: (userId: string, updatedRoles: UpdatedRoleData[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface UpdatedRoleData {
  roleName: UserRole;
  isActive: boolean;
  expirationDate?: Date;
  isNew?: boolean;
  isModified?: boolean;
}

interface RoleState {
  roleName: UserRole;
  isActive: boolean;
  expirationDate: string;
  assignedDate?: Date;
  isNew: boolean;
  isModified: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EditUserRolesModal: React.FC<EditUserRolesModalProps> = ({
  user,
  availableRoles,
  onSave,
  onClose,
  isOpen,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [roleStates, setRoleStates] = useState<Record<UserRole, RoleState>>({} as Record<UserRole, RoleState>);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize role states when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      const initialStates: Record<UserRole, RoleState> = {} as Record<UserRole, RoleState>;

      // Initialize all available roles
      availableRoles.forEach(role => {
        const existingRole = user.roles.find(r => r.roleName === role);

        if (existingRole) {
          // User already has this role
          initialStates[role] = {
            roleName: role,
            isActive: existingRole.isActive,
            expirationDate: existingRole.expirationDate
              ? new Date(existingRole.expirationDate).toISOString().split('T')[0]
              : '',
            assignedDate: existingRole.assignedDate,
            isNew: false,
            isModified: false,
          };
        } else {
          // User doesn't have this role
          initialStates[role] = {
            roleName: role,
            isActive: false,
            expirationDate: '',
            assignedDate: undefined,
            isNew: false,
            isModified: false,
          };
        }
      });

      setRoleStates(initialStates);
      setErrors({});
    }
  }, [isOpen, user, availableRoles]);

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

  const toggleRole = (role: UserRole) => {
    const currentState = roleStates[role];
    const wasInactive = !currentState.isActive;

    setRoleStates({
      ...roleStates,
      [role]: {
        ...currentState,
        isActive: wasInactive,
        isNew: wasInactive && !currentState.assignedDate,
        isModified: wasInactive ? currentState.isModified : true,
      },
    });

    // Clear error for this role if exists
    if (errors[role]) {
      const newErrors = { ...errors };
      delete newErrors[role];
      setErrors(newErrors);
    }
  };

  const handleExpirationChange = (role: UserRole, date: string) => {
    const currentState = roleStates[role];

    setRoleStates({
      ...roleStates,
      [role]: {
        ...currentState,
        expirationDate: date,
        isModified: true,
      },
    });

    // Validate date
    if (date) {
      const expDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expDate < today) {
        setErrors({
          ...errors,
          [role]: 'Expiration date must be in the future',
        });
      } else {
        const newErrors = { ...errors };
        delete newErrors[role];
        setErrors(newErrors);
      }
    } else {
      const newErrors = { ...errors };
      delete newErrors[role];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if at least one role is active
    const hasActiveRole = Object.values(roleStates).some(state => state.isActive);
    if (!hasActiveRole) {
      newErrors.global = 'User must have at least one active role';
    }

    // Check for future expiration dates
    Object.entries(roleStates).forEach(([role, state]) => {
      if (state.isActive && state.expirationDate) {
        const expDate = new Date(state.expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expDate < today) {
          newErrors[role] = 'Expiration date must be in the future';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm() || !user) {
      return;
    }

    const updatedRoles: UpdatedRoleData[] = Object.values(roleStates)
      .filter(state => state.isActive || state.assignedDate) // Include deactivated roles
      .map(state => ({
        roleName: state.roleName,
        isActive: state.isActive,
        expirationDate: state.expirationDate ? new Date(state.expirationDate) : undefined,
        isNew: state.isNew,
        isModified: state.isModified,
      }));

    onSave(user.userId, updatedRoles);
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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen || !user) return null;

  const activeRoles = Object.values(roleStates).filter(state => state.isActive);
  const inactiveRoles = Object.values(roleStates).filter(state => !state.isActive && state.assignedDate);
  const availableToAdd = Object.values(roleStates).filter(state => !state.isActive && !state.assignedDate);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit User Roles
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage role assignments for this user
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

        {/* User Info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-xl font-medium text-white">
                  {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.displayName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
              {user.jobTitle && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {user.jobTitle}
                </p>
              )}
              {user.department && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {user.department}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Global Error */}
          {errors.global && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="alert-triangle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  {errors.global}
                </p>
              </div>
            </div>
          )}

          {/* Active Roles */}
          {activeRoles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Active Roles ({activeRoles.length})
              </h3>
              <div className="space-y-3">
                {activeRoles.map((state) => {
                  const color = getRoleBadgeColor(state.roleName);

                  return (
                    <div
                      key={state.roleName}
                      className={`
                        p-4 rounded-lg border-2
                        border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={state.isActive}
                            onChange={() => toggleRole(state.roleName)}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getRoleDisplayName(state.roleName)}
                              </span>
                              {state.isNew && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 rounded">
                                  New
                                </span>
                              )}
                              {state.isModified && !state.isNew && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 rounded">
                                  Modified
                                </span>
                              )}
                            </div>
                            {state.assignedDate && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Assigned: {formatDate(state.assignedDate)}
                              </p>
                            )}

                            {/* Expiration Date */}
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Expiration Date (Optional)
                              </label>
                              <input
                                type="date"
                                value={state.expirationDate}
                                onChange={(e) => handleExpirationChange(state.roleName, e.target.value)}
                                className={`
                                  w-full px-3 py-2 text-sm border rounded-lg
                                  bg-white dark:bg-gray-700
                                  text-gray-900 dark:text-white
                                  ${errors[state.roleName]
                                    ? 'border-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                  }
                                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                `}
                              />
                              {errors[state.roleName] && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                  {errors[state.roleName]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Roles to Add */}
          {availableToAdd.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Available Roles to Add
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableToAdd.map((state) => {
                  const color = getRoleBadgeColor(state.roleName);

                  return (
                    <label
                      key={state.roleName}
                      className="flex items-center p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={state.isActive}
                        onChange={() => toggleRole(state.roleName)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                        {getRoleDisplayName(state.roleName)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inactive Roles (Previously Assigned) */}
          {inactiveRoles.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Icon
                  name="chevron-down"
                  className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                />
                Inactive Roles ({inactiveRoles.length})
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2">
                  {inactiveRoles.map((state) => (
                    <div
                      key={state.roleName}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={state.isActive}
                          onChange={() => toggleRole(state.roleName)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getRoleDisplayName(state.roleName)}
                          </span>
                          {state.assignedDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Previously assigned: {formatDate(state.assignedDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Inactive
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeRoles.length} active role{activeRoles.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={Object.keys(errors).length > 0}>
              <Icon name="check" className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserRolesModal;
