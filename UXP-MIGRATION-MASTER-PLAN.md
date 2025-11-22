# UXP (Unified Experience Platform) - Migration Master Plan

**Project**: Transform Employee Onboarding System → UXP Field Marketing Platform
**Date**: November 22, 2025
**Status**: Planning Phase
**Complexity**: 🔴 **MAJOR TRANSFORMATION**

---

## 🎯 Executive Summary

### What Is UXP?

**Unified Experience Platform (UXP)** is a comprehensive field marketing and experiential event management system designed to manage:

- **Campaign Management**: Multi-event campaign tracking with budget and performance metrics
- **Event Scheduling**: Venue selection, date coordination, team assignments
- **Field Operations**: On-site team coordination, check-ins, real-time tracking
- **Data Capture**: QR codes, Placer.ai footfall analytics, measurement tracking
- **Vendor Integration**: Brandscopic API integration for field marketing workflows

### Current State vs. Target State

| Aspect | Current (Employee Onboarding) | Target (UXP Platform) |
|--------|------------------------------|----------------------|
| **Domain** | HR/IT onboarding lifecycle | Field marketing/experiential events |
| **Core Entity** | PreHire → Employee | Campaign → Event → Venue |
| **Primary Users** | HR, IT, Finance, Managers | Marketing, Field Ops, Agencies, Finance |
| **Key Workflow** | Equipment provisioning & approvals | Event planning, execution, measurement |
| **Data Volume** | ~50-200 pre-hires/year | ~500-2000 events/year across multiple campaigns |
| **External Systems** | Workday, AD, Helix, Weenus | Brandscopic, Placer.ai, Smartsheet, QRtiger |
| **Reusability** | 🟡 ~40% infrastructure reusable | 🟢 Auth, UI components, Graph API integration |

### Transformation Scope

This is **NOT a simple feature add** - it's a complete platform repurposing:

- ✅ **Keep**: Authentication, UI library, Graph API, department lookup, telemetry
- 🔄 **Transform**: Data model, navigation, workflows, contexts, services
- ❌ **Remove**: All employee onboarding entities, approval workflows, freeze periods, hardware refresh

---

## 📊 UXP Data Model (From Architecture Analysis)

### Extracted from ReferenceFiles/Architecture/UXP_Hierarchy_markmap.html

```
UXP
└─ Campaign
   ├─ Campaign Data (23 fields)
   │  ├─ CampaignID, CampaignName, CampaignDescription
   │  ├─ Client, EventType, MasterProgram
   │  ├─ Region, Status, Year, Month
   │  └─ CampaignOwner (FK to User)
   │
   └─ Event (multiple events per campaign)
      ├─ Event Data (34 fields)
      │  ├─ EventID, EventName, EventDetails
      │  ├─ EventStartDate, EventEndDate
      │  ├─ EventVenue, City, Country, Address
      │  ├─ Latitude, Longitude
      │  ├─ Owner (FK to User), Status
      │  └─ DistanceFromOfficeMi, TimeFromOfficeMins
      │
      ├─ Venue (location data)
      │  ├─ Venue Data (27 fields)
      │  │  ├─ VenueID, Name, FullAddress
      │  │  ├─ Latitude, Longitude, GeoJSONData
      │  │  ├─ Platform, POIScope, Category
      │  │  └─ Tags, URL
      │  │
      │  └─ PlacerData (footfall analytics)
      │     ├─ PlacerDataID, VenueID
      │     ├─ PlacerEntryID, MovementData
      │     └─ URL, CreatedOn
      │
      ├─ QRCode (lead capture)
      │  ├─ QRCodeID, EventID
      │  ├─ CodeData, GeneratedOn, ScanCount
      │  └─ QRtigerID, QRtigerStatus
      │
      └─ PeopleAssignment (team assignments)
         ├─ AssignmentID, EventID
         ├─ UserID, UserName, UserEmail
         ├─ UserDepartment, UserRole
         ├─ OnSite (boolean)
         ├─ ManagerName, ManagerEmail
         └─ DistanceFromOffice, TimeFromOffice
```

### Entity Relationship Summary

```
Campaign (1) ──→ (N) Event
Event (1) ──→ (1) Venue ──→ (N) PlacerData
Event (1) ──→ (N) QRCode
Event (1) ──→ (N) PeopleAssignment
```

---

## 📋 Requirements Analysis (From ReferenceFiles)

### Key Documents Analyzed

1. **Architecture/UXP_Hierarchy_markmap.html** - Complete data model (analyzed ✅)
2. **Architecture/UXP_Data_Tables.xlsx** - Detailed field definitions (binary file - need conversion)
3. **Finance/1RIVET/UET - Requirements.docx** - Business requirements (binary file - need conversion)
4. **UXP + Field Management/Unified Experience Data and Field Management.v1.2.pptx** - Presentation (binary - need conversion)
5. **Internal Docs/ACCOUNT INTERVIEWS.docx** - User interviews with AMEX, Coca-Cola, Constellation (binary - need conversion)
6. **Common Backend Automation/Verizon Weekly Update Instructions** - Process documentation

### Extracted Requirements (From File Names & Structure)

#### **1. Campaign Management**
- Create multi-event campaigns with master program association
- Track campaign-level metrics (budget, performance, ROI)
- Client association (AMEX, Coca-Cola, Verizon, Constellation)
- Event type categorization (Sports, Music, Sampling, Activation)
- Regional segmentation
- Campaign ownership and team assignments

#### **2. Event Scheduling & Management**
- Event creation with start/end dates
- Venue selection with geolocation
- Address autocomplete and validation
- Distance/time calculations from office locations
- Event status tracking (Planning, Active, Completed, Cancelled)
- Event notes and details management

#### **3. Venue & Location Intelligence**
- Venue database with geolocation (lat/long)
- GeoJSON data for mapping
- POI (Point of Interest) scope and categories
- Platform integration (Google Maps, Bing Maps)
- Venue tags and categorization
- Full address parsing (Number, Street, City, State, PostCode, Country)

