# UXP Platform - Parallel Agent Execution Prompts

**Date**: November 22, 2025
**Project**: Transform Employee Onboarding → UXP (Unified Experience Platform)
**Priority**: Core event management hierarchy first, external APIs later

---

## 🎭 Experiential Marketing Agency Roles

Based on Momentum as an experiential marketing agency, here are the UXP user roles:

| Role | Permissions | Description |
|------|-------------|-------------|
| **Admin** | Full system access | System configuration, user management, all features |
| **Agency Lead** | Create/edit campaigns, events, venues; view all data | Senior leadership, campaign strategy |
| **Account Manager** | Create/edit campaigns for assigned clients; view own client data | Client relationship owner |
| **Event Manager** | Create/edit events; assign team; manage venues | Plans and executes individual events |
| **Field Manager** | View assigned events; update on-site status; manage team on-ground | On-site event execution lead |
| **Brand Ambassador** | View assigned events; check-in/out; limited updates | Front-line event staff |
| **Operations** | View all events; manage venues database; generate reports | Logistics and operations support |
| **Finance** | View campaigns/events; access budget reports; approve high-cost items | Budget and financial tracking |
| **Read-Only** | View all data; no edit permissions | Observers, stakeholders, clients (view-only access) |

---

## 🚀 AGENT EXECUTION STRATEGY

**Core Focus**: Campaign → Event → Venue hierarchy with CRUD operations
**Defer**: External API integrations (Brandscopic, Placer.ai, QRtiger, Smartsheet)
**Timeline**: ASAP with parallel execution

### Agent Assignments (5 Core Agents in Parallel)

1. **Agent 1**: Foundation & Data Model (types.ts, mockData.ts, database schema)
2. **Agent 2**: Campaign Management (components + context)
3. **Agent 3**: Event Management (calendar/map/list views + context)
4. **Agent 4**: Venue Management (database + context)
5. **Agent 5**: Backend API (50+ endpoints, database migrations)

---

## 📋 READY-TO-USE AGENT PROMPTS

Copy and paste each prompt into a separate chat with the specified agent.

---

### 🤖 AGENT 1: Foundation & Data Model

**Agent Type**: @agent-feature-developer
**Priority**: 🔴 CRITICAL (blocks all other agents)
**Duration**: 3-5 days
**Dependencies**: None

**PROMPT**:

