-- ============================================================================
-- MIGRATION 007: RBAC System (Role-Based Access Control)
-- ============================================================================
-- Date: 2025-11-21
-- Purpose: Implement comprehensive role-based access control system
-- Dependencies: Migration 003 (Core Tables - Employees)
--
-- **What This Does**:
-- 1. Creates Roles table - System and custom role definitions
-- 2. Creates Permissions table - Granular permission catalog
-- 3. Creates RolePermissions table - Maps permissions to roles
-- 4. Creates UserRoles table - Assigns roles to users
--
-- **Why This Matters**:
-- - Critical blocker for production deployment identified in COMPREHENSIVE-ANALYSIS-REPORT.md
-- - Enforces security: HR can view but not create hardware, HR packages are exceptions
-- - Finance views hardware refresh, Admin has full access
-- - Enables multi-role support (users can have multiple roles)
-- ============================================================================

-- ============================================================================
-- TABLE: Roles
-- ============================================================================
-- Role definitions (system and custom roles)

CREATE TABLE Roles (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Role Identity
  name VARCHAR(50) NOT NULL,                   -- EMPLOYEE, HIRING_MANAGER, MANAGER, IT, FINANCE, HR, DIRECTOR, ADMIN
  displayName NVARCHAR(100) NOT NULL,          -- "Human Resources", "IT Administrator", "Finance Analyst"
  description NVARCHAR(500) NULL,

  -- Role Type
  isSystemRole BIT NOT NULL DEFAULT 0,         -- true = cannot be deleted (EMPLOYEE, HR, IT, ADMIN, etc.)

  -- Status
  isActive BIT NOT NULL DEFAULT 1,             -- false = archived/deprecated

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  modifiedDate DATETIME NOT NULL DEFAULT GETDATE(),
  createdBy VARCHAR(100) NOT NULL,
  modifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT UQ_Roles_Name UNIQUE (name),

  -- Indexes
  INDEX IX_Roles_Name (name),
  INDEX IX_Roles_IsSystemRole (isSystemRole),
  INDEX IX_Roles_IsActive (isActive)
);

-- ============================================================================
-- TABLE: Permissions
-- ============================================================================
-- Permission catalog (50+ granular permissions)

CREATE TABLE Permissions (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Permission Identity
  name VARCHAR(100) NOT NULL,                  -- e.g., PREHIRE_CREATE, HARDWARE_READ, APPROVAL_APPROVE_ALL

  -- Categorization
  module VARCHAR(50) NOT NULL,                 -- PREHIRE, PACKAGE, HARDWARE, SOFTWARE, EMPLOYEE, APPROVAL, ADMIN, etc.
  action VARCHAR(50) NOT NULL,                 -- CREATE, READ, UPDATE, DELETE, EXPORT, APPROVE, etc.

  -- Metadata
  displayName NVARCHAR(200) NOT NULL,          -- "Create Pre-hire Records", "View Hardware Inventory"
  description NVARCHAR(500) NULL,

  -- Status
  isActive BIT NOT NULL DEFAULT 1,

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  modifiedDate DATETIME NOT NULL DEFAULT GETDATE(),

  -- Constraints
  CONSTRAINT UQ_Permissions_Name UNIQUE (name),

  -- Indexes
  INDEX IX_Permissions_Module (module),
  INDEX IX_Permissions_Action (action),
  INDEX IX_Permissions_IsActive (isActive)
);

-- ============================================================================
-- TABLE: RolePermissions
-- ============================================================================
-- Maps permissions to roles (many-to-many junction table)

CREATE TABLE RolePermissions (
  -- Composite Primary Key
  roleId VARCHAR(50) NOT NULL,
  permissionId VARCHAR(50) NOT NULL,

  -- Audit Fields
  assignedDate DATETIME NOT NULL DEFAULT GETDATE(),
  assignedBy VARCHAR(100) NOT NULL,

  -- Constraints
  PRIMARY KEY (roleId, permissionId),
  CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE CASCADE,
  CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (permissionId) REFERENCES Permissions(id) ON DELETE CASCADE,

  -- Indexes
  INDEX IX_RolePermissions_RoleId (roleId),
  INDEX IX_RolePermissions_PermissionId (permissionId)
);

-- ============================================================================
-- TABLE: UserRoles
-- ============================================================================
-- Assigns roles to users (supports multi-role per user)