#### **4. Placer.ai Integration**
- Footfall analytics integration
- Movement data tracking
- Venue-specific analytics
- URL linking to Placer.ai dashboard

#### **5. QR Code Management (QRtiger Integration)**
- QR code generation per event
- Scan count tracking
- QRtiger API synchronization
- QR code status monitoring
- Path/URL management

#### **6. Team & People Management**
- User assignments to events
- Role-based assignments (Field Manager, Brand Ambassador, Lead, etc.)
- On-site status tracking
- Department and manager associations
- Distance from office calculations for travel planning
- Email notifications

#### **7. Recurring Workflows**
- **Verizon Weekly Reports**: Automated weekly event recap generation
- **Event Recapping**: Post-event data collection and measurement (referenced in "EVENT RECAPPING - VERIZON.pptx")
- **Brandscopic Integration**: Field marketing data sync

---

## 🔄 Reusability Assessment

### ✅ **Components to KEEP (40% of codebase)**

#### **1. Authentication & Authorization (100% reusable)**
- `auth/authConfig.ts` - MSAL configuration
- `auth/AuthGuard.tsx` - Authentication wrapper
- `auth/AccessDenied.tsx` - Access control
- `contexts/AuthContext.tsx` - User context
- `backend/middleware/auth.js` - JWT validation
- **Reason**: UXP uses same Azure AD, same group security model

#### **2. UI Component Library (100% reusable)**
- `components/ui/Button.tsx` - Button variants
- `components/ui/Icon.tsx` - Icon system (30+ icons)
- `components/ui/Card.tsx` - Card layout
- `components/ui/Input.tsx` - Form inputs
- `components/ui/Textarea.tsx` - Text areas
- `components/ui/Toast.tsx` - Notifications
- `components/ui/ToggleSwitch.tsx` - Toggles
- `components/ui/Select.tsx` - Dropdowns
- `components/ui/Chip.tsx` - Tags
- `components/ui/Tooltip.tsx` - Tooltips
- `components/ui/LoadingModal.tsx` - Loading states
- `components/ui/SkeletonLoader.tsx` - Skeletons
- `components/ui/ScrollToTop.tsx` - Scroll button
- **Reason**: Generic UI components work for any domain

#### **3. Microsoft Graph API Integration (100% reusable)**
- `services/graphService.ts` - Graph API calls
- `services/departmentService.ts` - Department lookup (962 Momentum users)
- **Reason**: User profiles, departments, manager hierarchy all needed for UXP team assignments

#### **4. Utility Services (80% reusable)**
- `utils/telemetryService.ts` - Event tracking (needs event type updates)
- `utils/browserContext.ts` - Browser detection
- `utils/errorLogger.ts` - Error logging
- `utils/feedbackService.ts` - User feedback
- `utils/i18n.ts` - Internationalization (if needed)
- **Reason**: Generic utilities work across domains

#### **5. Core Infrastructure (100% reusable)**
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies (React, MSAL, Tailwind)
- `nginx.conf` - Nginx configuration
- `Dockerfile` - Docker container setup
- `backend/server.js` - Express server (needs endpoint updates)
- **Reason**: Infrastructure is domain-agnostic

### 🔄 **Components to TRANSFORM (30% of codebase)**

#### **1. Navigation System**
- `components/Navigation.tsx` - Complete redesign for UXP sections
- Current sections: Pre-hires, Packages, Hardware, Licenses, Freeze Periods
- **New sections**: Campaigns, Events, Venues, Team Assignments, Reports, Integrations

#### **2. State Management Contexts**
- `contexts/PreHireContext.tsx` → `contexts/CampaignContext.tsx`
- `contexts/PackageContext.tsx` → `contexts/EventContext.tsx`
- `contexts/ApprovalContext.tsx` → Remove (no approval workflow in UXP)
- `contexts/LicenseContext.tsx` → Remove (no licenses in UXP)
- `contexts/RefreshContext.tsx` → Remove (no hardware refresh in UXP)
- **New contexts needed**:
  - `contexts/VenueContext.tsx` - Venue management
  - `contexts/QRCodeContext.tsx` - QR code generation
  - `contexts/PlacerContext.tsx` - Analytics integration
  - `contexts/AssignmentContext.tsx` - People/team assignments

#### **3. Services Layer**
- `services/apiService.ts` - Keep for backend API calls
- `services/approvalWorkflowService.ts` → Remove
- `services/approvalEmailService.ts` → Transform to EventNotificationService
- `services/packageVersionService.ts` → Remove
- `services/refreshService.ts` → Remove
- **New services needed**:
  - `services/brandscopicService.ts` - Brandscopic API integration
  - `services/placerService.ts` - Placer.ai API integration
  - `services/qrtigerService.ts` - QRtiger API integration
  - `services/geocodingService.ts` - Address → Lat/Long conversion
  - `services/distanceService.ts` - Office distance calculations

### ❌ **Components to REMOVE (30% of codebase)**

#### **1. Employee Onboarding Components**
- All `components/` files related to:
  - Pre-hire management (PreHireForm, PreHireList, PreHireDetail)
  - Package management (PackageBuilder, PackageLibrary, PackageDetailView)
  - Hardware inventory (HardwareInventory, HardwareCreateModal, HardwareEditModal)
  - Software/license pools (LicensePoolDashboard, LicenseAssignmentModal)
  - Approval workflow (ApprovalQueue, ApprovalDetailModal)
  - Freeze periods (FreezePeriodAdmin, FreezePeriodDashboard)
  - Hardware refresh (RefreshCalendar, RefreshFinanceView)

#### **2. Database Migrations**
- `database/migrations/001_package_versioning.sql` - Remove
- `database/migrations/002_hardware_superseding.sql` - Remove
- `database/migrations/003_core_tables.sql` - Keep structure, replace entities
- `database/migrations/004_approval_workflow.sql` - Remove
- `database/migrations/005_freeze_periods.sql` - Remove
- `database/migrations/006_license_management.sql` - Remove