```
You are Agent 1 working on the UXP (Unified Experience Platform) migration.

CONTEXT:
- Transform Employee Onboarding System → UXP Platform for experiential marketing
- Project repo: /home/user/UXP
- Reference plan: UXP-MIGRATION-MASTER-PLAN.md
- Current branch: claude/uxp-platform-migration-01LbRynsCSing2qrVSRFxS1L

YOUR TASK: Create foundation for UXP platform

PHASE 1 - TypeScript Data Model (types.ts)
──────────────────────────────────────────
Create complete TypeScript interfaces for:

1. Campaign interface (23 fields):
   - id, campaignName, campaignDescription, campaignNotes
   - client, eventType, masterProgram, region
   - status: "planning" | "active" | "completed" | "cancelled"
   - year, month, yearMonth
   - campaignOwner, campaignOwnerEmail
   - createdBy, createdByName, createdOn
   - updatedBy, updatedByName, updatedOn
   - jobNumbers (array), visible (boolean)

2. Event interface (34 fields):
   - id, campaignId (FK)
   - eventName, eventDetails, eventNotes, number, index
   - eventStartDate, eventEndDate, year, month, yearMonthStart, yearMonthEnd
   - eventVenue, city, country, postCode, address1, address2, number
   - latitude, longitude
   - distanceFromOfficeMi, distanceFromOfficeKm, timeFromOfficeMins
   - owner, ownerName
   - status: "planning" | "active" | "completed" | "cancelled"
   - createdBy, createdByName, createdOn
   - updatedBy, updatedByName, updatedOn

3. Venue interface (27 fields):
   - id, eventId (FK)
   - name, fullAddress, formattedAddress
   - country, city, state, stateCode, postCode, address, number
   - latitude, longitude, geoJSONData
   - platform, poiScope, entityType, category, group, subCategory
   - status: "active" | "verified" | "archived"
   - sentOn, checkedOn, count, tags (array), url

4. PeopleAssignment interface (17 fields):
   - id, eventId (FK)
   - userId, userName, userEmail, userDepartment, userRole
   - onSite (boolean)
   - distanceFromOfficeMi, distanceFromOfficeKm, timeFromOfficeMins
   - managerName, managerEmail, managerRole
   - assignedByName, assignedByEmail, assignedOn

5. QRCode interface (9 fields):
   - id, eventId (FK)
   - codeData, generatedOn, scanCount
   - qrtigerId, qrtigerLastSync, qrtigerPath
   - qrtigerStatus: "active" | "paused" | "archived"

6. UserRole interface (for RBAC):
   - id, name, displayName, description, permissions (array)
   - Roles: admin, agency-lead, account-manager, event-manager, field-manager, brand-ambassador, operations, finance, read-only

PHASE 2 - Mock Data (utils/mockData.ts)
────────────────────────────────────────
Create realistic mock data:
- 10 campaigns (various clients: AMEX, Verizon, Coca-Cola, Constellation)
- 25 events (spread across campaigns, various dates in 2025)
- 15 venues (major cities: NYC, LA, Chicago, Dallas, Miami)
- 30 people assignments (realistic team compositions)
- 10 QR codes (one per active event)

Include realistic data:
- Event types: Sports Activation, Music Festival, Product Sampling, Brand Experience
- Regions: Northeast, Southeast, Midwest, West Coast, National
- Venues with real coordinates (use major stadiums/venues)

PHASE 3 - Database Schema (database/migrations/100_uxp_core.sql)
─────────────────────────────────────────────────────────────────
Create SQL migration for Azure SQL Database:

```sql
CREATE TABLE Campaigns (
  id VARCHAR(50) PRIMARY KEY,
  campaignName VARCHAR(200) NOT NULL,
  campaignDescription NVARCHAR(MAX),
  campaignNotes NVARCHAR(MAX),
  client VARCHAR(100),
  eventType VARCHAR(100),
  masterProgram VARCHAR(100),
  region VARCHAR(50),
  status VARCHAR(20) DEFAULT 'planning',
  year INT,
  month INT,
  yearMonth VARCHAR(7),
  campaignOwner VARCHAR(100),
  campaignOwnerEmail VARCHAR(100),
  createdBy VARCHAR(100),
  createdByName VARCHAR(100),
  createdOn DATETIME DEFAULT GETDATE(),
  updatedBy VARCHAR(100),
  updatedByName VARCHAR(100),
  updatedOn DATETIME,
  jobNumbers NVARCHAR(MAX), -- JSON array
  visible BIT DEFAULT 1,
  importSequenceNumber INT
);

CREATE TABLE Events (
  id VARCHAR(50) PRIMARY KEY,
  campaignId VARCHAR(50) NOT NULL,
  eventName VARCHAR(200) NOT NULL,
  eventDetails NVARCHAR(MAX),
  eventNotes NVARCHAR(MAX),
  number VARCHAR(20),
  [index] INT,
  eventStartDate DATETIME NOT NULL,
  eventEndDate DATETIME NOT NULL,
  year INT,
  month INT,
  yearMonthStart VARCHAR(7),
  yearMonthEnd VARCHAR(7),
  eventVenue VARCHAR(200),
  city VARCHAR(100),
  country VARCHAR(100),
  postCode VARCHAR(20),
  address1 VARCHAR(200),
  address2 VARCHAR(200),
  number VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distanceFromOfficeMi DECIMAL(10, 2),
  distanceFromOfficeKm DECIMAL(10, 2),
  timeFromOfficeMins INT,
  owner VARCHAR(100),
  ownerName VARCHAR(100),
  status VARCHAR(20) DEFAULT 'planning',
  createdBy VARCHAR(100),
  createdByName VARCHAR(100),
  createdOn DATETIME DEFAULT GETDATE(),
  updatedBy VARCHAR(100),
  updatedByName VARCHAR(100),
  updatedOn DATETIME,
  importSequenceNumber INT,
  FOREIGN KEY (campaignId) REFERENCES Campaigns(id)
);

