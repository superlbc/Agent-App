// ============================================================================
// ADD USER MODAL COMPONENT
// ============================================================================
// Modal for adding a single user with role assignments using ManagerSelector

import React, { useState, useEffect } from 'react';
import { ManagerProfile } from '../ManagerSelector';
import ManagerSelector from '../ManagerSelector';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Textarea } from '../ui/Textarea';
import { UserRole } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AddUserModalProps {
  availableRoles: UserRole[];
  onAddUser: (userData: AddUserData) => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface AddUserData {
  user: ManagerProfile;
  roles: UserRole[];
  expirationDate?: Date;
  notes?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AddUserModal: React.FC<AddUserModalProps> = ({
  availableRoles,
  onAddUser,
  onClose,
  isOpen,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedUser, setSelectedUser] = useState<ManagerProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{
    user?: string;
    roles?: string;
    expirationDate?: string;
  }>({});

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedUser(null);
      setSelectedRoles(new Set());
      setExpirationDate('');
      setNotes('');
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

  const toggleRole = (role: UserRole) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);

    // Clear role error if at least one role selected
    if (newRoles.size > 0 && errors.roles) {
      setErrors({ ...errors, roles: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedUser) {
      newErrors.user = 'Please select a user';
    }

    if (selectedRoles.size === 0) {
      newErrors.roles = 'Please select at least one role';
    }

    if (expirationDate) {
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expDate < today) {
        newErrors.expirationDate = 'Expiration date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const userData: AddUserData = {
      user: selectedUser!,
      roles: Array.from(selectedRoles),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      notes: notes.trim() || undefined,
    };

    onAddUser(userData);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add User
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Assign roles to a new user in the system
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
          {/* User Selection */}
          <div>
            <ManagerSelector
              label="Select User"
              value={selectedUser}
              onChange={(user) => {
                setSelectedUser(user);
                if (user && errors.user) {
                  setErrors({ ...errors, user: undefined });
                }
              }}
              placeholder="Search for user by name or email..."
              error={errors.user}
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Assign Roles <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRoles.map((role) => {
                const isSelected = selectedRoles.has(role);
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
                      onChange={() => toggleRole(role)}
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

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => {
                setExpirationDate(e.target.value);
                if (errors.expirationDate) {
                  setErrors({ ...errors, expirationDate: undefined });
                }
              }}
              className={`
                w-full px-3 py-2 border rounded-lg
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                ${errors.expirationDate
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              `}
            />
            {errors.expirationDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expirationDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for permanent role assignments
            </p>
          </div>

          {/* Notes */}
          <div>
            <Textarea
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this role assignment..."
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Selected User Summary */}
          {selectedUser && selectedRoles.size > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Summary
              </h3>
              <div className="flex items-start gap-3">
                {selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {selectedUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedUser.displayName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  {selectedUser.jobTitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {selectedUser.jobTitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(selectedRoles).map((role) => {
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUser || selectedRoles.size === 0}
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
