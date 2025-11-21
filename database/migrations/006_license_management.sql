-- ============================================================================
-- MIGRATION 006: License Pool Management (Phase 2)
-- ============================================================================
-- Date: 2025-11-21
-- Purpose: Create license assignment and reclaim tracking tables
-- Dependencies: Migration 003 (Core Tables)
--
-- **What This Does**:
-- 1. Creates LicenseAssignments table - Track software license assignments to employees
-- 2. Adds maintenance tracking to Hardware table
-- 3. Creates views for license utilization and over-allocation monitoring
--
-- **Why This Matters**:
-- - Prevents license over-allocation (track usage vs total seats)
-- - Enables license reclaim workflow (auto-reclaim on termination)
-- - Provides visibility into license costs and renewal dates
-- - Supports compliance audits (who has what license when)
-- ============================================================================

-- ============================================================================
-- TABLE: LicenseAssignments
-- ============================================================================
-- Tracks software license assignments to employees

CREATE TABLE LicenseAssignments (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Keys
  softwareId VARCHAR(50) NOT NULL,
  employeeId VARCHAR(50) NOT NULL,

  -- Assignment Details
  assignedDate DATETIME NOT NULL DEFAULT GETDATE(),
  assignedBy VARCHAR(100) NOT NULL,

  -- Expiration (for temporary assignments)
  expirationDate DATE NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, revoked

  -- Reclaim Tracking
  reclaimedDate DATETIME NULL,
  reclaimedBy VARCHAR(100) NULL,
  reclaimReason NVARCHAR(500) NULL,

  -- Notes
  notes NVARCHAR(1000) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_LicenseAssignments_Status CHECK (status IN ('active', 'expired', 'revoked')),
  CONSTRAINT FK_LicenseAssignments_Software FOREIGN KEY (softwareId) REFERENCES Software(id),
  CONSTRAINT FK_LicenseAssignments_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),

  -- Indexes
  INDEX IX_LicenseAssignments_SoftwareId (softwareId),
  INDEX IX_LicenseAssignments_EmployeeId (employeeId),
  INDEX IX_LicenseAssignments_Status (status),
  INDEX IX_LicenseAssignments_ExpirationDate (expirationDate),

  -- Unique Constraint (prevent duplicate active assignments)
  CONSTRAINT UQ_LicenseAssignments_SoftwareEmployee UNIQUE (softwareId, employeeId, status)
);

-- ============================================================================
-- TABLE: HardwareMaintenanceHistory
-- ============================================================================
-- Tracks maintenance history for hardware items