CREATE TABLE Venues (
  id VARCHAR(50) PRIMARY KEY,
  eventId VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  fullAddress VARCHAR(500),
  formattedAddress VARCHAR(500),
  country VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  stateCode VARCHAR(10),
  postCode VARCHAR(20),
  address VARCHAR(200),
  number VARCHAR(20),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geoJSONData NVARCHAR(MAX),
  platform VARCHAR(50),
  poiScope VARCHAR(50),
  entityType VARCHAR(50),
  category VARCHAR(100),
  [group] VARCHAR(100),
  subCategory VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  sentOn DATETIME,
  checkedOn DATETIME,
  count INT DEFAULT 0,
  tags NVARCHAR(MAX), -- JSON array
  url VARCHAR(500),
  FOREIGN KEY (eventId) REFERENCES Events(id)
);

CREATE TABLE PeopleAssignments (
  id VARCHAR(50) PRIMARY KEY,
  eventId VARCHAR(50) NOT NULL,
  userId VARCHAR(100) NOT NULL,
  userName VARCHAR(100) NOT NULL,
  userEmail VARCHAR(100) NOT NULL,
  userDepartment VARCHAR(100),
  userRole VARCHAR(100),
  onSite BIT DEFAULT 0,
  distanceFromOfficeMi DECIMAL(10, 2),
  distanceFromOfficeKm DECIMAL(10, 2),
  timeFromOfficeMins INT,
  managerName VARCHAR(100),
  managerEmail VARCHAR(100),
  managerRole VARCHAR(100),
  assignedByName VARCHAR(100),
  assignedByEmail VARCHAR(100),
  assignedOn DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (eventId) REFERENCES Events(id)
);

CREATE TABLE QRCodes (
  id VARCHAR(50) PRIMARY KEY,
  eventId VARCHAR(50) NOT NULL,
  codeData NVARCHAR(MAX) NOT NULL,
  generatedOn DATETIME DEFAULT GETDATE(),
  scanCount INT DEFAULT 0,
  qrtigerId VARCHAR(100),
  qrtigerLastSync DATETIME,
  qrtigerPath VARCHAR(500),
  qrtigerStatus VARCHAR(20),
  FOREIGN KEY (eventId) REFERENCES Events(id)
);

CREATE TABLE UserRoles (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(100) NOT NULL,
  userEmail VARCHAR(100) NOT NULL,
  roleName VARCHAR(50) NOT NULL,
  assignedBy VARCHAR(100),
  assignedOn DATETIME DEFAULT GETDATE()
);
```

DELIVERABLES:
1. Updated types.ts with all UXP interfaces
2. Updated utils/mockData.ts with 10 campaigns, 25 events, 15 venues
3. database/migrations/100_uxp_core.sql with complete schema
4. Brief summary of changes in UXP-AGENT-1-SUMMARY.md

CONSTRAINTS:
- Remove ALL employee onboarding types (PreHire, Package, Hardware, Software, etc.)
- Keep existing UI components (Button, Card, Input, etc.)
- Keep authentication infrastructure (AuthContext, authConfig.ts, etc.)
- Use realistic data (real cities, venues, dates in 2025)

START NOW. Report progress every 30 minutes.
```

---

### 🤖 AGENT 2: Campaign Management

**Agent Type**: @agent-feature-developer
**Priority**: 🟠 HIGH
**Duration**: 3-5 days
**Dependencies**: Agent 1 (types.ts, mockData.ts)

**PROMPT**:

```
You are Agent 2 working on the UXP (Unified Experience Platform) migration.

CONTEXT:
- Transform Employee Onboarding System → UXP Platform
- Project repo: /home/user/UXP
- Reference plan: UXP-MIGRATION-MASTER-PLAN.md
- Dependencies: Wait for Agent 1 to complete types.ts and mockData.ts

YOUR TASK: Build Campaign Management System

PHASE 1 - Campaign Context (contexts/CampaignContext.tsx)
──────────────────────────────────────────────────────────
Create state management for campaigns:

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Campaign } from '../types';
import { mockCampaigns } from '../utils/mockData';

interface CampaignContextType {
  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdOn'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => Campaign | undefined;
  filterCampaigns: (filters: CampaignFilters) => Campaign[];
  searchCampaigns: (query: string) => Campaign[];
}

interface CampaignFilters {
  client?: string;
  eventType?: string;
  region?: string;
  status?: Campaign['status'];
  year?: number;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

  // Implement CRUD operations
  // Implement filter/search helpers

  return (
    <CampaignContext.Provider value={{ /* ... */ }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('useCampaigns must be used within CampaignProvider');
  return context;
};
```

