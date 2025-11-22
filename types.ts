// ============================================================================
// UXP PLATFORM - TYPE DEFINITIONS
// ============================================================================
// Unified Experience Platform for experiential marketing campaign management

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
 * User/Stakeholder reference
 * Used for tracking campaign owners, event managers, and team assignments
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
  source?: 'manual' | 'graph' | 'database' | 'csv';
}

// ============================================================================
// UXP PLATFORM - CORE DATA MODEL
// ============================================================================

/**
 * Campaign
 * Top-level container for experiential marketing campaigns
 * Examples: "Verizon NFL Sponsorship 2025", "Coca-Cola Summer Tour", "AMEX Music Activation"
 */
export interface Campaign {
  id: string;
  campaignName: string;
  campaignDescription?: string;
  campaignNotes?: string;

  // Client & Classification
  client: string; // e.g., "AMEX", "Verizon", "Coca-Cola", "Constellation Brands"
  eventType: string; // e.g., "Sports Activation", "Music Festival", "Product Sampling"
  masterProgram?: string; // e.g., "NFL Sponsorship", "Summer Tour", "Brand Experience"
  region: string; // e.g., "Northeast", "Southeast", "Midwest", "West Coast", "National"

  // Status & Timeline
  status: "planning" | "active" | "completed" | "cancelled";
  year: number; // e.g., 2025
  month: number; // 1-12
  yearMonth: string; // e.g., "2025-06"

  // Ownership
  campaignOwner: string; // User ID or name
  campaignOwnerEmail: string;

  // Tracking
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;

  // Additional
  jobNumbers: string[]; // Associated job/project numbers
  visible: boolean; // Visibility flag for filtering
}

/**
 * Event
 * Individual activation event within a campaign
 * Examples: "Giants vs Cowboys - MetLife Stadium", "Lollapalooza Chicago Day 1"
 */
export interface Event {
  id: string;
  campaignId: string; // FK to Campaign.id

  // Event Details
  eventName: string;
  eventDetails?: string;
  eventNotes?: string;
  number?: string; // Event number within campaign
  index?: number; // Sort order

  // Dates & Timeline
  eventStartDate: Date;
  eventEndDate: Date;
  year: number;
  month: number;
  yearMonthStart: string; // e.g., "2025-06"
  yearMonthEnd: string;

  // Location
  eventVenue?: string; // Venue name
  city: string;
  country: string;
  postCode?: string;
  address1?: string;
  address2?: string;
  latitude?: number;
  longitude?: number;

  // Distance Calculations (from home office)
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;

  // Ownership & Status
  owner: string; // Event manager user ID
  ownerName: string;
  status: "planning" | "active" | "completed" | "cancelled";

  // Tracking
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;
}

/**
 * Venue
 * Physical location details for events
 * Enhanced with geocoding and venue metadata
 */
export interface Venue {
  id: string;
  eventId: string; // FK to Event.id

  // Venue Identity
  name: string;
  fullAddress?: string;
  formattedAddress?: string;

  // Address Components
  country: string;
  city: string;
  state?: string;
  stateCode?: string; // e.g., "NY", "CA"
  postCode?: string;
  address?: string;
  number?: string; // Street number

  // Geolocation
  latitude: number;
  longitude: number;
  geoJSONData?: string; // Full GeoJSON response

  // Venue Metadata
  platform?: string; // e.g., "Google Maps", "Azure Maps"
  poiScope?: string; // Point of Interest scope
  entityType?: string; // e.g., "Stadium", "Arena", "Convention Center"
  category?: string; // Venue category
  group?: string; // Venue group classification
  subCategory?: string;

  // Status & Verification
  status: "active" | "verified" | "archived";
  sentOn?: Date; // When venue data was sent/shared
  checkedOn?: Date; // Last verification date
  count?: number; // Usage count
  tags?: string[]; // Custom tags for filtering
  url?: string; // Venue website or info URL
}

/**
 * PeopleAssignment
 * Team member assignments to events
 * Tracks who is working on which events and their travel requirements
 */
export interface PeopleAssignment {
  id: string;
  eventId: string; // FK to Event.id

  // User Details
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userRole?: string; // e.g., "Brand Ambassador", "Event Manager", "Field Manager"

  // Assignment Details
  onSite: boolean; // Will person be on-site or remote?

  // Travel Calculations (from home office to event venue)
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;

  // Management Hierarchy
  managerName?: string;
  managerEmail?: string;
  managerRole?: string;

  // Assignment Metadata
  assignedByName: string;
  assignedByEmail: string;
  assignedOn: Date;
}

