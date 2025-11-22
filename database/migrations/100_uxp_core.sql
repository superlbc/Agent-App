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
