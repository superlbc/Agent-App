-- ============================================================================
-- MIGRATION 003: Core Tables (Foundation)
-- ============================================================================
-- Date: 2025-11-21
-- Purpose: Create foundational tables for Employee Onboarding System
-- Dependencies: None (creates base tables)
--
-- **What This Does**:
-- 1. Creates Packages table - Equipment package definitions
-- 2. Creates Hardware table - Hardware inventory catalog
-- 3. Creates Software table - Software catalog with license pools
-- 4. Creates PreHires table - Pre-hire candidate tracking
-- 5. Creates Employees table - Employee records with onboarding status
--
-- **Why This Matters**:
-- - Foundation for entire onboarding system
-- - Referenced by versioning (001) and superseding (002) migrations
-- - Enables pre-hire to employee lifecycle tracking
-- ============================================================================

-- ============================================================================
-- TABLE: Packages
-- ============================================================================
-- Master table for equipment package definitions
-- Each package targets specific roles/departments

CREATE TABLE Packages (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Package Definition
  name NVARCHAR(200) NOT NULL,
  description NVARCHAR(1000) NULL,

  -- Targeting (JSON arrays)
  roleTarget NVARCHAR(MAX) NOT NULL,           -- JSON array of role names (e.g., ["XD Designer", "Motion Designer"])
  departmentTarget NVARCHAR(MAX) NOT NULL,     -- JSON array of departments (e.g., ["Creative", "IPTC"])

  -- Approval Configuration
  isStandard BIT NOT NULL DEFAULT 1,           -- true = auto-approve, false = requires SVP approval

  -- Status
  isActive BIT NOT NULL DEFAULT 1,             -- false = archived/deprecated

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Indexes
  INDEX IX_Packages_Name (name),
  INDEX IX_Packages_IsActive (isActive)
);

-- ============================================================================
-- TABLE: Hardware
-- ============================================================================
-- Hardware catalog (models/specs, not physical instances)
-- Physical instances tracked separately in asset management system

CREATE TABLE Hardware (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Hardware Type
  type VARCHAR(20) NOT NULL,                   -- computer, monitor, keyboard, mouse, dock, headset, accessory

  -- Identification
  model NVARCHAR(200) NOT NULL,
  manufacturer NVARCHAR(100) NOT NULL,

  -- Specifications (JSON object)
  specifications NVARCHAR(MAX) NULL,           -- JSON: {"processor":"M3 Max","ram":"64GB","storage":"2TB SSD"} OR {"screenSize":"27\" 4K"} OR {"connectivity":"USB-C"}

  -- Cost Tracking
  purchaseDate DATE NULL,
  cost DECIMAL(10,2) NULL,

  -- Superseding Relationship (added in migration 002)
  supersededById VARCHAR(50) NULL,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_Hardware_Type CHECK (type IN ('computer', 'monitor', 'keyboard', 'mouse', 'dock', 'headset', 'accessory')),

  -- Indexes
  INDEX IX_Hardware_Type (type),
  INDEX IX_Hardware_Manufacturer (manufacturer)
);

-- ============================================================================
-- TABLE: Software
-- ============================================================================
-- Software catalog with license pool management

