# Employee Onboarding System - Database Schema

## Overview

This directory contains SQL migration scripts for the Employee Onboarding System database. The system uses Azure SQL Database (or SQL Server) with a versioned migration approach.

## Database Structure

### Core Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `Packages` | Package definitions (master) | 003 |
| `PackageVersions` | Immutable snapshots of package configurations | 001 |
| `PackageAssignments` | Links pre-hires/employees to specific package versions | 001 |
| `Hardware` | Hardware inventory catalog | 003 |
| `HardwareMaintenanceHistory` | Hardware maintenance tracking | 006 |
| `Software` | Software catalog and license pools | 003 |
| `LicenseAssignments` | Software license assignments to employees | 006 |
| `PreHires` | Pre-hire candidate tracking | 003 |
| `Employees` | Employee records with onboarding status | 003 |
| `ApprovalRequests` | Approval workflow tracking | 004 |
| `HelixTickets` | IT ticket integration | 004 |
| `OnboardingTasks` | Task checklist management | 004 |
| `FreezePeriods` | Workday freeze period definitions | 005 |
| `FreezePeriodNotifications` | Freeze period email tracking | 005 |

## Migration Files

### 001_package_versioning.sql

**Purpose**: Implements package versioning system to prevent retroactive changes

**Tables Created**:
- `PackageVersions` - Versioned snapshots of packages
- `PackageAssignments` - Pre-hire/employee package assignments

**Views Created**:
- `vw_LatestPackageVersions` - Latest version per package
- `vw_PackageAssignmentsWithDetails` - Assignments with package details

**Key Features**:
- Automatic version numbering (1, 2, 3, ...)
- Immutable assignments (linked to specific versions)
- JSON storage for hardware/software arrays
- Audit trail with creation timestamps and notes

### 002_hardware_superseding.sql

**Purpose**: Add hardware superseding relationships for automatic package updates

**Tables Modified**:
- `Hardware` - Added `supersededById` column for upgrade chains

**Views Created**:
- `vw_LatestHardware` - Current hardware (not superseded)
- `vw_HardwareSupersedingChain` - Full upgrade lineage
- `vw_SupersededHardwareInPackages` - Package impact analysis

**Stored Procedures**:
- `sp_SupersedeHardware` - Mark hardware as superseded and update packages

**Key Features**:
- Superseding chains (e.g., MacBook M3 → M4 → M5)
- Automatic package updates with new hardware
- Existing assignments preserved via versioning
- Impact analysis for package updates

### 003_core_tables.sql

**Purpose**: Create foundational tables for Employee Onboarding System

**Tables Created**:
- `Packages` - Equipment package definitions
- `Hardware` - Hardware inventory catalog
- `Software` - Software catalog with license pools
- `PreHires` - Pre-hire candidate tracking
- `Employees` - Employee records with onboarding status

**Views Created**:
- `vw_PreHiresWithPackages` - Pre-hires with assigned packages
- `vw_EmployeesOnboardingProgress` - Employee onboarding status
- `vw_HardwareInventorySummary` - Hardware inventory by type
- `vw_SoftwareLicenseUtilization` - License usage and availability

**Key Features**:
- Complete employee lifecycle tracking (pre-hire → employee)
- Hardware/software catalog with cost tracking
- License pool management (seats, utilization, renewal)
- Onboarding phase tracking with progress percentage

### 004_approval_workflow.sql

**Purpose**: Create approval routing and onboarding task tracking

**Tables Created**:
- `ApprovalRequests` - Equipment/software approval workflow
- `HelixTickets` - IT ticketing system integration
- `OnboardingTasks` - Task checklist management

**Views Created**:
- `vw_PendingApprovals` - Approval queue with urgency
- `vw_OpenHelixTickets` - Active IT tickets
- `vw_OverdueOnboardingTasks` - Tasks past due date
- `vw_OnboardingProgressSummary` - Employee onboarding metrics
- `vw_ApprovalRequestHistory` - Approval audit trail

**Stored Procedures**:
- `sp_AutoApproveStandardPackage` - Auto-approve and create Helix ticket

**Key Features**:
- Standard packages auto-approve, exceptions route to SVP
- Helix ticket creation for IT provisioning
- Freeze period password reset/termination handling
- Task tracking with due dates and blocking

### 005_freeze_periods.sql

**Purpose**: Create freeze period management and notification tracking

**Tables Created**:
- `FreezePeriods` - Workday freeze period definitions
- `FreezePeriodNotifications` - Email notification tracking

