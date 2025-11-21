// ============================================================================
// APPROVAL EMAIL SERVICE
// ============================================================================
// Email template rendering and approval notification system
//
// **Purpose**: Generate approval request emails with dynamic content
//
// **Features**:
// - Template placeholder substitution ({packageName}, {candidateName}, etc.)
// - Default templates for standard approval requests
// - Custom template support from Package.approvalEmailTemplate
// - HTML and plain text email generation
// - Email validation and sanitization
//
// **Use Cases**:
// - Send approval requests to SVP (Patricia/Steve) for exceptions
// - Notify hiring managers of package assignments
// - Send approval confirmations
// - Generate Helix ticket descriptions
// ============================================================================

import { Package, PreHire, ApprovalRequest, ApprovalEmailTemplate } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailPlaceholders {
  packageName: string;
  packageDescription?: string;
  candidateName: string;
  candidateEmail?: string;
  role: string;
  department: string;
  departmentGroup?: string;
  startDate: string; // Formatted date
  hiringManager: string;
  hiringManagerEmail?: string;
  requester: string;
  requesterEmail?: string;
  approverName?: string;
  approverEmail?: string;
  requestDate: string; // Formatted date
  packageCost?: string; // Formatted currency
  hardwareList?: string; // Bulleted list
  softwareList?: string; // Bulleted list
  justification?: string;
  helixTicketId?: string;
}

export interface RenderedEmail {
  subject: string;
  bodyPlainText: string;
  bodyHtml: string;
  to: string[]; // Recipient email addresses
  cc?: string[]; // CC recipients
  from?: string; // Sender email
  replyTo?: string; // Reply-to address
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Default approval request template for exception packages
 */
export const DEFAULT_APPROVAL_TEMPLATE: ApprovalEmailTemplate = {
  subject: 'Approval Required: {packageName} for {candidateName}',
  body: `Hi {approverName},

We need your approval for an equipment package exception:

**Candidate**: {candidateName} ({candidateEmail})
**Role**: {role}
**Department**: {department}
**Start Date**: {startDate}
**Hiring Manager**: {hiringManager}

**Package Details**:
- **Package Name**: {packageName}
- **Description**: {packageDescription}
- **Estimated Cost**: {packageCost}

**Hardware**:
{hardwareList}

**Software**:
{softwareList}

**Justification**:
{justification}

Please review and approve this request at your earliest convenience.

Best regards,
{requester}`,
  cc: [],
};

/**
 * Default confirmation email template for approved packages
 */
export const DEFAULT_CONFIRMATION_TEMPLATE: ApprovalEmailTemplate = {
  subject: 'Package Approved: {packageName} for {candidateName}',
  body: `Hi {requester},

Your equipment package request has been approved:

**Candidate**: {candidateName}
**Package**: {packageName}
**Approved By**: {approverName}
**Approval Date**: {requestDate}

A Helix ticket has been created for IT provisioning: {helixTicketId}

Best regards,
Onboarding System`,
  cc: [],
};

/**
 * Default rejection email template
 */
export const DEFAULT_REJECTION_TEMPLATE: ApprovalEmailTemplate = {
  subject: 'Package Request Declined: {packageName} for {candidateName}',
  body: `Hi {requester},

Your equipment package request has been declined:

**Candidate**: {candidateName}
**Package**: {packageName}
**Declined By**: {approverName}
**Decline Date**: {requestDate}

**Reason**: {justification}

Please revise your request or select a standard package.

Best regards,
Onboarding System`,
  cc: [],
};

// ============================================================================
// PLACEHOLDER SUBSTITUTION
// ============================================================================

/**
 * Replace placeholders in template string with actual values
 *
 * @example
 * const subject = replacePlaceholders(
 *   "Approval Required: {packageName} for {candidateName}",
 *   { packageName: "XD Designer Premium", candidateName: "Jane Smith" }
 * );
 * // Returns: "Approval Required: XD Designer Premium for Jane Smith"
 */
export function replacePlaceholders(
  template: string,
  placeholders: EmailPlaceholders
): string {
  let result = template;

  // Replace each placeholder with its value
  Object.entries(placeholders).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });

  // Remove any remaining unreplaced placeholders
  result = result.replace(/\{[^}]+\}/g, '[Not Available]');

  return result;
}

