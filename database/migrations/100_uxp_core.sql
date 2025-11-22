-- ============================================================================
-- MIGRATION 100: UXP Core Tables (Unified Experience Platform)
-- ============================================================================
-- Date: 2025-11-22
-- Purpose: Create foundational tables for UXP Field Marketing Platform
-- Dependencies: None (creates base UXP tables)
--
-- **What This Does**:
-- 1. Creates Campaigns table - Multi-event campaign tracking
-- 2. Creates Events table - Event scheduling and coordination
-- 3. Creates Venues table - Location and venue management
-- 4. Creates PlacerData table - Footfall analytics from Placer.ai
-- 5. Creates QRCodes table - Lead capture and tracking
-- 6. Creates PeopleAssignments table - Team assignments to events
--
-- **Entity Hierarchy**:
-- Campaign (1) → (N) Event
-- Event (1) → (1) Venue → (N) PlacerData
-- Event (1) → (N) QRCode
-- Event (1) → (N) PeopleAssignment
-- ============================================================================

-- ============================================================================
-- TABLE: Campaigns
-- ============================================================================
-- Multi-event campaign tracking with budget and performance metrics

CREATE TABLE Campaigns (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Campaign Identification
  campaignName NVARCHAR(200) NOT NULL,
  campaignDescription NVARCHAR(2000) NULL,

  -- Campaign Classification
  client NVARCHAR(200) NOT NULL,
  eventType NVARCHAR(100) NULL,              -- e.g., "Brand Activation", "Product Launch", "Sampling"
  masterProgram NVARCHAR(200) NULL,
  region NVARCHAR(100) NULL,                 -- e.g., "North America", "EMEA", "APAC"

  -- Timeline
  year INT NOT NULL,
  month INT NULL,                            -- 1-12 (NULL = multi-month)
  campaignStartDate DATE NULL,
  campaignEndDate DATE NULL,

  -- Ownership
  campaignOwner VARCHAR(100) NOT NULL,       -- FK to User email (from Azure AD)

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'planning', -- planning, active, completed, cancelled

  -- Budget & Performance (optional)
  budget DECIMAL(12,2) NULL,
  actualCost DECIMAL(12,2) NULL,
  targetFootfall INT NULL,
  actualFootfall INT NULL,

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT CHK_Campaigns_Status CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  CONSTRAINT CHK_Campaigns_Year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT CHK_Campaigns_Month CHECK (month IS NULL OR (month >= 1 AND month <= 12)),

  -- Indexes
  INDEX IX_Campaigns_CampaignOwner (campaignOwner),
  INDEX IX_Campaigns_Status (status),
  INDEX IX_Campaigns_Year (year),
  INDEX IX_Campaigns_Client (client),
  INDEX IX_Campaigns_EventType (eventType),
  INDEX IX_Campaigns_Region (region)
);

-- ============================================================================
-- TABLE: Events
-- ============================================================================
-- Event scheduling with venue selection and team assignments

