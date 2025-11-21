-- ============================================================================
-- MIGRATION 004: Approval Workflow & Task Management
-- ============================================================================
-- Date: 2025-11-21
-- Purpose: Create approval routing and onboarding task tracking tables
-- Dependencies: Migration 003 (Core Tables)
--
-- **What This Does**:
-- 1. Creates ApprovalRequests table - Equipment/software approval workflow
-- 2. Creates HelixTickets table - IT ticketing system integration
-- 3. Creates OnboardingTasks table - Task checklist management
--
-- **Why This Matters**:
-- - Standard packages auto-approve, exceptions route to SVP
-- - Helix tickets track IT provisioning progress
-- - Tasks ensure nothing falls through the cracks
-- ============================================================================

-- ============================================================================
-- TABLE: ApprovalRequests
-- ============================================================================
-- Tracks approval workflow for equipment and software requests

CREATE TABLE ApprovalRequests (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Request Target
  employeeId VARCHAR(50) NULL,                 -- FK to Employees (if for existing employee)
  preHireId VARCHAR(50) NULL,                  -- FK to PreHires (if for pre-hire)
  employeeName NVARCHAR(200) NOT NULL,

  -- Request Details
  requestType VARCHAR(20) NOT NULL,            -- equipment, software, exception, mid-employment
  items NVARCHAR(MAX) NOT NULL,                -- JSON array of Hardware/Software objects requested
  packageId VARCHAR(50) NULL,                  -- FK to Packages (if package-based request)

  -- Request Metadata
  requester VARCHAR(100) NOT NULL,             -- User who made the request
  requestDate DATETIME NOT NULL DEFAULT GETDATE(),
  reason NVARCHAR(1000) NULL,                  -- Justification for request

  -- Approval Configuration
  approver VARCHAR(100) NOT NULL,              -- "Auto", "Steve Sanderson", "Patricia"
  automatedDecision BIT NOT NULL DEFAULT 0,    -- true = auto-approved (standard package)

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approvalDate DATETIME NULL,
  rejectionReason NVARCHAR(1000) NULL,

  -- Helix Integration
  helixTicketId VARCHAR(50) NULL,              -- FK to HelixTickets

  -- Notes
  notes NVARCHAR(MAX) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_ApprovalRequests_RequestType CHECK (requestType IN ('equipment', 'software', 'exception', 'mid-employment')),
  CONSTRAINT CHK_ApprovalRequests_Status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT CHK_ApprovalRequests_Target CHECK (
    (employeeId IS NOT NULL AND preHireId IS NULL) OR
    (employeeId IS NULL AND preHireId IS NOT NULL)
  ),
  CONSTRAINT FK_ApprovalRequests_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),
  CONSTRAINT FK_ApprovalRequests_PreHires FOREIGN KEY (preHireId) REFERENCES PreHires(id),
  CONSTRAINT FK_ApprovalRequests_Packages FOREIGN KEY (packageId) REFERENCES Packages(id),

  -- Indexes
  INDEX IX_ApprovalRequests_EmployeeId (employeeId),
  INDEX IX_ApprovalRequests_PreHireId (preHireId),
  INDEX IX_ApprovalRequests_Status (status),
  INDEX IX_ApprovalRequests_Approver (approver),
  INDEX IX_ApprovalRequests_RequestDate (requestDate)
);

-- ============================================================================
-- TABLE: HelixTickets
-- ============================================================================
-- IT ticket integration for equipment provisioning and system access

