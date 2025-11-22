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
-- =====================================================
-- UXP Platform - Core Database Schema
-- Migration: 100_uxp_core.sql
-- Database: Azure SQL Database
-- Version: 1.0.0
-- Created: 2025-11-22
-- Description: Core tables for UXP experiential marketing platform
-- =====================================================

-- =====================================================
-- CAMPAIGNS TABLE
-- Purpose: Store campaign-level data for experiential marketing programs
-- =====================================================
CREATE TABLE Campaigns (
    id VARCHAR(50) PRIMARY KEY,
    campaignName NVARCHAR(200) NOT NULL,
    campaignDescription NVARCHAR(MAX),
    campaignNotes NVARCHAR(MAX),
    client NVARCHAR(100) NOT NULL,
    eventType NVARCHAR(100) NOT NULL,
    masterProgram NVARCHAR(100),
    region NVARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    yearMonth VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    campaignOwner VARCHAR(255) NOT NULL,
    campaignOwnerEmail VARCHAR(255) NOT NULL,
    createdBy VARCHAR(255) NOT NULL,
    createdByName NVARCHAR(100) NOT NULL,
    createdOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedBy VARCHAR(255),
    updatedByName NVARCHAR(100),
    updatedOn DATETIME2,
    jobNumbers NVARCHAR(MAX), -- JSON array of job numbers
    visible BIT NOT NULL DEFAULT 1,

    -- Indexes for performance
    INDEX IX_Campaigns_Client (client),
    INDEX IX_Campaigns_Status (status),
    INDEX IX_Campaigns_YearMonth (yearMonth),
    INDEX IX_Campaigns_Owner (campaignOwner)
);

-- =====================================================
-- EVENTS TABLE
-- Purpose: Store individual event data within campaigns
-- =====================================================
CREATE TABLE Events (
    id VARCHAR(50) PRIMARY KEY,
    campaignId VARCHAR(50) NOT NULL,
    eventName NVARCHAR(200) NOT NULL,
    eventDetails NVARCHAR(MAX),
    eventNotes NVARCHAR(MAX),
    number VARCHAR(20),
    [index] INT, -- "index" is reserved keyword, use brackets
    eventStartDate DATETIME2 NOT NULL,
    eventEndDate DATETIME2 NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    yearMonthStart VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    yearMonthEnd VARCHAR(7) NOT NULL,
    eventVenue NVARCHAR(200),
    city NVARCHAR(100) NOT NULL,
    country NVARCHAR(100) NOT NULL,
    postCode VARCHAR(20),
    address1 NVARCHAR(200),
    address2 NVARCHAR(200),
    latitude DECIMAL(10, 7), -- 7 decimal places for GPS precision
    longitude DECIMAL(10, 7),
    distanceFromOfficeMi DECIMAL(10, 2),
    distanceFromOfficeKm DECIMAL(10, 2),
    timeFromOfficeMins INT,
    owner VARCHAR(255) NOT NULL,
    ownerName NVARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    createdBy VARCHAR(255) NOT NULL,
    createdByName NVARCHAR(100) NOT NULL,
    createdOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedBy VARCHAR(255),
    updatedByName NVARCHAR(100),
    updatedOn DATETIME2,

    -- Foreign Keys
    CONSTRAINT FK_Events_Campaigns FOREIGN KEY (campaignId)
        REFERENCES Campaigns(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX IX_Events_Campaign (campaignId),
    INDEX IX_Events_Status (status),
    INDEX IX_Events_DateRange (eventStartDate, eventEndDate),
    INDEX IX_Events_City (city),
    INDEX IX_Events_Owner (owner),
    INDEX IX_Events_Location (latitude, longitude)
);

-- =====================================================
-- VENUES TABLE
-- Purpose: Store venue information with geolocation data
-- =====================================================
CREATE TABLE Venues (
    id VARCHAR(50) PRIMARY KEY,
    eventId VARCHAR(50) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    fullAddress NVARCHAR(500),
    formattedAddress NVARCHAR(500),
    country NVARCHAR(100) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100),
    stateCode VARCHAR(10),
    postCode VARCHAR(20),
    address NVARCHAR(200),
    number VARCHAR(50),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geoJSONData NVARCHAR(MAX), -- Store GeoJSON for advanced mapping
    platform NVARCHAR(50),
    poiScope NVARCHAR(100),
    entityType NVARCHAR(50),
    category NVARCHAR(100),
    [group] NVARCHAR(100), -- "group" is reserved keyword, use brackets
    subCategory NVARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'verified', 'archived')),
    sentOn DATETIME2,
    checkedOn DATETIME2,
    count INT,
    tags NVARCHAR(MAX), -- JSON array of tags
    url VARCHAR(500),

    -- Foreign Keys
    CONSTRAINT FK_Venues_Events FOREIGN KEY (eventId)
        REFERENCES Events(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX IX_Venues_Event (eventId),
    INDEX IX_Venues_Location (latitude, longitude),
    INDEX IX_Venues_City (city),
    INDEX IX_Venues_Status (status)
);