#### **3. Type Definitions (types.ts)**
- Remove all onboarding-related interfaces:
  - PreHire, Package, Hardware, Software, LicensePool, LicenseAssignment
  - ApprovalRequest, HelixTicket, FreezePeriod, FreezePeriodNotification
  - RefreshSchedule, OnboardingTask, PackageVersion

---

## 🏗️ New UXP Data Model (TypeScript Interfaces)

### Core Entities

```typescript
// ========================================
// CAMPAIGN MANAGEMENT
// ========================================

export interface Campaign {
  id: string;
  campaignName: string;
  campaignDescription?: string;
  campaignNotes?: string;

  // Business Context
  client: string;              // e.g., "American Express", "Verizon"
  eventType: string;           // e.g., "Sports", "Music Festival", "Sampling"
  masterProgram?: string;      // Parent program name
  region: string;              // e.g., "Northeast", "West Coast", "National"

  // Status & Timeline
  status: "planning" | "active" | "completed" | "cancelled";
  year: number;
  month: number;
  yearMonth: string;           // "2025-11" for grouping

  // Ownership
  campaignOwner: string;       // User ID (from Azure AD)
  campaignOwnerEmail: string;

  // Metadata
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;

  // Business Tracking
  jobNumbers?: string[];       // Finance tracking codes
  visible: boolean;            // Show/hide in reports
  importSequenceNumber?: number; // For data migrations
}

// ========================================
// EVENT MANAGEMENT
// ========================================

export interface Event {
  id: string;
  campaignId: string;          // FK to Campaign

  // Event Identity
  eventName: string;
  eventDetails?: string;
  eventNotes?: string;
  number?: string;             // Event number within campaign (e.g., "Event 1 of 5")
  index?: number;              // Sorting order

  // Timeline
  eventStartDate: Date;
  eventEndDate: Date;
  yearMonthStart: string;      // "2025-11"
  yearMonthEnd: string;
  year: number;
  month: number;

  // Location (Basic)
  eventVenue: string;          // Venue name
  city: string;
  country: string;
  postCode?: string;
  address1?: string;
  address2?: string;
  number?: string;             // Street number

  // Geolocation
  latitude?: number;
  longitude?: number;

  // Office Distance (For Travel Planning)
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;

  // Ownership & Status
  owner: string;               // User ID
  ownerName: string;
  status: "planning" | "active" | "completed" | "cancelled";

  // Metadata
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;
  importSequenceNumber?: number;
}

// ========================================
// VENUE & LOCATION DATA
// ========================================

export interface Venue {
  id: string;
  eventId: string;             // FK to Event

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
  address: string;
  number?: string;

  // Geolocation
  latitude: number;
  longitude: number;
  geoJSONData?: string;        // GeoJSON format for mapping

  // Categorization
  platform?: string;           // "Google Maps", "Bing Maps", etc.
  poiScope?: string;           // Point of Interest scope
  entityType?: string;         // Venue type
  category?: string;           // Primary category
  group?: string;              // Venue grouping
  subCategory?: string;        // Detailed categorization

  // Tracking
  status: "active" | "verified" | "archived";
  sentOn?: Date;               // When data sent to external system
  checkedOn?: Date;            // Last verification date
  count?: number;              // Usage count
  tags?: string[];             // Custom tags
  url?: string;                // Venue website or info URL
}

// ========================================
// PLACER.AI ANALYTICS INTEGRATION
// ========================================

export interface PlacerData {
  id: string;
  venueId: string;             // FK to Venue

  // Placer.ai Integration
  placerEntryId: string;       // External ID from Placer.ai
  movementData: string;        // JSON blob of footfall data
  url: string;                 // Link to Placer.ai dashboard

  // Tracking
  createdOn: Date;
}

// ========================================
// QR CODE MANAGEMENT
// ========================================

export interface QRCode {
  id: string;
  eventId: string;             // FK to Event

  // QR Code Data
  codeData: string;            // QR code content (URL, text, vCard, etc.)
  generatedOn: Date;
  scanCount: number;

  // QRtiger Integration
  qrtigerId?: string;          // External ID from QRtiger
  qrtigerLastSync?: Date;
  qrtigerPath?: string;        // QRtiger dashboard path
  qrtigerStatus?: "active" | "paused" | "archived";
}

// ========================================
// PEOPLE ASSIGNMENTS
// ========================================

export interface PeopleAssignment {
  id: string;
  eventId: string;             // FK to Event

  // User Identity
  userId: string;              // Azure AD User ID
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userRole: string;            // e.g., "Field Manager", "Brand Ambassador"

  // On-site Status
  onSite: boolean;             // Will this person be physically on-site?

  // Travel Planning
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;

  // Manager Info
  managerName?: string;
  managerEmail?: string;
  managerRole?: string;

  // Assignment Metadata
  assignedByName?: string;
  assignedByEmail?: string;
  assignedOn: Date;
}

// ========================================
// EXTERNAL SYSTEM INTEGRATIONS
// ========================================

export interface BrandscopicIntegration {
  id: string;
  eventId: string;

  // Brandscopic API Data
  brandscopicProjectId: string;
  brandscopicStatus: string;
  lastSyncDate: Date;
  syncStatus: "success" | "pending" | "failed";
  errorMessage?: string;
}

export interface SmartsheetIntegration {
  id: string;
  campaignId?: string;
  eventId?: string;

  // Smartsheet API Data
  sheetId: string;
  sheetName: string;
  lastSyncDate: Date;
  syncStatus: "success" | "pending" | "failed";
}
```

---

## 🗺️ UXP Navigation Structure

### Proposed Tab Organization

