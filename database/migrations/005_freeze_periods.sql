-- ============================================================================
-- MIGRATION 005: Freeze Period Administration
-- ============================================================================
-- Date: 2025-11-21
-- Purpose: Create freeze period management and notification tracking tables
-- Dependencies: Migration 003 (Core Tables)
--
-- **What This Does**:
-- 1. Creates FreezePeriods table - Workday freeze period definitions
-- 2. Creates FreezePeriodNotifications table - Email notification tracking
--
-- **Why This Matters**:
-- - Automates Nov-Jan 5 Workday freeze period handling
-- - Tracks password reset emails for pre-loaded accounts
-- - Monitors termination emails during freeze
-- - Provides audit trail for IT requests
-- ============================================================================

-- ============================================================================
-- TABLE: FreezePeriods
-- ============================================================================
-- Defines Workday freeze periods with configurable email templates

CREATE TABLE FreezePeriods (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Freeze Period Definition
  name NVARCHAR(200) NOT NULL,
  description NVARCHAR(1000) NULL,

  -- Date Range
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,

  -- Status
  isActive BIT NOT NULL DEFAULT 1,

  -- Email Configuration
  helixEmail VARCHAR(200) NOT NULL,            -- Email address for Helix (e.g., helix@momentumww.com)
  ccRecipients NVARCHAR(500) NULL,             -- Comma-separated CC emails (e.g., "camille@...,payton@...")

  -- Email Templates (Start Date - Password Reset)
  startDateEmailSubject NVARCHAR(500) NOT NULL,
  startDateEmailBody NVARCHAR(MAX) NOT NULL,

  -- Email Templates (End Date - Termination)
  endDateEmailSubject NVARCHAR(500) NOT NULL,
  endDateEmailBody NVARCHAR(MAX) NOT NULL,

  -- Automation Settings
  autoEmailEnabled BIT NOT NULL DEFAULT 0,     -- true = auto-send, false = manual

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT CHK_FreezePeriods_DateRange CHECK (endDate >= startDate),

  -- Indexes
  INDEX IX_FreezePeriods_DateRange (startDate, endDate),
  INDEX IX_FreezePeriods_IsActive (isActive)
);

-- ============================================================================
-- TABLE: FreezePeriodNotifications
-- ============================================================================
-- Tracks email notifications for employees affected by freeze periods

CREATE TABLE FreezePeriodNotifications (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Keys
  freezePeriodId VARCHAR(50) NOT NULL,
  employeeId VARCHAR(50) NOT NULL,

  -- Notification Type
  actionType VARCHAR(20) NOT NULL,             -- start, end

  -- Action Details
  actionDate DATE NOT NULL,                    -- Employee start date or end date
  employeeName NVARCHAR(200) NOT NULL,
  employeeEmail VARCHAR(200) NOT NULL,

  -- Notification Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
  sentDate DATETIME NULL,
  sentBy VARCHAR(100) NULL,

  -- Email Content Snapshot
  emailSubject NVARCHAR(500) NULL,             -- Generated subject (after placeholder replacement)
  emailBody NVARCHAR(MAX) NULL,                -- Generated body (after placeholder replacement)

  -- Error Tracking
  errorMessage NVARCHAR(1000) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_FreezePeriodNotifications_ActionType CHECK (actionType IN ('start', 'end')),
  CONSTRAINT CHK_FreezePeriodNotifications_Status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  CONSTRAINT FK_FreezePeriodNotifications_FreezePeriods FOREIGN KEY (freezePeriodId) REFERENCES FreezePeriods(id),
  CONSTRAINT FK_FreezePeriodNotifications_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),

  -- Indexes
  INDEX IX_FreezePeriodNotifications_FreezePeriodId (freezePeriodId),
  INDEX IX_FreezePeriodNotifications_EmployeeId (employeeId),
  INDEX IX_FreezePeriodNotifications_Status (status),
  INDEX IX_FreezePeriodNotifications_ActionDate (actionDate),
  INDEX IX_FreezePeriodNotifications_ActionType (actionType)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Active freeze periods
CREATE VIEW vw_ActiveFreezePeriods AS
SELECT
  fp.id,
  fp.name,
  fp.description,
  fp.startDate,
  fp.endDate,
  DATEDIFF(day, GETDATE(), fp.startDate) AS daysUntilStart,
  DATEDIFF(day, GETDATE(), fp.endDate) AS daysUntilEnd,
  CASE
    WHEN GETDATE() < fp.startDate THEN 'Upcoming'
    WHEN GETDATE() BETWEEN fp.startDate AND fp.endDate THEN 'In Progress'
    ELSE 'Past'
  END AS freezeStatus,
  fp.helixEmail,
  fp.autoEmailEnabled