CREATE TABLE UserRoles (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- User Identity (from Azure AD)
  userId VARCHAR(100) NOT NULL,               -- Azure AD localAccountId or username
  userEmail VARCHAR(200) NOT NULL,
  userName NVARCHAR(200) NOT NULL,

  -- Role Assignment
  roleId VARCHAR(50) NOT NULL,
  roleName VARCHAR(50) NOT NULL,              -- Denormalized for query performance

  -- Assignment Metadata
  assignedBy VARCHAR(100) NOT NULL,           -- Who assigned this role
  assignedDate DATETIME NOT NULL DEFAULT GETDATE(),
  expirationDate DATETIME NULL,               -- NULL = no expiration

  -- Status
  isActive BIT NOT NULL DEFAULT 1,            -- false = revoked or expired

  -- Audit Fields
  createdDate DATETIME NOT NULL DEFAULT GETDATE(),
  lastModified DATETIME NOT NULL DEFAULT GETDATE(),
  modifiedBy VARCHAR(100) NOT NULL,

  -- Constraints
  CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (roleId) REFERENCES Roles(id),
  CONSTRAINT CHK_UserRoles_ExpirationDate CHECK (expirationDate IS NULL OR expirationDate > assignedDate),

  -- Indexes
  INDEX IX_UserRoles_UserId (userId),
  INDEX IX_UserRoles_UserEmail (userEmail),
  INDEX IX_UserRoles_RoleId (roleId),
  INDEX IX_UserRoles_IsActive (isActive),
  INDEX IX_UserRoles_ExpirationDate (expirationDate)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: User permissions (flattened view of all permissions per user)
CREATE VIEW vw_UserPermissions AS
SELECT DISTINCT
  ur.userId,
  ur.userEmail,
  ur.userName,
  ur.roleId,
  r.name AS roleName,
  r.displayName AS roleDisplayName,
  p.id AS permissionId,
  p.name AS permissionName,
  p.module AS permissionModule,
  p.action AS permissionAction
FROM UserRoles ur
INNER JOIN Roles r ON ur.roleId = r.id
INNER JOIN RolePermissions rp ON r.id = rp.roleId
INNER JOIN Permissions p ON rp.permissionId = p.id
WHERE ur.isActive = 1
  AND r.isActive = 1
  AND p.isActive = 1
  AND (ur.expirationDate IS NULL OR ur.expirationDate > GETDATE());

-- View: Role summary with permission count
CREATE VIEW vw_RoleSummary AS
SELECT
  r.id AS roleId,
  r.name AS roleName,
  r.displayName,
  r.description,
  r.isSystemRole,
  r.isActive,
  COUNT(DISTINCT rp.permissionId) AS permissionCount,
  COUNT(DISTINCT ur.userId) AS assignedUserCount
FROM Roles r
LEFT JOIN RolePermissions rp ON r.id = rp.roleId
LEFT JOIN UserRoles ur ON r.id = ur.roleId AND ur.isActive = 1 AND (ur.expirationDate IS NULL OR ur.expirationDate > GETDATE())
GROUP BY r.id, r.name, r.displayName, r.description, r.isSystemRole, r.isActive;

-- View: User role assignments
CREATE VIEW vw_UserRoleAssignments AS
SELECT
  ur.id,
  ur.userId,
  ur.userEmail,
  ur.userName,
  ur.roleId,
  r.name AS roleName,
  r.displayName AS roleDisplayName,
  ur.assignedBy,
  ur.assignedDate,
  ur.expirationDate,
  ur.isActive,
  CASE
    WHEN ur.isActive = 0 THEN 'Revoked'
    WHEN ur.expirationDate IS NOT NULL AND ur.expirationDate < GETDATE() THEN 'Expired'
    WHEN ur.expirationDate IS NOT NULL AND DATEDIFF(day, GETDATE(), ur.expirationDate) <= 7 THEN 'Expiring Soon'
    ELSE 'Active'
  END AS assignmentStatus,
  CASE
    WHEN ur.expirationDate IS NOT NULL THEN DATEDIFF(day, GETDATE(), ur.expirationDate)
    ELSE NULL
  END AS daysUntilExpiration
FROM UserRoles ur
INNER JOIN Roles r ON ur.roleId = r.id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Assign role to user
CREATE PROCEDURE sp_AssignRoleToUser
  @userId VARCHAR(100),
  @userEmail VARCHAR(200),
  @userName NVARCHAR(200),
  @roleName VARCHAR(50),
  @assignedBy VARCHAR(100),
  @expirationDate DATETIME = NULL
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validate role exists
    DECLARE @roleId VARCHAR(50);

    SELECT @roleId = id
    FROM Roles
    WHERE name = @roleName AND isActive = 1;

    IF @roleId IS NULL
    BEGIN
      RAISERROR('Role not found or inactive: %s', 16, 1, @roleName);
      RETURN;
    END

    -- Check if user already has this role (active assignment)
    IF EXISTS (
      SELECT 1
      FROM UserRoles
      WHERE userId = @userId
        AND roleId = @roleId
        AND isActive = 1
        AND (expirationDate IS NULL OR expirationDate > GETDATE())
    )
    BEGIN
      RAISERROR('User already has this role assigned: %s', 16, 1, @roleName);
      RETURN;
    END

    -- Create assignment
    DECLARE @assignmentId VARCHAR(50) = 'ur-' + REPLACE(NEWID(), '-', '');

    INSERT INTO UserRoles (
      id, userId, userEmail, userName, roleId, roleName,
      assignedBy, expirationDate, isActive, modifiedBy
    )
    VALUES (
      @assignmentId, @userId, @userEmail, @userName, @roleId, @roleName,
      @assignedBy, @expirationDate, 1, @assignedBy
    );

    COMMIT TRANSACTION;

    PRINT 'Role assigned successfully: ' + @roleName + ' to ' + @userEmail;
    PRINT 'Assignment ID: ' + @assignmentId;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- Procedure: Revoke role from user
CREATE PROCEDURE sp_RevokeRoleFromUser
  @userId VARCHAR(100),
  @roleName VARCHAR(50),
  @revokedBy VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Find active role assignment
    DECLARE @roleId VARCHAR(50);

    SELECT @roleId = id
    FROM Roles
    WHERE name = @roleName;

    IF @roleId IS NULL
    BEGIN
      RAISERROR('Role not found: %s', 16, 1, @roleName);
      RETURN;
    END

    -- Revoke assignment
    UPDATE UserRoles
    SET
      isActive = 0,
      lastModified = GETDATE(),
      modifiedBy = @revokedBy
    WHERE userId = @userId
      AND roleId = @roleId
      AND isActive = 1;

    IF @@ROWCOUNT = 0
    BEGIN
      RAISERROR('No active role assignment found for user', 16, 1);
      RETURN;
    END

    COMMIT TRANSACTION;

    PRINT 'Role revoked successfully: ' + @roleName + ' from user ' + @userId;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- Procedure: Check if user has permission
CREATE PROCEDURE sp_CheckUserPermission
  @userId VARCHAR(100),
  @permissionName VARCHAR(100),
  @hasPermission BIT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  SET @hasPermission = 0;

  IF EXISTS (
    SELECT 1
    FROM vw_UserPermissions
    WHERE userId = @userId
      AND permissionName = @permissionName
  )
  BEGIN
    SET @hasPermission = 1;
  END
END;
GO

-- ============================================================================
-- SEED DATA - System Roles
-- ============================================================================

-- Insert 8 system roles
INSERT INTO Roles (id, name, displayName, description, isSystemRole, createdBy, modifiedBy)
VALUES
  ('role-employee', 'EMPLOYEE', 'Employee', 'Standard employee with view-only access to own data', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-hiring-mgr', 'HIRING_MANAGER', 'Hiring Manager', 'Create pre-hires and assign packages for own team', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-manager', 'MANAGER', 'Manager', 'Approve team equipment requests', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-it', 'IT', 'IT Administrator', 'Manage hardware, process Helix tickets, assign software', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-finance', 'FINANCE', 'Finance Analyst', 'View costs, approve high-value purchases', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-hr', 'HR', 'Human Resources', 'Create pre-hires, view hardware/software (cannot create), create exception packages', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-director', 'DIRECTOR', 'Director', 'Full HR access + create packages + all approvals', 1, 'system@momentumww.com', 'system@momentumww.com'),
  ('role-admin', 'ADMIN', 'System Administrator', 'Full system access + user management', 1, 'system@momentumww.com', 'system@momentumww.com');

-- ============================================================================
-- SEED DATA - Permissions
-- ============================================================================

-- Pre-hire permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-prehire-create', 'PREHIRE_CREATE', 'PREHIRE', 'CREATE', 'Create pre-hire records'),
  ('perm-prehire-read', 'PREHIRE_READ', 'PREHIRE', 'READ', 'View all pre-hire records'),
  ('perm-prehire-read-own', 'PREHIRE_READ_OWN', 'PREHIRE', 'READ', 'View own pre-hire records'),
  ('perm-prehire-update', 'PREHIRE_UPDATE', 'PREHIRE', 'UPDATE', 'Update pre-hire records'),
  ('perm-prehire-delete', 'PREHIRE_DELETE', 'PREHIRE', 'DELETE', 'Delete pre-hire records'),
  ('perm-prehire-assign-pkg', 'PREHIRE_ASSIGN_PACKAGE', 'PREHIRE', 'UPDATE', 'Assign packages to pre-hires'),
  ('perm-prehire-link-emp', 'PREHIRE_LINK_EMPLOYEE', 'PREHIRE', 'UPDATE', 'Link pre-hire to employee record'),
  ('perm-prehire-export', 'PREHIRE_EXPORT', 'PREHIRE', 'EXPORT', 'Export pre-hire data');

-- Package permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-package-create', 'PACKAGE_CREATE', 'PACKAGE', 'CREATE', 'Create equipment packages'),
  ('perm-package-create-std', 'PACKAGE_CREATE_STANDARD', 'PACKAGE', 'CREATE', 'Create standard packages (auto-approve)'),
  ('perm-package-create-exc', 'PACKAGE_CREATE_EXCEPTION', 'PACKAGE', 'CREATE', 'Create exception packages (require approval)'),
  ('perm-package-read', 'PACKAGE_READ', 'PACKAGE', 'READ', 'View equipment packages'),
  ('perm-package-update', 'PACKAGE_UPDATE', 'PACKAGE', 'UPDATE', 'Update equipment packages'),
  ('perm-package-delete', 'PACKAGE_DELETE', 'PACKAGE', 'DELETE', 'Delete equipment packages'),
  ('perm-package-assign', 'PACKAGE_ASSIGN', 'PACKAGE', 'UPDATE', 'Assign packages to employees'),
  ('perm-package-export', 'PACKAGE_EXPORT', 'PACKAGE', 'EXPORT', 'Export package data');

-- Hardware permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-hardware-create', 'HARDWARE_CREATE', 'HARDWARE', 'CREATE', 'Create hardware items'),
  ('perm-hardware-read', 'HARDWARE_READ', 'HARDWARE', 'READ', 'View hardware inventory'),
  ('perm-hardware-update', 'HARDWARE_UPDATE', 'HARDWARE', 'UPDATE', 'Update hardware items'),
  ('perm-hardware-delete', 'HARDWARE_DELETE', 'HARDWARE', 'DELETE', 'Delete hardware items'),
  ('perm-hardware-assign', 'HARDWARE_ASSIGN', 'HARDWARE', 'UPDATE', 'Assign hardware to employees'),
  ('perm-hardware-maintenance', 'HARDWARE_MAINTENANCE', 'HARDWARE', 'UPDATE', 'Record hardware maintenance'),
  ('perm-hardware-retire', 'HARDWARE_RETIRE', 'HARDWARE', 'UPDATE', 'Retire hardware items'),
  ('perm-hardware-export', 'HARDWARE_EXPORT', 'HARDWARE', 'EXPORT', 'Export hardware inventory'),
  ('perm-hardware-view-cost', 'HARDWARE_VIEW_COST', 'HARDWARE', 'READ', 'View hardware costs'),
  ('perm-hardware-refresh-view', 'HARDWARE_REFRESH_VIEW', 'HARDWARE', 'READ', 'View hardware refresh calendar');

-- Software permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-software-create', 'SOFTWARE_CREATE', 'SOFTWARE', 'CREATE', 'Create software items'),
  ('perm-software-read', 'SOFTWARE_READ', 'SOFTWARE', 'READ', 'View software catalog'),
  ('perm-software-update', 'SOFTWARE_UPDATE', 'SOFTWARE', 'UPDATE', 'Update software items'),
  ('perm-software-delete', 'SOFTWARE_DELETE', 'SOFTWARE', 'DELETE', 'Delete software items'),
  ('perm-software-assign', 'SOFTWARE_ASSIGN', 'SOFTWARE', 'UPDATE', 'Assign software to employees'),
  ('perm-software-revoke', 'SOFTWARE_REVOKE', 'SOFTWARE', 'UPDATE', 'Revoke software from employees'),
  ('perm-software-view-cost', 'SOFTWARE_VIEW_COST', 'SOFTWARE', 'READ', 'View software costs');

-- License permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-license-create', 'LICENSE_CREATE', 'LICENSE', 'CREATE', 'Create license pools'),
  ('perm-license-assign', 'LICENSE_ASSIGN', 'LICENSE', 'UPDATE', 'Assign licenses to employees'),
  ('perm-license-reclaim', 'LICENSE_RECLAIM', 'LICENSE', 'UPDATE', 'Reclaim licenses from employees'),
  ('perm-license-view-util', 'LICENSE_VIEW_UTILIZATION', 'LICENSE', 'READ', 'View license utilization');

-- Employee permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-employee-read', 'EMPLOYEE_READ', 'EMPLOYEE', 'READ', 'View all employee records'),
  ('perm-employee-read-own', 'EMPLOYEE_READ_OWN', 'EMPLOYEE', 'READ', 'View own employee record'),
  ('perm-employee-read-team', 'EMPLOYEE_READ_TEAM', 'EMPLOYEE', 'READ', 'View team employee records'),
  ('perm-employee-update', 'EMPLOYEE_UPDATE', 'EMPLOYEE', 'UPDATE', 'Update employee records'),
  ('perm-employee-update-own', 'EMPLOYEE_UPDATE_OWN', 'EMPLOYEE', 'UPDATE', 'Update own employee record'),
  ('perm-employee-delete', 'EMPLOYEE_DELETE', 'EMPLOYEE', 'DELETE', 'Delete employee records'),
  ('perm-employee-export', 'EMPLOYEE_EXPORT', 'EMPLOYEE', 'EXPORT', 'Export employee data');

-- Approval permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-approval-create', 'APPROVAL_CREATE', 'APPROVAL', 'CREATE', 'Create approval requests'),
  ('perm-approval-read', 'APPROVAL_READ', 'APPROVAL', 'READ', 'View approval requests'),
  ('perm-approval-approve', 'APPROVAL_APPROVE', 'APPROVAL', 'APPROVE', 'Approve high-value requests'),
  ('perm-approval-approve-team', 'APPROVAL_APPROVE_OWN_TEAM', 'APPROVAL', 'APPROVE', 'Approve requests for own team'),
  ('perm-approval-approve-all', 'APPROVAL_APPROVE_ALL', 'APPROVAL', 'APPROVE', 'Approve all requests'),
  ('perm-approval-reject', 'APPROVAL_REJECT', 'APPROVAL', 'REJECT', 'Reject approval requests'),
  ('perm-approval-cancel', 'APPROVAL_CANCEL', 'APPROVAL', 'UPDATE', 'Cancel approval requests'),
  ('perm-approval-escalate', 'APPROVAL_ESCALATE', 'APPROVAL', 'UPDATE', 'Escalate approval requests');

-- Freeze Period permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-freeze-create', 'FREEZEPERIOD_CREATE', 'FREEZEPERIOD', 'CREATE', 'Create freeze periods'),
  ('perm-freeze-read', 'FREEZEPERIOD_READ', 'FREEZEPERIOD', 'READ', 'View freeze periods'),
  ('perm-freeze-update', 'FREEZEPERIOD_UPDATE', 'FREEZEPERIOD', 'UPDATE', 'Update freeze periods'),
  ('perm-freeze-delete', 'FREEZEPERIOD_DELETE', 'FREEZEPERIOD', 'DELETE', 'Delete freeze periods'),
  ('perm-freeze-send-email', 'FREEZEPERIOD_SEND_EMAIL', 'FREEZEPERIOD', 'EXECUTE', 'Send freeze period emails');

-- Helix permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-helix-create', 'HELIX_CREATE_TICKET', 'HELIX', 'CREATE', 'Create Helix tickets'),
  ('perm-helix-read', 'HELIX_READ_TICKET', 'HELIX', 'READ', 'View Helix tickets'),
  ('perm-helix-update', 'HELIX_UPDATE_TICKET', 'HELIX', 'UPDATE', 'Update Helix tickets'),
  ('perm-helix-close', 'HELIX_CLOSE_TICKET', 'HELIX', 'UPDATE', 'Close Helix tickets');

-- Admin permissions
INSERT INTO Permissions (id, name, module, action, displayName)
VALUES
  ('perm-admin-user-manage', 'ADMIN_USER_MANAGE', 'ADMIN', 'MANAGE', 'Manage user accounts'),
  ('perm-admin-role-manage', 'ADMIN_ROLE_MANAGE', 'ADMIN', 'MANAGE', 'Manage roles'),
  ('perm-admin-perm-manage', 'ADMIN_PERMISSION_MANAGE', 'ADMIN', 'MANAGE', 'Manage permissions'),
  ('perm-admin-system-config', 'ADMIN_SYSTEM_CONFIG', 'ADMIN', 'CONFIGURE', 'Configure system settings'),
  ('perm-admin-audit-log', 'ADMIN_AUDIT_LOG', 'ADMIN', 'READ', 'View audit logs'),
  ('perm-admin-export-all', 'ADMIN_EXPORT_ALL', 'ADMIN', 'EXPORT', 'Export all system data');

-- ============================================================================
-- SEED DATA - Role Permissions (DEFAULT_ROLE_PERMISSIONS from RoleContext.tsx)
-- ============================================================================

-- EMPLOYEE: View own data only
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-employee', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN ('EMPLOYEE_READ_OWN', 'EMPLOYEE_UPDATE_OWN');

-- HIRING_MANAGER: Create pre-hires for own team
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-hiring-mgr', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ_OWN', 'EMPLOYEE_UPDATE_OWN', 'EMPLOYEE_READ_TEAM',
  'PREHIRE_CREATE', 'PREHIRE_READ_OWN', 'PREHIRE_UPDATE', 'PREHIRE_ASSIGN_PACKAGE',
  'PACKAGE_READ', 'HARDWARE_READ', 'SOFTWARE_READ',
  'APPROVAL_CREATE', 'APPROVAL_READ'
);