```
UXP (UNIFIED EXPERIENCE PLATFORM)
──────────────────────────────────

📊 CAMPAIGNS
├─ 🎯 All Campaigns              ← Campaign list/grid view
├─ ➕ Create Campaign            ← Campaign creation wizard
└─ 📈 Campaign Analytics         ← ROI, budget, performance metrics

📅 EVENTS
├─ 🗓️  Event Calendar            ← Calendar view of all events
├─ 📍 Event Map                  ← Geographic map view
├─ 📋 Event List                 ← Filterable event list
└─ ➕ Create Event               ← Event creation form

🏢 VENUES
├─ 🗺️  Venue Database            ← All venues with search/filter
├─ 📊 Venue Analytics            ← Placer.ai data dashboard
└─ ➕ Add Venue                  ← Venue creation

👥 TEAM
├─ 👤 Assignments                ← Who's assigned to what event
├─ 📅 Availability               ← Team member calendars
└─ 🚗 Travel Planning            ← Distance/time calculations

📲 INTEGRATIONS
├─ 🔗 Brandscopic                ← API status, sync logs
├─ 📊 Placer.ai                  ← Footfall analytics
├─ 📋 Smartsheet                 ← Event tracking sheets
└─ 📱 QRtiger                    ← QR code management

📊 REPORTS & ANALYTICS
├─ 📈 Campaign Performance       ← Budget vs. actual, ROI
├─ 📍 Regional Breakdown         ← Events by region
├─ 👥 Team Utilization           ← Assignments per person
└─ 📊 Venue Metrics              ← Most used venues, footfall
```

---

## 🚀 Migration Strategy: 4-Phase Approach

### **Phase 1: Foundation & Planning** (5-7 days)

**Objectives**:
- Create comprehensive UXP data model
- Design database schema
- Update type definitions
- Create mockData for UXP entities

**Deliverables**:
1. `types.ts` - Complete UXP interfaces (Campaign, Event, Venue, etc.)
2. `database/migrations/100_uxp_core_tables.sql` - SQL schema
3. `utils/mockData.ts` - Sample campaigns, events, venues (50+ records)
4. `UXP-DATA-MODEL-SPEC.md` - Detailed field documentation

**Sub-agents**:
- @agent-feature-developer - Data model design
- @agent-explore - Analyze reference files for additional requirements

---

### **Phase 2: Core Components** (10-15 days)

**Objectives**:
- Build Campaign, Event, and Venue CRUD components
- Implement state management (contexts)
- Create services for API calls

**Deliverables**:
1. **Campaign Management**:
   - `components/campaign/CampaignList.tsx`
   - `components/campaign/CampaignCreateModal.tsx`
   - `components/campaign/CampaignDetailView.tsx`
   - `contexts/CampaignContext.tsx`

2. **Event Management**:
   - `components/event/EventCalendar.tsx` (calendar view)
   - `components/event/EventMap.tsx` (geographic view)
   - `components/event/EventList.tsx` (filterable list)
   - `components/event/EventCreateModal.tsx`
   - `components/event/EventDetailView.tsx`
   - `contexts/EventContext.tsx`

3. **Venue Management**:
   - `components/venue/VenueDatabase.tsx`
   - `components/venue/VenueCreateModal.tsx`
   - `components/venue/VenueDetailView.tsx`
   - `contexts/VenueContext.tsx`

**Sub-agents**:
- @agent-feature-developer (3 instances in parallel):
  - Agent 1: Campaign components
  - Agent 2: Event components
  - Agent 3: Venue components

---

### **Phase 3: Advanced Features** (10-15 days)

**Objectives**:
- People assignments
- QR code management
- External integrations
- Analytics dashboards

**Deliverables**:
1. **People & Team**:
   - `components/team/AssignmentManager.tsx`
   - `components/team/AvailabilityCalendar.tsx`
   - `components/team/TravelPlanner.tsx`
   - `contexts/AssignmentContext.tsx`

2. **QR Codes**:
   - `components/qr/QRCodeGenerator.tsx`
   - `components/qr/QRCodeScanner.tsx`
   - `components/qr/QRAnalytics.tsx`
   - `services/qrtigerService.ts`

3. **Integrations**:
   - `services/brandscopicService.ts`
   - `services/placerService.ts`
   - `services/smartsheetService.ts`
   - `components/integrations/IntegrationDashboard.tsx`

4. **Analytics**:
   - `components/analytics/CampaignPerformance.tsx`
   - `components/analytics/RegionalBreakdown.tsx`
   - `components/analytics/TeamUtilization.tsx`
   - `components/analytics/VenueMetrics.tsx`

**Sub-agents**:
- @agent-feature-developer (4 instances in parallel):
  - Agent 1: People & team components
  - Agent 2: QR code system
  - Agent 3: Integration services
  - Agent 4: Analytics dashboards

---

### **Phase 4: Polish & Production** (5-7 days)

**Objectives**:
- Navigation reorganization
- Backend API implementation
- Database deployment
- Testing and documentation

**Deliverables**:
1. Updated `components/Navigation.tsx` with UXP sections
2. Backend API endpoints (50+ endpoints)
3. Database migration scripts
4. User documentation
5. Admin guide
6. API documentation

**Sub-agents**:
- @agent-feature-developer - Backend API
- @agent-design-reviewer - Visual validation
- @agent-migration-assistant - Documentation generation

---

## 🤖 Parallel Agent Execution Plan

### **Agents Overview**

| Agent | Purpose | Phase | Estimated Time |
|-------|---------|-------|----------------|
| **@agent-explore** | Analyze ReferenceFiles, extract requirements | Phase 1 | 2-3 days |
| **@agent-feature-developer-1** | Campaign components | Phase 2 | 3-5 days |
| **@agent-feature-developer-2** | Event components | Phase 2 | 5-7 days |
| **@agent-feature-developer-3** | Venue components | Phase 2 | 3-4 days |
| **@agent-feature-developer-4** | People/Team components | Phase 3 | 4-5 days |
| **@agent-feature-developer-5** | QR code system | Phase 3 | 3-4 days |
| **@agent-feature-developer-6** | Integration services | Phase 3 | 4-5 days |
| **@agent-feature-developer-7** | Analytics dashboards | Phase 3 | 3-4 days |
| **@agent-feature-developer-8** | Backend API | Phase 4 | 5-7 days |
| **@agent-design-reviewer** | Visual validation | Phase 4 | 2-3 days |
| **@agent-migration-assistant** | Documentation | Phase 4 | 2-3 days |

