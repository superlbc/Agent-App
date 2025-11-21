-- ============================================================================
-- MIGRATION 001: Package Versioning System
-- ============================================================================
-- Date: 2025-11-20
-- Purpose: Add package versioning to prevent retroactive changes to assignments
--
-- **What This Does**:
-- 1. Creates PackageVersions table - Immutable snapshots of package configurations
-- 2. Creates PackageAssignments table - Links pre-hires/employees to specific versions
--
-- **Why This Matters**:
-- - Prevents retroactive changes to packages already assigned to employees
-- - Each assignment gets the exact hardware/software promised at assignment time
-- - Audit trail of all package changes over time
--
-- **Example Workflow**:
-- - Package "XD Designer Standard" created → v1 created automatically
-- - Package assigned to pre-hire Jane → PackageAssignment links to v1
-- - Package updated (MacBook M3 → M4) → v2 created
-- - Jane still gets M3 (her assignment points to v1)
-- - New pre-hires get M4 (new assignments point to v2)
-- ============================================================================

-- ============================================================================
-- TABLE: PackageVersions
-- ============================================================================
-- Stores immutable snapshots of package configurations
-- Each time a package is created or updated, a new version is created
-- Assignments link to specific versions (not the package directly)

CREATE TABLE PackageVersions (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Key to Packages table
  packageId VARCHAR(50) NOT NULL,

  -- Version Metadata
  versionNumber INT NOT NULL,                    -- 1, 2, 3, etc. (auto-incremented per packageId)
  snapshotDate DATETIME NOT NULL DEFAULT GETDATE(), -- When this version was created

  -- Package Configuration Snapshot (JSON arrays)
  hardware NVARCHAR(MAX) NOT NULL,               -- JSON array of Hardware objects
  software NVARCHAR(MAX) NOT NULL,               -- JSON array of Software objects
  isStandard BIT NOT NULL DEFAULT 1,             -- true = auto-approve, false = requires SVP approval

  -- Audit Fields
  createdBy VARCHAR(100) NOT NULL,               -- User who created this version
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  notes NVARCHAR(500) NULL,                      -- Change notes (e.g., "Updated MacBook Pro M3 → M4")

  -- Constraints
  CONSTRAINT FK_PackageVersions_Packages FOREIGN KEY (packageId) REFERENCES Packages(id),
  CONSTRAINT UQ_PackageVersions_PackageVersion UNIQUE (packageId, versionNumber)
);

-- ============================================================================
-- TABLE: PackageAssignments
-- ============================================================================
-- Links pre-hires or employees to specific package versions
-- Each assignment is immutable and references a specific PackageVersion (not Package!)

