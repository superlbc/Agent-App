// ============================================================================
// EMPLOYEE ONBOARDING SYSTEM - TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// INFRASTRUCTURE TYPES (Preserved from original app)
// ============================================================================

/**
 * Microsoft Graph API user data
 * Used for user profile enrichment and authentication
 */
export interface GraphData {
  id?: string;               // Graph API user ID
  displayName?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  mail?: string;
  photoUrl?: string;
}

/**
 * Toast notification state
 * Used for success/error messages throughout the app
 */
export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

/**
 * Authentication token management
 * Used for API authentication and token caching
 */
export interface AuthToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * API Configuration
 * Used for backend service integration and AI agent communication (optional)
 */
export interface ApiConfig {
  hostname: string;
  clientId: string;
  clientSecret: string;
  notesAgentId?: string;
  interrogationAgentId?: string;
}

/**
 * Stakeholder/User reference
 * Used for tracking hiring managers, approvers, and employee relationships
 */
export interface Participant {
  id: string;
  displayName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  photoUrl?: string;
  graphId?: string;
  isExternal?: boolean;
  source?: 'manual' | 'graph' | 'database' | 'transcript' | 'csv' | 'emailList' | 'meeting';
}

// ============================================================================
// ONBOARDING SYSTEM - CORE DATA MODEL
// ============================================================================

/**
 * Hardware inventory item
 * Represents physical equipment (computers, monitors, accessories)
 *
 * **Phase 4: Hardware Superseding**
 * Hardware items form a superseding chain (e.g., MacBook M3 → M4 → M5)
 * When new hardware supersedes old hardware:
 * - Old hardware gets `supersededById` set to new hardware's ID
 * - Packages automatically update to use new hardware
 * - Existing assignments remain unchanged (versioning prevents retroactive changes)
 *
 * **Example**:
 * - MacBook Pro M3 (id: hw-mbp-m3) created → Used in packages
 * - MacBook Pro M4 (id: hw-mbp-m4) created → Supersedes M3
 * - MacBook M3.supersededById = "hw-mbp-m4"
 * - Packages auto-update to use M4 (creates new version)
 * - Pre-hires assigned to old version still get M3 (as promised)
 */
export interface Hardware {
  id: string;
  type: "computer" | "monitor" | "keyboard" | "mouse" | "dock" | "headset" | "accessory";
  model: string;
  manufacturer: string;
  specifications?: {
    processor?: string;
    ram?: string;
    storage?: string;
    screenSize?: string;
    connectivity?: string;
  };
  // Phase 4: Hardware Superseding
  supersededById?: string; // ID of hardware that replaces this item
  purchaseDate?: Date;
  cost?: number;
  // Phase 2: Cost Calculation Fix
  costFrequency?: "one-time" | "subscription"; // Differentiates hardware (one-time) from software subscriptions (monthly/annual)
}

/**
 * Software license assignment
 * Tracks individual license assignments to employees
 *
 * **Phase 10: License Pool Separation**
 * Updated to reference LicensePool instead of Software directly
 */
export interface LicenseAssignment {
  id: string;
  licensePoolId: string; // FK to LicensePool.id (new architecture)
  /** @deprecated Use licensePoolId instead */
  licenseId?: string; // Legacy FK to Software.id (for backward compatibility)
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  assignedDate: Date;
  assignedBy: string;
  expirationDate?: Date;
  notes?: string;
  status: "active" | "expired" | "revoked";
}

/**
 * License Pool
 * Phase 10: NEW - Separated from Software interface for clarity
 *
 * **Purpose**: Tracks license inventory with seat counts and assignments
 *
 * **Key Design Decision**: Separated from Software Catalog
 * - Software = "What software exists in our organization?" (catalog)
 * - LicensePool = "How many seats do we own? Who's using them?" (inventory)
 * - LicenseAssignment = "Individual seat assignments" (provisioning)
 *
 * **Benefits of Separation**:
 * - ✅ Clarity: No confusion about catalog vs inventory
 * - ✅ Flexibility: Software can exist WITHOUT a license pool (e.g., free/open-source tools)
 * - ✅ Multiple pools: Same software, different tiers/regions
 * - ✅ Accurate costing: Package costs from Software.cost, utilization from LicensePool
 *
 * **Example**:
 * ```
 * Software: { id: "sw-adobe-cc-001", name: "Adobe CC", cost: 54.99 }
 * LicensePool: { softwareId: "sw-adobe-cc-001", totalSeats: 10, assignedSeats: 3 }
 * ```
 */
export interface LicensePool {
  id: string;
  softwareId: string; // FK to Software.id (which software this pool is for)

  // Pool Sizing
  totalSeats: number; // Total licenses purchased
  assignedSeats: number; // Currently assigned (calculated from assignments.length)
  // availableSeats is calculated: totalSeats - assignedSeats

  // License Type
  licenseType: "perpetual" | "subscription" | "concurrent";

  // Lifecycle
  purchaseDate?: Date; // When licenses were purchased
  renewalDate?: Date; // Next renewal date for subscriptions
  renewalFrequency?: "monthly" | "annual";
  autoRenew: boolean; // Auto-renewal enabled

  // Contacts
  vendorContact?: string; // Vendor sales/support contact
  internalContact?: string; // Internal license administrator

  // Tracking
  assignments: LicenseAssignment[]; // Individual seat assignments