### **Execution Timeline**

```
Week 1-2: PHASE 1 (Foundation)
──────────────────────────────
[Agent: Explore] → Requirements extraction from ReferenceFiles
[Agent: Feature-Dev-1] → Data model design, types.ts, mockData.ts


Week 2-4: PHASE 2 (Core Components) - PARALLEL
───────────────────────────────────────────────
[Agent: Feature-Dev-1] → Campaign management
[Agent: Feature-Dev-2] → Event management
[Agent: Feature-Dev-3] → Venue management


Week 4-6: PHASE 3 (Advanced Features) - PARALLEL
─────────────────────────────────────────────────
[Agent: Feature-Dev-4] → People/Team
[Agent: Feature-Dev-5] → QR codes
[Agent: Feature-Dev-6] → Integrations
[Agent: Feature-Dev-7] → Analytics


Week 6-7: PHASE 4 (Polish & Production) - PARALLEL
───────────────────────────────────────────────────
[Agent: Feature-Dev-8] → Backend API
[Agent: Design-Reviewer] → Visual validation
[Agent: Migration-Assist] → Documentation


Total: 6-7 weeks (parallel execution)
Sequential: 9-12 weeks
```

---

## 📝 Detailed Agent Task Assignments

### **Agent 1: @agent-explore**
**Task**: Requirements Extraction & Analysis
**Duration**: 2-3 days
**Input**: ReferenceFiles folder
**Output**: `UXP-REQUIREMENTS-REPORT.md`

**Specific Instructions**:
```
Analyze the following ReferenceFiles and extract:

1. From Architecture/UXP_Data_Tables.xlsx:
   - Complete field definitions for all entities
   - Data types, constraints, relationships
   - Any business rules or validation logic

2. From Finance/1RIVET/UET - Requirements.docx:
   - Functional requirements
   - User stories
   - Acceptance criteria

3. From UXP + Field Management/*.pptx:
   - Workflow diagrams
   - User personas
   - Feature priorities

4. From Internal Docs/ACCOUNT INTERVIEWS.docx:
   - User pain points
   - Feature requests from AMEX, Coca-Cola, Constellation
   - Common workflows

5. From Common Backend Automation/Verizon*:
   - Automation requirements
   - Weekly report structure
   - Data flow diagrams

Generate a comprehensive requirements document with:
- User stories (As a [role], I want [feature], so that [benefit])
- Acceptance criteria for each feature
- Priority matrix (Must Have, Should Have, Nice to Have)
- External system integration requirements
```

---

### **Agent 2: @agent-feature-developer (Campaign Components)**
**Task**: Campaign Management System
**Duration**: 3-5 days
**Dependencies**: Agent 1 complete
**Output**: Campaign CRUD components + context

**Specific Instructions**:
```
Implement Campaign Management with the following components:

1. CampaignList.tsx:
   - Grid/List view toggle
   - Filters: Client, EventType, Region, Status, Year
   - Search by campaign name
   - Sort by: Date, Name, Client
   - Actions: View, Edit, Delete, Duplicate

2. CampaignCreateModal.tsx:
   - Form fields: Campaign Name, Description, Client, EventType, Region, Year/Month
   - Campaign Owner selection (Azure AD lookup)
   - Master Program dropdown
   - Validation: Required fields, duplicate name check
   - Save draft vs. Publish

3. CampaignDetailView.tsx:
   - Campaign header with status badge
   - Event list (child events)
   - Budget summary (if available)
   - Activity timeline
   - Edit/Delete actions

4. CampaignContext.tsx:
   - State management for campaigns
   - CRUD operations: createCampaign, updateCampaign, deleteCampaign, getCampaigns
   - Filtering and search helpers
   - Mock data integration

Use existing UI components from components/ui/ (Button, Card, Input, etc.)
Follow dark mode design patterns from existing components
Include TypeScript types from types.ts
Add telemetry tracking for all user actions
```

---

### **Agent 3: @agent-feature-developer (Event Components)**
**Task**: Event Management System with Calendar & Map Views
**Duration**: 5-7 days
**Dependencies**: Agent 1 + Agent 2 complete
**Output**: Event CRUD components + calendar + map views + context

**Specific Instructions**:
```
Implement Event Management with THREE VIEW MODES:

1. EventCalendar.tsx:
   - Full calendar view (month/week/day)
   - Events displayed on calendar grid
   - Color-coding by campaign or status
   - Drag-to-reschedule (optional MVP)
   - Click event → open detail modal
   - Libraries: Use react-big-calendar or similar

2. EventMap.tsx:
   - Google Maps integration showing all event venues
   - Markers clustered by proximity
   - Click marker → event detail popup
   - Filter by: Date range, Campaign, Status
   - Distance calculation from office location
   - Libraries: Use @react-google-maps/api or similar

3. EventList.tsx:
   - Filterable table/list view
   - Filters: Campaign, Date range, Status, City, Country
   - Search by event name or venue
   - Sort: Date, Name, City
   - Actions: View, Edit, Delete, Duplicate

4. EventCreateModal.tsx:
   - Multi-step form:
     Step 1: Event basics (Name, Campaign, Dates)
     Step 2: Venue (Address autocomplete, geolocation)
     Step 3: Team assignments (optional)
   - Address autocomplete (Google Places API)
   - Auto-calculate distance from office
   - Validation: Date range check, venue required

5. EventDetailView.tsx:
   - Event header with status
   - Venue map snippet
   - Team assignments list
   - QR codes section
   - Placer.ai analytics (if available)
   - Edit/Delete actions

6. EventContext.tsx:
   - State management for events
   - CRUD operations
   - Calendar data transformation helpers
   - Map marker data preparation
   - Geolocation utilities

CRITICAL:
- Integrate with CampaignContext (events belong to campaigns)
- Use VenueContext for venue data
- Add telemetry for all views (calendar, map, list)
- Include mock data with realistic lat/long coordinates
```