**Views Created**:
- `vw_ActiveFreezePeriods` - Current and upcoming freeze periods
- `vw_PendingFreezePeriodNotifications` - Notifications to send
- `vw_FreezePeriodNotificationHistory` - Sent notification audit trail
- `vw_EmployeesAffectedByFreezePeriod` - Employees with start/end during freeze

**Stored Procedures**:
- `sp_CreateFreezePeriodNotifications` - Generate notifications for affected employees
- `sp_MarkNotificationSent` - Track sent notifications

**Key Features**:
- Configurable freeze periods (not hardcoded Nov-Jan 5)
- Email template system with placeholders
- Auto-detect employees starting/ending during freeze
- Password reset automation for pre-loaded accounts
- Termination email automation

### 006_license_management.sql

**Purpose**: Create license assignment and reclaim tracking (Phase 2)

**Tables Created**:
- `LicenseAssignments` - Software license assignments to employees
- `HardwareMaintenanceHistory` - Hardware maintenance tracking

**Views Created**:
- `vw_EmployeeLicenseAssignments` - Licenses per employee
- `vw_LicenseOverAllocationAlerts` - Over-allocated licenses
- `vw_ExpiringLicenseAssignments` - Licenses expiring soon
- `vw_LicenseReclaimHistory` - Reclaimed license audit trail
- `vw_HardwareMaintenanceCosts` - Total cost of ownership

**Stored Procedures**:
- `sp_AssignLicense` - Assign license to employee
- `sp_ReclaimLicense` - Revoke single license
- `sp_ReclaimAllLicensesForEmployee` - Bulk reclaim on termination

**Key Features**:
- License seat tracking and utilization
- Over-allocation prevention and alerts
- Automatic reclaim on employee termination
- Temporary license assignments with expiration
- Hardware maintenance cost tracking

## How to Apply Migrations

### Prerequisites

1. Azure SQL Database or SQL Server 2016+
2. Database connection with CREATE TABLE permissions
3. SQL Server Management Studio (SSMS) or Azure Data Studio

### Steps

1. **Create Database** (if not exists):
```sql
CREATE DATABASE EmployeeOnboarding;
GO
USE EmployeeOnboarding;
GO
```

2. **Apply Migrations** (in order):
```bash
# Migration 001 - Package Versioning (REQUIRED)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/001_package_versioning.sql

# Migration 002 - Hardware Superseding (REQUIRED)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/002_hardware_superseding.sql

# Migration 003 - Core Tables (REQUIRED)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/003_core_tables.sql

# Migration 004 - Approval Workflow (REQUIRED)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/004_approval_workflow.sql

# Migration 005 - Freeze Periods (REQUIRED)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/005_freeze_periods.sql

# Migration 006 - License Management (Phase 2 - Optional)
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/006_license_management.sql
```

3. **Verify Migration**:
```sql
-- Check if tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

-- Check if views exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
```

## Rollback Instructions

Each migration file includes rollback SQL at the bottom (commented out). To undo a migration:

```sql
-- Example: Rollback migration 001
DROP VIEW IF EXISTS vw_PackageAssignmentsWithDetails;
DROP VIEW IF EXISTS vw_LatestPackageVersions;
DROP TABLE IF EXISTS PackageAssignments;
DROP TABLE IF EXISTS PackageVersions;
```

## Connection String Format

### Azure SQL Database

```
Server=tcp:<server-name>.database.windows.net,1433;
Initial Catalog=EmployeeOnboarding;
Persist Security Info=False;
User ID=<username>;
Password=<password>;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

### Local SQL Server

```
Server=localhost;
Database=EmployeeOnboarding;
Integrated Security=True;
```

## Data Model Relationships

```
Packages (1) ──< (many) PackageVersions
                            │
                            │ (FK: packageVersionId)
                            │
                            └──> PackageAssignments ──> PreHires (FK: preHireId)
                                                    └──> Employees (FK: employeeId)
```

## Query Examples

### Get latest version of a package

```sql
SELECT * FROM vw_LatestPackageVersions
WHERE packageName = 'XD Designer Standard';
```

### Get all versions of a package (history)

```sql
SELECT
  versionNumber,
  snapshotDate,
  createdBy,
  notes,
  JSON_VALUE(hardware, '$[0].model') AS primaryHardware
FROM PackageVersions
WHERE packageId = 'pkg-xd-std-001'
ORDER BY versionNumber DESC;
```

### Get package assignment for a pre-hire

```sql
SELECT
  packageName,
  versionNumber,
  hardware,
  software,
  assignedDate,
  assignedBy