-- MANAGER: Approve team equipment requests
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-manager', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ_OWN', 'EMPLOYEE_UPDATE_OWN', 'EMPLOYEE_READ_TEAM',
  'PREHIRE_READ_OWN', 'PACKAGE_READ', 'HARDWARE_READ', 'SOFTWARE_READ',
  'APPROVAL_READ', 'APPROVAL_APPROVE_OWN_TEAM', 'APPROVAL_REJECT'
);

-- IT: Manage hardware, process Helix tickets
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-it', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ', 'PREHIRE_READ', 'PACKAGE_READ',
  'HARDWARE_CREATE', 'HARDWARE_READ', 'HARDWARE_UPDATE', 'HARDWARE_ASSIGN',
  'HARDWARE_MAINTENANCE', 'HARDWARE_RETIRE', 'HARDWARE_EXPORT',
  'SOFTWARE_READ', 'SOFTWARE_ASSIGN', 'SOFTWARE_REVOKE',
  'LICENSE_ASSIGN', 'LICENSE_RECLAIM', 'LICENSE_VIEW_UTILIZATION',
  'APPROVAL_READ',
  'HELIX_CREATE_TICKET', 'HELIX_READ_TICKET', 'HELIX_UPDATE_TICKET', 'HELIX_CLOSE_TICKET'
);

