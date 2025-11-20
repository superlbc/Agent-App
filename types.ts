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
  status: "available" | "assigned" | "maintenance" | "retired";
  serialNumber?: string;
  purchaseDate?: Date;
  cost?: number;
}

/**
 * Software license assignment
 * Tracks individual license assignments to employees
 */
export interface LicenseAssignment {
  id: string;
  licenseId: string;
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
 * Software license item
 * Represents applications, subscriptions, and concurrent licenses
 * Now includes license pool tracking for availability management
 */
export interface Software {
  id: string;
  name: string;
  vendor: string;
  licenseType: "perpetual" | "subscription" | "concurrent";
  requiresApproval: boolean;
  approver?: string; // e.g., "Steve Sanderson", "Patricia", "Auto"
  cost: number;
  renewalFrequency?: "monthly" | "annual";
  seatCount?: number; // Total number of seats available (for concurrent/subscription licenses)
  description?: string;

  // License Pool Tracking (Phase 2 - NEW)
  assignedSeats?: number; // Number of seats currently assigned
  assignments?: LicenseAssignment[]; // Individual license assignments
  // availableSeats is calculated: seatCount - assignedSeats

  // License Lifecycle (Phase 2 - NEW)
  renewalDate?: Date; // Next renewal date for subscriptions
  purchaseDate?: Date; // Original purchase date
  vendorContact?: string; // Vendor sales/support contact
  internalContact?: string; // Internal license administrator
  autoRenew?: boolean; // Auto-renewal enabled
}

/**
 * Equipment package definition
 * Pre-configured bundles of hardware + software for specific roles
 * Example: "XD Designer Standard Package"
 */
export interface Package {
  id: string;
  name: string; // e.g., "XD Designer Standard"
  description: string;
  roleTarget: string[]; // e.g., ["XD Designer", "Motion Designer"]
  departmentTarget: string[]; // e.g., ["Creative", "IPTC"]
  hardware: Hardware[];
  software: Software[];
  licenses: Software[];
  isStandard: boolean; // true = auto-approve, false = SVP approval
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Pre-hire candidate record
 * Tracks candidates from offer acceptance through start date
 * Note: Salary data intentionally excluded (maintained in Camille's Excel)
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
  linkedEmployeeId?: string; // Manual link to Vantage/AD
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
 * Approval request
 * Tracks equipment/software approval workflow
 * Standard packages auto-approve, exceptions route to SVP
 */
export interface ApprovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestType: "equipment" | "software" | "exception" | "mid-employment";
  items: (Hardware | Software)[];
  packageId?: string;
  requester: string;
  requestDate: Date;
  approver: string; // "Auto", "Steve Sanderson", "Patricia"
  status: "pending" | "approved" | "rejected" | "cancelled";
  helixTicketId?: string;
  automatedDecision: boolean; // true for standard packages
  approvalDate?: Date;
  rejectionReason?: string;
  notes?: string;
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