PHASE 2 - Campaign List (components/campaign/CampaignList.tsx)
───────────────────────────────────────────────────────────────
Create campaign list view with:
- Grid/List view toggle
- Filters: Client, EventType, Region, Status, Year
- Search bar (campaign name)
- Sort options: Date, Name, Client
- Campaign cards showing: Name, Client, Event count, Status badge, Dates
- Click card → open detail view
- Actions: Create, Edit, Delete, Duplicate

Use existing UI components: Button, Card, Input, Select, Icon

PHASE 3 - Campaign Create/Edit Modal (components/campaign/CampaignModal.tsx)
─────────────────────────────────────────────────────────────────────────────
Create modal form with:
- Campaign Name (required)
- Description (optional)
- Client (dropdown: AMEX, Verizon, Coca-Cola, Constellation, Other)
- Event Type (dropdown: Sports Activation, Music Festival, Product Sampling, Brand Experience)
- Region (dropdown: Northeast, Southeast, Midwest, West Coast, National)
- Master Program (optional)
- Year/Month (date picker)
- Campaign Owner (Azure AD user search - use existing Graph API service)
- Status (planning, active, completed, cancelled)
- Save draft vs. Publish button

Validation:
- Campaign Name required (min 3 chars)
- Client required
- Year required

PHASE 4 - Campaign Detail View (components/campaign/CampaignDetailView.tsx)
────────────────────────────────────────────────────────────────────────────
Create detail view with:
- Header: Campaign name, status badge, edit/delete buttons
- Info section: Client, Event Type, Region, Owner, Dates
- Event list: Child events (table with name, date, venue, status)
- Activity timeline: Recent changes, who created/updated
- Quick actions: Add Event, Edit Campaign, Delete Campaign

DELIVERABLES:
1. contexts/CampaignContext.tsx (state management)
2. components/campaign/CampaignList.tsx (list/grid view)
3. components/campaign/CampaignModal.tsx (create/edit)
4. components/campaign/CampaignDetailView.tsx (detail page)
5. UXP-AGENT-2-SUMMARY.md (summary of work)

CONSTRAINTS:
- Use existing UI components from components/ui/
- Follow dark mode patterns from existing components
- Integrate with existing AuthContext for user data
- Add telemetry tracking for all actions (use existing telemetryService.ts)
- Use TypeScript strictly (no 'any' types)

START NOW. Report progress every 30 minutes.
```

---

### 🤖 AGENT 3: Event Management (Calendar/Map/List)

**Agent Type**: @agent-feature-developer
**Priority**: 🔴 CRITICAL
**Duration**: 5-7 days
**Dependencies**: Agent 1 (types.ts), Agent 2 (CampaignContext)

**PROMPT**:

```
You are Agent 3 working on the UXP (Unified Experience Platform) migration.

CONTEXT:
- Transform Employee Onboarding System → UXP Platform
- Project repo: /home/user/UXP
- Reference plan: UXP-MIGRATION-MASTER-PLAN.md
- Dependencies: Wait for Agent 1 and Agent 2 to complete

YOUR TASK: Build Event Management System with 3 view modes

PHASE 1 - Event Context (contexts/EventContext.tsx)
────────────────────────────────────────────────────
Create state management for events (similar to CampaignContext):
- CRUD operations: createEvent, updateEvent, deleteEvent, getEvent
- Filter/search helpers
- Calendar data transformation (events → calendar format)
- Map marker data preparation (events → map markers with lat/long)

PHASE 2 - Event Calendar View (components/event/EventCalendar.tsx)
───────────────────────────────────────────────────────────────────
Create calendar view using react-big-calendar:

```bash
npm install react-big-calendar date-fns
```

Features:
- Month/Week/Day view toggle
- Events displayed on calendar grid
- Color-coding by campaign (use campaign.client as color key)
- Status badges on events
- Click event → open detail modal
- Filter by: Campaign, Status
- Date navigation (prev/next month)

Use react-big-calendar library, style with Tailwind classes.

