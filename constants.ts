// ============================================================================
// EMPLOYEE ONBOARDING SYSTEM - CONSTANTS
// ============================================================================
// Expanded in Phase 4 with comprehensive role definitions and catalog data

// ============================================================================
// ORGANIZATIONAL DATA
// ============================================================================

// Department list (can be expanded or loaded dynamically from Power Platform)
export const DEPARTMENTS = [
  'Creative',
  'Global Technology',
  'IP & CT',
  'IPTC',
  'Strategy',
  'STR',
  'Project Management',
  'PM',
  'Finance',
  'Human Resources',
  'Operations',
  'Business Leadership',
  'Account Management',
  'Production',
] as const;

// Comprehensive roles list across all departments
export const ROLES = [
  // Creative Roles
  'XD Designer',
  'Senior XD Designer',
  'Lead XD Designer',
  'Motion Designer',
  'Senior Motion Designer',
  'Graphic Designer',
  'Art Director',
  'Creative Director',
  'Copywriter',
  'Senior Copywriter',
  'Content Strategist',

  // Technology Roles
  'Developer',
  'Senior Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer',
  'DevOps Engineer',
  'Data Engineer',
  'Solutions Architect',
  'Technical Lead',

  // Project Management Roles
  'Project Manager',
  'Senior Project Manager',
  'Program Manager',
  'Scrum Master',
  'Agile Coach',
  'Delivery Manager',

  // Strategy & Planning Roles
  'Strategist',
  'Senior Strategist',
  'Business Analyst',
  'Senior Business Analyst',
  'Data Analyst',
  'UX Researcher',
  'Market Researcher',

  // Account & Business Roles
  'Account Executive',
  'Account Director',
  'Account Manager',
  'Client Partner',
  'Business Development Manager',

  // Operations & Support Roles
  'Operations Manager',
  'Finance Analyst',
  'HR Generalist',
  'Recruiter',
  'Office Manager',
  'Executive Assistant',

  // Production Roles
  'Producer',
  'Senior Producer',
  'Production Manager',
  'Print Producer',
  'Digital Producer',
] as const;

// Pre-hire status options
export const PRE_HIRE_STATUSES = [
  'candidate',    // Interview stage
  'offered',      // Offer extended, awaiting acceptance
  'accepted',     // Offer accepted, preparing for start
  'linked',       // Linked to employee record in Vantage/AD
  'cancelled',    // Offer declined or position cancelled
] as const;

// Onboarding status options
export const ONBOARDING_STATUSES = [
  'pre-hire',
  'systems-created',
  'equipment-assigned',
  'active',
] as const;

// Approval status options
export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
] as const;

// Equipment types
export const EQUIPMENT_TYPES = [
  'computer',
  'monitor',
  'keyboard',
  'mouse',
  'dock',
  'headset',
  'accessory',
] as const;

// Freeze period dates (Workday freeze: Nov 1 - Jan 5)
export const FREEZE_PERIOD_START = { month: 11, day: 1 }; // November 1
export const FREEZE_PERIOD_END = { month: 1, day: 5 };    // January 5

// ============================================================================
// UI CONFIGURATION
// ============================================================================

// Status badge configuration for pre-hires
export const PRE_HIRE_STATUS_CONFIG = {
  candidate: {
    label: 'Candidate',
    color: 'gray',
    icon: 'user',
    description: 'Interview stage',
  },
  offered: {
    label: 'Offered',
    color: 'blue',
    icon: 'mail',
    description: 'Offer extended, awaiting acceptance',
  },
  accepted: {
    label: 'Accepted',
    color: 'green',
    icon: 'check-circle',
    description: 'Offer accepted, preparing for start',
  },
  linked: {
    label: 'Linked',
    color: 'purple',
    icon: 'link',
    description: 'Linked to employee record',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    icon: 'x-circle',
    description: 'Offer declined or position cancelled',
  },
} as const;

// Status badge configuration for onboarding
export const ONBOARDING_STATUS_CONFIG = {
  'pre-hire': {
    label: 'Pre-hire',
    color: 'gray',
    icon: 'clock',
    description: 'Awaiting start date',
  },
  'systems-created': {
    label: 'Systems Created',
    color: 'blue',
    icon: 'server',
    description: 'AD, Vantage, Workday accounts created',
  },
  'equipment-assigned': {
    label: 'Equipment Assigned',
    color: 'yellow',
    icon: 'package',
    description: 'Equipment provisioned and assigned',
  },
  'active': {
    label: 'Active',
    color: 'green',
    icon: 'check',
    description: 'Onboarding complete, employee active',
  },
} as const;

// Status badge configuration for approvals
export const APPROVAL_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    icon: 'clock',
    description: 'Awaiting approval',
  },
  approved: {
    label: 'Approved',
    color: 'green',
    icon: 'check',
    description: 'Request approved',
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: 'x',
    description: 'Request rejected',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    icon: 'x-circle',
    description: 'Request cancelled',
  },
} as const;

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
] as const;

// Task categories (stakeholders)
export const TASK_CATEGORIES = [
  { value: 'hr', label: 'HR', icon: 'users', color: 'purple' },
  { value: 'it', label: 'IT', icon: 'server', color: 'blue' },
  { value: 'manager', label: 'Manager', icon: 'user', color: 'green' },
  { value: 'employee', label: 'Employee', icon: 'person', color: 'yellow' },
] as const;

// Common hiring managers (pre-populated for quick selection)
export const COMMON_HIRING_MANAGERS = [
  'Sarah Johnson',
  'Steve Sanderson',
  'Patricia Martinez',
  'John Davis',
  'Mark Johnson',
  'Lisa Anderson',
  'Michael Roberts',
  'Jennifer Thompson',
  'David Wilson',
  'Emily Rodriguez',
] as const;

// Approval routing configuration
export const APPROVAL_ROUTING = {
  standard: {
    label: 'Standard Package',
    approver: 'Auto',
    requiresSVP: false,
    description: 'Automatically approved, sent directly to Helix for IT provisioning',
  },
  exception: {
    label: 'Exception Request',
    approver: 'SVP (Patricia/Steve)',
    requiresSVP: true,
    description: 'Requires SVP approval before Helix ticket creation',
  },
} as const;

// API Configuration
export const DEFAULT_API_CONFIG = {
  hostname: 'interact.interpublic.com',
  clientId: import.meta.env.CLIENT_ID || '',
  clientSecret: import.meta.env.CLIENT_SECRET || '',
  notesAgentId: import.meta.env.DEFAULT_BOT_ID || '',
  interrogationAgentId: import.meta.env.DEFAULT_BOT_ID || '',
};
