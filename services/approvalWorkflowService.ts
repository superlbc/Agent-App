// ============================================================================
// APPROVAL WORKFLOW SERVICE
// ============================================================================
// Complete approval workflow orchestration
//
// **Purpose**: Manage end-to-end approval process for equipment packages
//
// **Workflow Steps**:
// 1. Create approval request
// 2. Determine if auto-approve or manual approval needed
// 3. Send approval email (if manual approval)
// 4. Track approval status
// 5. Process approval/rejection
// 6. Create Helix ticket (after approval)
// 7. Send confirmation email
//
// **Approval Logic**:
// - Empty approverIds array → Auto-approve (standard package)
// - Populated approverIds → Manual approval (exception package)
//
// **Use Cases**:
// - Pre-hire equipment package assignment
// - Mid-employment software requests
// - Equipment upgrades
// - Exception package approvals
// ============================================================================

import {
  Package,
  PackageVersion,
  PreHire,
  Employee,
  ApprovalRequest,
  Hardware,
  Software,
} from '../types';
import {
  generateApprovalRequestEmail,
  generateConfirmationEmail,
  generateRejectionEmail,
  sendEmail,
  RenderedEmail,
} from './approvalEmailService';
import {
  getLatestPackageVersion,
  createPackageAssignment,
} from './packageVersionService';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateApprovalRequestOptions {
  preHire?: PreHire; // For pre-hire onboarding
  employee?: Employee; // For existing employee
  package: Package;
  packageVersion?: PackageVersion; // Optional: specify version, otherwise uses latest
  requestType: "equipment" | "software" | "exception" | "mid-employment";
  requester: string; // Name of requester
  requesterEmail?: string;
  notes?: string; // Justification
  responseDeadline?: Date; // Optional deadline
}

export interface ApprovalDecision {
  approvalRequestId: string;
  decision: "approved" | "rejected";
  decidedBy: string; // Name of approver
  decidedByEmail?: string;
  decisionDate: Date;
  rejectionReason?: string;
  notes?: string;
}

export interface ApprovalWorkflowResult {
  approvalRequest: ApprovalRequest;
  wasAutoApproved: boolean;
  emailSent: boolean;
  emailMessageId?: string;
  helixTicketId?: string;
  packageAssignmentId?: string;
  errors?: string[];
}

// ============================================================================
// IN-MEMORY STORAGE (Replace with database in production)
// ============================================================================

let approvalRequests: ApprovalRequest[] = [];
let approvalRequestIdCounter = 1;

// ============================================================================
// APPROVAL REQUEST CREATION
// ============================================================================

/**
 * Create approval request and initiate workflow
 *
 * **Workflow Logic**:
 * 1. Validate inputs (must have preHire OR employee)
 * 2. Get latest package version (if not specified)
 * 3. Determine if auto-approve or manual approval needed
 * 4. If auto-approve:
 *    - Create approval request with status "approved"
 *    - Create package assignment
 *    - Create Helix ticket
 * 5. If manual approval:
 *    - Create approval request with status "pending"
 *    - Send approval email to approvers
 *    - Wait for approval decision
 *
 * @example
 * const result = await createApprovalRequest({
 *   preHire: myPreHire,
 *   package: myPackage,
 *   requestType: "equipment",
 *   requester: "John Doe",
 *   notes: "Standard XD Designer package"
 * });
 *
 * if (result.wasAutoApproved) {
 *   console.log("Package auto-approved:", result.helixTicketId);
 * } else {
 *   console.log("Approval email sent to:", result.approvalRequest.currentApproverEmail);
 * }
 */