CREATE TABLE HelixTickets (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Ticket Type
  type VARCHAR(30) NOT NULL,                   -- new-hire, password-reset, termination, access-request, equipment

  -- Target
  employeeId VARCHAR(50) NOT NULL,
  employeeName NVARCHAR(200) NOT NULL,

  -- Request Details
  requestedBy VARCHAR(100) NOT NULL,
  description NVARCHAR(MAX) NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'open',  -- open, in-progress, resolved, closed
  priority VARCHAR(10) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent

  -- Assignment
  assignedTo VARCHAR(100) NULL,

  -- Timeline
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  resolvedDate DATETIME NULL,

  -- Freeze Period Handling
  scheduledAction VARCHAR(20) NULL,            -- activate, deactivate (for freeze period)
  actionDate DATE NULL,                        -- Date when action should occur

  -- Equipment Provisioning
  equipmentItems NVARCHAR(MAX) NULL,           -- JSON array of Hardware/Software to provision
  approvalRequestId VARCHAR(50) NULL,          -- FK to ApprovalRequests

  -- Notes
  notes NVARCHAR(MAX) NULL,

  -- Audit Fields
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_HelixTickets_Type CHECK (type IN ('new-hire', 'password-reset', 'termination', 'access-request', 'equipment')),
  CONSTRAINT CHK_HelixTickets_Status CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  CONSTRAINT CHK_HelixTickets_Priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT CHK_HelixTickets_ScheduledAction CHECK (scheduledAction IS NULL OR scheduledAction IN ('activate', 'deactivate')),
  CONSTRAINT FK_HelixTickets_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),
  CONSTRAINT FK_HelixTickets_ApprovalRequests FOREIGN KEY (approvalRequestId) REFERENCES ApprovalRequests(id),

  -- Indexes
  INDEX IX_HelixTickets_EmployeeId (employeeId),
  INDEX IX_HelixTickets_Type (type),
  INDEX IX_HelixTickets_Status (status),
  INDEX IX_HelixTickets_Priority (priority),
  INDEX IX_HelixTickets_ActionDate (actionDate),
  INDEX IX_HelixTickets_AssignedTo (assignedTo)
);

-- ============================================================================
-- TABLE: OnboardingTasks
-- ============================================================================
-- Task checklist management for onboarding process

CREATE TABLE OnboardingTasks (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Target
  employeeId VARCHAR(50) NOT NULL,

  -- Task Definition
  title NVARCHAR(200) NOT NULL,
  description NVARCHAR(1000) NULL,

  -- Categorization
  category VARCHAR(20) NOT NULL,               -- hr, it, manager, employee
  phase VARCHAR(30) NOT NULL,                  -- pre-hire, systems-setup, equipment-provisioning, complete

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in-progress, completed, blocked
  blockedReason NVARCHAR(500) NULL,

  -- Assignment
  assignedTo VARCHAR(100) NOT NULL,            -- User responsible for task

  -- Timeline
  dueDate DATE NULL,
  completedDate DATETIME NULL,

  -- Ordering
  displayOrder INT NOT NULL DEFAULT 0,

  -- Notes
  notes NVARCHAR(MAX) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_OnboardingTasks_Category CHECK (category IN ('hr', 'it', 'manager', 'employee')),
  CONSTRAINT CHK_OnboardingTasks_Phase CHECK (phase IN ('pre-hire', 'systems-setup', 'equipment-provisioning', 'complete')),
  CONSTRAINT CHK_OnboardingTasks_Status CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  CONSTRAINT FK_OnboardingTasks_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),

  -- Indexes
  INDEX IX_OnboardingTasks_EmployeeId (employeeId),
  INDEX IX_OnboardingTasks_Status (status),
  INDEX IX_OnboardingTasks_Category (category),
  INDEX IX_OnboardingTasks_DueDate (dueDate),
  INDEX IX_OnboardingTasks_Phase (phase)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Pending approval requests
CREATE VIEW vw_PendingApprovals AS
SELECT
  ar.id,
  ar.employeeName,
  ar.requestType,
  ar.approver,
  ar.requestDate,
  ar.reason,
  DATEDIFF(day, ar.requestDate, GETDATE()) AS daysWaiting,
  p.name AS packageName,
  CASE
    WHEN DATEDIFF(day, ar.requestDate, GETDATE()) > 3 THEN 'Overdue'
    WHEN DATEDIFF(day, ar.requestDate, GETDATE()) > 1 THEN 'Attention Needed'
    ELSE 'Recent'
  END AS urgency