CREATE TABLE Events (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Campaign Relationship
  campaignId VARCHAR(50) NOT NULL,

  -- Event Identification
  eventName NVARCHAR(200) NOT NULL,
  eventDetails NVARCHAR(2000) NULL,

  -- Timeline
  eventStartDate DATETIME NOT NULL,
  eventEndDate DATETIME NOT NULL,

  -- Location
  eventVenue NVARCHAR(300) NOT NULL,         -- Venue name
  city NVARCHAR(100) NOT NULL,
  state NVARCHAR(100) NULL,                  -- State/Province
  country NVARCHAR(100) NOT NULL,
  address NVARCHAR(500) NULL,                -- Full street address
  latitude DECIMAL(10,7) NULL,               -- Geographic coordinates
  longitude DECIMAL(10,7) NULL,

  -- Ownership
  owner VARCHAR(100) NOT NULL,               -- FK to User email (event coordinator)

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, in-progress, completed, cancelled

  -- Logistics
  distanceFromOfficeMi DECIMAL(8,2) NULL,    -- Distance from office (miles)
  timeFromOfficeMins INT NULL,               -- Travel time from office (minutes)

  -- Footfall Tracking
  expectedAttendance INT NULL,
  actualAttendance INT NULL,

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Foreign Keys
  CONSTRAINT FK_Events_Campaigns FOREIGN KEY (campaignId) REFERENCES Campaigns(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT CHK_Events_Status CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  CONSTRAINT CHK_Events_Timeline CHECK (eventEndDate >= eventStartDate),

  -- Indexes
  INDEX IX_Events_CampaignId (campaignId),
  INDEX IX_Events_EventStartDate (eventStartDate),
  INDEX IX_Events_Status (status),
  INDEX IX_Events_City (city),
  INDEX IX_Events_Country (country),
  INDEX IX_Events_Owner (owner)
);

-- ============================================================================
-- TABLE: Venues
-- ============================================================================
-- Venue catalog with geographic and categorization data

CREATE TABLE Venues (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Venue Identification
  name NVARCHAR(300) NOT NULL,
  fullAddress NVARCHAR(500) NOT NULL,

  -- Location
  city NVARCHAR(100) NOT NULL,
  state NVARCHAR(100) NULL,
  country NVARCHAR(100) NOT NULL,
  postalCode VARCHAR(20) NULL,

  -- Geographic Coordinates
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geoJSONData NVARCHAR(MAX) NULL,            -- GeoJSON geometry data

  -- Classification
  platform VARCHAR(100) NULL,                -- e.g., "Placer.ai", "Manual Entry"
  poiScope VARCHAR(100) NULL,                -- Point of Interest scope
  category NVARCHAR(100) NULL,               -- e.g., "Retail", "Mall", "Stadium", "Park"
  tags NVARCHAR(MAX) NULL,                   -- JSON array of tags

  -- Metadata
  url VARCHAR(500) NULL,                     -- Website or reference URL
  capacity INT NULL,                         -- Venue capacity (if applicable)

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Indexes
  INDEX IX_Venues_City (city),
  INDEX IX_Venues_Country (country),
  INDEX IX_Venues_Category (category),
  INDEX IX_Venues_Name (name)
);

-- ============================================================================
-- TABLE: PlacerData
-- ============================================================================
-- Footfall analytics from Placer.ai integration

CREATE TABLE PlacerData (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Venue Relationship
  venueId VARCHAR(50) NOT NULL,

  -- Placer.ai Integration
  placerEntryId VARCHAR(100) NULL,           -- External ID from Placer.ai
  placerStatus VARCHAR(50) NULL,             -- Status from Placer.ai API

  -- Movement/Footfall Data (JSON)
  movementData NVARCHAR(MAX) NULL,           -- JSON object with footfall metrics

  -- Reference
  url VARCHAR(500) NULL,                     -- Placer.ai dashboard URL

  -- Audit Fields
  createdOn DATETIME NOT NULL DEFAULT GETDATE(),

  -- Foreign Keys
  CONSTRAINT FK_PlacerData_Venues FOREIGN KEY (venueId) REFERENCES Venues(id) ON DELETE CASCADE,

  -- Indexes
  INDEX IX_PlacerData_VenueId (venueId),
  INDEX IX_PlacerData_PlacerEntryId (placerEntryId)
);

-- ============================================================================
-- TABLE: QRCodes
-- ============================================================================
-- QR code generation and tracking for lead capture

CREATE TABLE QRCodes (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Event Relationship
  eventId VARCHAR(50) NOT NULL,

  -- QR Code Data
  codeData NVARCHAR(MAX) NOT NULL,           -- QR code content/URL
  generatedOn DATETIME NOT NULL DEFAULT GETDATE(),
  scanCount INT NOT NULL DEFAULT 0,

  -- QRtiger Integration
  qrtigerId VARCHAR(100) NULL,               -- External ID from QRtiger API
  qrtigerStatus VARCHAR(50) NULL,            -- Status from QRtiger API

  -- Purpose/Description
  purpose NVARCHAR(200) NULL,                -- e.g., "Lead Capture", "Survey", "Registration"

  -- Foreign Keys
  CONSTRAINT FK_QRCodes_Events FOREIGN KEY (eventId) REFERENCES Events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX IX_QRCodes_EventId (eventId),
  INDEX IX_QRCodes_QRtigerId (qrtigerId)
);

-- ============================================================================
-- TABLE: PeopleAssignments
-- ============================================================================
-- Team member assignments to events

CREATE TABLE PeopleAssignments (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Event Relationship
  eventId VARCHAR(50) NOT NULL,

  -- User Information (from Azure AD / Momentum database)
  userId VARCHAR(100) NOT NULL,              -- Azure AD user ID or email
  userName NVARCHAR(200) NOT NULL,
  userEmail VARCHAR(200) NOT NULL,
  userDepartment NVARCHAR(100) NULL,
  userRole NVARCHAR(100) NULL,               -- e.g., "Brand Ambassador", "Field Manager", "Setup Crew"

  -- Assignment Details
  onSite BIT NOT NULL DEFAULT 0,             -- true = on-site, false = remote support
  assignmentDate DATE NOT NULL,
  checkInTime DATETIME NULL,                 -- Actual check-in time (on-site)
  checkOutTime DATETIME NULL,                -- Actual check-out time (on-site)

  -- Manager Information
  managerName NVARCHAR(200) NULL,
  managerEmail VARCHAR(200) NULL,

  -- Logistics
  distanceFromOffice DECIMAL(8,2) NULL,      -- Distance from user's office (miles)
  timeFromOffice INT NULL,                   -- Travel time from user's office (minutes)

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Foreign Keys
  CONSTRAINT FK_PeopleAssignments_Events FOREIGN KEY (eventId) REFERENCES Events(id) ON DELETE CASCADE,

  -- Indexes
  INDEX IX_PeopleAssignments_EventId (eventId),
  INDEX IX_PeopleAssignments_UserId (userId),
  INDEX IX_PeopleAssignments_AssignmentDate (assignmentDate),
  INDEX IX_PeopleAssignments_OnSite (onSite)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Campaigns with event counts
CREATE VIEW vw_CampaignsWithEventCounts AS
SELECT
  c.id,
  c.campaignName,
  c.client,
  c.eventType,
  c.region,
  c.year,
  c.status,
  c.campaignOwner,
  c.budget,
  c.actualCost,
  COUNT(e.id) AS totalEvents,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedEvents,
  SUM(CASE WHEN e.status = 'scheduled' THEN 1 ELSE 0 END) AS scheduledEvents,
  SUM(CASE WHEN e.status = 'in-progress' THEN 1 ELSE 0 END) AS inProgressEvents,
  MIN(e.eventStartDate) AS firstEventDate,
  MAX(e.eventEndDate) AS lastEventDate
FROM Campaigns c
LEFT JOIN Events e ON c.id = e.campaignId
GROUP BY c.id, c.campaignName, c.client, c.eventType, c.region, c.year, c.status, c.campaignOwner, c.budget, c.actualCost;

-- View: Events with venue and assignment details
CREATE VIEW vw_EventsWithDetails AS
SELECT
  e.id,
  e.eventName,
  e.campaignId,
  c.campaignName,
  c.client,
  e.eventStartDate,
  e.eventEndDate,
  e.eventVenue,
  e.city,
  e.state,
  e.country,
  e.status,
  e.owner,
  e.expectedAttendance,
  e.actualAttendance,
  COUNT(DISTINCT pa.id) AS assignedPeople,
  COUNT(DISTINCT q.id) AS qrCodeCount,
  SUM(q.scanCount) AS totalScans
FROM Events e
INNER JOIN Campaigns c ON e.campaignId = c.id
LEFT JOIN PeopleAssignments pa ON e.id = pa.eventId
LEFT JOIN QRCodes q ON e.id = q.eventId
GROUP BY e.id, e.eventName, e.campaignId, c.campaignName, c.client, e.eventStartDate, e.eventEndDate,
         e.eventVenue, e.city, e.state, e.country, e.status, e.owner, e.expectedAttendance, e.actualAttendance;

-- View: Venues with event history
CREATE VIEW vw_VenuesWithEventHistory AS
SELECT
  v.id,
  v.name,
  v.city,
  v.state,
  v.country,
  v.category,
  v.latitude,
  v.longitude,
  COUNT(DISTINCT e.id) AS totalEventsHosted,
  MIN(e.eventStartDate) AS firstEventDate,
  MAX(e.eventEndDate) AS lastEventDate,
  COUNT(DISTINCT pd.id) AS placerDataRecords
FROM Venues v
LEFT JOIN Events e ON v.id = e.eventVenue -- Note: This assumes eventVenue stores venue ID; adjust if needed
LEFT JOIN PlacerData pd ON v.id = pd.venueId
GROUP BY v.id, v.name, v.city, v.state, v.country, v.category, v.latitude, v.longitude;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Create Campaign
INSERT INTO Campaigns (id, campaignName, campaignDescription, client, eventType, region, year, campaignOwner, status, createdBy, lastModifiedBy)
VALUES (
  'camp-2025-001',
  'Summer Brand Activation Tour 2025',
  'Multi-city brand activation events across North America',
  'Coca-Cola',
  'Brand Activation',
  'North America',
  2025,
  'sarah.johnson@momentumww.com',
  'active',
  'admin@momentumww.com',
  'admin@momentumww.com'
);

-- Example 2: Create Event
INSERT INTO Events (id, campaignId, eventName, eventDetails, eventStartDate, eventEndDate, eventVenue, city, state, country, owner, status, createdBy, lastModifiedBy)
VALUES (
  'evt-2025-001',
  'camp-2025-001',
  'NYC Summer Kickoff',
  'Central Park brand activation with product sampling',
  '2025-06-15 10:00:00',
  '2025-06-15 18:00:00',
  'Central Park - Great Lawn',
  'New York',
  'NY',
  'United States',
  'john.doe@momentumww.com',
  'scheduled',
  'admin@momentumww.com',
  'admin@momentumww.com'
);

-- Example 3: Create Venue
INSERT INTO Venues (id, name, fullAddress, city, state, country, latitude, longitude, category)
VALUES (
  'ven-001',
  'Central Park - Great Lawn',
  'Great Lawn, Central Park, Manhattan, NY 10024',
  'New York',
  'NY',
  'United States',
  40.7829,
  -73.9654,
  'Park'
);

-- Example 4: Create QR Code
INSERT INTO QRCodes (id, eventId, codeData, purpose, createdBy)
VALUES (
  'qr-001',
  'evt-2025-001',
  'https://momentum-events.com/nyc-summer-2025/register',
  'Event Registration',
  'admin@momentumww.com'
);

-- Example 5: Create People Assignment
INSERT INTO PeopleAssignments (id, eventId, userId, userName, userEmail, userDepartment, userRole, onSite, assignmentDate)
VALUES (
  'pa-001',
  'evt-2025-001',
  'john.doe@momentumww.com',
  'John Doe',
  'john.doe@momentumww.com',
  'Field Operations',
  'Field Manager',
  1,
  '2025-06-15'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP VIEW IF EXISTS vw_VenuesWithEventHistory;
DROP VIEW IF EXISTS vw_EventsWithDetails;
DROP VIEW IF EXISTS vw_CampaignsWithEventCounts;
DROP TABLE IF EXISTS PeopleAssignments;
DROP TABLE IF EXISTS QRCodes;
DROP TABLE IF EXISTS PlacerData;
DROP TABLE IF EXISTS Venues;
DROP TABLE IF EXISTS Events;
DROP TABLE IF EXISTS Campaigns;
*/