export async function createApprovalRequest(
  options: CreateApprovalRequestOptions
): Promise<ApprovalWorkflowResult> {
  const errors: string[] = [];

  // Validate: must have preHire OR employee
  if (!options.preHire && !options.employee) {
    throw new Error('Must provide either preHire or employee');
  }

  if (options.preHire && options.employee) {
    throw new Error('Cannot provide both preHire and employee');
  }

  // Get latest package version if not specified
  let packageVersion = options.packageVersion;
  if (!packageVersion) {
    packageVersion =
      (await getLatestPackageVersion(options.package.id)) || undefined;

    if (!packageVersion) {
      throw new Error(
        `No versions found for package: ${options.package.id}`
      );
    }
  }

  // Determine if auto-approve
  const isAutoApprove =
    !options.package.approverIds || options.package.approverIds.length === 0;

  // Get employee name and ID
  const employeeName = options.preHire
    ? options.preHire.candidateName
    : options.employee!.name;
  const employeeId = options.employee?.id;
  const preHireId = options.preHire?.id;

  // Combine hardware and software items
  const items: (Hardware | Software)[] = [
    ...options.package.hardware,
    ...options.package.software,
  ];

  // Create approval request
  const approvalRequest: ApprovalRequest = {
    id: `apr-${approvalRequestIdCounter++}`,
    preHireId,
    employeeId,
    employeeName,
    packageId: options.package.id,
    packageVersionId: packageVersion.id,
    requestType: options.requestType,
    items,
    requester: options.requester,
    requesterEmail: options.requesterEmail,
    requestDate: new Date(),
    notes: options.notes,
    approverIds: options.package.approverIds || [],
    status: isAutoApprove ? 'approved' : 'pending',
    automatedDecision: isAutoApprove,
    approvalDate: isAutoApprove ? new Date() : undefined,
    approvedBy: isAutoApprove ? 'Auto' : undefined,
    responseDeadline: options.responseDeadline,
  };

  approvalRequests.push(approvalRequest);

  let emailSent = false;
  let emailMessageId: string | undefined;
  let helixTicketId: string | undefined;
  let packageAssignmentId: string | undefined;

  // If auto-approve, complete workflow immediately
  if (isAutoApprove) {
    // Create package assignment
    try {
      const assignment = await createPackageAssignment({
        preHireId: preHireId,
        employeeId: employeeId,
        packageVersionId: packageVersion.id,
        assignedBy: options.requester,
        notes: `Auto-approved: ${options.notes || 'Standard package'}`,
      });
      packageAssignmentId = assignment.id;
    } catch (error) {
      errors.push(
        `Failed to create package assignment: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Create Helix ticket
    helixTicketId = await createHelixTicket(approvalRequest);
    approvalRequest.helixTicketId = helixTicketId;

    console.log(
      `[ApprovalWorkflow] Auto-approved request ${approvalRequest.id} for ${employeeName}`
    );
  } else {
    // Manual approval: send email to approvers
    try {
      const approverEmail = await getApproverEmail(
        options.package.approverIds[0]
      );
      const approverName = await getApproverName(
        options.package.approverIds[0]
      );

      approvalRequest.currentApprover = approverName;
      approvalRequest.currentApproverEmail = approverEmail;

      // Generate and send approval email
      const email = generateApprovalRequestEmail(
        options.preHire || ({} as PreHire), // Placeholder if employee
        options.package,
        approvalRequest,
        { approverName, approverEmail }
      );

      // TODO: Get access token for email sending
      const accessToken = ''; // Placeholder
      const result = await sendEmail(email, accessToken);

      if (result.success) {
        emailSent = true;
        emailMessageId = result.messageId;
        approvalRequest.sentEmailDate = new Date();
        approvalRequest.emailMessageId = emailMessageId;
      } else {
        errors.push(`Failed to send approval email: ${result.error}`);
      }

      console.log(
        `[ApprovalWorkflow] Sent approval request ${approvalRequest.id} to ${approverName}`
      );
    } catch (error) {
      errors.push(
        `Failed to send approval email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    approvalRequest,
    wasAutoApproved: isAutoApprove,
    emailSent,
    emailMessageId,
    helixTicketId,
    packageAssignmentId,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================================================
// APPROVAL DECISION PROCESSING
// ============================================================================

/**
 * Process approval decision (approve or reject)
 *
 * **Workflow**:
 * 1. Update approval request status
 * 2. If approved:
 *    - Create package assignment
 *    - Create Helix ticket
 *    - Send confirmation email
 * 3. If rejected:
 *    - Send rejection email
 *
 * @example
 * await processApprovalDecision({
 *   approvalRequestId: "apr-123",
 *   decision: "approved",
 *   decidedBy: "Steve Sanderson",
 *   decidedByEmail: "steve.sanderson@momentumww.com",
 *   decisionDate: new Date()
 * });
 */
export async function processApprovalDecision(
  decision: ApprovalDecision
): Promise<{ success: boolean; helixTicketId?: string; errors?: string[] }> {
  const errors: string[] = [];

  // Find approval request
  const approvalRequest = approvalRequests.find(
    (req) => req.id === decision.approvalRequestId
  );

  if (!approvalRequest) {
    throw new Error(
      `Approval request not found: ${decision.approvalRequestId}`
    );
  }

  // Update status
  approvalRequest.status = decision.decision;
  approvalRequest.approvalDate = decision.decisionDate;
  approvalRequest.approvedBy =
    decision.decision === 'approved' ? decision.decidedBy : undefined;
  approvalRequest.rejectedBy =
    decision.decision === 'rejected' ? decision.decidedBy : undefined;
  approvalRequest.rejectionReason = decision.rejectionReason;

  let helixTicketId: string | undefined;

  if (decision.decision === 'approved') {
    // Create package assignment
    if (approvalRequest.packageVersionId) {
      try {
        await createPackageAssignment({
          preHireId: approvalRequest.preHireId,
          employeeId: approvalRequest.employeeId,
          packageVersionId: approvalRequest.packageVersionId,
          assignedBy: decision.decidedBy,
          notes: `Approved by ${decision.decidedBy}`,
        });
      } catch (error) {
        errors.push(
          `Failed to create package assignment: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create Helix ticket
    helixTicketId = await createHelixTicket(approvalRequest);
    approvalRequest.helixTicketId = helixTicketId;

    // Send confirmation email
    try {
      // TODO: Load PreHire/Employee and Package for email generation
      // const email = generateConfirmationEmail(...);
      // await sendEmail(email, accessToken);
      console.log(
        `[ApprovalWorkflow] Approval confirmed for ${approvalRequest.id}`
      );
    } catch (error) {
      errors.push(
        `Failed to send confirmation email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Send rejection email
    try {
      // TODO: Load PreHire/Employee and Package for email generation
      // const email = generateRejectionEmail(...);
      // await sendEmail(email, accessToken);
      console.log(
        `[ApprovalWorkflow] Approval rejected for ${approvalRequest.id}`
      );
    } catch (error) {
      errors.push(
        `Failed to send rejection email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    success: errors.length === 0,
    helixTicketId,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================================================
// HELIX TICKET CREATION (Placeholder)
// ============================================================================

/**
 * Create Helix ticket for equipment provisioning
 *
 * NOTE: This is a placeholder. Actual implementation requires:
 * - Helix API integration
 * - Ticket creation endpoint
 * - Authentication
 *
 * @example
 * const ticketId = await createHelixTicket(approvalRequest);
 * console.log("Helix ticket created:", ticketId);
 */
async function createHelixTicket(
  approvalRequest: ApprovalRequest
): Promise<string> {
  // TODO: Implement Helix API integration
  // POST https://helix.momentumww.com/api/tickets
  // Body: {
  //   type: "equipment",
  //   employeeName: approvalRequest.employeeName,
  //   requestedBy: approvalRequest.requester,
  //   priority: "medium",
  //   description: "Equipment provisioning request...",
  //   equipmentItems: approvalRequest.items
  // }

  const ticketId = `hx-${Date.now()}`;
  console.log(
    `[ApprovalWorkflow] Created Helix ticket ${ticketId} for ${approvalRequest.employeeName}`
  );
  return ticketId;
}

// ============================================================================
// APPROVER LOOKUP (Placeholder)
// ============================================================================

/**
 * Get approver email by user ID
 * TODO: Integrate with Active Directory / Azure AD
 */
async function getApproverEmail(userId: string): Promise<string> {
  // Placeholder: Map user IDs to emails
  const approverMap: Record<string, string> = {
    'steve.sanderson': 'steve.sanderson@momentumww.com',
    patricia: 'patricia@momentumww.com',
  };

  return approverMap[userId] || 'approver@momentumww.com';
}

/**
 * Get approver name by user ID
 * TODO: Integrate with Active Directory / Azure AD
 */
async function getApproverName(userId: string): Promise<string> {
  // Placeholder: Map user IDs to names
  const approverMap: Record<string, string> = {
    'steve.sanderson': 'Steve Sanderson',
    patricia: 'Patricia',
  };

  return approverMap[userId] || 'Approver';
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all pending approval requests
 */
export function getPendingApprovalRequests(): ApprovalRequest[] {
  return approvalRequests.filter((req) => req.status === 'pending');
}

/**
 * Get approval requests by approver
 */
export function getApprovalRequestsByApprover(
  approverId: string
): ApprovalRequest[] {
  return approvalRequests.filter((req) =>
    req.approverIds?.includes(approverId)
  );
}

/**
 * Get approval requests by pre-hire
 */
export function getApprovalRequestsByPreHire(
  preHireId: string
): ApprovalRequest[] {
  return approvalRequests.filter((req) => req.preHireId === preHireId);
}

/**
 * Get approval requests by employee
 */
export function getApprovalRequestsByEmployee(
  employeeId: string
): ApprovalRequest[] {
  return approvalRequests.filter((req) => req.employeeId === employeeId);
}

/**
 * Get single approval request by ID
 */
export function getApprovalRequestById(
  id: string
): ApprovalRequest | undefined {
  return approvalRequests.find((req) => req.id === id);
}

// ============================================================================
// REMINDER & ESCALATION
// ============================================================================

/**
 * Send reminder email for pending approval
 */
export async function sendApprovalReminder(
  approvalRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const approvalRequest = getApprovalRequestById(approvalRequestId);

  if (!approvalRequest) {
    return { success: false, error: 'Approval request not found' };
  }

  if (approvalRequest.status !== 'pending') {
    return { success: false, error: 'Approval request is not pending' };
  }

  // TODO: Send reminder email
  console.log(`[ApprovalWorkflow] Sending reminder for ${approvalRequestId}`);

  approvalRequest.reminderSentDate = new Date();

  return { success: true };
}

/**
 * Escalate approval request to higher authority
 */
export async function escalateApprovalRequest(
  approvalRequestId: string,
  escalateTo: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const approvalRequest = getApprovalRequestById(approvalRequestId);

  if (!approvalRequest) {
    return { success: false, error: 'Approval request not found' };
  }

  if (approvalRequest.status !== 'pending') {
    return { success: false, error: 'Approval request is not pending' };
  }

  // Update escalation fields
  approvalRequest.escalatedTo = escalateTo;
  approvalRequest.escalationDate = new Date();
  approvalRequest.escalationReason = reason;

  // TODO: Send escalation email
  console.log(
    `[ApprovalWorkflow] Escalated ${approvalRequestId} to ${escalateTo}`
  );

  return { success: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createApprovalRequest,
  processApprovalDecision,
  getPendingApprovalRequests,
  getApprovalRequestsByApprover,
  getApprovalRequestsByPreHire,
  getApprovalRequestsByEmployee,
  getApprovalRequestById,
  sendApprovalReminder,
  escalateApprovalRequest,
};