-- FINANCE: View costs, approve >$5K purchases
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-finance', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ', 'PACKAGE_READ',
  'HARDWARE_READ', 'HARDWARE_VIEW_COST', 'HARDWARE_REFRESH_VIEW',
  'SOFTWARE_READ', 'SOFTWARE_VIEW_COST',
  'LICENSE_VIEW_UTILIZATION',
  'APPROVAL_READ', 'APPROVAL_APPROVE'
);

-- HR: Create pre-hires, VIEW hardware/software (CANNOT create), create exception packages
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-hr', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_EXPORT',
  'PREHIRE_CREATE', 'PREHIRE_READ', 'PREHIRE_UPDATE', 'PREHIRE_DELETE',
  'PREHIRE_ASSIGN_PACKAGE', 'PREHIRE_LINK_EMPLOYEE', 'PREHIRE_EXPORT',
  'PACKAGE_READ', 'PACKAGE_ASSIGN', 'PACKAGE_CREATE_EXCEPTION',
  'HARDWARE_READ', 'HARDWARE_VIEW_COST',
  'SOFTWARE_READ', 'SOFTWARE_VIEW_COST',
  'LICENSE_VIEW_UTILIZATION',
  'APPROVAL_CREATE', 'APPROVAL_READ',
  'FREEZEPERIOD_READ', 'FREEZEPERIOD_SEND_EMAIL'
);