/**
 * QRCode
 * QR code tracking for event engagement and metrics
 * Integrates with QRTiger for scan tracking
 */
export interface QRCode {
  id: string;
  eventId: string; // FK to Event.id

  // QR Code Data
  codeData: string; // URL or data encoded in QR code
  generatedOn: Date;
  scanCount: number;

  // QRTiger Integration
  qrtigerId?: string; // QRTiger QR code ID
  qrtigerLastSync?: Date; // Last sync with QRTiger API
  qrtigerPath?: string; // QRTiger API path
  qrtigerStatus?: "active" | "paused" | "archived";
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

/**
 * UserRole definition
 * Defines roles and permissions for the UXP platform
 *
 * Role Hierarchy:
 * - admin: Full system access, user management
 * - agency-lead: Campaign creation, team management, financial oversight
 * - account-manager: Campaign management, client coordination
 * - event-manager: Event planning and execution
 * - field-manager: On-site team coordination
 * - brand-ambassador: Field execution, data collection
 * - operations: Logistics, venue coordination
 * - finance: Budget tracking, cost reporting
 * - read-only: View-only access for stakeholders
 */
export interface UserRole {
  id: string;
  name: string; // e.g., "admin", "agency-lead", "account-manager"
  displayName: string; // e.g., "Administrator", "Agency Lead"
  description: string;
  permissions: Permission[]; // Array of permission strings
}

/**
 * Permission types for UXP platform
 */
export type Permission =
  // Campaign permissions
  | "campaign.create"
  | "campaign.read"
  | "campaign.update"
  | "campaign.delete"
  | "campaign.export"

  // Event permissions
  | "event.create"
  | "event.read"
  | "event.update"
  | "event.delete"
  | "event.assign_people"
  | "event.export"

  // Venue permissions
  | "venue.create"
  | "venue.read"
  | "venue.update"
  | "venue.delete"
  | "venue.verify"

  // People permissions
  | "people.assign"
  | "people.view"
  | "people.manage"

  // QR Code permissions
  | "qrcode.generate"
  | "qrcode.view_analytics"
  | "qrcode.manage"

  // Financial permissions
  | "finance.view_costs"
  | "finance.manage_budgets"
  | "finance.export_reports"

  // Admin permissions
  | "admin.user_management"
  | "admin.role_management"
  | "admin.system_config";

/**
 * User role assignment
 * Links users to their roles in the system
 */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  roleName: string; // FK to UserRole.name
  assignedBy: string;
  assignedDate: Date;
  expirationDate?: Date;
  isActive: boolean;
}

// ============================================================================
// HELPER TYPES & ENUMS
// ============================================================================

/**
 * Campaign status values
 */
export type CampaignStatus = "planning" | "active" | "completed" | "cancelled";

/**
 * Event status values
 */
export type EventStatus = "planning" | "active" | "completed" | "cancelled";

/**
 * Venue status values
 */
export type VenueStatus = "active" | "verified" | "archived";

/**
 * QR code status values
 */
export type QRCodeStatus = "active" | "paused" | "archived";

/**
 * Common event types
 */
export type EventType =
  | "Sports Activation"
  | "Music Festival"
  | "Product Sampling"
  | "Brand Experience"
  | "Trade Show"
  | "Concert"
  | "Corporate Event"
  | "Pop-Up Store"
  | "Guerrilla Marketing"
  | "Street Team"
  | "Other";

/**
 * Geographic regions
 */
export type Region =
  | "Northeast"
  | "Southeast"
  | "Midwest"
  | "West Coast"
  | "Southwest"
  | "National"
  | "International";

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

/**
 * Campaign filter state
 */
export interface CampaignFilters {
  client?: string[];
  eventType?: string[];
  region?: string[];
  status?: CampaignStatus[];
  year?: number[];
  searchQuery?: string;
}

/**
 * Event filter state
 */
export interface EventFilters {
  campaignId?: string[];
  city?: string[];
  state?: string[];
  status?: EventStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

/**
 * People assignment filter state
 */
export interface PeopleFilters {
  eventId?: string[];
  department?: string[];
  role?: string[];
  onSite?: boolean;
  searchQuery?: string;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Campaign statistics for dashboard
 */
export interface CampaignStatistics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEvents: number;
  upcomingEvents: number;
  totalPeopleAssignments: number;
  totalQRCodeScans: number;
  campaignsByClient: Record<string, number>;
  eventsByMonth: Array<{ month: string; count: number }>;
}

/**
 * Event analytics
 */
export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalAssignments: number;
  onSiteCount: number;
  remoteCount: number;
  qrCodeScans: number;
  averageDistanceMi: number;
  status: EventStatus;
}

