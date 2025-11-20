// ============================================================================
// FREEZE PERIOD EMAIL TEMPLATES
// ============================================================================
// Generate email templates for Helix ticketing during Workday freeze period
// Supports configurable freeze periods with custom email templates

import { PreHire, FreezePeriod, Employee } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EmailTemplate {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  priority: 'normal' | 'high' | 'urgent';
}

export type EmailType = 'password-reset' | 'account-termination';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a date falls within the Workday freeze period
 * LEGACY: Hardcoded Nov 1 - Jan 5 freeze period
 * @deprecated Use isInAnyFreezePeriod instead with configurable freeze periods
 */
export const isInFreezePeriod = (date: Date): boolean => {
  const d = new Date(date);
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();
  return month === 10 || month === 11 || (month === 0 && day <= 5);
};

/**
 * Check if a date falls within any active freeze period
 * @param date Date to check
 * @param freezePeriods Array of freeze period definitions
 * @returns True if date is within any active freeze period
 */
export const isInAnyFreezePeriod = (date: Date, freezePeriods: FreezePeriod[]): boolean => {
  return freezePeriods.some((period) => {
    if (!period.isActive) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const startDate = new Date(period.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(period.endDate);
    endDate.setHours(23, 59, 59, 999);
    return checkDate >= startDate && checkDate <= endDate;
  });
};

/**
 * Get the active freeze period for a specific date
 * @param date Date to check
 * @param freezePeriods Array of freeze period definitions
 * @returns Active freeze period if found, null otherwise
 */
export const getActiveFreezePeriod = (date: Date, freezePeriods: FreezePeriod[]): FreezePeriod | null => {
  const activePeriod = freezePeriods.find((period) => {
    if (!period.isActive) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const startDate = new Date(period.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(period.endDate);
    endDate.setHours(23, 59, 59, 999);
    return checkDate >= startDate && checkDate <= endDate;
  });
  return activePeriod || null;
};

/**
 * Replace template placeholders with actual values
 * Supported placeholders:
 * - {employeeName} - Employee full name
 * - {employeeEmail} - Employee email address
 * - {startDate} - Employee start date (formatted)
 * - {endDate} - Employee end date (formatted)
 * - {role} - Employee role/job title
 * - {department} - Employee department
 * - {hiringManager} - Hiring manager name
 * - {employeeId} - Employee ID
 */
export const replacePlaceholders = (
  template: string,
  data: {
    employeeName: string;
    employeeEmail?: string;
    startDate?: Date;
    endDate?: Date;
    role?: string;
    department?: string;
    hiringManager?: string;
    employeeId?: string;
  }
): string => {
  let result = template;
  result = result.replace(/{employeeName}/g, data.employeeName);
  result = result.replace(/{employeeEmail}/g, data.employeeEmail || 'Not provided');
  result = result.replace(/{startDate}/g, data.startDate ? formatDate(data.startDate) : 'Not provided');
  result = result.replace(/{endDate}/g, data.endDate ? formatDate(data.endDate) : 'Not provided');
  result = result.replace(/{role}/g, data.role || 'Not specified');
  result = result.replace(/{department}/g, data.department || 'Not specified');
  result = result.replace(/{hiringManager}/g, data.hiringManager || 'Not specified');
  result = result.replace(/{employeeId}/g, data.employeeId || 'Not assigned');
  return result;
};

/**
 * Format date for email display
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// ============================================================================
// EMAIL TEMPLATE GENERATORS (NEW - Template-based)
// ============================================================================

/**
 * Generate email using freeze period template for employee start date
 * @param preHire Pre-hire record
 * @param freezePeriod Active freeze period with email templates
 * @returns Email template with placeholders replaced
 */
export const generateStartDateEmail = (preHire: PreHire, freezePeriod: FreezePeriod): EmailTemplate => {
  const subject = replacePlaceholders(freezePeriod.emailTemplate.startDateSubject, {
    employeeName: preHire.candidateName,
    employeeEmail: preHire.email,
    startDate: preHire.startDate,
    role: preHire.role,
    department: preHire.department,
    hiringManager: preHire.hiringManager,
    employeeId: preHire.linkedEmployeeId,
  });

  const body = replacePlaceholders(freezePeriod.emailTemplate.startDateBody, {
    employeeName: preHire.candidateName,
    employeeEmail: preHire.email,
    startDate: preHire.startDate,
    role: preHire.role,
    department: preHire.department,
    hiringManager: preHire.hiringManager,
    employeeId: preHire.linkedEmployeeId,
  });

  return {
    to: freezePeriod.helixEmail,
    cc: freezePeriod.ccRecipients,
    subject,
    body,
    priority: 'high',
  };
};

/**
 * Generate email using freeze period template for employee end date
 * @param employee Employee record
 * @param freezePeriod Active freeze period with email templates
 * @returns Email template with placeholders replaced
 */
export const generateEndDateEmail = (employee: Employee, freezePeriod: FreezePeriod): EmailTemplate => {
  const subject = replacePlaceholders(freezePeriod.emailTemplate.endDateSubject, {
    employeeName: employee.name,
    employeeEmail: employee.email,
    endDate: employee.endDate,
    role: employee.role,
    department: employee.department,
    manager: employee.manager,
    employeeId: employee.id,
  });

  const body = replacePlaceholders(freezePeriod.emailTemplate.endDateBody, {
    employeeName: employee.name,
    employeeEmail: employee.email,
    endDate: employee.endDate,
    role: employee.role,
    department: employee.department,
    manager: employee.manager,
    employeeId: employee.id,
  });

  return {
    to: freezePeriod.helixEmail,
    cc: freezePeriod.ccRecipients,
    subject,
    body,
    priority: 'high',
  };
};

// ============================================================================
// EMAIL TEMPLATE GENERATORS (LEGACY - Hardcoded)
// ============================================================================

/**
 * Generate password reset email for employee starting during freeze period
 * Sent to: Helix IT team
 * Purpose: Request password reset and MFA activation for pre-loaded account
 * @deprecated Use generateStartDateEmail with configurable FreezePeriod instead
 */
export const generatePasswordResetEmail = (preHire: PreHire, helixEmail: string): EmailTemplate => {
  const subject = `FREEZE PERIOD: Password Reset Request - ${preHire.candidateName}`;

  const body = `Dear IT Team,

${preHire.candidateName} is starting work on ${formatDate(preHire.startDate)}.

As this start date falls within the Workday freeze period, their account was pre-loaded with a scrubbed password. Please reset their password and MFA and send the credentials to ${preHire.email || '[email not provided]'}.

Employee Details:
- Name: ${preHire.candidateName}
- Role: ${preHire.role}
- Department: ${preHire.department}
- Start Date: ${formatDate(preHire.startDate)}
- Email: ${preHire.email || 'Not provided'}
- Hiring Manager: ${preHire.hiringManager}
${preHire.linkedEmployeeId ? `- Employee ID: ${preHire.linkedEmployeeId}` : ''}

${preHire.assignedPackage ? `Equipment Package: ${preHire.assignedPackage.name}` : 'Equipment Package: Not yet assigned'}

Action Required:
1. Reset password for ${preHire.candidateName}
2. Enable MFA for their account
3. Send credentials to ${preHire.email || preHire.hiringManager}
4. Update ticket status when complete

Priority: High (Start date: ${formatDate(preHire.startDate)})

This is an automated message from the Employee Onboarding System.
For questions, contact HR (Camille/Payton).

Thank you,
Employee Onboarding System`;

  return {
    to: helixEmail,
    cc: ['camille@momentumww.com', 'payton@momentumww.com'], // CC HR team
    subject,
    body,
    priority: 'high',
  };
};

/**
 * Generate account termination email for employee ending during freeze period
 * Sent to: Helix IT team
 * Purpose: Request password reset and MFA deactivation for departing employee
 */
export const generateAccountTerminationEmail = (
  employeeName: string,
  employeeId: string,
  endDate: Date,
  helixEmail: string
): EmailTemplate => {
  const subject = `FREEZE PERIOD: Account Termination Request - ${employeeName}`;

  const body = `Dear IT Team,

${employeeName} is no longer with the company as of ${formatDate(endDate)}.

As this end date falls within the Workday freeze period, please reset their password and disable MFA to secure their account.

Employee Details:
- Name: ${employeeName}
- Employee ID: ${employeeId}
- End Date: ${formatDate(endDate)}

Action Required:
1. Reset password for ${employeeName}
2. Disable MFA for their account
3. Revoke access to all systems
4. Update ticket status when complete

Priority: High (Security-sensitive)

This is an automated message from the Employee Onboarding System.
For questions, contact HR (Camille/Payton).

Thank you,
Employee Onboarding System`;

  return {
    to: helixEmail,
    cc: ['camille@momentumww.com', 'payton@momentumww.com'], // CC HR team
    subject,
    body,
    priority: 'high',
  };
};

/**
 * Generate mailto: link for opening email client
 * @param template Email template object
 * @returns mailto: URL string
 */
export const generateMailtoLink = (template: EmailTemplate): string => {
  const params = new URLSearchParams();
  params.append('subject', template.subject);
  params.append('body', template.body);

  if (template.cc && template.cc.length > 0) {
    params.append('cc', template.cc.join(','));
  }

  return `mailto:${template.to}?${params.toString()}`;
};

/**
 * Open email client with pre-filled template
 * @param template Email template object
 */
export const openEmailClient = (template: EmailTemplate): void => {
  const mailtoLink = generateMailtoLink(template);
  window.location.href = mailtoLink;
};

/**
 * Copy email template to clipboard
 * @param template Email template object
 * @returns Promise resolving when copy is complete
 */
export const copyEmailToClipboard = async (template: EmailTemplate): Promise<void> => {
  const fullEmail = `To: ${template.to}
${template.cc && template.cc.length > 0 ? `CC: ${template.cc.join(', ')}\n` : ''}Subject: ${template.subject}
Priority: ${template.priority.toUpperCase()}

${template.body}`;

  await navigator.clipboard.writeText(fullEmail);
};

// ============================================================================
// BATCH EMAIL GENERATION
// ============================================================================

/**
 * Generate emails for all pre-hires starting during freeze period
 * @param preHires Array of pre-hire records
 * @param helixEmail Helix ticket email address
 * @returns Array of email templates
 */
export const generateFreezePeriodStartEmails = (
  preHires: PreHire[],
  helixEmail: string
): EmailTemplate[] => {
  return preHires
    .filter((ph) =>
      ph.status === 'accepted' &&
      isInFreezePeriod(ph.startDate) &&
      new Date(ph.startDate) >= new Date() // Only future/today start dates
    )
    .map((ph) => generatePasswordResetEmail(ph, helixEmail));
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_HELIX_EMAIL = 'helix@momentumww.com'; // Update with actual Helix email
export const FREEZE_PERIOD_DESCRIPTION = 'November 1 - January 5 (Workday system freeze)';