---

### **Agent 4: @agent-feature-developer (Venue Components)**
**Task**: Venue Database & Placer.ai Integration
**Duration**: 3-4 days
**Dependencies**: Agent 1 complete
**Output**: Venue CRUD components + Placer.ai dashboard + context

**Specific Instructions**:
```
Implement Venue Management with Placer.ai analytics:

1. VenueDatabase.tsx:
   - Searchable venue list
   - Filters: City, Country, Category, POI Scope
   - Search by: Name, Address, Tags
   - Sort: Name, City, Usage count
   - Actions: View, Edit, Delete, Add Placer Data

2. VenueCreateModal.tsx:
   - Address entry with autocomplete (Google Places API)
   - Auto-populate: City, State, Country, PostCode, Lat/Long
   - Manual entry fallback
   - Category/Tags selection
   - Venue URL (optional)
   - Validation: Address required, geolocation required

3. VenueDetailView.tsx:
   - Venue header with map snippet
   - Full address display
   - Geolocation (lat/long)
   - Associated events (backlink to events at this venue)
   - Placer.ai analytics section (if data available)
   - Edit/Delete actions

4. VenueAnalytics.tsx:
   - Placer.ai footfall data visualization
   - Movement data charts
   - Link to Placer.ai dashboard
   - Data refresh status
   - Historical data (if available)

5. VenueContext.tsx:
   - State management for venues
   - CRUD operations
   - Geolocation helpers
   - Placer.ai data sync

6. services/placerService.ts:
   - Placer.ai API integration (if API available)
   - Mock data for MVP
   - Data transformation for charts

7. services/geocodingService.ts:
   - Address → Lat/Long conversion
   - Google Geocoding API integration
   - Fallback to manual entry

CRITICAL:
- Venues are reusable across events (one venue, many events)
- Include 20+ mock venues with realistic addresses
- Add telemetry for venue creation and analytics views
```

---

### **Agent 5: @agent-feature-developer (People/Team Components)**
**Task**: Team Assignment & Availability Management
**Duration**: 4-5 days
**Dependencies**: Agent 3 (events) complete
**Output**: Assignment components + availability calendar + travel planner

**Specific Instructions**:
```
Implement People & Team Management:

1. AssignmentManager.tsx:
   - View all assignments by event or by person
   - Assign people to events
   - Role selection (Field Manager, Brand Ambassador, etc.)
   - On-site status toggle
   - Manager assignment
   - Bulk assign to multiple events

2. AvailabilityCalendar.tsx:
   - View team member calendars
   - See who's available on specific dates
   - Conflicts highlighted (double-booked)
   - Filter by: Department, Role
   - Libraries: Use react-big-calendar or similar

3. TravelPlanner.tsx:
   - Calculate distance/time from office for all assignments
   - Group assignments by proximity for carpool planning
   - Export travel manifest (CSV)
   - Map view showing office + event locations

4. AssignmentDetailModal.tsx:
   - Person profile (from Azure AD)
   - Current assignments
   - Historical assignments
   - Manager approval (if needed)

5. AssignmentContext.tsx:
   - State management for assignments
   - CRUD operations
   - Availability checking
   - Conflict detection

6. services/distanceService.ts:
   - Google Distance Matrix API integration
   - Calculate distance (miles/km) and time (minutes)
   - Cache results to avoid repeated API calls

CRITICAL:
- Integrate with EventContext (assignments belong to events)
- Use Azure AD Graph API for user data (name, email, profile pic)
- Use DepartmentService for department data
- Add telemetry for assignment actions
```

---

### **Agent 6: @agent-feature-developer (QR Code System)**
**Task**: QR Code Generation & QRtiger Integration
**Duration**: 3-4 days
**Dependencies**: Agent 3 (events) complete
**Output**: QR code components + QRtiger service

**Specific Instructions**:
```
Implement QR Code Management:

1. QRCodeGenerator.tsx:
   - Generate QR code for event
   - QR code content types:
     - URL (event landing page)
     - vCard (contact info)
     - Plain text
     - Custom data
   - Customize QR code:
     - Size, color, logo overlay
     - Error correction level
   - Download QR code (PNG, SVG)
   - Copy QR code data

2. QRCodeScanner.tsx (Optional - if mobile app integration needed):
   - Scan QR codes
   - Track scans (count, timestamp, location)
   - Integration with QRtiger API

3. QRAnalytics.tsx:
   - View scan statistics
   - Scans over time (chart)
   - Geographic distribution
   - Link to QRtiger dashboard

4. QRCodeContext.tsx:
   - State management for QR codes
   - CRUD operations
   - QRtiger API sync

5. services/qrtigerService.ts:
   - QRtiger API integration
   - Generate QR code via API
   - Fetch scan statistics
   - Sync QR code status
   - Mock data for MVP

CRITICAL:
- One QR code per event (1:1 relationship)
- QR codes auto-generated on event creation (optional)
- Use existing QR code libraries (qrcode.react or similar)
- Add telemetry for QR code generation and downloads
```

---

### **Agent 7: @agent-feature-developer (Integration Services)**
**Task**: Brandscopic, Placer.ai, Smartsheet Integrations
**Duration**: 4-5 days
**Dependencies**: Agent 1 complete
**Output**: Integration services + dashboard