  // Metadata
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Software license item
 * Represents applications, subscriptions, and concurrent licenses
 *
 * **Phase 10: License Pool Separation**
 * This is now a PURE CATALOG - license inventory moved to LicensePool
 * Deprecated fields marked for removal after migration
 */
export interface Software {
  id: string;
  name: string;
  vendor: string;
  licenseType: "perpetual" | "subscription" | "concurrent";
  requiresApproval: boolean;
  approver?: string; // e.g., "Steve Sanderson", "Patricia", "Auto"
  cost: number;
  // Phase 2: Cost Calculation Fix
  costFrequency?: "one-time" | "monthly" | "annual"; // For accurate cost calculation
  description?: string;

  // ============================================================================
  // DEPRECATED FIELDS - Use LicensePool instead (Phase 10)
  // ============================================================================
  // These fields will be removed after migration to LicensePool architecture
  // For backward compatibility during migration only

  /** @deprecated Use LicensePool.totalSeats instead */
  seatCount?: number;
  /** @deprecated Use LicensePool.assignedSeats instead */
  assignedSeats?: number;
  /** @deprecated Use LicensePool.assignments instead */
  assignments?: LicenseAssignment[];
  /** @deprecated Use LicensePool.renewalDate instead */
  renewalDate?: Date;
  /** @deprecated Use LicensePool.renewalFrequency instead */
  renewalFrequency?: "monthly" | "annual";
  /** @deprecated Use LicensePool.purchaseDate instead */
  purchaseDate?: Date;
  /** @deprecated Use LicensePool.vendorContact instead */
  vendorContact?: string;
  /** @deprecated Use LicensePool.internalContact instead */
  internalContact?: string;
  /** @deprecated Use LicensePool.autoRenew instead */
  autoRenew?: boolean;
}

/**
 * Package cost breakdown
 * Phase 2: Differentiates one-time hardware costs from recurring software costs
 */
export interface PackageCostBreakdown {
  oneTimeTotal: number;      // Total one-time hardware costs
  monthlyTotal: number;      // Total monthly software subscription costs
  annualTotal: number;       // Total annual software subscription costs
  firstYearTotal: number;    // oneTimeTotal + (monthlyTotal * 12) + annualTotal
  ongoingAnnualTotal: number; // (monthlyTotal * 12) + annualTotal (for year 2+)
}

/**
 * Role target specification for package matching
 * Phase 6: Multi-dimensional role targeting
 */
export interface RoleTarget {
  departmentGroup: string; // e.g., "Global Technology", "Creative Services"
  role: string; // e.g., "XD Designer", "Developer", "Project Manager"
  gradeGroup?: string; // Optional: e.g., "Management", "Individual Contributor"
  grade?: string; // Optional: e.g., "Senior", "Lead", "Principal"
}

/**
 * Equipment package definition
 * Pre-configured bundles of hardware + software for specific roles
 * Example: "XD Designer Standard Package"
 *
 * **Phase 6: Role-Based Package Assignment**
 * Packages now support multi-dimensional role targeting based on:
 * - Department Group (from DepartmentGroup.csv)
 * - Role (job title)
 * - Grade Group (optional - management vs IC)
 * - Grade (optional - senior, lead, principal)
 *
 * **Matching Logic**:
 * 1. User enters: Department Group + Role (required)
 * 2. System finds all packages matching both criteria
 * 3. If multiple matches → User selects from list
 * 4. If one match → Auto-assign
 * 5. If no match → Show all packages for manual selection
 *
 * **Example**:
 * - Role Target: { departmentGroup: "Creative Services", role: "XD Designer" }
 * - Matches: "XD Designer Standard", "XD Designer Premium"
 * - User chooses "Premium" → Assignment created
 */
/**
 * Approval email template
 * Phase 7: Customizable email templates for approval requests
 */
export interface ApprovalEmailTemplate {
  subject: string; // Email subject with placeholders: {packageName}, {candidateName}, {role}
  body: string; // Email body with placeholders
  cc?: string[]; // Optional CC recipients
}

export interface Package {
  id: string;
  name: string; // e.g., "XD Designer Standard"
  description: string;

  // Phase 6: Role-based targeting (replaces simple roleTarget/departmentTarget arrays)
  roleTargets: RoleTarget[]; // Multiple role combinations that can use this package
  osPreference?: "Windows" | "Mac" | "Either"; // Hardware OS preference

  // Legacy fields (deprecated - keep for backward compatibility)
  roleTarget?: string[]; // DEPRECATED: Use roleTargets instead
  departmentTarget?: string[]; // DEPRECATED: Use roleTargets instead

  hardware: Hardware[];
  software: Software[]; // Includes all software, subscriptions, and licenses

  // Phase 7: Configurable approval workflow
  approverIds: string[]; // Empty array = auto-approve, populated = requires approval from these users (emails or IDs)
  approvalEmailTemplate?: ApprovalEmailTemplate; // Custom email template for approval requests