-- DIRECTOR: Full HR access + create packages + all approvals
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-director', id, 'system@momentumww.com'
FROM Permissions
WHERE name IN (
  'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE', 'EMPLOYEE_EXPORT',
  'PREHIRE_CREATE', 'PREHIRE_READ', 'PREHIRE_UPDATE', 'PREHIRE_DELETE',
  'PREHIRE_ASSIGN_PACKAGE', 'PREHIRE_LINK_EMPLOYEE', 'PREHIRE_EXPORT',
  'PACKAGE_CREATE', 'PACKAGE_CREATE_STANDARD', 'PACKAGE_CREATE_EXCEPTION',
  'PACKAGE_READ', 'PACKAGE_UPDATE', 'PACKAGE_DELETE', 'PACKAGE_ASSIGN', 'PACKAGE_EXPORT',
  'HARDWARE_READ', 'HARDWARE_UPDATE', 'HARDWARE_VIEW_COST', 'HARDWARE_REFRESH_VIEW', 'HARDWARE_EXPORT',
  'SOFTWARE_READ', 'SOFTWARE_UPDATE', 'SOFTWARE_VIEW_COST',
  'LICENSE_VIEW_UTILIZATION',
  'APPROVAL_CREATE', 'APPROVAL_READ', 'APPROVAL_APPROVE_ALL', 'APPROVAL_REJECT',
  'APPROVAL_CANCEL', 'APPROVAL_ESCALATE',
  'FREEZEPERIOD_CREATE', 'FREEZEPERIOD_READ', 'FREEZEPERIOD_UPDATE',
  'FREEZEPERIOD_DELETE', 'FREEZEPERIOD_SEND_EMAIL'
);

