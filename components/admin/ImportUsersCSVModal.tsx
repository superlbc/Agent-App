// ============================================================================
// IMPORT USERS CSV MODAL COMPONENT
// ============================================================================
// Modal for importing multiple users from CSV file with validation and preview

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { UserRole } from '../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ImportUsersCSVModalProps {
  availableRoles: UserRole[];
  onImportUsers: (usersData: CSVUserData[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface CSVUserData {
  email: string;
  displayName?: string;
  roles: UserRole[];
  isValid: boolean;
  errors: string[];
}

interface ParsedRow {
  email: string;
  displayName: string;
  roles: string;
  lineNumber: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ImportUsersCSVModal: React.FC<ImportUsersCSVModalProps> = ({
  availableRoles,
  onImportUsers,
  onClose,
  isOpen,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<CSVUserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedData([]);
      setIsProcessing(false);
      setError('');
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

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    parseCSV(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const parseCSV = async (csvFile: File) => {
    setIsProcessing(true);
    setError('');

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        setError('CSV file is empty');
        setIsProcessing(false);
        return;
      }

      // Parse header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const emailIndex = header.findIndex(h => h === 'email' || h === 'e-mail' || h === 'emailaddress');
      const nameIndex = header.findIndex(h => h === 'name' || h === 'displayname' || h === 'display name');
      const rolesIndex = header.findIndex(h => h === 'roles' || h === 'role');

      if (emailIndex === -1) {
        setError('CSV must contain an "email" column');
        setIsProcessing(false);
        return;
      }

      // Parse data rows
      const parsedRows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < header.length) continue;

        parsedRows.push({
          email: values[emailIndex] || '',
          displayName: nameIndex !== -1 ? values[nameIndex] : '',
          roles: rolesIndex !== -1 ? values[rolesIndex] : '',
          lineNumber: i + 1,
        });
      }

      // Validate and format data
      const validatedData: CSVUserData[] = parsedRows.map(row => {
        const errors: string[] = [];
        const userRoles: UserRole[] = [];

        // Validate email
        if (!row.email) {
          errors.push('Email is required');
        } else if (!isValidEmail(row.email)) {
          errors.push('Invalid email format');
        }

        // Parse and validate roles
        if (row.roles) {
          const roleNames = row.roles.split(';').map(r => r.trim());
          for (const roleName of roleNames) {
            const matchedRole = matchRole(roleName);
            if (matchedRole) {
              userRoles.push(matchedRole);
            } else {
              errors.push(`Unknown role: "${roleName}"`);
            }
          }
        }

        if (userRoles.length === 0 && !errors.some(e => e.includes('role'))) {
          errors.push('At least one role is required');
        }

        return {
          email: row.email,
          displayName: row.displayName || undefined,
          roles: userRoles,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedData(validatedData);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
      console.error('CSV parse error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    const validUsers = parsedData.filter(user => user.isValid);

    if (validUsers.length === 0) {
      setError('No valid users to import');
      return;
    }

    onImportUsers(validUsers);
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'email,displayname,roles\nexample@momentumww.com,John Doe,EMPLOYEE;HR\nexample2@momentumww.com,Jane Smith,MANAGER';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const matchRole = (roleName: string): UserRole | null => {
    const normalized = roleName.toUpperCase().replace(/\s+/g, '_');

    // Direct match
    if (availableRoles.includes(normalized as UserRole)) {
      return normalized as UserRole;
    }

    // Partial match
    const partialMatch = availableRoles.find(role =>
      role.includes(normalized) || normalized.includes(role)
    );

    return partialMatch || null;
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

  const getRoleDisplayName = (role: UserRole): string => {
    return role.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const validCount = parsedData.filter(u => u.isValid).length;
  const invalidCount = parsedData.filter(u => !u.isValid).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Import Users from CSV
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload a CSV file with user emails and role assignments
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
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              CSV Format Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Required columns: <strong>email</strong></li>
              <li>• Optional columns: <strong>displayname</strong>, <strong>roles</strong></li>
              <li>• Separate multiple roles with semicolons (;)</li>
              <li>• Available roles: {availableRoles.map(getRoleDisplayName).join(', ')}</li>
              <li>• Example: <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">example@momentumww.com,John Doe,EMPLOYEE;HR</code></li>
            </ul>
            <button
              onClick={handleDownloadTemplate}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <Icon name="download" className="w-4 h-4 mr-1" />
              Download CSV Template
            </button>
          </div>

          {/* File Upload */}
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="upload" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drag and drop CSV file here
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or click to browse your files
              </p>
              <Button variant="secondary">
                Select CSV File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* File Info */}
          {file && !isProcessing && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="file" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setError('');
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                aria-label="Remove file"
              >
                <Icon name="x" className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-8">
              <Icon name="refresh" className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processing CSV file...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="alert-triangle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                    Error
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview ({parsedData.length} rows)
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    ✓ {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      ✗ {invalidCount} invalid
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Display Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Roles
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Errors
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedData.map((user, index) => (
                        <tr
                          key={index}
                          className={user.isValid ? '' : 'bg-red-50 dark:bg-red-900/10'}
                        >
                          <td className="px-4 py-3">
                            {user.isValid ? (
                              <Icon name="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Icon name="x-circle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {user.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {user.displayName || 'Will fetch from directory'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => {
                                const color = getRoleBadgeColor(role);
                                return (
                                  <span
                                    key={role}
                                    className={`
                                      px-2 py-0.5 text-xs font-medium rounded
                                      bg-${color}-100 text-${color}-800
                                      dark:bg-${color}-900/50 dark:text-${color}-200
                                    `}
                                  >
                                    {getRoleDisplayName(role)}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-red-600 dark:text-red-400">
                            {user.errors.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {parsedData.length > 0 ? (
              <span>
                {validCount} user{validCount !== 1 ? 's' : ''} ready to import
                {invalidCount > 0 && ` (${invalidCount} will be skipped)`}
              </span>
            ) : (
              <span>Upload a CSV file to get started</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={validCount === 0}>
              <Icon name="check" className="w-4 h-4 mr-2" />
              Import {validCount} User{validCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportUsersCSVModal;