CREATE TABLE HardwareMaintenanceHistory (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Key
  hardwareId VARCHAR(50) NOT NULL,

  -- Maintenance Details
  maintenanceDate DATE NOT NULL,
  description NVARCHAR(1000) NOT NULL,
  performedBy NVARCHAR(200) NULL,              -- IT team, vendor name, etc.
  cost DECIMAL(10,2) NULL,

  -- Notes
  notes NVARCHAR(1000) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT FK_HardwareMaintenanceHistory_Hardware FOREIGN KEY (hardwareId) REFERENCES Hardware(id),

  -- Indexes
  INDEX IX_HardwareMaintenanceHistory_HardwareId (hardwareId),
  INDEX IX_HardwareMaintenanceHistory_MaintenanceDate (maintenanceDate)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: License assignment summary per employee
CREATE VIEW vw_EmployeeLicenseAssignments AS
SELECT
  e.id AS employeeId,
  e.name AS employeeName,
  e.email,
  e.department,
  s.id AS softwareId,
  s.name AS softwareName,
  s.vendor,
  s.licenseType,
  la.assignedDate,
  la.expirationDate,
  la.status,
  CASE
    WHEN la.status = 'revoked' THEN 'Revoked'
    WHEN la.expirationDate IS NOT NULL AND la.expirationDate < CAST(GETDATE() AS DATE) THEN 'Expired'
    WHEN la.expirationDate IS NOT NULL AND DATEDIFF(day, GETDATE(), la.expirationDate) <= 30 THEN 'Expiring Soon'
    ELSE 'Active'
  END AS assignmentStatus
FROM LicenseAssignments la
INNER JOIN Employees e ON la.employeeId = e.id
INNER JOIN Software s ON la.softwareId = s.id;

-- View: License over-allocation alerts
CREATE VIEW vw_LicenseOverAllocationAlerts AS
SELECT
  s.id,
  s.name,
  s.vendor,
  s.totalSeats,
  s.assignedSeats,
  s.assignedSeats - s.totalSeats AS overAllocatedSeats,
  s.cost,
  (s.assignedSeats - s.totalSeats) * s.cost AS overageCost,
  COUNT(la.id) AS activeAssignments
FROM Software s
LEFT JOIN LicenseAssignments la ON s.id = la.softwareId AND la.status = 'active'
WHERE s.totalSeats IS NOT NULL
  AND s.assignedSeats > s.totalSeats
GROUP BY s.id, s.name, s.vendor, s.totalSeats, s.assignedSeats, s.cost;

-- View: Expiring license assignments
CREATE VIEW vw_ExpiringLicenseAssignments AS
SELECT
  la.id,
  e.name AS employeeName,
  e.email,
  s.name AS softwareName,
  s.vendor,
  la.expirationDate,
  DATEDIFF(day, GETDATE(), la.expirationDate) AS daysUntilExpiration,
  la.assignedBy
FROM LicenseAssignments la
INNER JOIN Employees e ON la.employeeId = e.id
INNER JOIN Software s ON la.softwareId = s.id
WHERE la.status = 'active'
  AND la.expirationDate IS NOT NULL
  AND la.expirationDate <= DATEADD(day, 30, GETDATE());

-- View: License reclaim history
CREATE VIEW vw_LicenseReclaimHistory AS
SELECT
  la.id,
  e.name AS employeeName,
  e.email,
  s.name AS softwareName,
  s.vendor,
  la.assignedDate,
  la.reclaimedDate,
  DATEDIFF(day, la.assignedDate, la.reclaimedDate) AS assignmentDurationDays,
  la.reclaimedBy,
  la.reclaimReason,
  la.status
FROM LicenseAssignments la
INNER JOIN Employees e ON la.employeeId = e.id
INNER JOIN Software s ON la.softwareId = s.id
WHERE la.status IN ('revoked', 'expired');

-- View: Hardware maintenance cost summary
CREATE VIEW vw_HardwareMaintenanceCosts AS
SELECT
  h.id AS hardwareId,
  h.model,
  h.manufacturer,
  h.type,
  COUNT(hmh.id) AS maintenanceCount,
  SUM(hmh.cost) AS totalMaintenanceCost,
  AVG(hmh.cost) AS avgMaintenanceCost,
  MAX(hmh.maintenanceDate) AS lastMaintenanceDate,
  h.purchaseDate,
  h.cost AS purchaseCost,
  h.cost + ISNULL(SUM(hmh.cost), 0) AS totalCostOfOwnership
FROM Hardware h
LEFT JOIN HardwareMaintenanceHistory hmh ON h.id = hmh.hardwareId
GROUP BY h.id, h.model, h.manufacturer, h.type, h.purchaseDate, h.cost;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Assign license to employee
CREATE PROCEDURE sp_AssignLicense
  @softwareId VARCHAR(50),
  @employeeId VARCHAR(50),
  @assignedBy VARCHAR(100),
  @expirationDate DATE = NULL,
  @notes NVARCHAR(1000) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validate software exists
    DECLARE @softwareName NVARCHAR(200);
    DECLARE @totalSeats INT;
    DECLARE @assignedSeats INT;

    SELECT
      @softwareName = name,
      @totalSeats = totalSeats,
      @assignedSeats = assignedSeats
    FROM Software
    WHERE id = @softwareId;

    IF @softwareName IS NULL
    BEGIN
      RAISERROR('Software not found', 16, 1);
      RETURN;
    END

    -- Check if employee exists
    IF NOT EXISTS (SELECT 1 FROM Employees WHERE id = @employeeId)
    BEGIN
      RAISERROR('Employee not found', 16, 1);
      RETURN;
    END

    -- Check for existing active assignment
    IF EXISTS (
      SELECT 1 FROM LicenseAssignments
      WHERE softwareId = @softwareId
        AND employeeId = @employeeId
        AND status = 'active'
    )
    BEGIN
      RAISERROR('Employee already has an active assignment for this software', 16, 1);
      RETURN;
    END

    -- Check seat availability (warn if over-allocated)
    IF @totalSeats IS NOT NULL AND @assignedSeats >= @totalSeats
    BEGIN
      PRINT 'WARNING: Software is at or over capacity';
      PRINT 'Total seats: ' + CAST(@totalSeats AS VARCHAR);
      PRINT 'Assigned seats: ' + CAST(@assignedSeats AS VARCHAR);
    END

    -- Create assignment
    DECLARE @assignmentId VARCHAR(50) = 'la-' + REPLACE(NEWID(), '-', '');

    INSERT INTO LicenseAssignments (id, softwareId, employeeId, assignedBy, expirationDate, notes)
    VALUES (@assignmentId, @softwareId, @employeeId, @assignedBy, @expirationDate, @notes);

    -- Increment assigned seats
    UPDATE Software
    SET
      assignedSeats = assignedSeats + 1,
      lastModified = GETDATE()
    WHERE id = @softwareId;

    COMMIT TRANSACTION;

    PRINT 'License assigned successfully';
    PRINT 'Assignment ID: ' + @assignmentId;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- Procedure: Reclaim license from employee
CREATE PROCEDURE sp_ReclaimLicense
  @assignmentId VARCHAR(50),
  @reclaimedBy VARCHAR(100),
  @reclaimReason NVARCHAR(500)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validate assignment exists and is active
    DECLARE @softwareId VARCHAR(50);
    DECLARE @employeeId VARCHAR(50);

    SELECT
      @softwareId = softwareId,
      @employeeId = employeeId
    FROM LicenseAssignments
    WHERE id = @assignmentId
      AND status = 'active';

    IF @softwareId IS NULL
    BEGIN
      RAISERROR('Active license assignment not found', 16, 1);
      RETURN;
    END

    -- Revoke assignment
    UPDATE LicenseAssignments
    SET
      status = 'revoked',
      reclaimedDate = GETDATE(),
      reclaimedBy = @reclaimedBy,
      reclaimReason = @reclaimReason,
      lastModified = GETDATE()
    WHERE id = @assignmentId;

    -- Decrement assigned seats
    UPDATE Software
    SET
      assignedSeats = assignedSeats - 1,
      lastModified = GETDATE()
    WHERE id = @softwareId;

    COMMIT TRANSACTION;

    PRINT 'License reclaimed successfully';
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- Procedure: Reclaim all licenses for terminated employee
CREATE PROCEDURE sp_ReclaimAllLicensesForEmployee
  @employeeId VARCHAR(50),
  @reclaimedBy VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    DECLARE @reclaimedCount INT = 0;

    -- Get all active assignments for employee
    DECLARE @assignmentId VARCHAR(50);

    DECLARE assignment_cursor CURSOR FOR
    SELECT id
    FROM LicenseAssignments
    WHERE employeeId = @employeeId
      AND status = 'active';

    OPEN assignment_cursor;
    FETCH NEXT FROM assignment_cursor INTO @assignmentId;

    WHILE @@FETCH_STATUS = 0
    BEGIN
      -- Reclaim each license
      EXEC sp_ReclaimLicense
        @assignmentId = @assignmentId,
        @reclaimedBy = @reclaimedBy,
        @reclaimReason = 'Employee termination';

      SET @reclaimedCount = @reclaimedCount + 1;

      FETCH NEXT FROM assignment_cursor INTO @assignmentId;
    END

    CLOSE assignment_cursor;
    DEALLOCATE assignment_cursor;

    COMMIT TRANSACTION;

    PRINT 'All licenses reclaimed for employee';
    PRINT 'Total reclaimed: ' + CAST(@reclaimedCount AS VARCHAR);
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-reclaim expired licenses (runs daily via job)
-- Note: This is a conceptual trigger - actual implementation would use SQL Agent job
/*
CREATE TRIGGER trg_AutoReclaimExpiredLicenses
ON LicenseAssignments
AFTER UPDATE
AS
BEGIN
  UPDATE LicenseAssignments
  SET
    status = 'expired',
    reclaimedDate = GETDATE(),
    reclaimReason = 'License assignment expired'
  WHERE status = 'active'
    AND expirationDate IS NOT NULL
    AND expirationDate < CAST(GETDATE() AS DATE);
END;
*/

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Assign license to employee
EXEC sp_AssignLicense
  @softwareId = 'sw-adobe-cc',
  @employeeId = 'emp-001',
  @assignedBy = 'it@momentumww.com',
  @notes = 'Standard onboarding package';

-- Example 2: Assign temporary license (90 days)
EXEC sp_AssignLicense
  @softwareId = 'sw-cinema4d',
  @employeeId = 'emp-001',
  @assignedBy = 'steve.sanderson@momentumww.com',
  @expirationDate = '2026-03-01',
  @notes = 'Temporary license for Q1 project';

-- Example 3: Reclaim license
EXEC sp_ReclaimLicense
  @assignmentId = 'la-abc123',
  @reclaimedBy = 'it@momentumww.com',
  @reclaimReason = 'User no longer needs Cinema 4D';

-- Example 4: Reclaim all licenses on termination
EXEC sp_ReclaimAllLicensesForEmployee
  @employeeId = 'emp-001',
  @reclaimedBy = 'hr@momentumww.com';

-- Example 5: Add hardware maintenance record
INSERT INTO HardwareMaintenanceHistory (id, hardwareId, maintenanceDate, description, performedBy, cost)
VALUES (
  'maint-001',
  'hw-comp-001-m3',
  '2025-11-01',
  'Screen replacement - cracked display',
  'Apple Service Center',
  599.00
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP PROCEDURE IF EXISTS sp_ReclaimAllLicensesForEmployee;
DROP PROCEDURE IF EXISTS sp_ReclaimLicense;
DROP PROCEDURE IF EXISTS sp_AssignLicense;
DROP VIEW IF EXISTS vw_HardwareMaintenanceCosts;
DROP VIEW IF EXISTS vw_LicenseReclaimHistory;
DROP VIEW IF EXISTS vw_ExpiringLicenseAssignments;
DROP VIEW IF EXISTS vw_LicenseOverAllocationAlerts;
DROP VIEW IF EXISTS vw_EmployeeLicenseAssignments;
DROP TABLE IF EXISTS HardwareMaintenanceHistory;
DROP TABLE IF EXISTS LicenseAssignments;
*/