-- ADMIN: Full system access (all permissions)
INSERT INTO RolePermissions (roleId, permissionId, assignedBy)
SELECT 'role-admin', id, 'system@momentumww.com'
FROM Permissions;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: Assign HR role to Camille
EXEC sp_AssignRoleToUser
  @userId = 'camille@momentumww.com',
  @userEmail = 'camille@momentumww.com',
  @userName = 'Camille Harper',
  @roleName = 'HR',
  @assignedBy = 'admin@momentumww.com';

-- Example 2: Assign ADMIN role to Luis
EXEC sp_AssignRoleToUser
  @userId = 'luis.bustos@momentumww.com',
  @userEmail = 'luis.bustos@momentumww.com',
  @userName = 'Luis Bustos',
  @roleName = 'ADMIN',
  @assignedBy = 'admin@momentumww.com';

-- Example 3: Check if user has permission
DECLARE @hasPermission BIT;
EXEC sp_CheckUserPermission
  @userId = 'camille@momentumww.com',
  @permissionName = 'PREHIRE_CREATE',
  @hasPermission = @hasPermission OUTPUT;

SELECT @hasPermission AS HasPermission; -- Should return 1 (true)

-- Example 4: Revoke role from user
EXEC sp_RevokeRoleFromUser
  @userId = 'test.user@momentumww.com',
  @roleName = 'HR',
  @revokedBy = 'admin@momentumww.com';

-- Example 5: View all permissions for a user
SELECT *
FROM vw_UserPermissions
WHERE userEmail = 'camille@momentumww.com'
ORDER BY permissionModule, permissionName;

-- Example 6: View role summary
SELECT *
FROM vw_RoleSummary
ORDER BY roleName;
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP PROCEDURE IF EXISTS sp_CheckUserPermission;
DROP PROCEDURE IF EXISTS sp_RevokeRoleFromUser;
DROP PROCEDURE IF EXISTS sp_AssignRoleToUser;
DROP VIEW IF EXISTS vw_UserRoleAssignments;
DROP VIEW IF EXISTS vw_RoleSummary;
DROP VIEW IF EXISTS vw_UserPermissions;
DROP TABLE IF EXISTS UserRoles;
DROP TABLE IF EXISTS RolePermissions;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS Roles;
*/