FROM ApprovalRequests ar
LEFT JOIN Packages p ON ar.packageId = p.id
WHERE ar.status = 'pending';

-- View: Open Helix tickets
CREATE VIEW vw_OpenHelixTickets AS
SELECT
  ht.id,
  ht.type,
  ht.employeeName,
  ht.status,
  ht.priority,
  ht.assignedTo,
  ht.createdDate,
  ht.scheduledAction,
  ht.actionDate,
  DATEDIFF(day, ht.createdDate, GETDATE()) AS daysOpen,
  CASE
    WHEN ht.actionDate IS NOT NULL AND ht.actionDate < GETDATE() THEN 'Overdue'
    WHEN ht.actionDate IS NOT NULL AND ht.actionDate = CAST(GETDATE() AS DATE) THEN 'Due Today'
    WHEN ht.priority = 'urgent' THEN 'Urgent'
    WHEN DATEDIFF(day, ht.createdDate, GETDATE()) > 5 THEN 'Aging'
    ELSE 'Normal'
  END AS ticketUrgency
FROM HelixTickets ht
WHERE ht.status IN ('open', 'in-progress');

-- View: Overdue onboarding tasks
CREATE VIEW vw_OverdueOnboardingTasks AS
SELECT
  ot.id,
  e.name AS employeeName,
  e.email,
  ot.title,
  ot.category,
  ot.phase,
  ot.assignedTo,
  ot.dueDate,
  DATEDIFF(day, ot.dueDate, GETDATE()) AS daysOverdue,
  ot.status,
  ot.blockedReason
FROM OnboardingTasks ot
INNER JOIN Employees e ON ot.employeeId = e.id
WHERE ot.status NOT IN ('completed')
  AND ot.dueDate IS NOT NULL
  AND ot.dueDate < CAST(GETDATE() AS DATE)
ORDER BY ot.dueDate ASC;

-- View: Onboarding progress summary
CREATE VIEW vw_OnboardingProgressSummary AS
SELECT
  e.id AS employeeId,
  e.name AS employeeName,
  e.startDate,
  e.onboardingStatus,
  COUNT(ot.id) AS totalTasks,
  SUM(CASE WHEN ot.status = 'completed' THEN 1 ELSE 0 END) AS completedTasks,
  SUM(CASE WHEN ot.status = 'pending' THEN 1 ELSE 0 END) AS pendingTasks,
  SUM(CASE WHEN ot.status = 'in-progress' THEN 1 ELSE 0 END) AS inProgressTasks,
  SUM(CASE WHEN ot.status = 'blocked' THEN 1 ELSE 0 END) AS blockedTasks,
  SUM(CASE WHEN ot.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ot.id), 0) AS progressPercentage
FROM Employees e
LEFT JOIN OnboardingTasks ot ON e.id = ot.employeeId
WHERE e.onboardingStatus != 'active'
GROUP BY e.id, e.name, e.startDate, e.onboardingStatus;

-- View: Approval request history
CREATE VIEW vw_ApprovalRequestHistory AS
SELECT
  ar.id,
  ar.employeeName,
  ar.requestType,
  ar.approver,
  ar.status,
  ar.requestDate,
  ar.approvalDate,
  DATEDIFF(day, ar.requestDate, ar.approvalDate) AS approvalDurationDays,
  ar.automatedDecision,
  ht.id AS helixTicketId,
  ht.status AS helixTicketStatus