CREATE TABLE Software (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Software Definition
  name NVARCHAR(200) NOT NULL,
  vendor NVARCHAR(100) NOT NULL,
  description NVARCHAR(1000) NULL,

  -- License Configuration
  licenseType VARCHAR(20) NOT NULL,            -- perpetual, subscription, concurrent
  totalSeats INT NULL,                         -- Total number of licenses purchased (NULL = unlimited)
  assignedSeats INT NOT NULL DEFAULT 0,        -- Currently assigned seats

  -- Cost Tracking
  cost DECIMAL(10,2) NULL,                     -- Per-seat cost or total cost
  renewalFrequency VARCHAR(20) NULL,           -- monthly, annual
  renewalDate DATE NULL,                       -- Next renewal date
  autoRenew BIT NOT NULL DEFAULT 0,

  -- Approval Configuration
  requiresApproval BIT NOT NULL DEFAULT 0,     -- true = requires manager/SVP approval
  approver VARCHAR(100) NULL,                  -- "Auto", "Steve Sanderson", "Patricia"

  -- Vendor Management
  vendorContact NVARCHAR(200) NULL,
  internalAdmin VARCHAR(100) NULL,             -- Internal license administrator

  -- Status
  isActive BIT NOT NULL DEFAULT 1,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT CHK_Software_LicenseType CHECK (licenseType IN ('perpetual', 'subscription', 'concurrent')),
  CONSTRAINT CHK_Software_RenewalFrequency CHECK (renewalFrequency IS NULL OR renewalFrequency IN ('monthly', 'annual')),
  CONSTRAINT CHK_Software_SeatUtilization CHECK (assignedSeats >= 0 AND (totalSeats IS NULL OR assignedSeats <= totalSeats)),

  -- Indexes
  INDEX IX_Software_Vendor (vendor),
  INDEX IX_Software_LicenseType (licenseType),
  INDEX IX_Software_RenewalDate (renewalDate),
  INDEX IX_Software_IsActive (isActive)
);

-- ============================================================================
-- TABLE: PreHires
-- ============================================================================
-- Pre-hire candidate tracking from offer acceptance to start date

CREATE TABLE PreHires (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Candidate Information
  candidateName NVARCHAR(200) NOT NULL,
  email VARCHAR(200) NULL,

  -- Position Details
  role NVARCHAR(200) NOT NULL,
  department NVARCHAR(100) NOT NULL,
  hiringManager NVARCHAR(200) NOT NULL,

  -- Timeline
  offerDate DATE NULL,
  acceptedDate DATE NULL,
  startDate DATE NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'candidate', -- candidate, offered, accepted, linked, cancelled

  -- Package Assignment (handled by PackageAssignments table)
  -- assignedPackageId is tracked via PackageAssignments foreign key

  -- Customization Tracking (JSON)
  customizations NVARCHAR(MAX) NULL,           -- JSON: {"addedHardware":[...],"removedHardware":[...],"addedSoftware":[...],"removedSoftware":[...],"reason":"Requested during negotiation"}

  -- Linking to Employee Record
  linkedEmployeeId VARCHAR(50) NULL,           -- Manual link to Employees table (once created in Vantage/AD)
  linkedDate DATETIME NULL,

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT CHK_PreHires_Status CHECK (status IN ('candidate', 'offered', 'accepted', 'linked', 'cancelled')),

  -- Indexes
  INDEX IX_PreHires_Email (email),
  INDEX IX_PreHires_StartDate (startDate),
  INDEX IX_PreHires_Status (status),
  INDEX IX_PreHires_Department (department),
  INDEX IX_PreHires_LinkedEmployeeId (linkedEmployeeId)
);

-- ============================================================================
-- TABLE: Employees
-- ============================================================================
-- Employee records with onboarding status tracking