PHASE 3 - Event Map View (components/event/EventMap.tsx)
─────────────────────────────────────────────────────────
Create map view using Google Maps:

```bash
npm install @react-google-maps/api
```

Features:
- Google Maps showing all event venues
- Markers clustered by proximity
- Click marker → event detail popup
- Filter by: Date range, Campaign, Status
- Zoom to fit all markers
- Legend showing campaign colors

Use @react-google-maps/api library. For now, use mock Google Maps API key (will replace later).

PHASE 4 - Event List View (components/event/EventList.tsx)
───────────────────────────────────────────────────────────
Create filterable table/list view:
- Table columns: Event Name, Campaign, Date, Venue, City, Status, Actions
- Filters: Campaign (dropdown), Date range (date picker), Status, City
- Search bar (event name or venue)
- Sort: Date, Name, City
- Actions per row: View, Edit, Delete, Duplicate
- Pagination (10/25/50 per page)

PHASE 5 - Event Create/Edit Modal (components/event/EventModal.tsx)
────────────────────────────────────────────────────────────────────
Multi-step form (3 steps):

Step 1 - Event Basics:
- Event Name (required)
- Campaign (dropdown, required)
- Event Start Date (date picker, required)
- Event End Date (date picker, required)
- Event Details (textarea, optional)

Step 2 - Venue & Location:
- Venue Name (text input, required)
- Address (text input with autocomplete - for now just text, autocomplete in Phase 2)
- City (required)
- Country (required)
- Latitude/Longitude (optional, manual entry for now)
- Distance from office (auto-calculated if lat/long provided)

Step 3 - Team Assignments (optional):
- Add team members (Azure AD search)
- Assign roles (Event Manager, Field Manager, Brand Ambassador)
- Mark on-site status

Validation:
- Event Name required
- Campaign required
- Date range valid (end >= start)
- Venue name required
- City + Country required

PHASE 6 - Event Detail View (components/event/EventDetailView.tsx)
───────────────────────────────────────────────────────────────────
Detail page with:
- Header: Event name, status badge, dates, edit/delete buttons
- Info section: Campaign, Venue, City, Coordinates
- Map snippet: Small map showing venue location
- Team section: List of assigned people with roles
- QR codes section: Generated QR codes for this event
- Activity timeline: Recent changes

PHASE 7 - Event Navigation (components/event/EventViewSelector.tsx)
────────────────────────────────────────────────────────────────────
Create view selector component:
- Toggle buttons: Calendar | Map | List
- Current view highlighted
- Persistent selection (localStorage)

DELIVERABLES:
1. contexts/EventContext.tsx
2. components/event/EventCalendar.tsx (calendar view)
3. components/event/EventMap.tsx (map view)
4. components/event/EventList.tsx (table/list view)
5. components/event/EventModal.tsx (create/edit)
6. components/event/EventDetailView.tsx (detail page)
7. components/event/EventViewSelector.tsx (view toggle)
8. UXP-AGENT-3-SUMMARY.md

CONSTRAINTS:
- Install react-big-calendar and @react-google-maps/api
- Use mock Google Maps API key for now
- Integrate with CampaignContext (events belong to campaigns)
- Add telemetry for all view switches and actions
- Dark mode support for all views

START NOW. Report progress every 30 minutes.
```

---

### 🤖 AGENT 4: Venue Management

**Agent Type**: @agent-feature-developer
**Priority**: 🟡 MEDIUM
**Duration**: 3-4 days
**Dependencies**: Agent 1 (types.ts), Agent 3 (EventContext)

**PROMPT**:

```
You are Agent 4 working on the UXP (Unified Experience Platform) migration.

CONTEXT:
- Transform Employee Onboarding System → UXP Platform
- Project repo: /home/user/UXP
- Reference plan: UXP-MIGRATION-MASTER-PLAN.md
- Dependencies: Wait for Agent 1 and Agent 3 to complete

YOUR TASK: Build Venue Management System

PHASE 1 - Venue Context (contexts/VenueContext.tsx)
────────────────────────────────────────────────────
Create state management for venues:
- CRUD operations: createVenue, updateVenue, deleteVenue, getVenue
- Filter/search helpers
- Geolocation utilities (address → lat/long conversion)