  // Legacy approval field (deprecated)
  isStandard: boolean; // DEPRECATED: Use approverIds instead (true = [], false = [approvers])

  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Package Version snapshot
 * Immutable snapshot of a package's configuration at a specific point in time
 *
 * **Purpose**: Prevent retroactive changes to packages already assigned to pre-hires/employees
 *
 * **Workflow**:
 * 1. When a package is created, create initial PackageVersion (v1)
 * 2. When a package is assigned, link to specific PackageVersion (not Package)
 * 3. When a package is modified, create new PackageVersion (v2, v3, etc.)
 * 4. Existing assignments remain unchanged (linked to old version)
 * 5. New assignments use latest version
 *
 * **Example**:
 * - Package "XD Designer Standard" v1 assigned to pre-hire Jane (Nov 1)
 * - Package updated on Nov 15 (MacBook Pro M3 → M4) → creates v2
 * - Jane still gets M3 (assigned to v1)
 * - New pre-hire John (Nov 20) gets M4 (assigned to v2)
 */
export interface PackageVersion {
  id: string;
  packageId: string; // FK to Package.id
  versionNumber: number; // 1, 2, 3, etc. (auto-incremented)
  snapshotDate: Date; // When this version was created
  hardware: Hardware[]; // Snapshot of hardware at this version
  software: Software[]; // Snapshot of software at this version
  isStandard: boolean; // Snapshot of approval requirement
  createdBy: string; // Who created this version
  createdDate: Date;
  notes?: string; // Change notes (e.g., "Updated MacBook Pro M3 → M4")
}

/**
 * Package Assignment
 * Links a pre-hire or employee to a specific PackageVersion (not Package!)
 *
 * **Key Design Decision**: References PackageVersion, NOT Package
 * - This ensures assignments are immutable
 * - Changing a package doesn't retroactively affect existing assignments
 * - Each assignment gets the exact hardware/software promised at assignment time
 *
 * **Workflow**:
 * 1. HR assigns package to pre-hire → Create PackageAssignment with latest PackageVersion
 * 2. Package updated (new version created) → Existing assignments unaffected
 * 3. Query: "What hardware does Jane get?" → Lookup her PackageAssignment → Get PackageVersion → Return hardware snapshot
 *
 * **Example**:
 * - Jane assigned to "XD Designer Standard" v1 on Nov 1 (MacBook M3)
 * - Package updated to v2 on Nov 15 (MacBook M4)
 * - Jane's assignment still points to v1 → She gets M3 (as promised)
 */
export interface PackageAssignment {
  id: string;
  preHireId?: string; // FK to PreHire.id (if assigned to pre-hire)
  employeeId?: string; // FK to Employee.id (if assigned to employee)
  packageVersionId: string; // FK to PackageVersion.id (NOT Package.id!)
  assignedDate: Date; // When the assignment was made
  assignedBy: string; // Who made the assignment
  notes?: string; // Assignment notes (e.g., "Approved by hiring manager")
}

/**
 * Pre-hire candidate record
 * Tracks candidates from offer acceptance through start date
 * Note: Salary data intentionally excluded (maintained in Camille's Excel)
 *
 * **Phase 8: Employee Linking**
 * Pre-hire records can be linked to employee records from vw_Personnel.csv
 * - employeeId: FK to vw_Personnel Employee ID
 * - linkedDate: When the link was established
 * - linkConfidence: How the link was made (auto-match, manual selection, or verified by HR)
 */
export interface PreHire {
  id: string;
  candidateName: string;
  email?: string;
  role: string;
  department: string;
  startDate: Date;
  hiringManager: string;
  status: "candidate" | "offered" | "accepted" | "linked" | "cancelled";
  assignedPackage?: Package;
  customizations?: {
    addedHardware?: Hardware[];
    removedHardware?: Hardware[];
    addedSoftware?: Software[];
    removedSoftware?: Software[];
    reason?: string; // Explanation for customization
  };

  // Phase 8: Employee linking fields
  employeeId?: string; // FK to vw_Personnel Employee ID
  workdayId?: string; // Workday ID for pre-hires (before employee record created)
  linkedDate?: Date; // When pre-hire was linked to employee record
  linkConfidence?: "auto" | "manual" | "verified"; // How link was established

  // Legacy field (deprecated - use employeeId instead)
  linkedEmployeeId?: string; // DEPRECATED: Use employeeId instead

  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Employee record
 * Full employee data with system IDs and onboarding status
 */
export interface Employee {
  id: string; // From Vantage
  activeDirectoryId?: string;
  workdayId?: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'withdrawn' | 'pre-hire'; // From vw_personnel.csv
  startDate: Date;
  endDate?: Date;
  manager?: string;

  // Equipment tracking
  assignedPackage?: Package;
  actualHardware: Hardware[];
  actualSoftware: Software[];

  // Onboarding status
  preHireId?: string;
  onboardingStatus: "pre-hire" | "systems-created" | "equipment-assigned" | "active";
  onboardingPhases: {
    adCreated?: Date;
    vantageCreated?: Date;
    workdayCreated?: Date;
    equipmentOrdered?: Date;
    equipmentReceived?: Date;
    onboardingComplete?: Date;
  };