FROM FreezePeriods fp
WHERE fp.isActive = 1;

-- View: Pending freeze period notifications
CREATE VIEW vw_PendingFreezePeriodNotifications AS
SELECT
  fpn.id,
  fpn.employeeName,
  fpn.employeeEmail,
  fpn.actionType,
  fpn.actionDate,
  DATEDIFF(day, GETDATE(), fpn.actionDate) AS daysUntilAction,
  fp.name AS freezePeriodName,
  fp.startDate AS freezeStartDate,
  fp.endDate AS freezeEndDate,
  fpn.status,
  CASE
    WHEN fpn.actionDate < CAST(GETDATE() AS DATE) THEN 'Overdue'
    WHEN fpn.actionDate = CAST(GETDATE() AS DATE) THEN 'Due Today'
    WHEN DATEDIFF(day, GETDATE(), fpn.actionDate) <= 3 THEN 'Due Soon'
    ELSE 'Upcoming'
  END AS urgency
FROM FreezePeriodNotifications fpn
INNER JOIN FreezePeriods fp ON fpn.freezePeriodId = fp.id
WHERE fpn.status = 'pending';

-- View: Freeze period notification history
CREATE VIEW vw_FreezePeriodNotificationHistory AS
SELECT
  fpn.id,
  fpn.employeeName,
  fpn.actionType,
  fpn.actionDate,
  fpn.status,
  fpn.sentDate,
  fpn.sentBy,
  fp.name AS freezePeriodName,
  DATEDIFF(day, fpn.actionDate, fpn.sentDate) AS emailDelay
FROM FreezePeriodNotifications fpn
INNER JOIN FreezePeriods fp ON fpn.freezePeriodId = fp.id
WHERE fpn.status IN ('sent', 'failed');

-- View: Employees affected by active freeze periods
CREATE VIEW vw_EmployeesAffectedByFreezePeriod AS
SELECT
  e.id AS employeeId,
  e.name,
  e.email,
  e.startDate,
  e.endDate,
  fp.id AS freezePeriodId,
  fp.name AS freezePeriodName,
  fp.startDate AS freezeStartDate,
  fp.endDate AS freezeEndDate,
  CASE
    WHEN e.startDate BETWEEN fp.startDate AND fp.endDate THEN 'start'
    WHEN e.endDate BETWEEN fp.startDate AND fp.endDate THEN 'end'
  END AS affectedAction
FROM Employees e
CROSS JOIN FreezePeriods fp
WHERE fp.isActive = 1
  AND (
    (e.startDate BETWEEN fp.startDate AND fp.endDate) OR
    (e.endDate BETWEEN fp.startDate AND fp.endDate)
  );

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Create notifications for employees affected by freeze period
CREATE PROCEDURE sp_CreateFreezePeriodNotifications
  @freezePeriodId VARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validate freeze period exists
    IF NOT EXISTS (SELECT 1 FROM FreezePeriods WHERE id = @freezePeriodId)
    BEGIN
      RAISERROR('Freeze period not found', 16, 1);
      RETURN;
    END

    DECLARE @startDate DATE;
    DECLARE @endDate DATE;
    DECLARE @startSubject NVARCHAR(500);
    DECLARE @startBody NVARCHAR(MAX);
    DECLARE @endSubject NVARCHAR(500);
    DECLARE @endBody NVARCHAR(MAX);

    -- Get freeze period details
    SELECT
      @startDate = startDate,
      @endDate = endDate,
      @startSubject = startDateEmailSubject,
      @startBody = startDateEmailBody,
      @endSubject = endDateEmailSubject,
      @endBody = endDateEmailBody
    FROM FreezePeriods
    WHERE id = @freezePeriodId;

    -- Create notifications for employees starting during freeze
    INSERT INTO FreezePeriodNotifications (
      id,
      freezePeriodId,
      employeeId,
      actionType,
      actionDate,
      employeeName,
      employeeEmail,
      emailSubject,
      emailBody
    )
    SELECT
      'fpn-start-' + e.id,
      @freezePeriodId,
      e.id,
      'start',
      e.startDate,
      e.name,
      e.email,
      -- Replace placeholders in subject
      REPLACE(REPLACE(@startSubject, '{employeeName}', e.name), '{startDate}', CONVERT(VARCHAR, e.startDate, 107)),
      -- Replace placeholders in body
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(@startBody, '{employeeName}', e.name),
              '{employeeEmail}', e.email
            ),
            '{startDate}', CONVERT(VARCHAR, e.startDate, 107)
          ),
          '{role}', e.role
        ),
        '{department}', e.department
      )
    FROM Employees e
    WHERE e.startDate BETWEEN @startDate AND @endDate
      AND NOT EXISTS (
        SELECT 1 FROM FreezePeriodNotifications
        WHERE freezePeriodId = @freezePeriodId
          AND employeeId = e.id
          AND actionType = 'start'
      );

    -- Create notifications for employees ending during freeze
    INSERT INTO FreezePeriodNotifications (
      id,
      freezePeriodId,
      employeeId,
      actionType,
      actionDate,
      employeeName,
      employeeEmail,
      emailSubject,
      emailBody
    )
    SELECT
      'fpn-end-' + e.id,
      @freezePeriodId,
      e.id,
      'end',
      e.endDate,
      e.name,
      e.email,
      -- Replace placeholders in subject
      REPLACE(REPLACE(@endSubject, '{employeeName}', e.name), '{endDate}', CONVERT(VARCHAR, e.endDate, 107)),
      -- Replace placeholders in body
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(@endBody, '{employeeName}', e.name),
              '{employeeEmail}', e.email
            ),
            '{endDate}', CONVERT(VARCHAR, e.endDate, 107)
          ),
          '{role}', e.role
        ),
        '{department}', e.department
      )
    FROM Employees e
    WHERE e.endDate BETWEEN @startDate AND @endDate
      AND NOT EXISTS (
        SELECT 1 FROM FreezePeriodNotifications
        WHERE freezePeriodId = @freezePeriodId
          AND employeeId = e.id
          AND actionType = 'end'
      );

    DECLARE @startNotificationsCreated INT = @@ROWCOUNT;

    COMMIT TRANSACTION;

    PRINT 'Freeze period notifications created successfully';
    PRINT 'Start notifications: ' + CAST(@startNotificationsCreated AS VARCHAR);
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- Procedure: Mark notification as sent
CREATE PROCEDURE sp_MarkNotificationSent
  @notificationId VARCHAR(50),
  @sentBy VARCHAR(100)
