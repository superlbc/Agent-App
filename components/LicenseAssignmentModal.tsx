// ============================================================================
// LICENSE ASSIGNMENT MODAL COMPONENT
// ============================================================================
// Assign software licenses to employees with validation and availability checking

import React, { useState, useMemo } from 'react';
import { Software, LicenseAssignment, Employee, PreHire } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicenseAssignmentModalProps {
  license: Software;
  employees: (Employee | PreHire)[]; // Can assign to employees or pre-hires
  currentUser: { name: string; email: string };
  onAssign: (assignment: Omit<LicenseAssignment, 'id'>) => void;
  onClose: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get available seats for a license
 */
const getAvailableSeats = (license: Software): number => {
  if (!license.seatCount) return 0;
  const assigned = license.assignedSeats || 0;
  return license.seatCount - assigned;
};

/**
 * Calculate utilization percentage
 */
const getUtilization = (license: Software): number => {
  if (!license.seatCount) return 0;
  const assigned = license.assignedSeats || 0;
  return (assigned / license.seatCount) * 100;
};

/**
 * Format employee name
 */
const formatEmployeeName = (emp: Employee | PreHire): string => {
  if ('candidateName' in emp) {
    return `${emp.candidateName} (Pre-hire)`;
  }
  return emp.name;
};

/**
 * Get employee email
 */
const getEmployeeEmail = (emp: Employee | PreHire): string => {
  if ('candidateName' in emp) {
    return emp.email || '';
  }
  return emp.email;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LicenseAssignmentModal: React.FC<LicenseAssignmentModalProps> = ({
  license,
  employees,
  currentUser,
  onAssign,
  onClose,
}) => {
  // State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const availableSeats = getAvailableSeats(license);
  const utilization = getUtilization(license);
  const isOverAllocated = availableSeats < 0;
  const canAssign = availableSeats > 0;

  // Get already assigned employee IDs
  const assignedEmployeeIds = useMemo(() => {
    return new Set(license.assignments?.map((a) => a.employeeId) || []);
  }, [license.assignments]);

  // Filter available employees (not already assigned)
  const availableEmployees = useMemo(() => {
    return employees.filter((emp) => !assignedEmployeeIds.has(emp.id));
  }, [employees, assignedEmployeeIds]);

  // Search filtered employees
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return availableEmployees;
    const query = searchQuery.toLowerCase();
    return availableEmployees.filter((emp) => {
      const name = formatEmployeeName(emp).toLowerCase();
      const email = getEmployeeEmail(emp).toLowerCase();
      const department = emp.department.toLowerCase();
      return name.includes(query) || email.includes(query) || department.includes(query);
    });
  }, [availableEmployees, searchQuery]);

  // Get selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      setError('Please select an employee');
      return;
    }

    if (!canAssign && !isOverAllocated) {
      setError('No available seats for this license');
      return;
    }

    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee) {
      setError('Selected employee not found');
      return;
    }

    const assignment: Omit<LicenseAssignment, 'id'> = {
      licenseId: license.id,
      employeeId: employee.id,
      employeeName: formatEmployeeName(employee),
      employeeEmail: getEmployeeEmail(employee),
      assignedDate: new Date(),
      assignedBy: currentUser.name,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      notes: notes || undefined,
      status: 'active',
    };

    onAssign(assignment);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icon name="key" className="w-6 h-6" />
                Assign License
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Assign a seat of {license.name} to an employee
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* License Info Card */}
          <Card className="p-4 mb-6 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{license.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Vendor:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">{license.vendor}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {license.licenseType.charAt(0).toUpperCase() + license.licenseType.slice(1)}
                    </span>
                  </div>
                  {license.seatCount && (
                    <>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Seats:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">{license.seatCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {license.assignedSeats || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Available:</span>
                        <span
                          className={`ml-2 font-medium ${
                            availableSeats > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {availableSeats}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Utilization:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {Math.round(utilization)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Utilization Bar */}
                {license.seatCount && (
                  <div className="mt-3">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          utilization > 100
                            ? 'bg-red-500'
                            : utilization >= 90
                            ? 'bg-orange-500'
                            : utilization >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Warning for no available seats */}
          {!canAssign && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="alert" className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                    {isOverAllocated ? 'License Over-Allocated' : 'No Available Seats'}
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {isOverAllocated
                      ? 'This license is over-allocated. Assigning more seats will increase the over-allocation.'
                      : 'All seats for this license are currently assigned. You can still assign, but this will create an over-allocation.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Employee *
              </label>
              <Select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setError('');
                }}
                options={[
                  {
                    value: '',
                    label: `-- Select Employee (${filteredEmployees.length} available) --`,
                  },
                  ...filteredEmployees.map((emp) => ({
                    value: emp.id,
                    label: `${formatEmployeeName(emp)} - ${emp.department} (${getEmployeeEmail(emp)})`,
                  })),
                ]}
              />
              {assignedEmployeeIds.size > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {assignedEmployeeIds.size} employee{assignedEmployeeIds.size !== 1 ? 's' : ''} already have this
                  license assigned
                </p>
              )}
            </div>

            {/* Selected Employee Info */}
            {selectedEmployee && (
              <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <Icon name="user" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatEmployeeName(selectedEmployee)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{selectedEmployee.department}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{getEmployeeEmail(selectedEmployee)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Expiration Date (Optional) */}
            <div>
              <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiration Date (Optional)
              </label>
              <Input
                id="expiration-date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                placeholder="Leave blank for perpetual assignment"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set an expiration date for temporary assignments. Leave blank for permanent assignments.
              </p>
            </div>

            {/* Notes (Optional) */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this license assignment..."
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={!selectedEmployeeId}>
                <Icon name="check" className="w-4 h-4 mr-2" />
                Assign License
                {!canAssign && ' (Over-Allocate)'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