**Specific Instructions**:
```
Implement External System Integrations:

1. services/brandscopicService.ts:
   - Brandscopic API integration
   - Sync event data to Brandscopic
   - Fetch event status from Brandscopic
   - Error handling and retry logic
   - Mock data for MVP (if API not available)

2. services/placerService.ts:
   - Already created by Agent 4 (Venue components)
   - Extend with campaign-level analytics if needed

3. services/smartsheetService.ts:
   - Smartsheet API integration
   - Create sheets for campaigns/events
   - Update event data in Smartsheet
   - Fetch data from Smartsheet
   - Mock data for MVP

4. IntegrationDashboard.tsx:
   - View integration status (Brandscopic, Placer, Smartsheet)
   - Sync status indicators (success, pending, failed)
   - Last sync timestamp
   - Manual sync triggers
   - Error logs
   - API key configuration

5. IntegrationContext.tsx:
   - State management for integrations
   - Sync operations
   - Status tracking

CRITICAL:
- All integrations should be optional (graceful degradation if API unavailable)
- Include comprehensive error handling
- Add telemetry for sync operations
- Create mock data for all integrations
- Document API endpoints and authentication methods
```

---

### **Agent 8: @agent-feature-developer (Analytics Dashboards)**
**Task**: Campaign Performance & Reporting
**Duration**: 3-4 days
**Dependencies**: All other agents complete
**Output**: Analytics components + export functions

**Specific Instructions**:
```
Implement Analytics & Reporting:

1. CampaignPerformance.tsx:
   - Budget vs. Actual spending (if budget data available)
   - Event count per campaign
   - Team utilization per campaign
   - Timeline visualization
   - Export to CSV/PDF

2. RegionalBreakdown.tsx:
   - Events by region (map view)
   - Regional performance comparison
   - Top cities/venues
   - Export to CSV

3. TeamUtilization.tsx:
   - Assignments per person
   - Workload distribution
   - Availability overview
   - Top contributors
   - Export to CSV

4. VenueMetrics.tsx:
   - Most used venues
   - Placer.ai footfall aggregation
   - Venue performance rankings
   - Export to CSV

5. ReportExport.tsx:
   - PDF report generation
   - CSV export utilities
   - Email report functionality
   - Scheduled reports (optional)

CRITICAL:
- Use charts/graphs (recharts or similar library)
- All analytics should be filterable by date range, campaign, region
- Include mock data for realistic visualizations
- Add export telemetry
```

---

### **Agent 9: @agent-feature-developer (Backend API)**
**Task**: Node.js/Express Backend with SQL Database
**Duration**: 5-7 days
**Dependencies**: All frontend agents complete
**Output**: Backend API + database migrations

**Specific Instructions**:
```
Implement Backend API for UXP:

1. Database Schema (Azure SQL Database):
   - Campaigns table
   - Events table
   - Venues table
   - PlacerData table
   - QRCodes table
   - PeopleAssignments table
   - BrandscopicIntegrations table
   - SmartsheetIntegrations table

2. API Endpoints (50+ total):

   CAMPAIGNS:
   - GET    /api/campaigns                    - List campaigns (with filters)
   - POST   /api/campaigns                    - Create campaign
   - GET    /api/campaigns/:id                - Get campaign details
   - PUT    /api/campaigns/:id                - Update campaign
   - DELETE /api/campaigns/:id                - Delete campaign

   EVENTS:
   - GET    /api/events                       - List events (with filters)
   - POST   /api/events                       - Create event
   - GET    /api/events/:id                   - Get event details
   - PUT    /api/events/:id                   - Update event
   - DELETE /api/events/:id                   - Delete event
   - GET    /api/events/calendar              - Calendar view data
   - GET    /api/events/map                   - Map view data

   VENUES:
   - GET    /api/venues                       - List venues
   - POST   /api/venues                       - Create venue
   - GET    /api/venues/:id                   - Get venue details
   - PUT    /api/venues/:id                   - Update venue
   - DELETE /api/venues/:id                   - Delete venue

   QR CODES:
   - GET    /api/qrcodes                      - List QR codes
   - POST   /api/qrcodes                      - Generate QR code
   - GET    /api/qrcodes/:id                  - Get QR code details
   - DELETE /api/qrcodes/:id                  - Delete QR code

   ASSIGNMENTS:
   - GET    /api/assignments                  - List assignments
   - POST   /api/assignments                  - Create assignment
   - DELETE /api/assignments/:id              - Delete assignment

   ANALYTICS:
   - GET    /api/analytics/campaigns          - Campaign performance
   - GET    /api/analytics/regional           - Regional breakdown
   - GET    /api/analytics/team               - Team utilization
   - GET    /api/analytics/venues             - Venue metrics

   INTEGRATIONS:
   - POST   /api/integrations/brandscopic/sync - Sync with Brandscopic
   - POST   /api/integrations/placer/sync      - Sync with Placer.ai
   - POST   /api/integrations/smartsheet/sync  - Sync with Smartsheet

3. Middleware:
   - Authentication (JWT validation) - REUSE from existing backend
   - Authorization (group membership) - REUSE from existing backend
   - Request validation
   - Error handling
   - Logging

4. Database Migrations:
   - 100_uxp_campaigns.sql
   - 101_uxp_events.sql
   - 102_uxp_venues.sql
   - 103_uxp_qrcodes.sql
   - 104_uxp_assignments.sql
   - 105_uxp_integrations.sql

CRITICAL:
- Reuse existing backend/middleware/auth.js for authentication
- Follow RESTful API conventions
- Include comprehensive error handling
- Add request validation for all endpoints
- Include API documentation (Swagger/OpenAPI)
- Add telemetry for all API calls
```

---

### **Agent 10: @agent-design-reviewer**
**Task**: Visual Validation & UX Review
**Duration**: 2-3 days
**Dependencies**: All frontend agents complete
**Output**: Design review report + screenshots

**Specific Instructions**:
```
Perform comprehensive design review of UXP:

1. Visual Validation:
   - Check all components match Momentum design system
   - Verify dark mode works across all views
   - Test responsive design (desktop 1440px, tablet 768px, mobile 375px)
   - Take screenshots of all major views

2. UX Review:
   - Navigation flow (can users complete workflows easily?)
   - Form validation feedback (clear error messages?)
   - Loading states (skeleton loaders, spinners)
   - Empty states (no data messages)
   - Success/error toast notifications

3. Accessibility:
   - Keyboard navigation works
   - ARIA labels present
   - Color contrast meets WCAG AA standards
   - Focus indicators visible

4. Performance:
   - Large datasets render efficiently (100+ campaigns, 500+ events)
   - Maps load quickly
   - Charts/graphs render smoothly

Generate report with:
- Screenshots of all major views
- List of issues (critical, medium, minor)
- Recommendations for improvements
```

