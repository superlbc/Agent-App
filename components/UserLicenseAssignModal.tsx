// ============================================================================
// USER LICENSE ASSIGN MODAL COMPONENT
// ============================================================================
// Modal for assigning licenses to employees with seat availability validation

import React, { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { useLicense } from '../contexts/LicenseContext';
import type { Employee, LicensePool, Software } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserLicenseAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedEmployeeId?: string; // Optional: pre-select an employee
  employees: Employee[];
  onAssignSuccess?: (employeeId: string, licensePoolId: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UserLicenseAssignModal: React.FC<UserLicenseAssignModalProps> = ({
  isOpen,
  onClose,
  preSelectedEmployeeId,
  employees,
  onAssignSuccess,
}) => {
  const { licensePools, licenses, assignLicense } = useLicense();

  // Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preSelectedEmployeeId || '');
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter active employees only
  const activeEmployees = useMemo(() => {
    return employees.filter((emp) => emp.status === 'active' || emp.status === 'pre-hire');
  }, [employees]);

  // Get software details for a pool
  const getSoftwareForPool = (poolId: string): Software | undefined => {
    const pool = licensePools.find((p) => p.id === poolId);
    if (!pool) return undefined;
    return licenses.find((sw) => sw.id === pool.softwareId);
  };

  // Filter license pools by search query and availability
  const filteredPools = useMemo(() => {
    let pools = licensePools;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      pools = pools.filter((pool) => {
        const software = getSoftwareForPool(pool.id);
        return (
          software?.name.toLowerCase().includes(lowerQuery) ||
          software?.vendor.toLowerCase().includes(lowerQuery) ||
          pool.id.toLowerCase().includes(lowerQuery)
        );
      });
    }

    return pools;
  }, [licensePools, searchQuery, licenses]);

  // Get selected employee
  const selectedEmployee = useMemo(() => {
    return activeEmployees.find((emp) => emp.id === selectedEmployeeId);
  }, [activeEmployees, selectedEmployeeId]);

  // Get selected pool
  const selectedPool = useMemo(() => {
    return licensePools.find((pool) => pool.id === selectedPoolId);
  }, [licensePools, selectedPoolId]);

  // Calculate utilization percentage
  const getUtilization = (pool: LicensePool): number => {
    if (pool.totalSeats === 0) return 0;
    return Math.round((pool.assignedSeats / pool.totalSeats) * 100);
  };

  // Get utilization color
  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 100) return 'bg-red-500';
    if (utilization >= 90) return 'bg-orange-500';
    if (utilization >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get available seats
  const getAvailableSeats = (pool: LicensePool): number => {
    return Math.max(0, pool.totalSeats - pool.assignedSeats);
  };

  // Check if employee already has this license
  const employeeHasLicense = (employeeId: string, poolId: string): boolean => {
    const pool = licensePools.find((p) => p.id === poolId);
    if (!pool) return false;
    return pool.assignments.some(
      (assignment) => assignment.employeeId === employeeId && assignment.status === 'active'
    );
  };

  // Validation
  const canAssign = useMemo(() => {
    if (!selectedEmployeeId || !selectedPoolId) return false;

    const pool = selectedPool;
    if (!pool) return false;

    // Check if employee already has this license
    if (employeeHasLicense(selectedEmployeeId, selectedPoolId)) {
      return false;
    }

    // Allow over-allocation but warn
    return true;
  }, [selectedEmployeeId, selectedPoolId, selectedPool]);

  // Get warning message
  const getWarningMessage = (): string | null => {
    if (!selectedPool || !selectedEmployeeId) return null;

    if (employeeHasLicense(selectedEmployeeId, selectedPoolId)) {
      return 'This employee already has an active assignment for this license.';
    }

    const availableSeats = getAvailableSeats(selectedPool);
    if (availableSeats === 0) {
      return `⚠️ This pool is at capacity (${selectedPool.assignedSeats}/${selectedPool.totalSeats}). Assigning will create over-allocation.`;
    }

    if (availableSeats < 0) {
      return `⚠️ This pool is already over-allocated by ${Math.abs(availableSeats)} seats. Assigning will increase over-allocation.`;
    }

    return null;
  };

  // Handle assignment
  const handleAssign = () => {
    if (!canAssign || !selectedEmployee || !selectedPool) return;

    const software = getSoftwareForPool(selectedPoolId);
    if (!software) return;

    const newAssignment = {
      id: `assign-${Date.now()}`,
      licensePoolId: selectedPoolId,
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployee.name,
      employeeEmail: selectedEmployee.email,
      assignedDate: new Date(),
      assignedBy: 'current-user@momentumww.com', // TODO: Get from auth context
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      status: 'active' as const,
      notes: notes || undefined,
    };

    assignLicense(selectedPoolId, newAssignment);

    // Call success callback
    if (onAssignSuccess) {
      onAssignSuccess(selectedEmployeeId, selectedPoolId);
    }

    // Reset form and close
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setSelectedEmployeeId(preSelectedEmployeeId || '');
    setSelectedPoolId('');
    setExpirationDate('');
    setNotes('');
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="user-check" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assign License to Employee
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Select Employee */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Step 1: Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setSelectedPoolId(''); // Reset pool selection when employee changes
              }}
              disabled={!!preSelectedEmployeeId}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Employee --</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email}) - {emp.department}
                </option>
              ))}
            </select>
            {preSelectedEmployeeId && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Employee pre-selected. Close and reopen modal to change.
              </p>
            )}
          </div>

          {/* Step 2: Select License Pool */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Step 2: Select License Pool
            </label>

            {/* Search */}
            <Input
              type="text"
              placeholder="Search by license name or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
            />

            {/* License Pool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredPools.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                  No license pools found.
                </div>
              ) : (
                filteredPools.map((pool) => {
                  const software = getSoftwareForPool(pool.id);
                  if (!software) return null;

                  const utilization = getUtilization(pool);
                  const availableSeats = getAvailableSeats(pool);
                  const isSelected = selectedPoolId === pool.id;
                  const alreadyAssigned = selectedEmployeeId
                    ? employeeHasLicense(selectedEmployeeId, pool.id)
                    : false;

                  return (
                    <button
                      key={pool.id}
                      onClick={() => setSelectedPoolId(pool.id)}
                      disabled={alreadyAssigned}
                      className={`
                        text-left p-4 rounded-lg border-2 transition-all
                        ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                        }
                        ${
                          alreadyAssigned
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {software.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {software.vendor}
                          </p>
                        </div>
                        {isSelected && (
                          <Icon
                            name="check-circle"
                            className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0"
                          />
                        )}
                      </div>

                      {/* Utilization Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {pool.assignedSeats} of {pool.totalSeats} seats ({utilization}%)
                          </span>
                          {availableSeats > 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {availableSeats} available
                            </span>
                          ) : availableSeats === 0 ? (
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              Full
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {Math.abs(availableSeats)} over
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${getUtilizationColor(utilization)} rounded-full h-2 transition-all`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                      </div>

                      {alreadyAssigned && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Already assigned to this employee
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 3: Optional Details */}
          {selectedPoolId && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step 3: Assignment Details (Optional)
              </h3>

              {/* Warning Message */}
              {getWarningMessage() && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    {getWarningMessage()}
                  </p>
                </div>
              )}

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank for permanent assignment
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant notes about this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!canAssign}
          >
            <Icon name="check" className="w-4 h-4 mr-2" />
            Assign License
          </Button>
        </div>
      </div>
    </div>
  );
};
