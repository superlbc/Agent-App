# Employee Onboarding System - Database Schema

## Overview

This directory contains SQL migration scripts for the Employee Onboarding System database. The system uses Azure SQL Database (or SQL Server) with a versioned migration approach.

## Database Structure

### Core Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `PackageVersions` | Immutable snapshots of package configurations | 001 |
| `PackageAssignments` | Links pre-hires/employees to specific package versions | 001 |
| `Packages` | Package definitions (master) | TBD |
| `Hardware` | Hardware inventory | TBD |
| `Software` | Software catalog and license pools | TBD |
| `PreHires` | Pre-hire candidate tracking | TBD |
| `Employees` | Employee records | TBD |
| `ApprovalRequests` | Approval workflow tracking | TBD |
| `HelixTickets` | IT ticket integration | TBD |
| `FreezePeriods` | Workday freeze period definitions | TBD |
| `FreezePeriodNotifications` | Freeze period email tracking | TBD |

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
# Migration 001
sqlcmd -S <server> -d EmployeeOnboarding -i migrations/001_package_versioning.sql

# Future migrations
# sqlcmd -S <server> -d EmployeeOnboarding -i migrations/002_*.sql
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

## Future Migrations

Planned migrations:

- `002_core_tables.sql` - Packages, Hardware, Software, PreHires, Employees
- `003_approval_workflow.sql` - ApprovalRequests, HelixTickets
- `004_freeze_periods.sql` - FreezePeriods, FreezePeriodNotifications
- `005_hardware_superseding.sql` - Add supersededById to Hardware table
- `006_role_based_matching.sql` - Add roleTargets array to Packages

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