  // Freeze period handling (Nov - Jan 5)
  isPreloaded: boolean;
  needsPasswordReset: boolean;

  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Employee License Summary
 * Efficient view of all licenses assigned to an employee
 * Used for User License Assignments dashboard
 *
 * **Phase 2: NEW**
 */
export interface EmployeeLicenseSummary {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'withdrawn' | 'pre-hire';
  assignedLicenses: Array<{
    assignmentId: string;
    licensePoolId: string;
    licenseName: string;
    poolName: string;
    vendor: string;
    assignedDate: Date;
    assignedBy: string;
    expirationDate?: Date;
    status: 'active' | 'expired' | 'revoked';
    notes?: string;
  }>;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
}

/**
 * License Assignment History
 * Audit trail for license assignment actions
 * Tracks who did what and when for compliance
 *
 * **Phase 2: NEW**
 */
export interface LicenseAssignmentHistory {
  id: string;
  assignmentId: string; // FK to LicenseAssignment.id
  action: 'assigned' | 'revoked' | 'expired' | 'renewed';
  performedBy: string;
  performedAt: Date;
  reason?: string;
  notes?: string;
  previousStatus?: 'active' | 'expired' | 'revoked';
  newStatus?: 'active' | 'expired' | 'revoked';
}

/**
 * License Assignment Filters
 * Filter options for User License Assignments view
 *
 * **Phase 2: NEW**
 */
export interface LicenseAssignmentFilters {
  employeeStatus?: ('active' | 'inactive' | 'withdrawn' | 'pre-hire')[];
  licenseStatus?: ('active' | 'expired' | 'revoked')[];
  licensePoolIds?: string[];
  departments?: string[];
  roles?: string[];
  assignedDateFrom?: Date;
  assignedDateTo?: Date;
  expirationDateFrom?: Date;
  expirationDateTo?: Date;
  searchQuery?: string; // Search employee name or email
}

/**
 * Approval request
 * Tracks equipment/software approval workflow
 *
 * **Approval Flow**:
 * - Empty approverIds → Auto-approve (standard package)
 * - Populated approverIds → Email sent to approvers, wait for approval
 *
 * **Phase 7 Enhancements**:
 * - Linked to specific PackageVersion (not just Package)
 * - Tracks pre-hire assignment via preHireId
 * - Email tracking (sentEmailDate, emailMessageId)
 * - Escalation support
 */
export interface ApprovalRequest {
  id: string;

  // References
  preHireId?: string; // FK to PreHire.id (if for pre-hire onboarding)
  employeeId?: string; // FK to Employee.id (if for existing employee)
  employeeName: string;
  packageId?: string; // FK to Package.id (legacy, use packageVersionId)
  packageVersionId?: string; // FK to PackageVersion.id (Phase 3 integration)

  // Request details
  requestType: "equipment" | "software" | "exception" | "mid-employment";
  items: (Hardware | Software)[]; // Items being requested
  requester: string; // Name of person making request
  requesterEmail?: string; // Email of requester (for notifications)
  requestDate: Date;
  notes?: string; // Justification or additional notes

  // Approval workflow (Phase 7)
  approverIds: string[]; // Array of user IDs who can approve (empty = auto-approve)
  currentApprover?: string; // Name of current approver (for display)
  currentApproverEmail?: string; // Email of current approver
  status: "pending" | "approved" | "rejected" | "cancelled";
  automatedDecision: boolean; // true if auto-approved (empty approverIds)
  approvalDate?: Date;
  approvedBy?: string; // Name of person who approved
  rejectionReason?: string;
  rejectedBy?: string; // Name of person who rejected

  // Email tracking (Phase 7)
  sentEmailDate?: Date; // When approval email was sent
  emailMessageId?: string; // Email message ID (for tracking replies)
  responseDeadline?: Date; // Optional deadline for approval response
  reminderSentDate?: Date; // When reminder email was sent

  // Escalation
  escalatedTo?: string; // User ID if escalated to higher authority
  escalationDate?: Date;
  escalationReason?: string;

  // Helix integration
  helixTicketId?: string; // Created after approval

  // Legacy field (deprecated - use approverIds instead)
  /** @deprecated Use approverIds array instead */
  approver?: string; // "Auto", "Steve Sanderson", "Patricia"
}

/**
 * Helix IT ticket
 * Integration with Helix ticketing system for IT provisioning
 */
export interface HelixTicket {
  id: string;
  type: "new-hire" | "password-reset" | "termination" | "access-request" | "equipment";
  employeeId: string;
  employeeName: string;
  requestedBy: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdDate: Date;
  resolvedDate?: Date;
  assignedTo?: string;
  description: string;

  // Freeze period handling (Nov - Jan 5)
  scheduledAction?: "activate" | "deactivate";
  actionDate?: Date;