FROM vw_PackageAssignmentsWithDetails
WHERE preHireId = 'pre-2025-001';
```

### Create new package version

```sql
DECLARE @newVersionNumber INT;

-- Get next version number
SELECT @newVersionNumber = ISNULL(MAX(versionNumber), 0) + 1
FROM PackageVersions
WHERE packageId = 'pkg-xd-std-001';

-- Insert new version
INSERT INTO PackageVersions (id, packageId, versionNumber, hardware, software, isStandard, createdBy, notes)
VALUES (
  'pkgver-xd-std-001-v' + CAST(@newVersionNumber AS VARCHAR),
  'pkg-xd-std-001',
  @newVersionNumber,
  '[{"id":"hw-mbp-m4-16","type":"computer","model":"MacBook Pro 16\" M4 Max"}]',
  '[{"id":"sw-adobe-cc","name":"Adobe Creative Cloud"}]',
  1,
  'admin@momentumww.com',
  'Updated MacBook Pro M3 → M4'
);
```

## Best Practices

### Version Creation

1. **Always create v1** when creating a new package
2. **Never delete** old versions (historical record)
3. **Add notes** explaining version changes
4. **Test queries** against both old and new versions

### Assignment Creation

1. **Always assign to latest version** (use `vw_LatestPackageVersions`)
2. **Never update** existing assignments (create new assignment instead)
3. **Check constraints** (either preHireId OR employeeId, not both)

### JSON Storage

Hardware and software are stored as JSON arrays. To query:

```sql
-- Extract first hardware item
SELECT JSON_VALUE(hardware, '$[0].model') AS model
FROM PackageVersions;

-- Extract all hardware items
SELECT
  id,
  value AS hardwareItem
FROM PackageVersions
CROSS APPLY OPENJSON(hardware);
```

## Migration Status

### Completed Migrations ✅

- ✅ `001_package_versioning.sql` - PackageVersions, PackageAssignments
- ✅ `002_hardware_superseding.sql` - Hardware superseding relationships
- ✅ `003_core_tables.sql` - Packages, Hardware, Software, PreHires, Employees
- ✅ `004_approval_workflow.sql` - ApprovalRequests, HelixTickets, OnboardingTasks
- ✅ `005_freeze_periods.sql` - FreezePeriods, FreezePeriodNotifications
- ✅ `006_license_management.sql` - LicenseAssignments, HardwareMaintenanceHistory

### Future Enhancements (Optional)

Potential future migrations for additional features:

- `007_document_management.sql` - Onboarding document tracking (I-9, W-4, etc.)
- `008_audit_logging.sql` - Comprehensive audit trail for all table changes
- `009_reporting_views.sql` - Additional business intelligence views
- `010_performance_optimization.sql` - Indexes and query optimization

## Maintenance

### Backup

```sql
-- Full backup
BACKUP DATABASE EmployeeOnboarding
TO DISK = 'C:\Backups\EmployeeOnboarding.bak'
WITH FORMAT, NAME = 'Full Database Backup';
```

### Index Maintenance

```sql
-- Rebuild indexes
ALTER INDEX ALL ON PackageVersions REBUILD;
ALTER INDEX ALL ON PackageAssignments REBUILD;
```

### Statistics Update

```sql
-- Update statistics
UPDATE STATISTICS PackageVersions;
UPDATE STATISTICS PackageAssignments;
```

## Troubleshooting

### Issue: Foreign key constraint failures

**Solution**: Ensure parent records exist before creating child records
- Create Package before PackageVersion
- Create PackageVersion before PackageAssignment
- Create PreHire/Employee before PackageAssignment

### Issue: JSON parsing errors

**Solution**: Validate JSON before inserting
```sql
-- Check if JSON is valid
SELECT ISJSON('[{"id":"test"}]'); -- Returns 1 if valid
```

### Issue: Duplicate version numbers

**Solution**: Use transaction and explicit version number generation
```sql
BEGIN TRANSACTION;
  DECLARE @nextVersion INT;
  SELECT @nextVersion = ISNULL(MAX(versionNumber), 0) + 1
  FROM PackageVersions WITH (HOLDLOCK, TABLOCKX)
  WHERE packageId = 'pkg-xd-std-001';

  -- Insert with explicit version number
  INSERT INTO PackageVersions (...) VALUES (@nextVersion, ...);
COMMIT TRANSACTION;
```

## Contact

For database questions, contact:
- **DBA Team**: dba@momentumww.com
- **Development**: dev@momentumww.com
- **IT Support**: itsupport@momentumww.com
