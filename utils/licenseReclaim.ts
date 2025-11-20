// ============================================================================
// LICENSE RECLAIM UTILITIES
// ============================================================================
// Handles automatic license reclamation when employees are terminated
// or when assignments expire

import { Software, LicenseAssignment, Employee } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReclaimResult {
  success: boolean;
  reclaimedLicenses: Array<{
    licenseId: string;
    licenseName: string;
    employeeId: string;
    employeeName: string;
    assignmentId: string;
  }>;
  errors: Array<{
    licenseId: string;
    licenseName: string;
    error: string;
  }>;
  totalReclaimed: number;
}

export interface ReclaimOptions {
  reason?: 'termination' | 'expiration' | 'manual';
  reclaimedBy: string;
  notes?: string;
  sendNotification?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a license assignment has expired
 */
export const isAssignmentExpired = (assignment: LicenseAssignment): boolean => {
  if (!assignment.expirationDate) return false;
  const now = new Date();
  return assignment.expirationDate < now && assignment.status === 'active';
};

/**
 * Get all active assignments for an employee
 */
export const getEmployeeAssignments = (
  licenses: Software[],
  employeeId: string
): Array<{ license: Software; assignment: LicenseAssignment }> => {
  const result: Array<{ license: Software; assignment: LicenseAssignment }> = [];

  licenses.forEach((license) => {
    if (!license.assignments) return;

    license.assignments.forEach((assignment) => {
      if (assignment.employeeId === employeeId && assignment.status === 'active') {
        result.push({ license, assignment });
      }
    });
  });

  return result;
};

/**
 * Get all expired assignments across all licenses
 */
export const getExpiredAssignments = (
  licenses: Software[]
): Array<{ license: Software; assignment: LicenseAssignment }> => {
  const result: Array<{ license: Software; assignment: LicenseAssignment }> = [];

  licenses.forEach((license) => {
    if (!license.assignments) return;

    license.assignments.forEach((assignment) => {
      if (isAssignmentExpired(assignment)) {
        result.push({ license, assignment });
      }
    });
  });

  return result;
};

// ============================================================================
// RECLAIM FUNCTIONS
// ============================================================================

/**
 * Reclaim a single license assignment
 * Updates the assignment status to 'revoked' and decrements assignedSeats
 */
export const reclaimLicenseAssignment = (
  license: Software,
  assignmentId: string,
  options: ReclaimOptions
): { success: boolean; error?: string; updatedLicense?: Software } => {
  if (!license.assignments) {
    return { success: false, error: 'License has no assignments' };
  }

  const assignmentIndex = license.assignments.findIndex((a) => a.id === assignmentId);
  if (assignmentIndex === -1) {
    return { success: false, error: 'Assignment not found' };
  }

  const assignment = license.assignments[assignmentIndex];
  if (assignment.status !== 'active') {
    return { success: false, error: `Assignment already ${assignment.status}` };
  }

  // Create updated license with revoked assignment
  const updatedAssignments = [...license.assignments];
  updatedAssignments[assignmentIndex] = {
    ...assignment,
    status: 'revoked',
    notes: options.notes
      ? `${assignment.notes || ''}\nRevoked by ${options.reclaimedBy}: ${options.notes}`.trim()
      : assignment.notes,
  };

  const updatedLicense: Software = {
    ...license,
    assignments: updatedAssignments,
    assignedSeats: Math.max(0, (license.assignedSeats || 0) - 1),
  };

  return { success: true, updatedLicense };
};

/**
 * Reclaim all licenses for a terminated employee
 * Returns a summary of reclaimed licenses and any errors
 */
export const reclaimEmployeeLicenses = (
  licenses: Software[],
  employeeId: string,
  options: ReclaimOptions
): ReclaimResult => {
  const result: ReclaimResult = {
    success: true,
    reclaimedLicenses: [],
    errors: [],
    totalReclaimed: 0,
  };

  const employeeAssignments = getEmployeeAssignments(licenses, employeeId);

  if (employeeAssignments.length === 0) {
    return result; // No licenses to reclaim
  }

  employeeAssignments.forEach(({ license, assignment }) => {
    const reclaimResult = reclaimLicenseAssignment(license, assignment.id, options);

    if (reclaimResult.success) {
      result.reclaimedLicenses.push({
        licenseId: license.id,
        licenseName: license.name,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        assignmentId: assignment.id,
      });
      result.totalReclaimed++;
    } else {
      result.errors.push({
        licenseId: license.id,
        licenseName: license.name,
        error: reclaimResult.error || 'Unknown error',
      });
      result.success = false;
    }
  });

  return result;
};

/**
 * Reclaim all expired license assignments
 * Should be run periodically (e.g., daily cron job)
 */
export const reclaimExpiredLicenses = (
  licenses: Software[],
  options: Omit<ReclaimOptions, 'reason'>
): ReclaimResult => {
  const result: ReclaimResult = {
    success: true,
    reclaimedLicenses: [],
    errors: [],
    totalReclaimed: 0,
  };

  const expiredAssignments = getExpiredAssignments(licenses);

  if (expiredAssignments.length === 0) {
    return result; // No expired licenses
  }

  expiredAssignments.forEach(({ license, assignment }) => {
    const reclaimResult = reclaimLicenseAssignment(license, assignment.id, {
      ...options,
      reason: 'expiration',
      notes: `Automatically reclaimed due to expiration on ${assignment.expirationDate?.toLocaleDateString()}`,
    });

    if (reclaimResult.success) {
      result.reclaimedLicenses.push({
        licenseId: license.id,
        licenseName: license.name,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        assignmentId: assignment.id,
      });
      result.totalReclaimed++;
    } else {
      result.errors.push({
        licenseId: license.id,
        licenseName: license.name,
        error: reclaimResult.error || 'Unknown error',
      });
      result.success = false;
    }
  });

  return result;
};

/**
 * Generate email notification for reclaimed licenses
 * Can be sent to IT admin, manager, or employee
 */
export const generateReclaimNotification = (
  result: ReclaimResult,
  employee: Employee | { id: string; name: string; email: string; department: string },
  reason: 'termination' | 'expiration'
): {
  subject: string;
  body: string;
  recipients: string[];
} => {
  const subject =
    reason === 'termination'
      ? `License Reclamation: ${employee.name} - Termination`
      : `License Reclamation: Expired Assignments`;

  const body = `
# License Reclamation Report

${reason === 'termination' ? `**Employee:** ${employee.name} (${employee.email})` : ''}
${reason === 'termination' ? `**Department:** ${employee.department}` : ''}
**Reason:** ${reason === 'termination' ? 'Employee Termination' : 'License Expiration'}
**Date:** ${new Date().toLocaleDateString()}
**Total Licenses Reclaimed:** ${result.totalReclaimed}

---

## Reclaimed Licenses

${result.reclaimedLicenses
  .map(
    (license, index) => `
${index + 1}. **${license.licenseName}**
   - Employee: ${license.employeeName}
   - License ID: ${license.licenseId}
   - Assignment ID: ${license.assignmentId}
`
  )
  .join('\n')}

${
  result.errors.length > 0
    ? `
---

## Errors

${result.errors.map((error, index) => `${index + 1}. **${error.licenseName}**: ${error.error}`).join('\n')}
`
    : ''
}

---

**Note:** These licenses are now available for reassignment.
`;

  const recipients =
    reason === 'termination'
      ? ['it-admin@company.com', employee.email] // Notify IT and employee's manager
      : ['it-admin@company.com']; // Notify IT only for expirations

  return {
    subject,
    body,
    recipients,
  };
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Process multiple employee terminations in batch
 * Useful for end-of-quarter or end-of-year terminations
 */
export const batchReclaimEmployeeLicenses = (
  licenses: Software[],
  employeeIds: string[],
  options: ReclaimOptions
): Map<string, ReclaimResult> => {
  const results = new Map<string, ReclaimResult>();

  employeeIds.forEach((employeeId) => {
    const result = reclaimEmployeeLicenses(licenses, employeeId, options);
    results.set(employeeId, result);
  });

  return results;
};

/**
 * Get summary statistics for reclamation results
 */
export const getReclaimSummary = (
  results: Map<string, ReclaimResult>
): {
  totalEmployees: number;
  totalLicensesReclaimed: number;
  successfulReclaims: number;
  failedReclaims: number;
  totalErrors: number;
} => {
  let totalLicensesReclaimed = 0;
  let successfulReclaims = 0;
  let failedReclaims = 0;
  let totalErrors = 0;

  results.forEach((result) => {
    totalLicensesReclaimed += result.totalReclaimed;
    if (result.success) {
      successfulReclaims++;
    } else {
      failedReclaims++;
    }
    totalErrors += result.errors.length;
  });

  return {
    totalEmployees: results.size,
    totalLicensesReclaimed,
    successfulReclaims,
    failedReclaims,
    totalErrors,
  };
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Reclaim licenses when an employee is terminated
 *
 * const result = reclaimEmployeeLicenses(
 *   allLicenses,
 *   'emp-123',
 *   {
 *     reason: 'termination',
 *     reclaimedBy: 'HR Admin',
 *     notes: 'Employee terminated effective 2025-12-01',
 *     sendNotification: true,
 *   }
 * );
 *
 * if (result.success) {
 *   console.log(`Successfully reclaimed ${result.totalReclaimed} licenses`);
 * }
 */

/**
 * Example 2: Daily cron job to reclaim expired licenses
 *
 * const result = reclaimExpiredLicenses(
 *   allLicenses,
 *   {
 *     reclaimedBy: 'System (Auto-Reclaim)',
 *     sendNotification: true,
 *   }
 * );
 *
 * if (result.totalReclaimed > 0) {
 *   console.log(`Reclaimed ${result.totalReclaimed} expired licenses`);
 *   // Send notification email
 *   const notification = generateReclaimNotification(result, employee, 'expiration');
 *   sendEmail(notification);
 * }
 */

/**
 * Example 3: Batch reclaim for multiple terminations
 *
 * const employeeIds = ['emp-123', 'emp-456', 'emp-789'];
 * const results = batchReclaimEmployeeLicenses(
 *   allLicenses,
 *   employeeIds,
 *   {
 *     reason: 'termination',
 *     reclaimedBy: 'HR Admin',
 *     sendNotification: true,
 *   }
 * );
 *
 * const summary = getReclaimSummary(results);
 * console.log(`Processed ${summary.totalEmployees} employees, reclaimed ${summary.totalLicensesReclaimed} licenses`);
 */