  // Equipment provisioning
  equipmentItems?: (Hardware | Software)[];
  approvalRequestId?: string;
}

/**
 * Onboarding task
 * Individual checklist item for HR, IT, Manager, or Employee
 */
export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: "hr" | "it" | "manager" | "employee";
  status: "pending" | "in-progress" | "completed" | "blocked";
  assignedTo: string;
  dueDate?: Date;
  completedDate?: Date;
  blockedReason?: string;
  order: number;
}

/**
 * Onboarding progress tracker
 * Tracks employee onboarding completion status and pending tasks
 */
export interface OnboardingProgress {
  employeeId: string;
  currentPhase: "pre-hire" | "systems-setup" | "equipment-provisioning" | "complete";
  percentComplete: number;
  completedSteps: string[];
  pendingTasks: OnboardingTask[];
  startDate: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  lastUpdated: Date;
}

/**
 * Freeze Period definition
 * Defines date ranges when Workday system updates are frozen
 * Example: Nov - Jan 5 annual freeze, or custom maintenance windows
 *
 * During freeze periods:
 * - Employee accounts are pre-loaded with scrubbed credentials
 * - Password resets handled manually via Helix tickets
 * - Start/end date changes require IT coordination
 */
export interface FreezePeriod {
  id: string;
  name: string; // e.g., "Annual Year-End Freeze", "Q2 Maintenance Window"
  description?: string; // e.g., "Workday is frozen for year-end processing"
  startDate: Date; // First day of freeze period
  endDate: Date; // Last day of freeze period (inclusive)
  isActive: boolean; // Currently active freeze period
  autoEmailEnabled: boolean; // Send automated emails for start/end date triggers
  emailTemplate: {
    startDateSubject: string; // Email subject for employee start dates
    startDateBody: string; // Email body template with placeholders
    endDateSubject: string; // Email subject for employee end dates
    endDateBody: string; // Email body template with placeholders
  };
  helixEmail: string; // Helix ticketing system email address
  ccRecipients: string[]; // CC recipients for automated emails (e.g., Camille, Payton)
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  modifiedBy: string;
}

/**
 * Freeze Period notification
 * Tracks scheduled emails for employee start/end dates during freeze periods
 */
export interface FreezePeriodNotification {
  id: string;
  freezePeriodId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  actionType: "start" | "end"; // Start date (password reset) or end date (termination)
  actionDate: Date; // Date when action is needed
  emailSent: boolean; // Has the email been sent?
  emailSentDate?: Date;
  emailSentBy?: string;
  helixTicketId?: string; // Linked Helix ticket if created
  status: "pending" | "sent" | "failed" | "cancelled";
  failureReason?: string;
  createdDate: Date;
}

/**
 * Hardware Refresh Schedule
 * Phase 9: Tracks hardware refresh eligibility and calendar
 *
 * **Purpose**: Manage hardware refresh lifecycle (typically 3 years for computers, 2 years for phones)
 *
 * **Workflow**:
 * 1. When hardware is assigned to employee, create RefreshSchedule record
 * 2. Calculate refreshEligibilityDate = assignedDate + refreshCycleYears
 * 3. Monitor refresh calendar for upcoming eligible hardware
 * 4. Generate notifications X months before eligibility
 * 5. Create approval requests for refresh equipment
 * 6. Track financial forecasting for upcoming refreshes
 *
 * **Example**:
 * - MacBook Pro assigned to Jane on 2022-01-01 (3-year cycle)
 * - Refresh eligibility date: 2025-01-01
 * - Notification: Sept 2024 (4 months advance notice)
 * - Finance forecast: Include $3,500 in Q1 2025 budget
 */
export interface RefreshSchedule {
  id: string;
  hardwareId: string; // FK to Hardware.id
  hardwareType: HardwareType; // Computer, monitor, etc.
  hardwareModel: string; // e.g., "MacBook Pro 16\" M3 Max"
  employeeId?: string; // FK to Employee.id (if assigned)
  employeeName?: string; // Employee name for display
  employeeEmail?: string; // Employee email
  assignedDate: Date; // When hardware was assigned
  refreshCycleYears: number; // 3 for computers, 2 for phones, etc.
  refreshEligibilityDate: Date; // Calculated: assignedDate + refreshCycleYears
  estimatedRefreshCost: number; // Estimated cost for budgeting
  status: "active" | "refresh-pending" | "refreshed" | "retired";
  notificationSent: boolean; // Advance notification sent?
  notificationSentDate?: Date;
  refreshRequestId?: string; // FK to ApprovalRequest if refresh requested
  refreshedDate?: Date; // When refresh was completed
  newHardwareId?: string; // FK to new Hardware.id after refresh
  notes?: string; // Additional notes
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Refresh Calendar Stats
 * Aggregated statistics for refresh calendar dashboard
 */
export interface RefreshCalendarStats {
  totalActiveAssets: number;
  eligibleThisQuarter: number;
  eligibleThisYear: number;
  refreshPendingCount: number;
  estimatedCostThisQuarter: number;
  estimatedCostThisYear: number;
  byHardwareType: Record<HardwareType, number>;
  byDepartment: Record<string, number>;
}

// ============================================================================
// HELPER TYPES & ENUMS
// ============================================================================

/**
 * Hardware types for filtering and categorization
 */
export type HardwareType = "computer" | "monitor" | "keyboard" | "mouse" | "dock" | "headset" | "accessory";

/**
 * Software license types
 */
export type LicenseType = "perpetual" | "subscription" | "concurrent";

/**
 * Approval workflow statuses
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

/**
 * Employee onboarding status stages
 */
export type OnboardingStatus = "pre-hire" | "systems-created" | "equipment-assigned" | "active";

/**
 * Pre-hire candidate status
 */
export type PreHireStatus = "candidate" | "offered" | "accepted" | "linked" | "cancelled";

/**
 * Helix ticket types
 */
export type HelixTicketType = "new-hire" | "password-reset" | "termination" | "access-request" | "equipment";

/**
 * Task categories for stakeholder assignment
 */
export type TaskCategory = "hr" | "it" | "manager" | "employee";

/**
 * Task status for progress tracking
 */
export type TaskStatus = "pending" | "in-progress" | "completed" | "blocked";

/**
 * Request types for approval workflow
 */
export type RequestType = "equipment" | "software" | "exception" | "mid-employment";

/**
 * Freeze period actions (Nov - Jan 5)
 */
export type FreezeAction = "activate" | "deactivate";

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Form state for pre-hire creation/editing
 */
export interface PreHireFormState {
  candidateName: string;
  email: string;
  role: string;
  department: string;
  startDate: Date | null;
  hiringManager: string;
  selectedPackage?: Package;
}

/**
 * Filter state for pre-hire list
 */
export interface PreHireFilters {
  status?: PreHireStatus[];
  department?: string[];
  role?: string[];
  startDateFrom?: Date;
  startDateTo?: Date;
  searchQuery?: string;
}

/**
 * Filter state for employee list
 */
export interface EmployeeFilters {
  onboardingStatus?: OnboardingStatus[];
  department?: string[];
  role?: string[];
  needsPasswordReset?: boolean;
  searchQuery?: string;
}

/**
 * Statistics for dashboard
 */
export interface OnboardingStatistics {
  totalPreHires: number;
  totalEmployees: number;
  pendingApprovals: number;
  activeOnboarding: number;
  completedThisMonth: number;
  freezePeriodActive: boolean;
  upcomingStartDates: Array<{ date: Date; count: number }>;
}

// ============================================================================
// LEGACY TYPES (For Phase 2 Compatibility - To Be Removed)
// ============================================================================
// These types support the old Meeting Notes Generator components
// They will be removed in Phase 2 when those components are deleted

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface FormState {
  title?: string;
  agenda?: string;
  transcript?: string;
  transcriptSource?: 'manual' | 'imported';
  importedMeetingName?: string;
  importedMeetingDate?: Date;
  userNotes?: string;
  tags?: string[];
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface Controls {
  focus_department?: string[];
  view?: string;
  critical_lens?: boolean;
  audience?: string;
  tone?: string;
  redact?: boolean;
  status_view?: string;
  meeting_date?: string;
  rag_mode?: string;
  use_icons?: boolean;
  bold_important_words?: boolean;
  meetingPreset?: string;
  meeting_coach?: boolean;
  coaching_style?: string;
  groupingMode?: string;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface AgentResponse {
  markdown?: string;
  next_steps?: NextStep[];
  coach_insights?: CoachInsights;
  suggested_questions?: string[];
  structured_data?: any;
  executive_summary?: string[];
  critical_review?: any;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface NextStep {
  department?: string;
  owner?: string;
  task?: string;
  due_date?: string;
  status?: string;
  status_notes?: string;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface CoachInsights {
  initiative?: string;
  style?: string;
  strengths?: string[];
  improvements?: string[];
  facilitation_tips?: string[];
  metrics?: {
    agenda_coverage?: number;
    decision_count?: number;
    action_count?: number;
    participant_diversity?: number;
  };
  flags?: {
    participation_imbalance?: boolean;
    many_unassigned?: boolean;
    few_decisions?: boolean;
  };
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface Payload {
  meeting_title?: string;
  agenda?: string[];
  transcript?: string;
  user_notes?: string;
  participants?: Participant[];
  controls?: Controls;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface InterrogationResponse {
  question: string;
  answer: string;
  emphasis?: any[];
  not_in_transcript: boolean;
  follow_up_suggestions: string[];
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface ChatMessage {
  question: string;
  answer?: string;
  emphasis?: any[];
  not_in_transcript?: boolean;
  follow_up_suggestions?: string[];
  isError?: boolean;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface CriticalThinkingRequest {
  line_text: string;
  line_context: string;
  workstream_name: string;
  full_transcript: string;
  meeting_title: string;
  meeting_purpose: string;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface CriticalThinkingAnalysis {
  strategic_context?: string;
  alternative_perspectives?: string[];
  probing_questions?: string[];
  risk_analysis?: string;
  connections?: string;
  actionable_insights?: string[];
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// ============================================================================

/**
 * User role enumeration
 * Defines all roles in the system with their access levels
 *
 * **Role Hierarchy** (ascending privilege):
 * 1. EMPLOYEE - View own data only
 * 2. HIRING_MANAGER - Create pre-hires for own team
 * 3. MANAGER - Approve team equipment requests
 * 4. IT - Manage hardware, process Helix tickets
 * 5. FINANCE - View costs, approve >$5K purchases
 * 6. HR - Create pre-hires, manage pre-hires, VIEW hardware/software (CANNOT create)
 * 7. DIRECTOR - Full HR access + create packages + all approvals
 * 8. ADMIN - Full system access + user management
 */
export type UserRole =
  | "EMPLOYEE"
  | "HIRING_MANAGER"
  | "MANAGER"
  | "IT"
  | "FINANCE"
  | "HR"
  | "DIRECTOR"
  | "ADMIN";

/**
 * Permission enumeration
 * Defines all granular permissions in the system
 *
 * **Naming Convention**: {ENTITY}_{ACTION}
 * - ENTITY: PreHire, Package, Hardware, Software, License, Employee, Approval, etc.
 * - ACTION: Create, Read, Update, Delete, Assign, Approve, Export, etc.
 */
export type Permission =
  // Pre-hire permissions
  | "PREHIRE_CREATE"
  | "PREHIRE_READ"
  | "PREHIRE_READ_OWN" // View only own team's pre-hires
  | "PREHIRE_UPDATE"
  | "PREHIRE_DELETE"
  | "PREHIRE_ASSIGN_PACKAGE"
  | "PREHIRE_LINK_EMPLOYEE"
  | "PREHIRE_EXPORT"

  // Package permissions
  | "PACKAGE_CREATE"
  | "PACKAGE_CREATE_STANDARD" // Create standard packages (auto-approve)
  | "PACKAGE_CREATE_EXCEPTION" // Create exception packages (require approval)
  | "PACKAGE_READ"
  | "PACKAGE_UPDATE"
  | "PACKAGE_DELETE"
  | "PACKAGE_ASSIGN"
  | "PACKAGE_EXPORT"

  // Hardware permissions
  | "HARDWARE_CREATE"
  | "HARDWARE_READ"
  | "HARDWARE_UPDATE"
  | "HARDWARE_DELETE"
  | "HARDWARE_ASSIGN"
  | "HARDWARE_MAINTENANCE"
  | "HARDWARE_RETIRE"
  | "HARDWARE_EXPORT"
  | "HARDWARE_VIEW_COST" // View hardware costs
  | "HARDWARE_REFRESH_VIEW" // View hardware refresh calendar

  // Software/License permissions
  | "SOFTWARE_CREATE"
  | "SOFTWARE_READ"
  | "SOFTWARE_UPDATE"
  | "SOFTWARE_DELETE"
  | "SOFTWARE_ASSIGN"
  | "SOFTWARE_REVOKE"
  | "SOFTWARE_VIEW_COST"
  | "LICENSE_CREATE"
  | "LICENSE_ASSIGN"
  | "LICENSE_RECLAIM"
  | "LICENSE_VIEW_UTILIZATION"

  // Employee permissions
  | "EMPLOYEE_READ"
  | "EMPLOYEE_READ_OWN" // View only own profile
  | "EMPLOYEE_READ_TEAM" // View own team's profiles
  | "EMPLOYEE_UPDATE"
  | "EMPLOYEE_UPDATE_OWN" // Update only own profile
  | "EMPLOYEE_DELETE"
  | "EMPLOYEE_EXPORT"

  // Approval permissions
  | "APPROVAL_CREATE"
  | "APPROVAL_READ"
  | "APPROVAL_APPROVE"
  | "APPROVAL_APPROVE_OWN_TEAM" // Approve only own team's requests
  | "APPROVAL_APPROVE_ALL" // Approve any request
  | "APPROVAL_REJECT"
  | "APPROVAL_CANCEL"
  | "APPROVAL_ESCALATE"

  // Freeze period permissions
  | "FREEZEPERIOD_CREATE"
  | "FREEZEPERIOD_READ"
  | "FREEZEPERIOD_UPDATE"
  | "FREEZEPERIOD_DELETE"
  | "FREEZEPERIOD_SEND_EMAIL"

  // Helix/IT permissions
  | "HELIX_CREATE_TICKET"
  | "HELIX_READ_TICKET"
  | "HELIX_UPDATE_TICKET"
  | "HELIX_CLOSE_TICKET"

  // Admin permissions
  | "ADMIN_USER_MANAGE" // Manage users and role assignments
  | "ADMIN_ROLE_MANAGE" // Create/edit roles
  | "ADMIN_PERMISSION_MANAGE" // Assign permissions to roles
  | "ADMIN_SYSTEM_CONFIG" // Configure system settings
  | "ADMIN_AUDIT_LOG" // View audit logs
  | "ADMIN_EXPORT_ALL"; // Export all data

/**
 * Role definition
 * Maps a role name to its display information and default permissions
 */
export interface Role {
  id: string;
  name: UserRole;
  displayName: string; // e.g., "Human Resources"
  description: string;
  permissions: Permission[]; // Default permissions for this role
  isSystemRole: boolean; // true for built-in roles, false for custom roles
  createdDate: Date;
  modifiedDate: Date;
}

/**
 * User role assignment
 * Links a user to one or more roles
 *
 * **Multi-role support**: Users can have multiple roles
 * Example: Luis could be both "IT" and "ADMIN"
 */
export interface UserRoleAssignment {
  id: string;
  userId: string; // Azure AD user ID or Employee ID
  userEmail: string;
  userName: string;
  roleId: string; // FK to Role.id
  roleName: UserRole;
  assignedBy: string; // Who assigned this role
  assignedDate: Date;
  expirationDate?: Date; // Optional: for temporary role assignments
  isActive: boolean;
}

/**
 * Permission check result
 * Response from hasPermission() helper function
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  roles: UserRole[]; // Roles that user has
  reason?: string; // Why permission was denied (for debugging)
}

/**
 * Role context state
 * Manages current user's roles and permissions
 */
export interface RoleContextState {
  currentUser?: {
    id: string;
    email: string;
    name: string;
  };
  userRoles: UserRoleAssignment[]; // User's assigned roles
  permissions: Permission[]; // Flattened list of all permissions from all roles
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// LEGACY TYPES (Preserved from Meeting Notes Generator)
// ============================================================================

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface CSVParticipant {
  name: string;
  email: string;
  department?: string;
  role?: string;
  acceptanceStatus?: string;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface ExtractedParticipant {
  extractedText?: string;
  normalizedName?: string;
  confidence?: 'high' | 'medium' | 'low';
  rawText?: string;
  parsedName?: string;
  isExternal?: boolean;
  email?: string;
  source?: string;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface PresenceData {
  availability: string;
  activity: string;
  lastUpdated?: number;
}

/**
 * @deprecated Legacy type from Meeting Notes Generator - will be removed in Phase 2
 */
export interface Department {
  code: string;
  name: string;
}

// ============================================================================
// EXTENDED PARTICIPANT TYPE (Legacy Meeting Properties)
// ============================================================================
// Temporarily extend Participant with legacy meeting-specific properties
// These will be removed when meeting components are deleted in Phase 2

declare module './types' {
  interface Participant {
    // Legacy meeting-specific properties
    extractedText?: string;
    matched?: boolean;
    matchConfidence?: 'high' | 'medium' | 'low';
    participantType?: 'internal' | 'external' | 'unknown';
    presence?: PresenceData;
    acceptanceStatus?: 'accepted' | 'declined' | 'tentative' | 'noResponse' | 'organizer';
    attendanceType?: 'required' | 'optional';
    attended?: boolean;
    attendanceDurationMinutes?: number;
    spokeInMeeting?: boolean;
    speakerMentionCount?: number;
    isSearching?: boolean;
    searchError?: string;
  }
}

// ============================================================================
// UXP FIELD MARKETING PLATFORM - EVENT MANAGEMENT TYPES
// ============================================================================

/**
 * Campaign
 * Represents a multi-event marketing campaign
 * Example: "Nike Air Max 2025 Launch Tour" with 50 events across US
 */
export interface Campaign {
  id: string;
  campaignName: string;
  campaignDescription?: string;
  client: string; // e.g., "Nike", "Coca-Cola"
  eventType: string; // e.g., "Product Launch", "Brand Activation", "Sampling"
  masterProgram?: string; // e.g., "Summer Tour 2025"
  region: string; // e.g., "North America", "EMEA", "APAC"
  status: "planning" | "active" | "completed" | "cancelled";
  year: number;
  month?: number;
  campaignOwner: string; // User ID or email of campaign owner
  campaignOwnerName?: string;

  // Financial tracking
  totalBudget?: number;
  spentToDate?: number;

  // Dates
  startDate?: Date;
  endDate?: Date;

  // Metadata
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  modifiedBy: string;

  // Stats (calculated)
  totalEvents?: number;
  completedEvents?: number;
  upcomingEvents?: number;
}

/**
 * Event
 * Individual event within a campaign
 * Example: "Nike Air Max Launch - Los Angeles" on specific date/venue
 */
export interface Event {
  id: string;
  campaignId: string; // FK to Campaign.id
  eventName: string;
  eventDetails?: string;

  // Dates
  eventStartDate: Date;
  eventEndDate: Date;

  // Location
  eventVenue: string; // Venue name (e.g., "Staples Center")
  city: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  // Logistics
  distanceFromOfficeMi?: number; // Distance from main office
  timeFromOfficeMins?: number; // Drive time from office

  // Ownership
  owner: string; // User ID or email of event owner
  ownerName?: string;
  status: "planning" | "confirmed" | "in-progress" | "completed" | "cancelled";

  // Team assignments
  peopleAssignments?: PeopleAssignment[];

  // Data capture
  qrCodes?: QRCode[];

  // Metadata
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  modifiedBy: string;
}

/**
 * Venue
 * Location/venue data with Placer.ai integration
 */
export interface Venue {
  id: string;
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  geoJSONData?: any; // GeoJSON polygon data

  // Placer.ai platform data
  platform?: string; // e.g., "Placer.ai"
  poiScope?: string; // Point of Interest scope
  category?: string; // Venue category (e.g., "Retail", "Sports", "Entertainment")
  tags?: string[]; // Venue tags for categorization
  url?: string; // Venue URL

  // Placer analytics
  placerData?: PlacerData[];

  // Metadata
  createdDate: Date;
  lastModified: Date;
}

/**
 * PlacerData
 * Footfall analytics from Placer.ai
 */
export interface PlacerData {
  id: string;
  venueId: string; // FK to Venue.id
  placerEntryId?: string; // Placer.ai's internal ID
  movementData?: any; // Footfall/movement analytics JSON
  url?: string; // Link to Placer.ai dashboard
  createdOn: Date;
}

/**
 * QRCode
 * Lead capture QR codes generated for events
 */
export interface QRCode {
  id: string;
  eventId: string; // FK to Event.id
  codeData: string; // QR code content (URL, text, etc.)
  generatedOn: Date;
  scanCount: number;

  // QRtiger integration
  qrtigerId?: string; // QRtiger's internal ID
  qrtigerStatus?: string; // e.g., "active", "disabled"

  // Metadata
  createdBy: string;
  lastModified: Date;
}

/**
 * PeopleAssignment
 * Team member assignments to events
 */
export interface PeopleAssignment {
  id: string;
  eventId: string; // FK to Event.id

  // User info
  userId: string; // Azure AD user ID or Employee ID
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userRole?: string; // Role in event (e.g., "Event Manager", "Field Manager", "Brand Ambassador")

  // On-site tracking
  onSite: boolean; // Will this person be on-site?

  // Manager info
  managerName?: string;
  managerEmail?: string;

  // Logistics
  distanceFromOffice?: number; // Distance from person's office to venue
  timeFromOffice?: number; // Travel time from person's office to venue

  // Metadata
  assignedBy: string;
  assignedDate: Date;
}

/**
 * Event filter state
 * Filters for event list/calendar/map views
 */
export interface EventFilters {
  campaigns?: string[]; // Filter by campaign IDs
  statuses?: ("planning" | "confirmed" | "in-progress" | "completed" | "cancelled")[];
  cities?: string[];
  countries?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  owners?: string[]; // Filter by owner user IDs
  searchQuery?: string; // Search event name or venue
}

/**
 * Event calendar data
 * Transformed data for react-big-calendar
 */
export interface CalendarEvent {
  id: string;
  title: string; // Event name
  start: Date;
  end: Date;
  resource?: {
    event: Event; // Original event object
    campaign: Campaign; // Associated campaign
    color: string; // Campaign color
  };
}

/**
 * Event map marker
 * Transformed data for Google Maps markers
 */
export interface EventMapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  event: Event;
  campaign: Campaign;
  color: string; // Campaign color for marker
}

/**
 * Event statistics
 * Dashboard statistics for events
 */
export interface EventStatistics {
  totalEvents: number;
  upcomingEvents: number;
  inProgressEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  eventsByCampaign: Record<string, number>;
  eventsByMonth: Record<string, number>;
  eventsByCity: Record<string, number>;
}
