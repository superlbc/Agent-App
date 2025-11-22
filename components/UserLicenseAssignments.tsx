// ============================================================================
// USER LICENSE ASSIGNMENTS COMPONENT
// ============================================================================
// Master-detail view for managing license assignments across all employees
// Phase 3: User License Assignments feature

import React, { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { UserLicenseAssignModal } from './UserLicenseAssignModal';
import { BulkLicenseImportModal } from './BulkLicenseImportModal';
import { useLicense } from '../contexts/LicenseContext';
import { EmployeeLicenseSummary, LicenseAssignmentFilters, Employee } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserLicenseAssignmentsProps {
  employees?: EmployeeLicenseSummary[];
  allEmployees: Employee[]; // Full employee records for modal
  onAssignLicense?: (employeeId: string) => void;
  onRevokeLicense?: (assignmentId: string) => void;
  onViewHistory?: (assignmentId: string) => void;
  onBulkImport?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UserLicenseAssignments: React.FC<UserLicenseAssignmentsProps> = ({
  employees: externalEmployees,
  allEmployees,
  onAssignLicense,
  onRevokeLicense,
  onViewHistory,
  onBulkImport,
}) => {
  // Context
  const { getEmployeeLicenseSummaries, searchAssignments, filterAssignments } = useLicense();

  // Local state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'withdrawn' | 'pre-hire'>('all');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState<string | undefined>(undefined);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Get employee summaries (use external data if provided, otherwise from context)
  const allEmployeeSummaries = useMemo(() => {
    return externalEmployees || getEmployeeLicenseSummaries();
  }, [externalEmployees, getEmployeeLicenseSummaries]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    let result = allEmployeeSummaries;

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.employeeName.toLowerCase().includes(lowerQuery) ||
          emp.employeeEmail.toLowerCase().includes(lowerQuery) ||
          emp.department.toLowerCase().includes(lowerQuery) ||
          emp.role.toLowerCase().includes(lowerQuery)
      );
    }

    // Employee status filter
    if (statusFilter !== 'all') {
      result = result.filter((emp) => emp.status === statusFilter);
    }

    // License status filter (filter employees who have at least one license with matching status)
    if (licenseStatusFilter !== 'all') {
      result = result.filter((emp) =>
        emp.assignedLicenses.some((lic) => lic.status === licenseStatusFilter)
      );
    }

    return result;
  }, [allEmployeeSummaries, searchQuery, statusFilter, licenseStatusFilter]);

  // Selected employee details
  const selectedEmployee = useMemo(() => {
    return filteredEmployees.find((emp) => emp.employeeId === selectedEmployeeId) || null;
  }, [filteredEmployees, selectedEmployeeId]);

  // Statistics
  const stats = useMemo(() => {
    const totalEmployees = allEmployeeSummaries.length;
    const employeesWithLicenses = allEmployeeSummaries.filter((emp) => emp.totalLicenses > 0).length;
    const totalLicensesAssigned = allEmployeeSummaries.reduce((sum, emp) => sum + emp.totalLicenses, 0);
    const activeLicenses = allEmployeeSummaries.reduce((sum, emp) => sum + emp.activeLicenses, 0);
    const expiredLicenses = allEmployeeSummaries.reduce((sum, emp) => sum + emp.expiredLicenses, 0);
    const revokedLicenses = allEmployeeSummaries.reduce((sum, emp) => sum + emp.revokedLicenses, 0);

    return {
      totalEmployees,
      employeesWithLicenses,
      totalLicensesAssigned,
      activeLicenses,
      expiredLicenses,
      revokedLicenses,
    };
  }, [allEmployeeSummaries]);

  // Handlers
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleAssignLicense = () => {
    // Open modal with selected employee (if any)
    setSelectedEmployeeForAssignment(selectedEmployeeId || undefined);
    setIsAssignModalOpen(true);
  };

  const handleAssignmentSuccess = (employeeId: string, licensePoolId: string) => {
    // Close modal
    setIsAssignModalOpen(false);
    setSelectedEmployeeForAssignment(undefined);

    // Call external callback if provided
    if (onAssignLicense) {
      onAssignLicense(employeeId);
    }

    // Refresh selected employee if they were assigned a license
    if (employeeId === selectedEmployeeId) {
      // Re-select to trigger refresh
      setSelectedEmployeeId(employeeId);
    }
  };

  const handleRevokeLicense = (assignmentId: string) => {
    if (onRevokeLicense) {
      onRevokeLicense(assignmentId);
    }
  };

  const handleViewHistory = (assignmentId: string) => {
    if (onViewHistory) {
      onViewHistory(assignmentId);
    }
  };

  const handleBulkImport = () => {
    setIsBulkImportModalOpen(true);
  };

  const handleBulkImportSuccess = (importedCount: number) => {
    setIsBulkImportModalOpen(false);

    // Call external callback if provided
    if (onBulkImport) {
      onBulkImport();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLicenseStatusFilter('all');
  };

  // Helper: Get status badge color
  const getStatusColor = (status: 'active' | 'inactive' | 'withdrawn' | 'pre-hire') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'pre-hire':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getLicenseStatusColor = (status: 'active' | 'expired' | 'revoked') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'revoked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User License Assignments
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View and manage software license assignments for all employees
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkImport}>
              <Icon name="upload" className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button variant="primary" onClick={handleAssignLicense} disabled={!selectedEmployeeId}>
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Assign License
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalEmployees}
                </p>
              </div>
              <Icon name="users" className="w-8 h-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">With Licenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.employeesWithLicenses}
                </p>
              </div>
              <Icon name="user-check" className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Licenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalLicensesAssigned}
                </p>
              </div>
              <Icon name="key" className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.activeLicenses}
                </p>
              </div>
              <Icon name="check-circle" className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {stats.expiredLicenses}
                </p>
              </div>
              <Icon name="alert-triangle" className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Revoked</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.revokedLicenses}
                </p>
              </div>
              <Icon name="x-circle" className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Employee List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                label="Employee Status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="pre-hire">Pre-hire</option>
              </Select>

              <Select
                value={licenseStatusFilter}
                onChange={(e) => setLicenseStatusFilter(e.target.value as any)}
                label="License Status"
              >
                <option value="all">All Licenses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </Select>
            </div>

            {(searchQuery || statusFilter !== 'all' || licenseStatusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="w-full">
                <Icon name="x" className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}

            <div className="text-xs text-gray-600 dark:text-gray-400">
              Showing {filteredEmployees.length} of {allEmployeeSummaries.length} employees
            </div>
          </div>

          {/* Employee List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Icon name="users" className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No employees found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.employeeId}
                    onClick={() => handleEmployeeSelect(employee.employeeId)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedEmployeeId === employee.employeeId
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {employee.employeeName}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {employee.employeeEmail}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          employee.status
                        )}`}
                      >
                        {employee.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{employee.department}</span>
                      <span className="font-medium">
                        {employee.totalLicenses} license{employee.totalLicenses !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {employee.totalLicenses > 0 && (
                      <div className="flex gap-2 mt-2 text-xs">
                        {employee.activeLicenses > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            {employee.activeLicenses} active
                          </span>
                        )}
                        {employee.expiredLicenses > 0 && (
                          <span className="text-orange-600 dark:text-orange-400">
                            {employee.expiredLicenses} expired
                          </span>
                        )}
                        {employee.revokedLicenses > 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            {employee.revokedLicenses} revoked
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: License Details */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {!selectedEmployee ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Icon name="user-check" className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Employee Selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Select an employee from the list to view and manage their license assignments
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Employee Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedEmployee.employeeName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedEmployee.employeeEmail}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Department:</span> {selectedEmployee.department}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Role:</span> {selectedEmployee.role}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      selectedEmployee.status
                    )}`}
                  >
                    {selectedEmployee.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Licenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {selectedEmployee.totalLicenses}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {selectedEmployee.activeLicenses}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Expired</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {selectedEmployee.expiredLicenses}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Revoked</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {selectedEmployee.revokedLicenses}
                    </p>
                  </div>
                </div>
              </Card>

              {/* License Assignments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    License Assignments
                  </h3>
                  <Button variant="primary" size="sm" onClick={handleAssignLicense}>
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Assign License
                  </Button>
                </div>

                {selectedEmployee.assignedLicenses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Icon name="key" className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No licenses assigned</p>
                    <Button variant="primary" size="sm" onClick={handleAssignLicense} className="mt-4">
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                      Assign First License
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedEmployee.assignedLicenses.map((assignment) => (
                      <Card key={assignment.assignmentId} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {assignment.licenseName}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getLicenseStatusColor(
                                  assignment.status
                                )}`}
                              >
                                {assignment.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {assignment.vendor} • {assignment.poolName}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                              </span>
                              <span>By: {assignment.assignedBy}</span>
                              {assignment.expirationDate && (
                                <span>
                                  Expires: {new Date(assignment.expirationDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {assignment.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                                {assignment.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(assignment.assignmentId)}
                            >
                              <Icon name="clock" className="w-4 h-4" />
                            </Button>
                            {assignment.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeLicense(assignment.assignmentId)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <Icon name="x-circle" className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserLicenseAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedEmployeeForAssignment(undefined);
        }}
        preSelectedEmployeeId={selectedEmployeeForAssignment}
        employees={allEmployees}
        onAssignSuccess={handleAssignmentSuccess}
      />

      <BulkLicenseImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        employees={allEmployees}
        onImportSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};