// ============================================================================
// UXP PLATFORM - VENUE MANAGEMENT
// ============================================================================

/**
 * Venue entity
 * Represents event locations with geolocation and categorization
 *
 * **Design Decision**: Venues are REUSABLE across multiple events
 * - One venue can host many events
 * - Venues are created independently and linked to events
 * - This allows venue analytics (most used, event count, etc.)
 *
 * **Note**: Unlike the master plan which has eventId FK, we make venues
 * reusable entities for better data architecture
 */
export interface Venue {
  id: string;

  // Venue Identity
  name: string;
  fullAddress: string;
  formattedAddress?: string;

  // Address Components
  country: string;
  city: string;
  state?: string;
  stateCode?: string;
  postCode?: string;
  address: string; // Street address
  number?: string; // Street number

  // Geolocation (REQUIRED)
  latitude: number;
  longitude: number;
  geoJSONData?: string; // GeoJSON format for mapping libraries

  // Categorization
  category?: "Stadium" | "Arena" | "Convention Center" | "Park" | "Street" | "Other";
  platform?: string; // "Google Maps", "Bing Maps", etc.
  poiScope?: string; // Point of Interest scope
  entityType?: string; // Venue type classification
  subCategory?: string; // Detailed categorization
  tags?: string[]; // Custom tags for filtering

  // External Links
  url?: string; // Venue website or information URL

  // Tracking & Metadata
  status: "active" | "verified" | "archived";
  eventsCount?: number; // Count of events at this venue (computed)
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;
}

/**
 * Venue filter options
 * Used for filtering and searching venues in VenueDatabase component
 */
export interface VenueFilters {
  city?: string[];
  country?: string[];
  category?: ("Stadium" | "Arena" | "Convention Center" | "Park" | "Street" | "Other")[];
  poiScope?: string[];
  status?: ("active" | "verified" | "archived")[];
  searchQuery?: string; // Search by name or address
}

// ============================================================================
// LEGACY TYPES (Preserved from Meeting Notes Generator)
// FORM STATE TYPES
// ============================================================================

/**
 * Campaign form state
 */
export interface CampaignFormState {
  campaignName: string;
  campaignDescription: string;
  client: string;
  eventType: string;
  masterProgram: string;
  region: string;
  year: number;
  month: number;
  campaignOwner: string;
  campaignOwnerEmail: string;
}

/**
 * Event form state
 */
export interface EventFormState {
  eventName: string;
  eventDetails: string;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  city: string;
  country: string;
  eventVenue: string;
  owner: string;
  ownerName: string;
}

/**
 * Venue form state
 */
export interface VenueFormState {
  name: string;
  address: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
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

// ============================================================================
// EMPLOYEE ONBOARDING SYSTEM - DATA MODEL
// ============================================================================

/**
 * Hardware Entity
 * Physical equipment inventory for employee provisioning
 */
export interface Hardware {
  id: string;
  type: "computer" | "monitor" | "keyboard" | "mouse" | "dock" | "headset" | "accessory";
  model: string;
  manufacturer: string;
  specifications: {
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
 * Software/License Entity
 * Software catalog and license pool management
 */
export interface Software {
  id: string;
  name: string;
  vendor: string;
  licenseType: "perpetual" | "subscription" | "concurrent";
  requiresApproval: boolean;
  approver?: string;
  cost: number;
  renewalFrequency?: "monthly" | "annual";
  seatCount?: number;
  description?: string;
}

/**
 * Package Entity
 * Pre-defined equipment and software bundles for roles
 */
export interface Package {
  id: string;
  name: string;
  description: string;
  roleTarget: string[];
  departmentTarget: string[];
  hardware: Hardware[];
  software: Software[];
  licenses: Software[];
  isStandard: boolean;
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * PreHire Entity
 * Candidate tracking from offer acceptance through start date
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
    reason?: string;
  };
  linkedEmployeeId?: string;
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}

/**
 * Employee Entity
 * Full employee record with onboarding status
 */
export interface Employee {
  id: string;
  activeDirectoryId?: string;
  workdayId?: string;
  name: string;
  email: string;
  department: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  manager?: string;
  assignedPackage?: Package;
  actualHardware: Hardware[];
  actualSoftware: Software[];
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
  isPreloaded: boolean;
  needsPasswordReset: boolean;
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}