---

### **Agent 11: @agent-migration-assistant**
**Task**: Documentation Generation
**Duration**: 2-3 days
**Dependencies**: All agents complete
**Output**: User guide + admin guide + API docs

**Specific Instructions**:
```
Generate comprehensive documentation for UXP:

1. USER-GUIDE.md:
   - Getting started
   - Campaign management walkthrough
   - Event creation step-by-step
   - Venue database usage
   - Team assignment workflow
   - QR code generation
   - Analytics and reporting
   - FAQ

2. ADMIN-GUIDE.md:
   - System configuration
   - User role management
   - Integration setup (Brandscopic, Placer.ai, Smartsheet)
   - Database maintenance
   - Troubleshooting

3. API-DOCUMENTATION.md:
   - All endpoints documented
   - Request/response examples
   - Authentication guide
   - Error codes
   - Rate limits (if applicable)

4. DEVELOPER-GUIDE.md:
   - Architecture overview
   - Component hierarchy
   - State management (contexts)
   - Adding new features
   - Testing strategy

CRITICAL:
- Include screenshots for all workflows
- Provide code examples for API usage
- Document all environment variables
- Include deployment instructions
```

---

## 📊 Risk Assessment & Mitigation

### High-Risk Areas

1. **Binary File Analysis** 🔴 HIGH RISK
   - **Issue**: Key requirements in .docx, .pptx, .xlsx files (cannot read directly)
   - **Mitigation**:
     - Agent 1 (@agent-explore) should attempt to extract text using command-line tools
     - Request user to provide text exports or screenshots of key sections
     - Prioritize HTML/readable files (UXP_Hierarchy_markmap.html already extracted)

2. **External API Availability** 🟡 MEDIUM RISK
   - **Issue**: Brandscopic, Placer.ai, QRtiger, Smartsheet APIs may not be accessible or documented
   - **Mitigation**:
     - Build services with mock data first
     - Create integration abstraction layer
     - Allow graceful degradation if APIs unavailable

3. **Geolocation Services** 🟡 MEDIUM RISK
   - **Issue**: Google Maps/Geocoding API requires API keys and billing
   - **Mitigation**:
     - Use free tier for development
     - Provide manual lat/long entry fallback
     - Consider OpenStreetMap alternatives

4. **Timeline Pressure** 🟡 MEDIUM RISK
   - **Issue**: 6-7 weeks is aggressive for this scope
   - **Mitigation**:
     - Prioritize MVP features (defer analytics to Phase 4.5)
     - Maximize parallel agent execution
     - Use existing UI components aggressively

5. **Data Migration** 🟡 MEDIUM RISK
   - **Issue**: May have existing data in old systems that needs importing
   - **Mitigation**:
     - Create CSV import utilities
     - Document expected CSV format
     - Provide data validation before import

---

## ✅ Success Criteria

### MVP (Minimum Viable Product)

UXP is considered production-ready when:

1. ✅ **Core CRUD Operations Work**:
   - Create/Read/Update/Delete campaigns
   - Create/Read/Update/Delete events
   - Create/Read/Update/Delete venues

2. ✅ **Essential Views Functional**:
   - Campaign list with filters
   - Event calendar view
   - Event map view (even if mock data)
   - Venue database with search

3. ✅ **Basic Integrations Working**:
   - Azure AD authentication
   - Graph API user lookup
   - Department service (962 users)

4. ✅ **Data Persistence**:
   - Backend API responding
   - Database saving data
   - Changes persist across sessions

5. ✅ **Acceptable UX**:
   - Dark mode works
   - Navigation intuitive
   - Forms validate properly
   - Loading states present

### Post-MVP Enhancements

After MVP, prioritize:
- Placer.ai integration (real data)
- QR code generation
- Team assignments
- Analytics dashboards
- Brandscopic/Smartsheet sync

---

## 🚦 Next Steps (Immediate Actions)

### 1. **User Confirmation**
**BEFORE starting agents**, confirm with user:
- Is this transformation scope correct? (Employee Onboarding → UXP)
- Are there existing UXP deployments we should match?
- Which external APIs are available and documented?
- What's the priority order for features?
- Is 6-7 week timeline realistic?

### 2. **Extract Binary Files**
**If user confirms**, request:
- Text export of UET - Requirements.docx
- Screenshots/slides from .pptx presentations
- CSV export of UXP_Data_Tables.xlsx (or I can attempt extraction)

### 3. **Launch Phase 1 Agents**
**Once requirements clarified**, launch in parallel:
- Agent 1 (@agent-explore): Requirements extraction
- Agent 2 (@agent-feature-developer): Data model design

### 4. **Create Project Tracking**
- Set up GitHub project board (or equivalent)
- Create agent-specific branches
- Document agent assignments

---

## 📞 Questions for User

Before proceeding, please confirm:

1. **Scope Confirmation**: Is transforming Employee Onboarding System → UXP correct?
2. **Timeline**: Is 6-7 weeks acceptable, or is there a hard deadline?
3. **API Access**: Do you have API keys/documentation for:
   - Brandscopic API
   - Placer.ai API
   - QRtiger API
   - Smartsheet API
   - Google Maps/Geocoding API
4. **Data Migration**: Is there existing event data that needs importing?
5. **User Roles**: Are UXP user roles the same as Employee Onboarding (HR, IT, Finance, Admin)?
6. **Deployment**: Is this deployed to Google Cloud Run like the current system?
7. **Budget**: Are there constraints on API usage (Google Maps calls, Placer.ai costs)?

---

**END OF MIGRATION MASTER PLAN**

**Next Step**: Await user confirmation, then launch Agent 1 (@agent-explore) for requirements extraction.