CREATE TABLE Employees (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- External System IDs
  activeDirectoryId VARCHAR(100) NULL,
  workdayId VARCHAR(100) NULL,
  vantageId VARCHAR(100) NULL,

  -- Employee Information
  name NVARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  department NVARCHAR(100) NOT NULL,
  role NVARCHAR(200) NOT NULL,
  manager NVARCHAR(200) NULL,

  -- Timeline
  startDate DATE NOT NULL,
  endDate DATE NULL,

  -- Equipment Tracking
  -- Actual equipment tracked via PackageAssignments and separate asset management
  actualHardware NVARCHAR(MAX) NULL,           -- JSON array of Hardware IDs received
  actualSoftware NVARCHAR(MAX) NULL,           -- JSON array of Software IDs assigned

  -- Onboarding Status
  preHireId VARCHAR(50) NULL,                  -- Link to PreHires table
  onboardingStatus VARCHAR(30) NOT NULL DEFAULT 'pre-hire', -- pre-hire, systems-created, equipment-assigned, active

  -- Onboarding Phase Tracking (JSON)
  onboardingPhases NVARCHAR(MAX) NULL,         -- JSON: {"adCreated":"2025-01-15","vantageCreated":"2025-01-15","workdayCreated":"2025-01-15","equipmentOrdered":"2025-01-20","equipmentReceived":"2025-01-30","onboardingComplete":"2025-02-01"}

  -- Freeze Period Flags
  isPreloaded BIT NOT NULL DEFAULT 0,          -- true = account pre-loaded during freeze period
  needsPasswordReset BIT NOT NULL DEFAULT 0,   -- true = password reset email needed (freeze period)

  -- Status
  isActive BIT NOT NULL DEFAULT 1,             -- false = terminated/offboarded

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  lastModifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT CHK_Employees_OnboardingStatus CHECK (onboardingStatus IN ('pre-hire', 'systems-created', 'equipment-assigned', 'active')),
  CONSTRAINT FK_Employees_PreHires FOREIGN KEY (preHireId) REFERENCES PreHires(id),

  -- Indexes
  INDEX IX_Employees_Email (email),
  INDEX IX_Employees_Department (department),
  INDEX IX_Employees_StartDate (startDate),
  INDEX IX_Employees_EndDate (endDate),
  INDEX IX_Employees_OnboardingStatus (onboardingStatus),
  INDEX IX_Employees_PreHireId (preHireId),
  INDEX IX_Employees_IsActive (isActive),

  -- Unique Constraints
  CONSTRAINT UQ_Employees_Email UNIQUE (email),
  CONSTRAINT UQ_Employees_ActiveDirectoryId UNIQUE (activeDirectoryId)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Pre-hires with assigned packages
CREATE VIEW vw_PreHiresWithPackages AS
SELECT
  ph.id,
  ph.candidateName,
  ph.email,
  ph.role,
  ph.department,
  ph.startDate,
  ph.status,
  pa.id AS assignmentId,
  pv.packageId,
  p.name AS packageName,
  pv.versionNumber AS packageVersion,
  pa.assignedDate,
  ph.linkedEmployeeId,
  e.name AS linkedEmployeeName
FROM PreHires ph
LEFT JOIN PackageAssignments pa ON pa.preHireId = ph.id
LEFT JOIN PackageVersions pv ON pa.packageVersionId = pv.id
LEFT JOIN Packages p ON pv.packageId = p.id
LEFT JOIN Employees e ON ph.linkedEmployeeId = e.id;

-- View: Employees with onboarding progress
CREATE VIEW vw_EmployeesOnboardingProgress AS
SELECT
  e.id,
  e.name,
  e.email,
  e.department,
  e.role,
  e.startDate,
  e.onboardingStatus,
  e.isPreloaded,
  e.needsPasswordReset,
  ph.candidateName AS preHireName,
  ph.startDate AS preHireStartDate,
  pa.id AS assignmentId,
  p.name AS assignedPackage,
  pv.versionNumber AS packageVersion,
  CASE
    WHEN e.onboardingStatus = 'active' THEN 100
    WHEN e.onboardingStatus = 'equipment-assigned' THEN 75
    WHEN e.onboardingStatus = 'systems-created' THEN 50
    ELSE 25
  END AS progressPercentage
FROM Employees e
LEFT JOIN PreHires ph ON e.preHireId = ph.id
LEFT JOIN PackageAssignments pa ON pa.employeeId = e.id
LEFT JOIN PackageVersions pv ON pa.packageVersionId = pv.id
LEFT JOIN Packages p ON pv.packageId = p.id;

-- View: Hardware inventory summary
CREATE VIEW vw_HardwareInventorySummary AS
SELECT
  h.type,
  h.manufacturer,
  COUNT(*) AS totalModels,
  SUM(CASE WHEN h.supersededById IS NULL THEN 1 ELSE 0 END) AS currentModels,
  SUM(CASE WHEN h.supersededById IS NOT NULL THEN 1 ELSE 0 END) AS supersededModels,
  AVG(h.cost) AS avgCost,
  SUM(h.cost) AS totalInventoryValue
FROM Hardware h
GROUP BY h.type, h.manufacturer;

-- View: Software license utilization
CREATE VIEW vw_SoftwareLicenseUtilization AS
SELECT
  s.id,
  s.name,
  s.vendor,
  s.licenseType,
  s.totalSeats,
  s.assignedSeats,
  CASE
    WHEN s.totalSeats IS NULL THEN NULL
    ELSE s.totalSeats - s.assignedSeats
  END AS availableSeats,
  CASE
    WHEN s.totalSeats IS NULL THEN NULL
    ELSE CAST(s.assignedSeats AS DECIMAL) / NULLIF(s.totalSeats, 0) * 100
  END AS utilizationPercentage,
  s.renewalDate,
  DATEDIFF(day, GETDATE(), s.renewalDate) AS daysUntilRenewal,
  CASE
    WHEN s.totalSeats IS NOT NULL AND s.assignedSeats >= s.totalSeats THEN 'Full'
    WHEN s.totalSeats IS NOT NULL AND s.assignedSeats >= s.totalSeats * 0.9 THEN 'Near Capacity'
    WHEN s.renewalDate IS NOT NULL AND DATEDIFF(day, GETDATE(), s.renewalDate) <= 30 THEN 'Expiring Soon'
    ELSE 'Available'
  END AS licenseStatus
FROM Software s
WHERE s.isActive = 1;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Create XD Designer Standard Package
INSERT INTO Packages (id, name, description, roleTarget, departmentTarget, isStandard, createdBy, lastModifiedBy)
VALUES (
  'pkg-xd-std-001',
  'XD Designer Standard',
  'Standard equipment package for Experience Designers',
  '["XD Designer","Senior XD Designer"]',
  '["Creative","IPTC"]',
  1,
  'admin@momentumww.com',
  'admin@momentumww.com'
);

-- Example 2: Create Hardware - MacBook Pro M3
INSERT INTO Hardware (id, type, model, manufacturer, specifications, cost)
VALUES (
  'hw-comp-001-m3',
  'computer',
  'MacBook Pro 16" M3 Max',
  'Apple',
  '{"processor":"M3 Max","ram":"64GB","storage":"2TB SSD"}',
  4299.00
);

-- Example 3: Create Software - Adobe Creative Cloud
INSERT INTO Software (id, name, vendor, licenseType, totalSeats, cost, renewalFrequency, requiresApproval, approver)
VALUES (
  'sw-adobe-cc',
  'Adobe Creative Cloud',
  'Adobe',
  'subscription',
  100,
  54.99,
  'monthly',
  0,
  'Auto'
);

-- Example 4: Create Pre-hire
INSERT INTO PreHires (id, candidateName, email, role, department, hiringManager, startDate, status, createdBy, lastModifiedBy)
VALUES (
  'pre-2025-001',
  'Jane Smith',
  'jane.smith@momentumww.com',
  'XD Designer',
  'Creative',
  'John Doe',
  '2025-12-01',
  'accepted',
  'camille@momentumww.com',
  'camille@momentumww.com'
);

-- Example 5: Create Employee
INSERT INTO Employees (id, activeDirectoryId, name, email, department, role, startDate, onboardingStatus, createdBy, lastModifiedBy)
VALUES (
  'emp-001',
  'abc123-def456',
  'John Smith',
  'john.smith@momentumww.com',
  'Creative',
  'Senior XD Designer',
  '2023-01-15',
  'active',
  'hr@momentumww.com',
  'hr@momentumww.com'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP VIEW IF EXISTS vw_SoftwareLicenseUtilization;
DROP VIEW IF EXISTS vw_HardwareInventorySummary;
DROP VIEW IF EXISTS vw_EmployeesOnboardingProgress;
DROP VIEW IF EXISTS vw_PreHiresWithPackages;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS PreHires;
DROP TABLE IF EXISTS Software;
DROP TABLE IF EXISTS Hardware;
DROP TABLE IF EXISTS Packages;
*/