-- =====================================================
-- PEOPLE_ASSIGNMENTS TABLE
-- Purpose: Store team member assignments to events
-- =====================================================
CREATE TABLE PeopleAssignments (
    id VARCHAR(50) PRIMARY KEY,
    eventId VARCHAR(50) NOT NULL,
    userId VARCHAR(100) NOT NULL,
    userName NVARCHAR(100) NOT NULL,
    userEmail VARCHAR(255) NOT NULL,
    userDepartment NVARCHAR(100),
    userRole NVARCHAR(50),
    onSite BIT NOT NULL DEFAULT 0,
    distanceFromOfficeMi DECIMAL(10, 2),
    distanceFromOfficeKm DECIMAL(10, 2),
    timeFromOfficeMins INT,
    managerName NVARCHAR(100),
    managerEmail VARCHAR(255),
    managerRole NVARCHAR(50),
    assignedByName NVARCHAR(100) NOT NULL,
    assignedByEmail VARCHAR(255) NOT NULL,
    assignedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    -- Foreign Keys
    CONSTRAINT FK_PeopleAssignments_Events FOREIGN KEY (eventId)
        REFERENCES Events(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX IX_PeopleAssignments_Event (eventId),
    INDEX IX_PeopleAssignments_User (userId),
    INDEX IX_PeopleAssignments_Email (userEmail),
    INDEX IX_PeopleAssignments_OnSite (onSite)
);

-- =====================================================
-- QR_CODES TABLE
-- Purpose: Store QR code data and analytics for events
-- =====================================================
CREATE TABLE QRCodes (
    id VARCHAR(50) PRIMARY KEY,
    eventId VARCHAR(50) NOT NULL,
    codeData NVARCHAR(MAX) NOT NULL,
    generatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    scanCount INT NOT NULL DEFAULT 0,
    qrtigerId VARCHAR(100),
    qrtigerLastSync DATETIME2,
    qrtigerPath VARCHAR(500),
    qrtigerStatus VARCHAR(20) CHECK (qrtigerStatus IN ('active', 'paused', 'archived')),

    -- Foreign Keys
    CONSTRAINT FK_QRCodes_Events FOREIGN KEY (eventId)
        REFERENCES Events(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX IX_QRCodes_Event (eventId),
    INDEX IX_QRCodes_QRTigerId (qrtigerId),
    INDEX IX_QRCodes_Status (qrtigerStatus)
);

-- =====================================================
-- USER_ROLES TABLE
-- Purpose: Store role definitions for RBAC (Role-Based Access Control)
-- =====================================================
CREATE TABLE UserRoles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    displayName NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    permissions NVARCHAR(MAX) NOT NULL, -- JSON array of permission strings
    isActive BIT NOT NULL DEFAULT 1,
    createdOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedOn DATETIME2,

    -- Indexes for performance
    INDEX IX_UserRoles_Name (name),
    INDEX IX_UserRoles_Active (isActive)
);

-- =====================================================
-- INITIAL DATA - USER ROLES
-- Purpose: Seed the database with default RBAC roles
-- =====================================================

-- Admin Role (full access)
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-admin',
    'admin',
    'Administrator',
    'Full system access - can manage all campaigns, events, venues, people, and system configuration',
    '["campaign.create","campaign.read","campaign.update","campaign.delete","campaign.export","event.create","event.read","event.update","event.delete","event.assign_people","event.export","venue.create","venue.read","venue.update","venue.delete","venue.verify","people.assign","people.view","people.manage","qrcode.generate","qrcode.view_analytics","qrcode.manage","finance.view_costs","finance.manage_budgets","finance.export_reports","admin.user_management","admin.role_management","admin.system_config"]'
);

-- Agency Lead Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-agency-lead',
    'agency-lead',
    'Agency Lead',
    'Senior leadership - manages campaigns, budgets, and team assignments',
    '["campaign.create","campaign.read","campaign.update","campaign.delete","campaign.export","event.create","event.read","event.update","event.delete","event.assign_people","event.export","venue.read","venue.update","venue.verify","people.assign","people.view","people.manage","qrcode.view_analytics","finance.view_costs","finance.manage_budgets","finance.export_reports"]'
);