FROM ApprovalRequests ar
LEFT JOIN HelixTickets ht ON ar.helixTicketId = ht.id
WHERE ar.status IN ('approved', 'rejected');

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Auto-approve standard package request
CREATE PROCEDURE sp_AutoApproveStandardPackage
  @approvalRequestId VARCHAR(50),
  @approvedBy VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validate request exists and is standard package
    DECLARE @packageId VARCHAR(50);
    DECLARE @isStandard BIT;
    DECLARE @employeeId VARCHAR(50);
    DECLARE @employeeName NVARCHAR(200);

    SELECT
      @packageId = ar.packageId,
      @employeeId = ar.employeeId,
      @employeeName = ar.employeeName
    FROM ApprovalRequests ar
    WHERE ar.id = @approvalRequestId;

    IF @packageId IS NULL
    BEGIN
      RAISERROR('Approval request not found or has no package ID', 16, 1);
      RETURN;
    END

    SELECT @isStandard = p.isStandard
    FROM Packages p
    WHERE p.id = @packageId;

    IF @isStandard = 0
    BEGIN
      RAISERROR('Package is not standard - requires manual approval', 16, 1);
      RETURN;
    END

    -- Approve the request
    UPDATE ApprovalRequests
    SET
      status = 'approved',
      approvalDate = GETDATE(),
      automatedDecision = 1,
      lastModified = GETDATE()
    WHERE id = @approvalRequestId;

    -- Create Helix ticket for IT provisioning
    DECLARE @helixTicketId VARCHAR(50) = 'hx-' + REPLACE(NEWID(), '-', '');

    INSERT INTO HelixTickets (id, type, employeeId, employeeName, requestedBy, description, priority, approvalRequestId)
    VALUES (
      @helixTicketId,
      'equipment',
      @employeeId,
      @employeeName,
      @approvedBy,
      'Equipment provisioning approved - Standard package auto-approved',
      'medium',
      @approvalRequestId
    );

    -- Link ticket to approval request
    UPDATE ApprovalRequests
    SET helixTicketId = @helixTicketId
    WHERE id = @approvalRequestId;

    COMMIT TRANSACTION;

    PRINT 'Standard package auto-approved successfully';
    PRINT 'Helix ticket created: ' + @helixTicketId;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Create approval request for pre-hire
INSERT INTO ApprovalRequests (id, preHireId, employeeName, requestType, items, packageId, requester, approver)
VALUES (
  'apr-2025-001',
  'pre-2025-001',
  'Jane Smith',
  'equipment',
  '[{"id":"hw-comp-001-m3","type":"computer","model":"MacBook Pro 16\" M3 Max"}]',
  'pkg-xd-std-001',
  'camille@momentumww.com',
  'Auto'
);

-- Example 2: Auto-approve standard package
EXEC sp_AutoApproveStandardPackage
  @approvalRequestId = 'apr-2025-001',
  @approvedBy = 'system@momentumww.com';

-- Example 3: Create onboarding tasks for employee
INSERT INTO OnboardingTasks (id, employeeId, title, category, phase, assignedTo, dueDate, displayOrder)
VALUES
  ('task-001', 'emp-001', 'Create Active Directory account', 'it', 'systems-setup', 'it@momentumww.com', '2025-01-10', 1),
  ('task-002', 'emp-001', 'Create Vantage record', 'hr', 'systems-setup', 'laurie@momentumww.com', '2025-01-10', 2),
  ('task-003', 'emp-001', 'Order equipment', 'it', 'equipment-provisioning', 'it@momentumww.com', '2025-01-12', 3);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP PROCEDURE IF EXISTS sp_AutoApproveStandardPackage;
DROP VIEW IF EXISTS vw_ApprovalRequestHistory;
DROP VIEW IF EXISTS vw_OnboardingProgressSummary;
DROP VIEW IF EXISTS vw_OverdueOnboardingTasks;
DROP VIEW IF EXISTS vw_OpenHelixTickets;
DROP VIEW IF EXISTS vw_PendingApprovals;
DROP TABLE IF EXISTS OnboardingTasks;
DROP TABLE IF EXISTS HelixTickets;
DROP TABLE IF EXISTS ApprovalRequests;
*/