CREATE TABLE PackageAssignments (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Foreign Keys (one of these must be populated)
  preHireId VARCHAR(50) NULL,                    -- FK to PreHires table (if assigned to pre-hire)
  employeeId VARCHAR(50) NULL,                   -- FK to Employees table (if assigned to employee)
  packageVersionId VARCHAR(50) NOT NULL,         -- FK to PackageVersions table

  -- Assignment Metadata
  assignedDate DATETIME NOT NULL DEFAULT GETDATE(), -- When the assignment was made
  assignedBy VARCHAR(100) NOT NULL,              -- User who made the assignment
  notes NVARCHAR(500) NULL,                      -- Assignment notes (e.g., "Approved by hiring manager")

  -- Constraints
  CONSTRAINT FK_PackageAssignments_PreHires FOREIGN KEY (preHireId) REFERENCES PreHires(id),
  CONSTRAINT FK_PackageAssignments_Employees FOREIGN KEY (employeeId) REFERENCES Employees(id),
  CONSTRAINT FK_PackageAssignments_PackageVersions FOREIGN KEY (packageVersionId) REFERENCES PackageVersions(id),
  CONSTRAINT CHK_PackageAssignments_OneReference CHECK (
    (preHireId IS NOT NULL AND employeeId IS NULL) OR
    (preHireId IS NULL AND employeeId IS NOT NULL)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Optimize common query patterns

-- Index for looking up versions by package
CREATE NONCLUSTERED INDEX IX_PackageVersions_PackageId
ON PackageVersions(packageId, versionNumber DESC);

-- Index for looking up assignments by pre-hire
CREATE NONCLUSTERED INDEX IX_PackageAssignments_PreHireId
ON PackageAssignments(preHireId)
WHERE preHireId IS NOT NULL;

-- Index for looking up assignments by employee
CREATE NONCLUSTERED INDEX IX_PackageAssignments_EmployeeId
ON PackageAssignments(employeeId)
WHERE employeeId IS NOT NULL;

-- Index for looking up assignments by package version
CREATE NONCLUSTERED INDEX IX_PackageAssignments_PackageVersionId
ON PackageAssignments(packageVersionId);

-- ============================================================================
-- VIEWS
-- ============================================================================
-- Convenience views for common queries

-- View: Latest package versions (most recent version per package)
CREATE VIEW vw_LatestPackageVersions AS
SELECT
  pv.id,
  pv.packageId,
  p.name AS packageName,
  pv.versionNumber,
  pv.snapshotDate,
  pv.hardware,
  pv.software,
  pv.isStandard,
  pv.createdBy,
  pv.createdDate,
  pv.notes
FROM PackageVersions pv
INNER JOIN Packages p ON pv.packageId = p.id
WHERE pv.versionNumber = (
  SELECT MAX(versionNumber)
  FROM PackageVersions
  WHERE packageId = pv.packageId
);

-- View: Package assignments with version details
CREATE VIEW vw_PackageAssignmentsWithDetails AS
SELECT
  pa.id AS assignmentId,
  pa.preHireId,
  pa.employeeId,
  pa.assignedDate,
  pa.assignedBy,
  pa.notes AS assignmentNotes,
  pv.id AS packageVersionId,
  pv.packageId,
  p.name AS packageName,
  pv.versionNumber,
  pv.snapshotDate AS versionCreatedDate,
  pv.hardware,
  pv.software,
  pv.isStandard,
  pv.notes AS versionNotes
FROM PackageAssignments pa
INNER JOIN PackageVersions pv ON pa.packageVersionId = pv.id
INNER JOIN Packages p ON pv.packageId = p.id;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
-- Insert sample package version and assignment
-- (Assumes a Package with id 'pkg-xd-std-001' exists)

/*
-- Example: Create initial version (v1) for existing package
INSERT INTO PackageVersions (id, packageId, versionNumber, hardware, software, isStandard, createdBy, notes)
VALUES (
  'pkgver-xd-std-001-v1',
  'pkg-xd-std-001',
  1,
  '[{"id":"hw-mbp-m3-16","type":"computer","model":"MacBook Pro 16\" M3 Max","manufacturer":"Apple"}]',
  '[{"id":"sw-adobe-cc","name":"Adobe Creative Cloud","vendor":"Adobe"}]',
  1,
  'admin@momentumww.com',
  'Initial version'
);

-- Example: Assign version to pre-hire
INSERT INTO PackageAssignments (id, preHireId, packageVersionId, assignedDate, assignedBy, notes)
VALUES (
  'pkgasgn-pre-2025-001',
  'pre-2025-001',
  'pkgver-xd-std-001-v1',
  GETDATE(),
  'camille@momentumww.com',
  'Standard XD Designer package assigned during onboarding'
);

-- Example: Create updated version (v2) with hardware change
INSERT INTO PackageVersions (id, packageId, versionNumber, hardware, software, isStandard, createdBy, notes)
VALUES (
  'pkgver-xd-std-001-v2',
  'pkg-xd-std-001',
  2,
  '[{"id":"hw-mbp-m4-16","type":"computer","model":"MacBook Pro 16\" M4 Max","manufacturer":"Apple"}]',
  '[{"id":"sw-adobe-cc","name":"Adobe Creative Cloud","vendor":"Adobe"}]',
  1,
  'admin@momentumww.com',
  'Updated MacBook Pro M3 → M4'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP VIEW IF EXISTS vw_PackageAssignmentsWithDetails;
DROP VIEW IF EXISTS vw_LatestPackageVersions;
DROP TABLE IF EXISTS PackageAssignments;
DROP TABLE IF EXISTS PackageVersions;
*/