-- Account Manager Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-account-manager',
    'account-manager',
    'Account Manager',
    'Client-facing role - manages campaigns and coordinates events',
    '["campaign.create","campaign.read","campaign.update","campaign.export","event.create","event.read","event.update","event.assign_people","event.export","venue.read","people.view","qrcode.view_analytics","finance.view_costs"]'
);

-- Event Manager Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-event-manager',
    'event-manager',
    'Event Manager',
    'Operational role - manages event logistics, venues, and on-site teams',
    '["campaign.read","event.create","event.read","event.update","event.assign_people","event.export","venue.create","venue.read","venue.update","venue.verify","people.assign","people.view","qrcode.generate","qrcode.view_analytics"]'
);

-- Field Manager Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-field-manager',
    'field-manager',
    'Field Manager',
    'On-site leadership - manages field teams and event execution',
    '["campaign.read","event.read","event.update","venue.read","venue.update","people.assign","people.view","qrcode.generate","qrcode.view_analytics"]'
);

-- Brand Ambassador Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-brand-ambassador',
    'brand-ambassador',
    'Brand Ambassador',
    'Field staff - participates in events and generates QR code scans',
    '["event.read","venue.read","people.view","qrcode.generate"]'
);

-- Operations Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-operations',
    'operations',
    'Operations',
    'Operations team - manages logistics, venues, and assignments',
    '["campaign.read","event.read","event.update","event.export","venue.create","venue.read","venue.update","venue.verify","people.assign","people.view","people.manage","qrcode.view_analytics"]'
);

-- Finance Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-finance',
    'finance',
    'Finance',
    'Finance team - views costs, manages budgets, and exports financial reports',
    '["campaign.read","campaign.export","event.read","event.export","finance.view_costs","finance.manage_budgets","finance.export_reports"]'
);

-- Read-Only Role
INSERT INTO UserRoles (id, name, displayName, description, permissions) VALUES (
    'role-read-only',
    'read-only',
    'Read-Only User',
    'View-only access - can see campaigns, events, and analytics but cannot modify',
    '["campaign.read","event.read","venue.read","people.view","qrcode.view_analytics"]'
);

-- =====================================================
-- VIEWS - REPORTING AND ANALYTICS
-- =====================================================

-- Campaign Summary View
CREATE VIEW vw_CampaignSummary AS
SELECT
    c.id,
    c.campaignName,
    c.client,
    c.region,
    c.status,
    c.yearMonth,
    c.campaignOwner,
    COUNT(DISTINCT e.id) AS totalEvents,
    COUNT(DISTINCT pa.userId) AS totalPeople,
    SUM(qr.scanCount) AS totalQRScans,
    MIN(e.eventStartDate) AS firstEventDate,
    MAX(e.eventEndDate) AS lastEventDate
FROM Campaigns c
LEFT JOIN Events e ON c.id = e.campaignId
LEFT JOIN PeopleAssignments pa ON e.id = pa.eventId
LEFT JOIN QRCodes qr ON e.id = qr.eventId
GROUP BY
    c.id, c.campaignName, c.client, c.region,
    c.status, c.yearMonth, c.campaignOwner;

-- Event Roster View
CREATE VIEW vw_EventRoster AS
SELECT
    e.id AS eventId,
    e.eventName,
    e.city,
    e.eventStartDate,
    e.eventEndDate,
    pa.userId,
    pa.userName,
    pa.userEmail,
    pa.userDepartment,
    pa.userRole,
    pa.onSite,
    pa.managerName,
    pa.assignedByName,
    pa.assignedOn
FROM Events e
INNER JOIN PeopleAssignments pa ON e.id = pa.eventId;

-- QR Code Analytics View
CREATE VIEW vw_QRCodeAnalytics AS
SELECT
    e.id AS eventId,
    e.eventName,
    e.campaignId,
    c.campaignName,
    c.client,
    COUNT(qr.id) AS totalQRCodes,
    SUM(qr.scanCount) AS totalScans,
    AVG(qr.scanCount) AS avgScansPerCode,
    MAX(qr.scanCount) AS maxScans
FROM Events e
LEFT JOIN QRCodes qr ON e.id = qr.eventId
LEFT JOIN Campaigns c ON e.campaignId = c.id
GROUP BY
    e.id, e.eventName, e.campaignId,
    c.campaignName, c.client;

