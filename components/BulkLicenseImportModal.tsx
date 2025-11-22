// ============================================================================
// BULK LICENSE IMPORT MODAL COMPONENT
// ============================================================================
// Modal for importing license assignments from CSV files
// Supports retrospective import of existing assignments with validation

import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useLicense } from '../contexts/LicenseContext';
import type { Employee, LicensePool, Software, LicenseAssignment } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BulkLicenseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onImportSuccess?: (importedCount: number) => void;
}

interface CSVRow {
  employeeEmail: string;
  licenseName: string;
  assignedDate: string;
  expirationDate?: string;
  status: string;
  notes?: string;
  assignedBy?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedAssignment extends CSVRow {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  employeeId?: string;
  licensePoolId?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BulkLicenseImportModal: React.FC<BulkLicenseImportModalProps> = ({
  isOpen,
  onClose,
  employees,
  onImportSuccess,
}) => {
  const { licensePools, licenses, assignLicense } = useLicense();

  // Step state
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  // File upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);

  // Validation state
  const [parsedAssignments, setParsedAssignments] = useState<ParsedAssignment[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Import state
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    errors: 0,
    warnings: 0,
  });

  // Find employee by email
  const findEmployeeByEmail = (email: string): Employee | undefined => {
    return employees.find((emp) => emp.email.toLowerCase() === email.toLowerCase());
  };

  // Find license pool by software name
  const findLicensePoolBySoftwareName = (name: string): { pool: LicensePool; software: Software } | undefined => {
    const software = licenses.find((sw) => sw.name.toLowerCase() === name.toLowerCase());
    if (!software) return undefined;

    const pool = licensePools.find((p) => p.softwareId === software.id);
    if (!pool) return undefined;

    return { pool, software };
  };

  // Parse CSV file
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Required headers
    const requiredHeaders = ['employeeemail', 'licensename', 'assigneddate', 'status'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header.replace(/\s+/g, '')] = values[index] || '';
      });

      rows.push({
        employeeEmail: row.employeeemail || '',
        licenseName: row.licensename || '',
        assignedDate: row.assigneddate || '',
        expirationDate: row.expirationdate || undefined,
        status: row.status || '',
        notes: row.notes || undefined,
        assignedBy: row.assignedby || undefined,
      });
    }

    return rows;
  };

  // Validate assignments
  const validateAssignments = (rows: CSVRow[]): ParsedAssignment[] => {
    const parsed: ParsedAssignment[] = [];

    rows.forEach((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let employeeId: string | undefined;
      let licensePoolId: string | undefined;

      // Validate employee email
      if (!row.employeeEmail) {
        errors.push('Employee email is required');
      } else {
        const employee = findEmployeeByEmail(row.employeeEmail);
        if (!employee) {
          errors.push(`Employee not found: ${row.employeeEmail}`);
        } else {
          employeeId = employee.id;

          // Warning: Employee is inactive/withdrawn
          if (employee.status !== 'active' && employee.status !== 'pre-hire') {
            warnings.push(`Employee status is ${employee.status}`);
          }
        }
      }

      // Validate license name
      if (!row.licenseName) {
        errors.push('License name is required');
      } else {
        const result = findLicensePoolBySoftwareName(row.licenseName);
        if (!result) {
          errors.push(`License not found: ${row.licenseName}`);
        } else {
          licensePoolId = result.pool.id;

          // Warning: Pool at capacity
          const availableSeats = result.pool.totalSeats - result.pool.assignedSeats;
          if (availableSeats <= 0) {
            warnings.push(`License pool at capacity (${result.pool.assignedSeats}/${result.pool.totalSeats})`);
          }
        }
      }

      // Validate assigned date
      if (!row.assignedDate) {
        errors.push('Assigned date is required');
      } else {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(row.assignedDate)) {
          errors.push('Assigned date must be in YYYY-MM-DD format');
        } else {
          const date = new Date(row.assignedDate);
          if (isNaN(date.getTime())) {
            errors.push('Invalid assigned date');
          }
        }
      }

      // Validate expiration date (optional)
      if (row.expirationDate) {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(row.expirationDate)) {
          errors.push('Expiration date must be in YYYY-MM-DD format');
        } else {
          const date = new Date(row.expirationDate);
          if (isNaN(date.getTime())) {
            errors.push('Invalid expiration date');
          }
        }
      }

      // Validate status
      const validStatuses = ['active', 'expired', 'revoked'];
      if (!row.status) {
        errors.push('Status is required');
      } else if (!validStatuses.includes(row.status.toLowerCase())) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      parsed.push({
        ...row,
        isValid: errors.length === 0,
        errors,
        warnings,
        employeeId,
        licensePoolId,
      });
    });

    return parsed;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        setCsvData(rows);

        // Validate
        const parsed = validateAssignments(rows);
        setParsedAssignments(parsed);

        // Move to preview step
        setCurrentStep('preview');
      } catch (error) {
        alert(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `employeeEmail,licenseName,assignedDate,expirationDate,status,notes,assignedBy
john.doe@momentumww.com,Adobe Creative Cloud,2024-01-15,2025-01-15,active,Assigned for creative work,admin@momentumww.com
jane.smith@momentumww.com,Cinema 4D,2024-02-01,,active,Permanent assignment,admin@momentumww.com
robert.martinez@momentumww.com,Smartsheet,2024-03-01,2024-12-01,revoked,Revoked upon termination,admin@momentumww.com`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'license-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Perform import
  const performImport = () => {
    const validAssignments = parsedAssignments.filter((a) => a.isValid);
    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    validAssignments.forEach((assignment) => {
      try {
        const employee = findEmployeeByEmail(assignment.employeeEmail);
        if (!employee || !assignment.licensePoolId) {
          errorCount++;
          return;
        }

        const newAssignment: LicenseAssignment = {
          id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          licensePoolId: assignment.licensePoolId,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          assignedDate: new Date(assignment.assignedDate),
          assignedBy: assignment.assignedBy || 'bulk-import@momentumww.com',
          expirationDate: assignment.expirationDate ? new Date(assignment.expirationDate) : undefined,
          status: assignment.status as 'active' | 'expired' | 'revoked',
          notes: assignment.notes,
        };

        assignLicense(assignment.licensePoolId, newAssignment);
        successCount++;

        if (assignment.warnings.length > 0) {
          warningCount++;
        }
      } catch (error) {
        errorCount++;
      }
    });

    setImportStats({
      total: parsedAssignments.length,
      success: successCount,
      errors: errorCount + parsedAssignments.filter((a) => !a.isValid).length,
      warnings: warningCount,
    });

    setCurrentStep('complete');

    if (onImportSuccess) {
      onImportSuccess(successCount);
    }
  };

  // Handle close
  const handleClose = () => {
    setCsvFile(null);
    setCsvData([]);
    setParsedAssignments([]);
    setValidationErrors([]);
    setCurrentStep('upload');
    setImportStats({ total: 0, success: 0, errors: 0, warnings: 0 });
    onClose();
  };

  if (!isOpen) return null;

  const validCount = parsedAssignments.filter((a) => a.isValid).length;
  const invalidCount = parsedAssignments.filter((a) => !a.isValid).length;
  const warningCount = parsedAssignments.filter((a) => a.warnings.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="upload" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bulk License Import
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Import license assignments from CSV file
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />
            <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                2
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />
            <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'complete' ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                3
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <Icon name="upload" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Select a CSV file with license assignment data to import
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Icon name="file" className="w-4 h-4" />
                  Choose File
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  CSV Format Requirements
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• <strong>Required columns:</strong> employeeEmail, licenseName, assignedDate, status</p>
                  <p>• <strong>Optional columns:</strong> expirationDate, notes, assignedBy</p>
                  <p>• <strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15)</p>
                  <p>• <strong>Valid statuses:</strong> active, expired, revoked</p>
                </div>

                <Button
                  variant="ghost"
                  onClick={downloadTemplate}
                  className="mt-4"
                >
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Rows</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {parsedAssignments.length}
                      </p>
                    </div>
                    <Icon name="list" className="w-8 h-8 text-gray-400" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Valid</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {validCount}
                      </p>
                    </div>
                    <Icon name="check-circle" className="w-8 h-8 text-green-400" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Errors</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {invalidCount}
                      </p>
                    </div>
                    <Icon name="alert-triangle" className="w-8 h-8 text-red-400" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Warnings</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {warningCount}
                      </p>
                    </div>
                    <Icon name="alert-circle" className="w-8 h-8 text-orange-400" />
                  </div>
                </Card>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Status</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Employee</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">License</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Assigned</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedAssignments.map((assignment, index) => (
                        <tr
                          key={index}
                          className={`
                            ${assignment.isValid ? 'bg-white dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/10'}
                            ${assignment.warnings.length > 0 && assignment.isValid ? 'bg-orange-50 dark:bg-orange-900/10' : ''}
                          `}
                        >
                          <td className="px-4 py-2">
                            {assignment.isValid ? (
                              assignment.warnings.length > 0 ? (
                                <Icon name="alert-circle" className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Icon name="check-circle" className="w-5 h-5 text-green-500" />
                              )
                            ) : (
                              <Icon name="x-circle" className="w-5 h-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {assignment.employeeEmail}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {assignment.licenseName}
                          </td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                            {assignment.assignedDate}
                          </td>
                          <td className="px-4 py-2">
                            {assignment.errors.length > 0 && (
                              <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                                {assignment.errors.map((error, i) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            )}
                            {assignment.warnings.length > 0 && (
                              <ul className="text-xs text-orange-600 dark:text-orange-400 list-disc list-inside">
                                {assignment.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ⚠️ {invalidCount} rows contain errors and will be skipped during import.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <Icon name="check-circle" className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Import Complete!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  License assignments have been successfully imported.
                </p>
              </div>

              {/* Import Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Processed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {importStats.total}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Imported</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {importStats.success}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Errors</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {importStats.errors}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Warnings</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {importStats.warnings}
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={handleClose}>
            {currentStep === 'complete' ? 'Close' : 'Cancel'}
          </Button>

          {currentStep === 'preview' && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={performImport}
                disabled={validCount === 0}
              >
                <Icon name="upload" className="w-4 h-4 mr-2" />
                Import {validCount} Assignments
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