PHASE 2 - Venue Database (components/venue/VenueDatabase.tsx)
──────────────────────────────────────────────────────────────
Create searchable venue list:
- Table view: Name, City, Country, Category, Events Count, Actions
- Filters: City, Country, Category, POI Scope
- Search bar (name or address)
- Sort: Name, City, Usage count (events count)
- Actions: View, Edit, Delete
- Pagination

PHASE 3 - Venue Create/Edit Modal (components/venue/VenueModal.tsx)
────────────────────────────────────────────────────────────────────
Create form with:
- Venue Name (required)
- Full Address (text input, required)
- City (auto-populated from address or manual)
- State (optional)
- Country (required)
- Post Code (optional)
- Latitude (required, manual entry for now)
- Longitude (required, manual entry for now)
- Category (dropdown: Stadium, Arena, Convention Center, Park, Street, Other)
- Tags (chip input, optional)
- Venue URL (optional)

Validation:
- Name required
- Address required
- City + Country required
- Latitude/Longitude required (must be valid numbers)

PHASE 4 - Venue Detail View (components/venue/VenueDetailView.tsx)
───────────────────────────────────────────────────────────────────
Detail page with:
- Header: Venue name, category badge, edit/delete buttons
- Info section: Full address, coordinates, tags
- Map snippet: Small map showing venue location (Google Maps)
- Events section: List of events at this venue (backlink to events)
- Usage stats: Total events, most recent event, most common client

DELIVERABLES:
1. contexts/VenueContext.tsx
2. components/venue/VenueDatabase.tsx (list view)
3. components/venue/VenueModal.tsx (create/edit)
4. components/venue/VenueDetailView.tsx (detail page)
5. UXP-AGENT-4-SUMMARY.md

CONSTRAINTS:
- Venues are reusable (one venue can have many events)
- Use Google Maps for map snippets (mock API key for now)
- Add telemetry for all actions
- Dark mode support

START NOW. Report progress every 30 minutes.
```

---

### 🤖 AGENT 5: Backend API & Database

**Agent Type**: @agent-feature-developer
**Priority**: 🔴 CRITICAL
**Duration**: 5-7 days
**Dependencies**: Agent 1 (database schema)

**PROMPT**:

```
You are Agent 5 working on the UXP (Unified Experience Platform) migration.

CONTEXT:
- Transform Employee Onboarding System → UXP Platform
- Project repo: /home/user/UXP
- Reference plan: UXP-MIGRATION-MASTER-PLAN.md
- Dependencies: Wait for Agent 1 to complete database schema

YOUR TASK: Build Backend API with Node.js/Express

PHASE 1 - Database Deployment (database/migrations/)
─────────────────────────────────────────────────────
Deploy SQL schema to Azure SQL Database:
1. Use Agent 1's 100_uxp_core.sql migration
2. Create indexes for performance:
   - Campaigns: campaignOwner, status, year
   - Events: campaignId, eventStartDate, status, city
   - Venues: eventId, city, country
   - PeopleAssignments: eventId, userId
   - QRCodes: eventId

PHASE 2 - API Endpoints (backend/routes/)
──────────────────────────────────────────

CAMPAIGNS:
- GET    /api/campaigns              - List campaigns (with filters: client, eventType, region, status, year)
- POST   /api/campaigns              - Create campaign
- GET    /api/campaigns/:id          - Get campaign details
- PUT    /api/campaigns/:id          - Update campaign
- DELETE /api/campaigns/:id          - Delete campaign
- GET    /api/campaigns/:id/events   - Get events for campaign

EVENTS:
- GET    /api/events                 - List events (with filters: campaignId, status, startDate, endDate, city)
- POST   /api/events                 - Create event
- GET    /api/events/:id             - Get event details
- PUT    /api/events/:id             - Update event
- DELETE /api/events/:id             - Delete event
- GET    /api/events/calendar        - Calendar view data (returns events formatted for calendar)
- GET    /api/events/map             - Map view data (returns events with lat/long for markers)

VENUES:
- GET    /api/venues                 - List venues (with filters: city, country, category)
- POST   /api/venues                 - Create venue
- GET    /api/venues/:id             - Get venue details
- PUT    /api/venues/:id             - Update venue
- DELETE /api/venues/:id             - Delete venue
- GET    /api/venues/:id/events      - Get events at venue

