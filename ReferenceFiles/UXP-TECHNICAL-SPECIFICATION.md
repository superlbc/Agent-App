# UXP Technical Specification
## Unified Experience Platform - Complete System Design

**Version**: 1.0.0
**Date**: November 22, 2025
**Status**: Architecture Design Phase
**Authors**: Luis Bustos, Kristen, Steve
**Stakeholders**: Verizon, AMEX, Coca-Cola, Constellation, WGS, MLG

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [System Architecture](#system-architecture)
4. [Data Model](#data-model)
5. [Feature Specifications](#feature-specifications)
6. [Integration Requirements](#integration-requirements)
7. [User Roles & Permissions](#user-roles--permissions)
8. [API Specifications](#api-specifications)
9. [UI/UX Design Requirements](#uiux-design-requirements)
10. [Migration Strategy](#migration-strategy)
11. [Development Roadmap](#development-roadmap)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Deployment Strategy](#deployment-strategy)
14. [Appendices](#appendices)

---

## Executive Summary

### Purpose
The **Unified Experience Platform (UXP)** is a centralized event management system designed to streamline the lifecycle of experiential marketing activations from planning through post-event analysis. UXP replaces disparate processes across multiple clients (Verizon, AMEX, Coca-Cola, etc.) with a single unified platform.

### Goals
1. **Centralized Event Management**: Single source of truth for all activations across clients
2. **Automated Data Collection**: Eliminate manual data entry and email-based reporting
3. **Real-Time Sync**: Bidirectional integration with field management systems (Brandscopic, etc.)
4. **Consistent Reporting**: Standardized metrics and KPIs across all clients
5. **Business Intelligence**: Power BI dashboards with real-time event data

### Key Metrics
- **Events Managed**: 500+ activations per year (projected)
- **Users**: 150+ (Business Leaders, Project Managers, Field Managers, Brand Ambassadors)
- **Clients**: 6 primary (Verizon, AMEX, Coca-Cola, Constellation, WGS, MLG) + expandable
- **Integrations**: 3 primary (Brandscopic, QR Tiger, Qualtrics) + expandable
- **Data Volume**: 10,000+ event days per year, 50,000+ recap records

### Success Criteria
- ✅ 100% of events created in UXP sync to field management systems
- ✅ Recap data submitted within 24 hours of event completion
- ✅ Business Leaders approve/reject recaps within 48 hours
- ✅ Power BI dashboards update in real-time
- ✅ 90%+ user adoption within 3 months of launch
- ✅ 50%+ reduction in manual data entry time

---

## Business Requirements

### Primary Use Cases

#### 1. Event Scheduling (Business Leaders & Project Managers)
**User Story**: *"As a Business Leader, I want to create an event in UXP so that it automatically appears in Brandscopic and my field team can see it."*

**Requirements**:
- Create single-day or multi-day events
- Assign to client programs (e.g., "Verizon Hyperlocal", "AMEX US Open")
- Set venue details (name, type, address, geo-coordinates)
- Define event times (start/end per day for multi-day events)
- Select event status (Planned, Confirmed, Cancelled)
- Automatically sync to Brandscopic via API
- Generate unique Master Program ID (Parent ID) and Event ID per day

#### 2. Event Recap Submission (Field Managers & Brand Ambassadors)
**User Story**: *"As a Field Manager, I want to submit event recap data within 24 hours so that my Business Leader can review and approve it."*

**Requirements**:
- Mobile-friendly recap form
- Client-specific recap fields (e.g., Verizon: QR scans, premiums distributed; AMEX: attendance, surveys)
- Photo upload (multiple images per event)
- Offline data collection support (submit when back online)
- Auto-populate event details (venue, date, client)
- Save draft and submit later
- Notification to Business Leader when submitted

#### 3. Recap Approval (Business Leaders)
**User Story**: *"As a Business Leader, I want to review and approve event recaps so that accurate data flows to our Power BI dashboards."*

**Requirements**:
- View pending recaps in approval queue
- Filter by client, program, date range, field manager
- Review submitted data and photos
- Approve or reject with comments
- Bulk approve multiple recaps
- Notification to field manager on approval/rejection
- Approved data syncs to MOMO BI (Power BI)

#### 4. Calendar View (All Users)
**User Story**: *"As a Project Manager, I want to see all events on a calendar so I can identify scheduling conflicts and resource allocation."*

**Requirements**:
- Month/week/day views
- Filter by client, program, region, status
- Color-coded by client or status
- Click event to view details
- Drag-and-drop to reschedule (with confirmation)
- Export to iCal/Google Calendar
- Sync with Outlook/Teams calendar

#### 5. Analytics & Reporting (Business Leaders & Executives)
**User Story**: *"As an Executive, I want to see real-time event performance metrics so I can make data-driven decisions."*

**Requirements**:
- Power BI dashboards (embedded in UXP)
- Client-specific permissions (see only their data)
- KPIs: Total events, confirmed events, completed events, pending recaps, QR scans, surveys collected, premiums distributed
- Drill-down by client, program, region, venue type, date range
- Export to Excel, PDF
- Scheduled email reports (weekly/monthly)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        UXP Frontend                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           React SPA (TypeScript + Tailwind)               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │  Event Mgmt  │  │ Recap Mgmt   │  │  Calendar View  │ │  │
│  │  │  Components  │  │  Components  │  │  Components     │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │  │
│  │         │                  │                    │          │  │
│  │         └──────────────────┼────────────────────┘          │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │     React Context (State Management)                 │  │  │
│  │  │  EventContext, RecapContext, CalendarContext         │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                            │                                │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │     API Service Layer (Token Management, Retry)      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│         HTTPS (Azure AD Token in Authorization Header)           │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                        UXP Backend                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │       Node.js/Express API (JWT Validation Middleware)     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │ Event Routes │  │ Recap Routes │  │ Integration     │ │  │
│  │  │   (CRUD)     │  │  (Submit/    │  │ Routes (Sync)   │ │  │
│  │  │              │  │   Approve)   │  │                 │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │  │
│  │         │                  │                    │          │  │
│  │         └──────────────────┼────────────────────┘          │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │     Database Service (Azure SQL Connection Pool)     │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
┌────────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Azure SQL         │  │  Brandscopic    │  │  QR Tiger       │
│  Database          │  │  API            │  │  API            │
│                    │  │                 │  │                 │
│  - Events          │  │  - Create       │  │  - Generate     │
│  - Recaps          │  │    Project      │  │    QR Code      │
│  - Users           │  │  - Sync Metrics │  │  - Track Scans  │
│  - Clients         │  │  - Get Project  │  │                 │
│  - Programs        │  │    ID           │  │                 │
└────────────────────┘  └─────────────────┘  └─────────────────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Qualtrics API      │
                    │                     │
                    │  - Survey IDs       │
                    │  - Link to Events   │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Power BI           │
                    │  (MOMO BI)          │
                    │                     │
                    │  - Event Dashboards │
                    │  - Recap Analytics  │
                    │  - Client KPIs      │
                    └─────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18.2+ (TypeScript 5.4+)
- **Styling**: Tailwind CSS 3.4+
- **State Management**: React Context API + Custom Hooks
- **Authentication**: MSAL Browser 3.10+ (Azure AD)
- **API Client**: Fetch API with retry logic
- **Calendar**: FullCalendar 6.0+ or React Big Calendar
- **Charts**: Chart.js or Recharts
- **i18n**: react-i18next
- **Build Tool**: Vite 5.2+

#### Backend
- **Runtime**: Node.js 18 LTS
- **Framework**: Express 4.18+
- **Authentication**: jsonwebtoken + jwks-rsa (JWT validation)
- **Database**: Azure SQL Database (or SQL Server)
- **ORM**: Prisma or Sequelize
- **Scheduler**: node-cron (for sync jobs)
- **File Upload**: multer (photo uploads)
- **API Integrations**: axios with retry logic

#### Database
- **Primary**: Azure SQL Database
- **Schema Management**: Prisma migrations or SQL scripts
- **Caching**: Redis (optional, for performance)

#### Infrastructure
- **Hosting**: Google Cloud Run (2 services: frontend + backend)
- **Container**: Docker
- **Registry**: Google Artifact Registry
- **CI/CD**: GitHub Actions or Cloud Build
- **DNS**: Internal DNS zones (IPG network)
- **Monitoring**: Google Cloud Logging + Monitoring
- **Secrets**: Google Secret Manager

---

## Data Model

### Core Entities

#### 1. Client
```typescript
interface Client {
  id: string;                    // UUID
  name: string;                  // "Verizon", "AMEX", etc.
  code: string;                  // "VZ", "AMEX", etc.
  isActive: boolean;
  brandscopicEnabled: boolean;   // Enable Brandscopic integration
  qrTigerEnabled: boolean;       // Enable QR Tiger integration
  qualtricsEnabled: boolean;     // Enable Qualtrics integration
  tenantId?: string;             // For multi-tenant data separation
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

#### 2. Program (Master Program)
```typescript
interface Program {
  id: string;                    // UUID
  clientId: string;              // FK to Client
  name: string;                  // "Verizon Hyperlocal", "AMEX US Open"
  code: string;                  // "VZ_HYPERLOCAL", "AMEX_USOPEN"
  region?: string;               // "Northeast", "Southwest", etc.
  eventType: string;             // "Sampling", "Sponsorship", "Pop-Up"
  status: 'active' | 'inactive' | 'archived';
  logo?: string;                 // URL to logo image
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

#### 3. Event
```typescript
interface Event {
  id: string;                    // UUID (Event ID - unique per day)
  masterProgramId: string;       // FK to Program (Parent ID)
  brandscopicProjectId?: string; // ID from Brandscopic

  // Event Details
  eventName: string;
  eventDate: Date;               // Single date for this event record
  startTime: string;             // HH:MM format
  endTime: string;               // HH:MM format

  // Location
  venueName: string;
  venueType: string;             // "Indoor", "Outdoor", "Virtual"
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  country: string;               // Default: "USA"
  geoLat?: number;               // Geocoded latitude
  geoLng?: number;               // Geocoded longitude

  // Ownership
  businessLeaderId: string;      // FK to User
  projectLeaderId: string;       // FK to User
  fieldManagerId?: string;       // FK to User

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
```

#### 4. EventRecap
```typescript
interface EventRecap {
  id: string;                    // UUID
  eventId: string;               // FK to Event

  // Submission Info
  submittedById: string;         // FK to User
  submittedAt: Date;

  // Approval Info
  status: 'pending' | 'approved' | 'rejected';
  approvedById?: string;         // FK to User
  approvedAt?: Date;
  rejectionReason?: string;

  // Common Metrics (all clients)
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  footprintDescription: string;
  qrScans: number;
  surveysCollected: number;

  // Client-Specific Metrics (JSON)
  clientMetrics: Record<string, any>; // Flexible for client-specific fields

  // Feedback
  eventFeedback: {
    baPerformance?: string;      // Brand Ambassador performance
    salesTeam?: string;
    customerComments?: string;
    trafficFlow?: string;
    attendeeDemographics?: string;
    wouldReturn: boolean;
  };

  // Photos
  photos: EventPhoto[];          // Array of photo objects

  additionalComments?: string;

  // Sync to MOMO BI
  momoSyncStatus: 'pending' | 'synced' | 'failed';
  momoLastSync?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface EventPhoto {
  id: string;
  url: string;                   // Azure Blob Storage URL
  filename: string;
  uploadedAt: Date;
  uploadedBy: string;
}
```

#### 5. PremiumDistribution
```typescript
interface PremiumDistribution {
  id: string;                    // UUID
  eventRecapId: string;          // FK to EventRecap
  premiumType: string;           // "Popsocket", "Water Bottle", "Starbucks Gift Card"
  quantityDistributed: number;
  quantityRemaining?: number;
  createdAt: Date;
}
```

#### 6. QRCode
```typescript
interface QRCode {
  id: string;                    // UUID
  qrTigerId: string;             // ID from QR Tiger
  name: string;
  url: string;                   // Destination URL
  qrCodeImageUrl: string;        // URL to QR code image
  status: 'active' | 'inactive';

  // Associations
  eventAssociations: EventQRAssociation[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface EventQRAssociation {
  id: string;
  qrCodeId: string;              // FK to QRCode
  eventId: string;               // FK to Event
  isActive: boolean;             // Only one event per QR code can be active
  scansCount: number;            // Synced from QR Tiger
  createdAt: Date;
}
```

#### 7. Survey
```typescript
interface Survey {
  id: string;                    // UUID
  qualtricsSurveyId: string;     // ID from Qualtrics
  name: string;
  eventId: string;               // FK to Event (one survey per event)
  createdAt: Date;
  createdBy: string;
}
```

#### 8. User
```typescript
interface User {
  id: string;                    // UUID
  azureAdId: string;             // From Azure AD
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'business_leader' | 'project_manager' | 'field_manager' | 'brand_ambassador';
  clientIds: string[];           // Access to specific clients (empty = all)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema Diagram

```
Client (1) ─────────< (many) Program
                         │
                         │
                         │ (Parent ID / Master Program ID)
                         │
                         ▼
                      Event (1) ─────────< (many) EventRecap
                         │                         │
                         │                         │
                         │                         ▼
                         │                   PremiumDistribution (many)
                         │
                         │
                         ├─────────< (many) EventQRAssociation ───────> QRCode (many)
                         │
                         │
                         └─────────< (1) Survey

User (many) ──────────────────────────────────────> Event (many)
  │                                                      │
  │ (businessLeaderId, projectLeaderId, fieldManagerId) │
  │                                                      │
  └──────────────────────────────────────────> EventRecap (many)
                  (submittedById, approvedById)
```

---

## Feature Specifications

### Feature 1: Event Management

#### 1.1 Create Event
**Flow**:
1. User clicks "+ New Event" button
2. Form displays with fields:
   - Master Program (dropdown, filterable)
   - Event Name (text)
   - Event Date(s) (date picker, supports single or multi-day)
   - Start Time / End Time (time picker, per day for multi-day)
   - Venue Name (text)
   - Venue Type (dropdown: Indoor, Outdoor, Virtual)
   - Address Line (text)
   - City (dropdown, searchable)
   - State (dropdown)
   - Zip (text, auto-populate city/state if possible)
   - Business Leader (user selector)
   - Project Leader (user selector)
   - Status (dropdown: Planned, Tentative, Confirmed)
3. User fills form and clicks "Save"
4. Validation:
   - All required fields filled
   - End time > Start time
   - Date is in the future (warning if in past)
5. Backend:
   - Generate Event ID (UUID) for each day
   - If multi-day event, create separate Event record per day
   - All days share same Master Program ID
   - Store in database
   - If client has Brandscopic enabled:
     - Call Brandscopic API to create project
     - Store Brandscopic Project ID
     - Set syncStatus = 'synced'
6. Success message: "Event created successfully. Synced to Brandscopic."
7. Redirect to Event Detail view

#### 1.2 Edit Event
**Flow**:
1. User clicks "Edit" on event card
2. Form pre-populates with existing data
3. User modifies fields
4. If status = 'Confirmed', show warning: "Event is confirmed. Changes will sync to Brandscopic."
5. User clicks "Save"
6. Backend:
   - Update database
   - If Brandscopic enabled:
     - Call Brandscopic Update API
     - Update syncStatus
7. Success message: "Event updated. Synced to Brandscopic."

#### 1.3 Delete Event
**Flow**:
1. User clicks "Delete" on event card
2. Confirmation modal: "Delete this event? This action cannot be undone."
3. If event has recap data, show warning: "This event has recap data. Are you sure?"
4. User confirms
5. Backend:
   - If status = 'Planned' or 'Tentative': Allow deletion
   - If status = 'Confirmed' or later: Require admin role or show error
   - Soft delete (set deletedAt timestamp)
   - If Brandscopic enabled:
     - Call Brandscopic Close Event API
6. Success message: "Event deleted."

#### 1.4 Calendar View
**Interface**:
- Month/Week/Day views (toggle buttons)
- Filters:
  - Client (multi-select dropdown)
  - Program (multi-select dropdown)
  - Status (multi-select dropdown)
  - Date Range (date picker)
- Color coding:
  - By Client (default)
  - By Status (toggle)
- Event display:
  - Event name
  - Venue name
  - Start time
  - Status badge
- Click event to open detail modal
- Drag-and-drop to reschedule (with confirmation)

---

### Feature 2: Recap Management

#### 2.1 Submit Recap
**Flow**:
1. Field Manager navigates to Events → Filter by "My Events" → Status = "Active" or "Completed"
2. Click "Submit Recap" button on event card
3. Recap form displays:
   - Event details (read-only): Name, Date, Venue, Client, Program
   - Common fields:
     - Indoor/Outdoor (radio buttons)
     - Footprint Description (textarea)
     - QR Scans (number input, sync from QR Tiger if available)
     - Surveys Collected (number input)
   - Client-specific fields (dynamic based on client):
     - **Verizon Hyperlocal**:
       - # Sales Reps On-Site (number)
       - # Sales Made (number)
       - Premiums Distributed (repeatable section):
         - Premium Type (dropdown: Popsocket, Water Bottle, Cooling Towel, Starbucks Gift Card, Other)
         - Quantity Distributed (number)
         - Quantity Remaining (number)
       - Competitors Nearby? (Yes/No, textarea for description)
     - **AMEX US Open**:
       - Attendance (number)
       - Talent Signings (number)
       - Game Participants (number)
       - Charging Locker Usage (number)
   - Feedback (all clients):
     - BA Performance (textarea)
     - Sales Team (textarea)
     - Customer Comments (textarea)
     - Traffic Flow (textarea)
     - Attendee Demographics (textarea)
     - Would Return to Event? (Yes/No)
   - Photos (multi-file upload, drag-and-drop, max 20 MB per file)
   - Additional Comments (textarea)
4. User can "Save Draft" or "Submit for Approval"
5. Backend:
   - If "Save Draft": status = 'draft', user can edit later
   - If "Submit for Approval": status = 'pending', notify Business Leader
   - Store in EventRecap table
   - Upload photos to Azure Blob Storage
6. Success message: "Recap submitted for approval. Business Leader will be notified."

#### 2.2 Approve/Reject Recap
**Flow**:
1. Business Leader navigates to Recaps → Approval Queue
2. Filter by:
   - Client
   - Program
   - Date Range
   - Field Manager
3. List displays pending recaps:
   - Event name
   - Date
   - Field Manager
   - Submitted At
   - Quick metrics (QR scans, surveys, premiums)
4. Click recap to open detail view
5. Review data and photos
6. Actions:
   - Approve (button)
   - Reject (button, requires reason in textarea)
7. Backend:
   - If Approve: status = 'approved', sync to MOMO BI (Power Automate flow)
   - If Reject: status = 'rejected', notify Field Manager with reason
8. Success message: "Recap approved. Data synced to MOMO BI." or "Recap rejected. Field Manager notified."

#### 2.3 Bulk Approve
**Flow**:
1. Business Leader in Approval Queue
2. Select multiple recaps (checkboxes)
3. Click "Bulk Approve" button
4. Confirmation modal: "Approve X recaps?"
5. User confirms
6. Backend:
   - Approve all selected recaps
   - Sync to MOMO BI in batch
7. Success message: "X recaps approved."

---

### Feature 3: Integration Management

#### 3.1 Brandscopic Sync
**API Endpoints** (UXP Backend → Brandscopic):
- **Create Event**: `POST /api/brandscopic/events`
  - Request: Event details (name, date, venue, etc.)
  - Response: Brandscopic Project ID
- **Update Event**: `PUT /api/brandscopic/events/:projectId`
  - Request: Updated event details
  - Response: Success/failure
- **Close Event**: `DELETE /api/brandscopic/events/:projectId`
  - Response: Success/failure
- **Get Event Metrics**: `GET /api/brandscopic/events/:projectId/metrics`
  - Response: Impressions, Photos, Interactions, Custom Fields

**Sync Flow**:
1. **UXP → Brandscopic** (Event Creation):
   - User creates event in UXP
   - UXP backend calls Brandscopic Create API
   - Store Brandscopic Project ID in UXP database
   - Set syncStatus = 'synced'
2. **Brandscopic → UXP** (Post-Event Metrics):
   - Nightly scheduled job (7:00 AM):
     - UXP backend queries all events with status = 'completed' and brandscopicProjectId not null
     - Call Brandscopic Get Metrics API for each event
     - Update EventRecap with metrics (if recap already exists, merge data)
   - Manual sync:
     - User clicks "Sync Now" button in Event List
     - Sync individual event or all events in program

**Error Handling**:
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- If all retries fail: syncStatus = 'failed', log error, notify admin
- User can manually retry from Event Detail view

#### 3.2 QR Tiger Sync
**API Endpoints** (UXP Backend → QR Tiger):
- **Create QR Code**: `POST /api/qrtiger/qrcodes`
  - Request: URL, name
  - Response: QR Tiger ID, QR code image URL
- **Get Scan Count**: `GET /api/qrtiger/qrcodes/:qrTigerId/scans`
  - Response: Scan count

**Sync Flow**:
1. User creates QR code in UXP → QR Codes page
2. Enter URL and name
3. UXP backend calls QR Tiger Create API
4. Store QR Tiger ID and image URL in database
5. User associates QR code with event (Event QR Association)
6. Nightly sync: Fetch scan counts for all active QR codes
7. Update EventRecap with QR scan count

#### 3.3 Qualtrics Survey Mapping
**Flow**:
1. User creates survey in Qualtrics (external system)
2. In UXP, navigate to Event Detail
3. Click "Link Survey"
4. Enter Qualtrics Survey ID (paste from Qualtrics URL)
5. UXP stores Survey record linked to Event
6. Display survey link in Event Detail view
7. Field Managers can share survey link at events
8. (Future: Auto-sync survey responses)

---

## User Roles & Permissions

### Role Definitions

| Role | Description | Key Responsibilities |
|------|-------------|----------------------|
| **Admin** | System administrator | Manage users, clients, programs, system settings |
| **Business Leader (BL)** | Client account lead | Create events, approve recaps, view analytics |
| **Project Manager (PM)** | Event coordinator | Create events, manage event details, coordinate field teams |
| **Field Manager (FM)** | On-site event lead | Submit recaps, manage field team, upload photos |
| **Brand Ambassador (BA)** | On-site staff | View event details, collect data (future: submit partial recaps) |

### Permission Matrix

| Feature | Admin | BL | PM | FM | BA |
|---------|-------|----|----|----|----|
| **Events** |
| Create Event | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Event (Planned/Tentative) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Event (Confirmed/Active) | ✅ | ✅ | ⚠️* | ❌ | ❌ |
| Delete Event | ✅ | ✅ | ⚠️* | ❌ | ❌ |
| View Events (All Clients) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Events (Assigned Clients) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar View | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Recaps** |
| Submit Recap | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Recap (Draft) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Recap (Pending/Approved) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Recap | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reject Recap | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bulk Approve Recaps | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Integrations** |
| Sync to Brandscopic | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create QR Code | ✅ | ✅ | ✅ | ❌ | ❌ |
| Associate QR Code with Event | ✅ | ✅ | ✅ | ❌ | ❌ |
| Link Qualtrics Survey | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Analytics** |
| View Power BI Dashboards (All) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Power BI Dashboards (Client) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Clients | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Programs | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

*⚠️ = Restricted (only if they created the event)*

---

## API Specifications

### Authentication
All API requests require an Azure AD Bearer token in the `Authorization` header.

**Backend Middleware**:
```javascript
// JWT validation + group membership check
// Reuse from Employee Onboarding System: backend/middleware/auth.js
```

### REST API Endpoints

#### Events

**Create Event**
```
POST /api/events
Authorization: Bearer <token>

Request:
{
  "masterProgramId": "uuid",
  "eventName": "Verizon 5G Activation",
  "eventDates": ["2025-06-01", "2025-06-02"],  // Multi-day support
  "startTime": "10:00",
  "endTime": "18:00",
  "venueName": "Times Square",
  "venueType": "outdoor",
  "addressLine": "Times Square",
  "city": "New York",
  "state": "NY",
  "zip": "10036",
  "businessLeaderId": "uuid",
  "projectLeaderId": "uuid",
  "status": "planned"
}

Response:
{
  "success": true,
  "events": [
    {
      "id": "event-uuid-1",  // Event ID for June 1
      "masterProgramId": "uuid",
      "eventDate": "2025-06-01",
      "brandscopicProjectId": "bs-12345",
      "syncStatus": "synced"
    },
    {
      "id": "event-uuid-2",  // Event ID for June 2
      "masterProgramId": "uuid",
      "eventDate": "2025-06-02",
      "brandscopicProjectId": "bs-12346",
      "syncStatus": "synced"
    }
  ]
}
```

**Get Events**
```
GET /api/events?clientId=uuid&programId=uuid&status=confirmed&startDate=2025-06-01&endDate=2025-06-30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "masterProgramId": "uuid",
      "eventName": "...",
      "eventDate": "2025-06-01",
      // ... all event fields
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

**Update Event**
```
PUT /api/events/:eventId
Authorization: Bearer <token>

Request:
{
  "eventName": "Updated Name",
  "status": "confirmed"
}

Response:
{
  "success": true,
  "event": { /* updated event */ },
  "brandscopicSync": {
    "status": "synced",
    "syncedAt": "2025-11-22T12:00:00Z"
  }
}
```

**Delete Event**
```
DELETE /api/events/:eventId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Event deleted",
  "brandscopicSync": {
    "status": "closed",
    "closedAt": "2025-11-22T12:00:00Z"
  }
}
```

#### Recaps

**Submit Recap**
```
POST /api/recaps
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
eventId: uuid
indoorOutdoor: "outdoor"
footprintDescription: "..."
qrScans: 150
surveysCollected: 200
clientMetrics: {"salesReps": 3, "salesMade": 12}
feedback: {...}
photos: [file1.jpg, file2.jpg]
additionalComments: "..."
status: "pending"  // or "draft"

Response:
{
  "success": true,
  "recap": {
    "id": "recap-uuid",
    "eventId": "uuid",
    "status": "pending",
    "photos": [
      { "id": "photo-uuid-1", "url": "https://..." },
      { "id": "photo-uuid-2", "url": "https://..." }
    ]
  },
  "notification": {
    "sent": true,
    "recipient": "businesslead@momentumww.com"
  }
}
```

**Approve/Reject Recap**
```
PATCH /api/recaps/:recapId/approval
Authorization: Bearer <token>

Request:
{
  "action": "approve",  // or "reject"
  "rejectionReason": "Incomplete data"  // if action = "reject"
}

Response:
{
  "success": true,
  "recap": {
    "id": "recap-uuid",
    "status": "approved",  // or "rejected"
    "approvedById": "user-uuid",
    "approvedAt": "2025-11-22T12:00:00Z"
  },
  "momoSync": {
    "status": "synced",  // if approved
    "syncedAt": "2025-11-22T12:05:00Z"
  }
}
```

#### Integrations

**Sync Event to Brandscopic**
```
POST /api/integrations/brandscopic/sync/:eventId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "event": {
    "id": "event-uuid",
    "brandscopicProjectId": "bs-12345",
    "syncStatus": "synced",
    "lastSync": "2025-11-22T12:00:00Z"
  }
}
```

**Get Brandscopic Metrics**
```
GET /api/integrations/brandscopic/metrics/:eventId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "metrics": {
    "impressions": 5000,
    "photos": 25,
    "interactions": 300,
    "customFields": {
      "field1": "value1"
    }
  },
  "syncedAt": "2025-11-22T12:00:00Z"
}
```

**Create QR Code**
```
POST /api/integrations/qrtiger/qrcodes
Authorization: Bearer <token>

Request:
{
  "name": "Verizon Survey QR",
  "url": "https://survey.example.com/vz-survey"
}

Response:
{
  "success": true,
  "qrCode": {
    "id": "qr-uuid",
    "qrTigerId": "qt-12345",
    "name": "Verizon Survey QR",
    "url": "https://...",
    "qrCodeImageUrl": "https://qrtiger.com/image/..."
  }
}
```

---

## UI/UX Design Requirements

### Design Principles
1. **Mobile-First**: Field Managers submit recaps from mobile devices
2. **Dark Mode**: Support for light/dark themes (reuse from Employee Onboarding)
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Consistency**: Reuse UI component library (Button, Card, Input, etc.)
5. **Performance**: Fast load times (<3s), optimized images
6. **i18n Ready**: English (primary), Spanish, Japanese (future)

### Key Screens

#### 1. Dashboard
**Layout**:
- Stats cards (top row):
  - Total Events (this month)
  - Confirmed Events
  - Pending Recaps
  - Completed Recaps
- Calendar widget (month view, clickable events)
- Recent Activity feed (last 10 actions)
- Quick Actions (buttons):
  - + New Event
  - Submit Recap
  - Approval Queue

#### 2. Event List
**Layout**:
- Filters sidebar (left):
  - Client (multi-select)
  - Program (multi-select)
  - Status (multi-select)
  - Date Range
  - Search (event name, venue)
- Event cards (right, grid or list view toggle):
  - Event name (bold)
  - Date + time
  - Venue name + city
  - Status badge (color-coded)
  - Quick actions: Edit, Delete, View Details, Submit Recap
- Pagination (bottom)

#### 3. Event Detail
**Layout**:
- Header: Event name, status badge, Edit/Delete buttons
- Tabs:
  - **Overview**: All event details (read-only or edit mode)
  - **Recap**: Recap data (if exists), or "Submit Recap" button
  - **QR Codes**: Associated QR codes with scan counts
  - **Survey**: Linked Qualtrics survey (if exists)
  - **Brandscopic**: Sync status, Brandscopic Project ID, last sync time, "Sync Now" button
- Sidebar: Timeline (created, updated, confirmed, recap submitted, recap approved)

#### 4. Recap Form (Mobile-Optimized)
**Layout**:
- Event details (read-only header):
  - Event name
  - Date + time
  - Venue
- Form sections (collapsible accordions):
  - **Basic Info**: Indoor/Outdoor, Footprint Description, QR Scans, Surveys Collected
  - **Client Metrics**: Dynamic fields based on client (e.g., Verizon: Sales Reps, Sales Made, Premiums)
  - **Feedback**: BA Performance, Sales Team, Customer Comments, Traffic Flow, Demographics, Would Return?
  - **Photos**: Drag-and-drop upload, preview thumbnails, delete button per photo
  - **Additional Comments**: Textarea
- Sticky footer:
  - Save Draft (secondary button)
  - Submit for Approval (primary button)

#### 5. Approval Queue
**Layout**:
- Filters (top):
  - Client, Program, Field Manager, Date Range
- Recap list (left, scrollable):
  - Event name
  - Date
  - Field Manager
  - Submitted At
  - Quick metrics (QR scans, surveys)
  - Checkbox (for bulk approve)
- Recap detail (right):
  - Event details
  - Recap data
  - Photo gallery (lightbox on click)
  - Approve/Reject buttons
- Bulk actions bar (bottom, appears when checkboxes selected):
  - Bulk Approve button

#### 6. Calendar View
**Layout**:
- Toolbar (top):
  - View toggle: Month, Week, Day
  - Date navigation: < Today >
  - Filters: Client, Program, Status
  - Color-code toggle: By Client, By Status
- Calendar grid:
  - Events displayed as colored blocks
  - Event name + time on block
  - Click to open detail modal
  - Drag-and-drop to reschedule (with confirmation)

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
**Goal**: Preserve 100% of reusable infrastructure from Employee Onboarding System

**Tasks**:
1. Create new Git branch: `feature/uxp-migration`
2. Copy reusable infrastructure:
   - `/auth/*` (MSAL, Azure AD, JWT validation)
   - `/components/ui/*` (26 components)
   - `/hooks/*` (useLocalStorage, useDebounce, etc.)
   - `/utils/*` (telemetry, i18n, formatting, etc.)
   - `/backend/middleware/auth.js`
   - `/backend/server.js` (Express setup)
3. Archive onboarding-specific code (don't delete yet)
4. Update Azure AD app registration:
   - Add UXP frontend URL to redirect URIs
   - Update required group IDs (if different from Employee Onboarding)
5. Set up new Azure SQL Database:
   - Create database in Azure Portal
   - Configure connection string
   - Test connection from backend
6. Update environment variables:
   - `.env.local` (frontend): API URLs, Azure AD config
   - `.env` (backend): Database connection, Brandscopic API keys, QR Tiger API keys, Qualtrics API keys

**Deliverables**:
- ✅ Authentication working (login, logout, profile)
- ✅ UI component library rendering correctly
- ✅ Backend server running with health check
- ✅ Database connection established
- ✅ Dark mode working
- ✅ Telemetry tracking working

---

### Phase 2: UXP Data Model (Week 3)
**Goal**: Define UXP-specific types and database schema

**Tasks**:
1. Create `types.ts` for UXP:
   - Client, Program, Event, EventRecap, PremiumDistribution, QRCode, Survey, User
   - Remove all onboarding-specific types
2. Design database schema:
   - SQL scripts or Prisma schema
   - Tables: Clients, Programs, Events, EventRecaps, PremiumDistributions, QRCodes, EventQRAssociations, Surveys, Users
   - Foreign key constraints
   - Indexes on commonly queried fields
3. Create database migrations:
   - Initial schema creation
   - Seed data (test clients, programs, users)
4. Create mock data:
   - `mockData.ts` with sample events, recaps, QR codes
   - Use for component development and demos

**Deliverables**:
- ✅ `types.ts` complete with all UXP entities
- ✅ Database schema created
- ✅ Seed data inserted
- ✅ Mock data available for frontend development

---

### Phase 3: UXP Services (Week 4)
**Goal**: Build event management services

**Tasks**:
1. Create `eventService.ts`:
   - CRUD operations (create, read, update, delete)
   - Validation logic
   - Brandscopic sync integration
2. Create `recapService.ts`:
   - Submit recap (with photo upload to Azure Blob Storage)
   - Approve/reject recap
   - MOMO BI sync (Power Automate trigger)
3. Create `brandscopicService.ts`:
   - Create project API call
   - Update project API call
   - Close project API call
   - Get metrics API call
   - Retry logic (3 attempts with exponential backoff)
4. Create `qrTigerService.ts`:
   - Create QR code API call
   - Get scan count API call
5. Create `qualtricsService.ts`:
   - Validate survey ID (future: fetch survey metadata)
6. Adapt `apiService.ts`:
   - Keep token management
   - Remove AI agent calls (or repurpose for event insights)

**Deliverables**:
- ✅ All services implemented and tested
- ✅ API integration tests passing (use mock Brandscopic API if needed)
- ✅ Error handling and retry logic working

---

### Phase 4: UXP Contexts (Week 5)
**Goal**: Create UXP-specific state management

**Tasks**:
1. Create `EventContext.tsx`:
   - Events state (list, filters, selected event)
   - CRUD operations
   - Loading/error states
2. Create `RecapContext.tsx`:
   - Recaps state (pending, approved, rejected)
   - Submit/approve/reject operations
3. Create `CalendarContext.tsx`:
   - Calendar view state (month/week/day)
   - Filter state (client, program, status)
4. Create `IntegrationContext.tsx`:
   - Brandscopic sync status
   - QR Tiger sync status
5. Reuse existing:
   - `AuthContext.tsx`
   - `TourContext.tsx`

**Deliverables**:
- ✅ All contexts working
- ✅ State management tested with mock data
- ✅ Context providers integrated in App.tsx

---

### Phase 5: UXP Components (Week 6-8)
**Goal**: Build event management UI

**Tasks** (can be parallelized across Feature Developer agents):

**Agent 1: Event Management Components**
1. `EventForm.tsx` - Create/edit event form
2. `EventList.tsx` - Event directory with filters
3. `EventCard.tsx` - Event card component
4. `EventDetailModal.tsx` - Event details view
5. `EventDashboard.tsx` - Event statistics

**Agent 2: Recap Management Components**
1. `RecapForm.tsx` - Post-event recap submission
2. `RecapApprovalQueue.tsx` - BL approval workflow
3. `RecapCard.tsx` - Recap card component
4. `RecapDetailModal.tsx` - Recap details and approval
5. `RecapMetricsView.tsx` - Recap analytics

**Agent 3: Calendar & Integration Components**
1. `CalendarView.tsx` - Calendar visualization (FullCalendar)
2. `BrandscopicSyncStatus.tsx` - Sync status display
3. `QRCodeManager.tsx` - QR code creation and association
4. `SurveyLinkModal.tsx` - Link Qualtrics survey
5. `IntegrationSettings.tsx` - API configuration

**Agent 4: Admin & Analytics Components**
1. `UserManagement.tsx` - Admin user CRUD
2. `ClientManagement.tsx` - Admin client CRUD
3. `ProgramManagement.tsx` - Admin program CRUD
4. `PowerBIDashboard.tsx` - Embedded Power BI (iframe)
5. `ReportExport.tsx` - Export to Excel/PDF

**Deliverables**:
- ✅ All components implemented
- ✅ Dark mode working
- ✅ Mobile-responsive
- ✅ Accessibility tested (keyboard nav, ARIA labels)

---

### Phase 6: Backend Routes (Week 9)
**Goal**: Create UXP API endpoints

**Tasks**:
1. Create `eventRoutes.js`:
   - POST /api/events (create)
   - GET /api/events (list with filters)
   - GET /api/events/:id (detail)
   - PUT /api/events/:id (update)
   - DELETE /api/events/:id (delete)
2. Create `recapRoutes.js`:
   - POST /api/recaps (submit)
   - GET /api/recaps (list)
   - GET /api/recaps/:id (detail)
   - PATCH /api/recaps/:id/approval (approve/reject)
   - POST /api/recaps/bulk-approve (bulk approve)
3. Create `brandscopicRoutes.js`:
   - POST /api/integrations/brandscopic/sync/:eventId (manual sync)
   - GET /api/integrations/brandscopic/metrics/:eventId (get metrics)
4. Create `qrTigerRoutes.js`:
   - POST /api/integrations/qrtiger/qrcodes (create QR code)
   - GET /api/integrations/qrtiger/qrcodes/:id/scans (get scan count)
5. Create `analyticsRoutes.js`:
   - GET /api/analytics/events (event summary)
   - GET /api/analytics/recaps (recap summary)
6. Adapt `server.js`:
   - Import new routes
   - Keep auth middleware
   - Update CORS for UXP frontend domain

**Deliverables**:
- ✅ All routes implemented
- ✅ Postman tests passing
- ✅ Error handling consistent
- ✅ Logging in place

---

### Phase 7: Testing & Refinement (Week 10)
**Goal**: End-to-end testing and polish

**Tasks**:
1. **Manual Testing**:
   - Event creation flow (single-day, multi-day)
   - Calendar integration
   - Recap submission (with photos)
   - Approval workflow
   - Brandscopic sync (manual and scheduled)
   - QR code creation and association
   - Survey linking
   - Export functions
2. **i18n Updates**:
   - Update English translations
   - Add Spanish translations (key screens)
   - Add Japanese translations (future)
3. **Telemetry**:
   - Add UXP-specific events (eventCreated, recapSubmitted, recapApproved, etc.)
   - Test Power Automate flow
4. **Tour Update**:
   - Create UXP onboarding tour (5-7 steps)
   - Test tour flow
5. **Documentation**:
   - Update README.md for UXP
   - Update CLAUDE.md with new context
   - Create user guide (PDF)
   - Create API documentation

**Deliverables**:
- ✅ All features tested and working
- ✅ Zero critical bugs
- ✅ i18n complete for English
- ✅ Telemetry tracking all key events
- ✅ Tour complete
- ✅ Documentation complete

---

### Phase 8: Deployment (Week 11)
**Goal**: Deploy to Google Cloud Run

**Tasks**:
1. **Frontend Deployment**:
   - Update Dockerfile (reuse from Employee Onboarding)
   - Update nginx.conf
   - Build Docker image
   - Push to Artifact Registry
   - Deploy to Cloud Run
   - Configure custom domain
2. **Backend Deployment**:
   - Update Dockerfile
   - Build Docker image
   - Push to Artifact Registry
   - Deploy to Cloud Run
   - Configure environment variables (Secret Manager)
   - Configure VPC connector (for Azure SQL access)
3. **Database Setup**:
   - Create production database in Azure SQL
   - Run migrations
   - Seed initial data (clients, programs)
4. **DNS Configuration**:
   - Create internal DNS zones (IPG network)
   - Configure on-prem DNS forwarders
5. **Testing**:
   - Smoke test all features in production
   - Load testing (if needed)
6. **Monitoring**:
   - Set up Cloud Logging
   - Set up Cloud Monitoring alerts
   - Test error notifications

**Deliverables**:
- ✅ Frontend deployed to Cloud Run
- ✅ Backend deployed to Cloud Run
- ✅ Database migrated and seeded
- ✅ DNS working (internal access)
- ✅ Monitoring in place

---

## Development Roadmap

### 11-Week Timeline

| Week | Phase | Key Deliverables | Owner |
|------|-------|------------------|-------|
| 1-2 | Foundation | Auth working, UI library, backend setup, database connection | Luis |
| 3 | Data Model | Types defined, schema created, seed data | Luis |
| 4 | Services | Event service, recap service, integrations | Luis |
| 5 | Contexts | State management contexts | Luis |
| 6-8 | Components | All UI components (4 parallel agents) | **Agents 1-4** |
| 9 | Backend Routes | All API endpoints | Luis |
| 10 | Testing | End-to-end testing, i18n, telemetry, tour | Luis + Kristen |
| 11 | Deployment | Cloud Run deployment, DNS, monitoring | Luis + Jeff |

**Total Effort**: ~11 weeks (2.75 months)

---

## Testing & Quality Assurance

### Testing Strategy

#### 1. Unit Tests
**Tools**: Jest + React Testing Library
**Coverage**:
- Services (eventService, recapService, brandscopicService)
- Utilities (formatting, validation, dateFormatting)
- Context logic (state updates, CRUD operations)

**Example**:
```javascript
// Test: eventService.createEvent()
test('creates single-day event and syncs to Brandscopic', async () => {
  const event = await eventService.createEvent({ /* ... */ });
  expect(event.id).toBeDefined();
  expect(event.brandscopicProjectId).toBeDefined();
  expect(event.syncStatus).toBe('synced');
});
```

#### 2. Integration Tests
**Tools**: Supertest (backend), MSW (mock API)
**Coverage**:
- API endpoints (event routes, recap routes)
- Database operations (CRUD)
- Brandscopic API integration (mocked)

**Example**:
```javascript
// Test: POST /api/events
test('POST /api/events creates event and returns 201', async () => {
  const response = await request(app)
    .post('/api/events')
    .set('Authorization', 'Bearer mocktoken')
    .send({ /* event data */ });
  expect(response.status).toBe(201);
  expect(response.body.events).toHaveLength(1);
});
```

#### 3. E2E Tests
**Tools**: Playwright or Cypress
**Coverage**:
- Event creation flow (form validation, submission, success message)
- Recap submission flow (photo upload, approval)
- Calendar interaction (click event, edit, save)
- Brandscopic sync (manual sync button)

**Example**:
```javascript
// Test: Create event E2E
test('user can create event', async ({ page }) => {
  await page.goto('/events');
  await page.click('text=+ New Event');
  await page.fill('input[name="eventName"]', 'Test Event');
  // ... fill all fields
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Event created')).toBeVisible();
});
```

#### 4. Manual Testing Checklist

**Event Management**:
- [ ] Create single-day event
- [ ] Create multi-day event (3 days)
- [ ] Edit event (planned status)
- [ ] Edit event (confirmed status, shows warning)
- [ ] Delete event (planned status)
- [ ] Delete event (confirmed status, restricted)
- [ ] Calendar view displays events correctly
- [ ] Filter events by client, program, status
- [ ] Drag-and-drop reschedule

**Recap Management**:
- [ ] Submit recap (all fields, 5 photos)
- [ ] Save recap as draft
- [ ] Edit draft recap
- [ ] Submit draft recap for approval
- [ ] BL approves recap
- [ ] BL rejects recap with reason
- [ ] FM receives rejection notification
- [ ] Bulk approve 10 recaps

**Integrations**:
- [ ] Manual sync event to Brandscopic
- [ ] Scheduled sync retrieves metrics from Brandscopic
- [ ] Create QR code via QR Tiger
- [ ] Associate QR code with event
- [ ] View QR scan count
- [ ] Link Qualtrics survey to event

**Analytics**:
- [ ] Power BI dashboard loads
- [ ] Filter dashboard by client
- [ ] Export report to Excel
- [ ] Export report to PDF

**Mobile**:
- [ ] All screens responsive on mobile (375px width)
- [ ] Recap form usable on mobile
- [ ] Photo upload works on mobile
- [ ] Calendar view works on mobile

**Dark Mode**:
- [ ] Toggle dark mode
- [ ] All components render correctly in dark mode
- [ ] Theme persists on page reload

**i18n**:
- [ ] Switch language to Spanish
- [ ] All UI text translates
- [ ] Date/time formats update

---

## Deployment Strategy

### Infrastructure

**Frontend**:
- **Service Name**: `uxp-frontend`
- **Container**: Nginx + React SPA
- **Port**: 8080
- **Region**: us-east4
- **Min Instances**: 1
- **Max Instances**: 10
- **CPU**: 1 vCPU
- **Memory**: 512 MB

**Backend**:
- **Service Name**: `uxp-backend`
- **Container**: Node.js/Express
- **Port**: 8080
- **Region**: us-east4
- **Min Instances**: 1
- **Max Instances**: 10
- **CPU**: 2 vCPU
- **Memory**: 2 GB
- **Secrets**: CLIENT_SECRET, DB_PASSWORD (from Secret Manager)

**Database**:
- **Type**: Azure SQL Database
- **Tier**: Standard S1 (20 DTUs) - can scale up
- **Region**: East US
- **Backup**: Automated daily backups (7-day retention)
- **Firewall**: Allow Azure services + specific IP ranges

**Storage**:
- **Type**: Azure Blob Storage
- **Container**: `uxp-event-photos`
- **Access**: Private (signed URLs)
- **Redundancy**: LRS (Locally Redundant Storage)

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: Deploy UXP to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build backend image
        run: docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/uxp-backend:${{ github.sha }} ./backend
      - name: Push to Artifact Registry
        run: docker push gcr.io/${{ secrets.GCP_PROJECT }}/uxp-backend:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy uxp-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/uxp-backend:${{ github.sha }} \
            --platform managed \
            --region us-east4

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build frontend image
        run: docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/uxp-frontend:${{ github.sha }} .
      - name: Push to Artifact Registry
        run: docker push gcr.io/${{ secrets.GCP_PROJECT }}/uxp-frontend:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy uxp-frontend \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/uxp-frontend:${{ github.sha }} \
            --platform managed \
            --region us-east4
```

### Monitoring & Alerts

**Logs to Monitor**:
- Event creation errors
- Brandscopic API failures
- Database connection errors
- Authentication failures
- 500 errors

**Alerts**:
- Email alert if error rate > 5% over 5 minutes
- Slack alert if backend service down
- Email alert if database CPU > 80% for 10 minutes

---

## Appendices

### Appendix A: Client-Specific Recap Fields

**Verizon Hyperlocal**:
```typescript
{
  salesRepCount: number;
  salesMade: number;
  premiumsDistributed: [
    { type: "Popsocket", distributed: 100, remaining: 20 },
    { type: "Water Bottle", distributed: 50, remaining: 10 }
  ];
  competitorsNearby: boolean;
  competitorDescription: string;
}
```

**AMEX US Open**:
```typescript
{
  attendance: number;
  talentSignings: number;
  gameParticipants: number;
  chargingLockerUsage: number;
}
```

**Coca-Cola**:
```typescript
{
  samplesDistributed: number;
  photosWithBrand: number;
  socialMediaMentions: number;
}
```

### Appendix B: Brandscopic API Documentation

**Base URL**: `https://api.brandscopic.com/v2`

**Authentication**: API Key in header `X-API-Key`

**Create Project**:
```
POST /projects
{
  "name": "Event Name",
  "start_date": "2025-06-01",
  "end_date": "2025-06-01",
  "venue": "Times Square",
  "city": "New York",
  "state": "NY"
}

Response:
{
  "project_id": "bs-12345",
  "status": "created"
}
```

**Update Project**:
```
PUT /projects/{project_id}
{
  "name": "Updated Name"
}

Response:
{
  "project_id": "bs-12345",
  "status": "updated"
}
```

**Get Metrics**:
```
GET /projects/{project_id}/metrics

Response:
{
  "impressions": 5000,
  "photos": 25,
  "interactions": 300,
  "custom_fields": {...}
}
```

### Appendix C: QR Tiger API Documentation

**Base URL**: `https://api.qrtiger.com/v1`

**Authentication**: API Key in header `Authorization: Bearer {api_key}`

**Create QR Code**:
```
POST /qrcodes
{
  "type": "url",
  "content": "https://survey.example.com",
  "name": "Verizon Survey QR"
}

Response:
{
  "qr_id": "qt-12345",
  "qr_url": "https://qrtiger.com/qt-12345",
  "image_url": "https://cdn.qrtiger.com/qt-12345.png"
}
```

**Get Scan Count**:
```
GET /qrcodes/{qr_id}/scans

Response:
{
  "qr_id": "qt-12345",
  "total_scans": 150,
  "scans_today": 12
}
```

---

**End of UXP Technical Specification**

---

**Document Version**: 1.0.0
**Last Updated**: November 22, 2025
**Next Review**: December 2025
**Contact**: Luis Bustos (luis.bustos@momentumww.com)