-- =====================================================
-- STORED PROCEDURES - COMMON OPERATIONS
-- =====================================================

-- Get Campaigns by Client
GO
CREATE PROCEDURE sp_GetCampaignsByClient
    @client NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Campaigns
    WHERE client = @client
    ORDER BY createdOn DESC;
END;
GO

-- Get Events by Campaign
GO
CREATE PROCEDURE sp_GetEventsByCampaign
    @campaignId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Events
    WHERE campaignId = @campaignId
    ORDER BY eventStartDate ASC;
END;
GO

-- Get People by Event
GO
CREATE PROCEDURE sp_GetPeopleByEvent
    @eventId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM PeopleAssignments
    WHERE eventId = @eventId
    ORDER BY userName ASC;
END;
GO

-- Get Active Campaigns
GO
CREATE PROCEDURE sp_GetActiveCampaigns
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Campaigns
    WHERE status = 'active' AND visible = 1
    ORDER BY yearMonth DESC, campaignName ASC;
END;
GO

-- Get Upcoming Events
GO
CREATE PROCEDURE sp_GetUpcomingEvents
    @daysAhead INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cutoffDate DATETIME2 = DATEADD(DAY, @daysAhead, GETUTCDATE());

    SELECT * FROM Events
    WHERE eventStartDate >= GETUTCDATE()
      AND eventStartDate <= @cutoffDate
      AND status IN ('planning', 'active')
    ORDER BY eventStartDate ASC;
END;
GO

-- Increment QR Code Scan Count
GO
CREATE PROCEDURE sp_IncrementQRCodeScan
    @qrCodeId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE QRCodes
    SET scanCount = scanCount + 1
    WHERE id = @qrCodeId;

    SELECT * FROM QRCodes WHERE id = @qrCodeId;
END;
GO

-- =====================================================
-- FUNCTIONS - DATA CALCULATIONS
-- =====================================================

-- Calculate total QR scans for an event
GO
CREATE FUNCTION fn_GetTotalQRScans(@eventId VARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @total INT;

    SELECT @total = ISNULL(SUM(scanCount), 0)
    FROM QRCodes
    WHERE eventId = @eventId;

    RETURN @total;
END;
GO

-- Calculate total people assigned to an event
GO
CREATE FUNCTION fn_GetTotalPeople(@eventId VARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @total INT;

    SELECT @total = COUNT(*)
    FROM PeopleAssignments
    WHERE eventId = @eventId;

    RETURN @total;
END;
GO

-- =====================================================
-- TRIGGERS - DATA INTEGRITY AND AUDIT
-- =====================================================

-- Update Campaign updatedOn timestamp
GO
CREATE TRIGGER tr_Campaigns_UpdateTimestamp
ON Campaigns
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Campaigns
    SET updatedOn = GETUTCDATE()
    FROM Campaigns c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

-- Update Event updatedOn timestamp
GO
CREATE TRIGGER tr_Events_UpdateTimestamp
ON Events
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Events
    SET updatedOn = GETUTCDATE()
    FROM Events e
    INNER JOIN inserted i ON e.id = i.id;
END;
GO

-- =====================================================
-- INDEXES - ADDITIONAL PERFORMANCE OPTIMIZATION
-- =====================================================

-- Composite indexes for common query patterns
CREATE NONCLUSTERED INDEX IX_Events_Campaign_Status ON Events(campaignId, status);
CREATE NONCLUSTERED INDEX IX_Events_City_DateRange ON Events(city, eventStartDate, eventEndDate);
CREATE NONCLUSTERED INDEX IX_PeopleAssignments_User_Event ON PeopleAssignments(userId, eventId);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- Add table descriptions using extended properties
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores campaign-level data for experiential marketing programs',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'Campaigns';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores individual event data within campaigns',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'Events';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores venue information with geolocation data',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'Venues';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores team member assignments to events',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'PeopleAssignments';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores QR code data and analytics for events',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'QRCodes';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Stores role definitions for RBAC (Role-Based Access Control)',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'UserRoles';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Migration 100_uxp_core.sql completed successfully
-- Tables created: 6 (Campaigns, Events, Venues, PeopleAssignments, QRCodes, UserRoles)
-- Views created: 3 (vw_CampaignSummary, vw_EventRoster, vw_QRCodeAnalytics)
-- Stored procedures created: 6
-- Functions created: 2
-- Triggers created: 2
-- Initial data: 9 user roles seeded
-- =====================================================