PEOPLE ASSIGNMENTS:
- GET    /api/assignments            - List assignments (with filters: eventId, userId)
- POST   /api/assignments            - Create assignment
- DELETE /api/assignments/:id        - Delete assignment

QR CODES:
- GET    /api/qrcodes                - List QR codes
- POST   /api/qrcodes                - Generate QR code
- GET    /api/qrcodes/:id            - Get QR code details
- DELETE /api/qrcodes/:id            - Delete QR code

USER ROLES:
- GET    /api/users/:id/roles        - Get user's roles
- POST   /api/users/:id/roles        - Assign role
- DELETE /api/users/:id/roles/:roleId - Remove role

PHASE 3 - Middleware (backend/middleware/)
───────────────────────────────────────────
REUSE existing middleware:
- backend/middleware/auth.js (JWT validation, group membership)

ADD new middleware:
- backend/middleware/rbac.js (role-based access control)
- backend/middleware/validation.js (request validation)

PHASE 4 - Database Connection (backend/db.js)
──────────────────────────────────────────────
Create connection pool to Azure SQL Database:

```javascript
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed:', err));

module.exports = { sql, poolPromise };
```

PHASE 5 - Error Handling
─────────────────────────
Implement comprehensive error handling:
- 400 Bad Request (validation errors)
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (resource not found)
- 500 Internal Server Error (database/server errors)

Return consistent error format:
```json
{
  "error": "error_code",
  "message": "User-friendly error message",
  "details": { /* optional error details */ }
}
```

DELIVERABLES:
1. backend/routes/campaigns.js (campaign endpoints)
2. backend/routes/events.js (event endpoints)
3. backend/routes/venues.js (venue endpoints)
4. backend/routes/assignments.js (assignment endpoints)
5. backend/routes/qrcodes.js (QR code endpoints)
6. backend/middleware/rbac.js (role-based access control)
7. backend/middleware/validation.js (request validation)
8. backend/db.js (database connection)
9. UXP-AGENT-5-SUMMARY.md

CONSTRAINTS:
- Reuse existing auth middleware (backend/middleware/auth.js)
- Use Azure SQL Database (connection string from env vars)
- Add comprehensive error handling
- Include request validation for all endpoints
- Add logging for all database operations
- Support filtering, sorting, pagination

START NOW. Report progress every 30 minutes.
```

---

## 📋 EXECUTION CHECKLIST

### Before Launching Agents

- [x] User confirmed scope (Employee Onboarding → UXP)
- [x] User confirmed timeline (ASAP)
- [x] User confirmed API access (have keys for most APIs)
- [x] User confirmed focus (core event management first, APIs later)
- [x] Defined experiential marketing agency roles
- [x] Created ready-to-use prompts for 5 core agents

### Launch Sequence

Launch agents in this order (can be parallel after Agent 1):

1. **Launch Agent 1 FIRST** (Foundation) - Wait for completion (~3-5 days)
2. **Launch Agents 2, 3, 4, 5 in PARALLEL** (after Agent 1 completes)

### Progress Tracking

Each agent will report progress every 30 minutes and create a summary document:
- UXP-AGENT-1-SUMMARY.md
- UXP-AGENT-2-SUMMARY.md
- UXP-AGENT-3-SUMMARY.md
- UXP-AGENT-4-SUMMARY.md
- UXP-AGENT-5-SUMMARY.md

---

## 🎯 Success Criteria

UXP MVP is ready when:

1. ✅ Types defined (Campaign, Event, Venue, PeopleAssignment, QRCode)
2. ✅ Mock data created (10 campaigns, 25 events, 15 venues)
3. ✅ Database schema deployed
4. ✅ Campaign CRUD working (list, create, edit, delete)
5. ✅ Event CRUD working with 3 views (calendar, map, list)
6. ✅ Venue CRUD working
7. ✅ Backend API responding (50+ endpoints)
8. ✅ Data persists across sessions

---

**READY TO LAUNCH AGENTS**

Copy each prompt into a new chat with the specified agent type (@agent-feature-developer).
Monitor progress via summary documents.
All agents can work in parallel after Agent 1 completes.