AS
BEGIN
  UPDATE FreezePeriodNotifications
  SET
    status = 'sent',
    sentDate = GETDATE(),
    sentBy = @sentBy,
    lastModified = GETDATE()
  WHERE id = @notificationId;

  IF @@ROWCOUNT = 0
    RAISERROR('Notification not found', 16, 1);
END;
GO

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Create Winter 2025 Workday Freeze
INSERT INTO FreezePeriods (
  id,
  name,
  description,
  startDate,
  endDate,
  helixEmail,
  ccRecipients,
  startDateEmailSubject,
  startDateEmailBody,
  endDateEmailSubject,
  endDateEmailBody,
  isActive,
  createdBy,
  lastModifiedBy
)
VALUES (
  'fp-winter-2025',
  'Winter 2025 Workday Freeze',
  'Annual year-end freeze period for Workday system maintenance',
  '2025-11-20',
  '2026-01-05',
  'helix@momentumww.com',
  'camille@momentumww.com,payton@momentumww.com',
  'Password Reset Required - {employeeName} Starting {startDate}',
  'Hi IT Team,

Employee {employeeName} ({employeeEmail}) is scheduled to start on {startDate}.

Their account has been pre-loaded during the Workday freeze period. Please reset their password and MFA, then send credentials to {employeeEmail}.

Role: {role}
Department: {department}

Thank you!',
  'Account Termination - {employeeName} End Date {endDate}',
  'Hi IT Team,

Employee {employeeName} ({employeeEmail}) has an end date of {endDate} during the Workday freeze period.

Please reset their password and disable MFA for security.

Thank you!',
  1,
  'admin@momentumww.com',
  'admin@momentumww.com'
);

-- Example 2: Create notifications for freeze period
EXEC sp_CreateFreezePeriodNotifications
  @freezePeriodId = 'fp-winter-2025';

-- Example 3: Mark notification as sent
EXEC sp_MarkNotificationSent
  @notificationId = 'fpn-start-emp-001',
  @sentBy = 'camille@momentumww.com';
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP PROCEDURE IF EXISTS sp_MarkNotificationSent;
DROP PROCEDURE IF EXISTS sp_CreateFreezePeriodNotifications;
DROP VIEW IF EXISTS vw_EmployeesAffectedByFreezePeriod;
DROP VIEW IF EXISTS vw_FreezePeriodNotificationHistory;
DROP VIEW IF EXISTS vw_PendingFreezePeriodNotifications;
DROP VIEW IF EXISTS vw_ActiveFreezePeriods;
DROP TABLE IF EXISTS FreezePeriodNotifications;
DROP TABLE IF EXISTS FreezePeriods;
*/