/**
 * Validate template syntax (check for valid placeholders)
 */
export function validateTemplate(template: ApprovalEmailTemplate): EmailValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  if (!template.subject || template.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!template.body || template.body.trim().length === 0) {
    errors.push('Body is required');
  }

  // Check for valid placeholder syntax
  const placeholderRegex = /\{([^}]+)\}/g;
  const validPlaceholders = [
    'packageName',
    'packageDescription',
    'candidateName',
    'candidateEmail',
    'role',
    'department',
    'departmentGroup',
    'startDate',
    'hiringManager',
    'hiringManagerEmail',
    'requester',
    'requesterEmail',
    'approverName',
    'approverEmail',
    'requestDate',
    'packageCost',
    'hardwareList',
    'softwareList',
    'justification',
    'helixTicketId',
  ];

  // Check subject placeholders
  let match;
  while ((match = placeholderRegex.exec(template.subject)) !== null) {
    const placeholder = match[1];
    if (!validPlaceholders.includes(placeholder)) {
      warnings.push(`Unknown placeholder in subject: {${placeholder}}`);
    }
  }

  // Reset regex for body
  placeholderRegex.lastIndex = 0;

  // Check body placeholders
  while ((match = placeholderRegex.exec(template.body)) !== null) {
    const placeholder = match[1];
    if (!validPlaceholders.includes(placeholder)) {
      warnings.push(`Unknown placeholder in body: {${placeholder}}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// EMAIL GENERATION
// ============================================================================

/**
 * Build placeholders object from PreHire and Package data
 */
export function buildPlaceholders(
  preHire: PreHire,
  pkg: Package,
  approvalRequest: ApprovalRequest
): EmailPlaceholders {
  // Format dates
  const startDate = new Date(preHire.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const requestDate = new Date(approvalRequest.requestDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format hardware list
  const hardwareList = pkg.hardware
    .map((hw) => `- ${hw.model} (${hw.manufacturer})`)
    .join('\n');

  // Format software list
  const softwareList = pkg.software
    .map((sw) => `- ${sw.name} (${sw.vendor})`)
    .join('\n');

  // Calculate package cost
  const hardwareCost = pkg.hardware.reduce((sum, hw) => sum + (hw.cost || 0), 0);
  const softwareCost = pkg.software.reduce((sum, sw) => sum + (sw.cost || 0), 0);
  const totalCost = hardwareCost + softwareCost;
  const packageCost = `$${totalCost.toFixed(2)}`;

  return {
    packageName: pkg.name,
    packageDescription: pkg.description,
    candidateName: preHire.candidateName,
    candidateEmail: preHire.email,
    role: preHire.role,
    department: preHire.department,
    startDate,
    hiringManager: preHire.hiringManager,
    requester: approvalRequest.requester,
    requestDate,
    packageCost,
    hardwareList,
    softwareList,
    justification: approvalRequest.notes,
  };
}

/**
 * Generate approval request email
 *
 * @example
 * const email = generateApprovalRequestEmail(preHire, pkg, approvalRequest, {
 *   approverName: "Steve Sanderson",
 *   approverEmail: "steve.sanderson@momentumww.com"
 * });
 *
 * // Send email via Microsoft Graph or other email service
 * await sendEmail(email);
 */
export function generateApprovalRequestEmail(
  preHire: PreHire,
  pkg: Package,
  approvalRequest: ApprovalRequest,
  options: {
    approverName: string;
    approverEmail: string;
    fromEmail?: string;
  }
): RenderedEmail {
  // Use custom template if provided, otherwise use default
  const template = pkg.approvalEmailTemplate || DEFAULT_APPROVAL_TEMPLATE;

  // Build placeholders
  const placeholders = buildPlaceholders(preHire, pkg, approvalRequest);
  placeholders.approverName = options.approverName;
  placeholders.approverEmail = options.approverEmail;

  // Render subject and body
  const subject = replacePlaceholders(template.subject, placeholders);
  const bodyPlainText = replacePlaceholders(template.body, placeholders);

  // Convert plain text to basic HTML
  const bodyHtml = convertToHtml(bodyPlainText);

  return {
    subject,
    bodyPlainText,
    bodyHtml,
    to: [options.approverEmail],
    cc: template.cc || [],
    from: options.fromEmail,
  };
}

/**
 * Generate approval confirmation email
 */
export function generateConfirmationEmail(
  preHire: PreHire,
  pkg: Package,
  approvalRequest: ApprovalRequest,
  options: {
    approverName: string;
    helixTicketId?: string;
  }
): RenderedEmail {
  const template = DEFAULT_CONFIRMATION_TEMPLATE;

  const placeholders = buildPlaceholders(preHire, pkg, approvalRequest);
  placeholders.approverName = options.approverName;
  placeholders.helixTicketId = options.helixTicketId || 'TBD';

  const subject = replacePlaceholders(template.subject, placeholders);
  const bodyPlainText = replacePlaceholders(template.body, placeholders);
  const bodyHtml = convertToHtml(bodyPlainText);

  return {
    subject,
    bodyPlainText,
    bodyHtml,
    to: [approvalRequest.requester],
    cc: template.cc || [],
  };
}

/**
 * Generate rejection notification email
 */
export function generateRejectionEmail(
  preHire: PreHire,
  pkg: Package,
  approvalRequest: ApprovalRequest,
  options: {
    approverName: string;
    rejectionReason: string;
  }
): RenderedEmail {
  const template = DEFAULT_REJECTION_TEMPLATE;

  const placeholders = buildPlaceholders(preHire, pkg, approvalRequest);
  placeholders.approverName = options.approverName;
  placeholders.justification = options.rejectionReason;

  const subject = replacePlaceholders(template.subject, placeholders);
  const bodyPlainText = replacePlaceholders(template.body, placeholders);
  const bodyHtml = convertToHtml(bodyPlainText);

  return {
    subject,
    bodyPlainText,
    bodyHtml,
    to: [approvalRequest.requester],
    cc: template.cc || [],
  };
}

// ============================================================================
// HTML CONVERSION
// ============================================================================

/**
 * Convert plain text email body to basic HTML
 * - Preserves line breaks
 * - Converts **bold** to <strong>
 * - Converts bullet points to <ul>/<li>
 */
function convertToHtml(plainText: string): string {
  let html = plainText;

  // Convert **bold** to <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert bullet points to <ul>/<li>
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`  <li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(trimmed ? `<p>${line}</p>` : '<br/>');
    }
  });

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Wrap in HTML email template
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    strong { color: #000; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>
  `.trim();
}

// ============================================================================
// EMAIL SENDING (Integration Placeholder)
// ============================================================================

/**
 * Send email via Microsoft Graph API
 *
 * NOTE: This is a placeholder. Actual implementation requires:
 * - Microsoft Graph SDK
 * - OAuth token with Mail.Send permission
 * - Proper error handling and retry logic
 *
 * @example
 * const email = generateApprovalRequestEmail(...);
 * await sendEmail(email, accessToken);
 */
export async function sendEmail(
  email: RenderedEmail,
  accessToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('[ApprovalEmailService] Sending email:', email.subject);

  // TODO: Implement Microsoft Graph API integration
  // POST https://graph.microsoft.com/v1.0/me/sendMail
  // Body: {
  //   message: {
  //     subject: email.subject,
  //     body: { contentType: "HTML", content: email.bodyHtml },
  //     toRecipients: email.to.map(addr => ({ emailAddress: { address: addr } })),
  //     ccRecipients: email.cc?.map(addr => ({ emailAddress: { address: addr } })),
  //   }
  // }

  // Placeholder response
  return {
    success: true,
    messageId: `msg-${Date.now()}`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  replacePlaceholders,
  validateTemplate,
  buildPlaceholders,
  generateApprovalRequestEmail,
  generateConfirmationEmail,
  generateRejectionEmail,
  sendEmail,
  DEFAULT_APPROVAL_TEMPLATE,
  DEFAULT_CONFIRMATION_TEMPLATE,
  DEFAULT_REJECTION_TEMPLATE,
};
