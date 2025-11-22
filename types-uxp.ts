// ============================================================================
// UXP (Unified Experience Platform) - TYPE DEFINITIONS
// ============================================================================
// Event management system types for UXP platform

/**
 * Client entity
 * Represents a client organization (e.g., Verizon, AMEX, Coca-Cola)
 */
export interface Client {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  brandscopicEnabled: boolean;
  qrTigerEnabled: boolean;
  qualtricsEnabled: boolean;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Program (Master Program)
 * Represents a campaign or program under a client
 */
export interface Program {
  id: string;
  clientId: string;
  name: string;
  code: string;
  region?: string;
  eventType: string;
  status: 'active' | 'inactive' | 'archived';
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Event
 * Represents a single event day (multi-day events create multiple Event records)
 */
export interface UXPEvent {
  id: string;
  masterProgramId: string;
  brandscopicProjectId?: string;

  // Event Details
  eventName: string;
  eventDate: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format

  // Location
  venueName: string;
  venueType: 'indoor' | 'outdoor' | 'virtual';
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  geoLat?: number;
  geoLng?: number;

  // Ownership
  businessLeaderId: string;
  projectLeaderId: string;
  fieldManagerId?: string;

  // Status
  status: 'planned' | 'tentative' | 'confirmed' | 'active' | 'completed' | 'cancelled';

  // Sync Status
  brandscopicSyncStatus: 'pending' | 'synced' | 'failed';
  brandscopicLastSync?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastUpdatedBy: string;
}

/**
 * Event Recap
 * Post-event data submission
 */
export interface EventRecap {
  id: string;
  eventId: string;

  // Submission Info
  submittedById: string;
  submittedAt: Date;

  // Approval Info
  status: 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedAt?: Date;
  rejectionReason?: string;

  // Common Metrics
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  footprintDescription: string;
  qrScans: number;
  surveysCollected: number;

  // Client-Specific Metrics (JSON)
  clientMetrics: Record<string, any>;

  // Feedback
  eventFeedback: {
    baPerformance?: string;
    salesTeam?: string;
    customerComments?: string;
    trafficFlow?: string;
    attendeeDemographics?: string;
    wouldReturn: boolean;
  };

  // Photos
  photos: EventPhoto[];

  additionalComments?: string;

  // Sync to MOMO BI
  momoSyncStatus: 'pending' | 'synced' | 'failed';
  momoLastSync?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event Photo
 */
export interface EventPhoto {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Premium Distribution
 */
export interface PremiumDistribution {
  id: string;
  eventRecapId: string;
  premiumType: string;
  quantityDistributed: number;
  quantityRemaining?: number;
  createdAt: Date;
}

/**
 * QR Code
 */
export interface QRCode {
  id: string;
  qrTigerId: string;
  name: string;
  url: string;
  qrCodeImageUrl: string;
  status: 'active' | 'inactive';
  eventAssociations: EventQRAssociation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Event QR Association
 */
export interface EventQRAssociation {
  id: string;
  qrCodeId: string;
  eventId: string;
  isActive: boolean;
  scansCount: number;
  createdAt: Date;
}

/**
 * Survey
 */
export interface Survey {
  id: string;
  qualtricsSurveyId: string;
  name: string;
  eventId: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * User
 */
export interface UXPUser {
  id: string;
  azureAdId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'business_leader' | 'project_manager' | 'field_manager' | 'brand_ambassador';
  clientIds: string[]; // Access to specific clients (empty = all)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Event filters for EventList
 */
export interface EventFilters {
  clientId?: string;
  programId?: string;
  status?: UXPEvent['status'];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Event statistics for dashboard
 */
export interface EventStatistics {
  totalEvents: number;
  confirmedEvents: number;
  pendingRecaps: number;
  completedRecaps: number;
  upcomingEvents: number;
  activeEvents: number;
}

/**
 * Calendar event (simplified view for calendar widget)
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: UXPEvent['status'];
  color?: string;
}
