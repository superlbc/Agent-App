# User License Assignments Implementation Plan

**Date**: 2025-11-22
**Status**: Planning Phase
**Priority**: High

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Requirements](#user-requirements)
3. [Current Architecture Analysis](#current-architecture-analysis)
4. [Navigation Restructure](#navigation-restructure)
5. [Data Model](#data-model)
6. [User Journey & UX](#user-journey--ux)
7. [UI Design](#ui-design)
8. [Database Schema](#database-schema)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)

---

## Overview

Implement a comprehensive User License Assignments management system that allows tracking and viewing which licenses are assigned to which employees across the entire organization (not just pre-hires).

### Goals

- ✅ Track license assignments for ALL employees (active, withdrawn, pre-hire)
- ✅ Provide searchable, filterable view of user-license assignments
- ✅ Support retrospective license assignment tracking
- ✅ Integrate with existing license pool architecture
- ✅ Simplify navigation structure
- ✅ Follow modern UI/UX conventions

---

## User Requirements

### Navigation Changes

**Current Structure (Problems):**
```
PACKAGES
├── Packages (parent)
    ├── Manage Packages
    ├── Hardware ❌ (duplicate - already in Inventory)
    ├── Software ❌ (duplicate - already in Inventory)
    └── Licenses ❌ (duplicate - already in Inventory)

INVENTORY
├── Hardware Inventory ✅
├── Software & Licenses ✅
└── License Pool Dashboard ✅
```

**Desired Structure:**
```
PACKAGES
└── Packages ✅ (single menu item → manage-packages)

INVENTORY
├── Hardware Inventory ✅
└── Software Inventory ✅ (NEW parent with children)
    ├── Software Catalog ✅ (current "Software & Licenses")
    ├── License Pool Dashboard ✅
    └── User License Assignments ✨ (NEW)
```

### Functional Requirements

**FR-1: User License Assignments Screen**
- Display all license assignments across all users
- Show: User Name, User Email, License Name, Pool Name, Assignment Date, Expiration Date, Status
- Support search by user name or email
- Support filter by license type/pool
- Support filter by status (active, expired, revoked)
- Sortable columns
- Pagination for large datasets
- Export to CSV/Excel

**FR-2: Assignment Tracking**
- Track assignments for ALL employees (not just pre-hires)
- Include withdrawn/inactive employees
- Show assignment history (who assigned, when)
- Track expiration dates
- Track assignment status

**FR-3: Integration**
- Link to user profile (if available)
- Link to license pool details
- Show pool utilization in context
- Allow quick assignment/revocation actions

**FR-4: Retrospective Support**
- Support importing existing assignments
- Bulk assignment upload (CSV)
- Migration from legacy systems

---

## Current Architecture Analysis

### Existing Data Structures ✅

**LicenseAssignment Interface** (already exists in `types.ts`):
```typescript
export interface LicenseAssignment {
  id: string;
  licensePoolId: string; // FK to LicensePool.id
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  assignedDate: Date;
  assignedBy: string;
  expirationDate?: Date;
  notes?: string;
  status: "active" | "expired" | "revoked";
}
```

**LicensePool Interface** (already exists):
```typescript
export interface LicensePool {
  id: string;
  softwareId: string; // FK to Software.id
  totalSeats: number;
  assignedSeats: number;
  licenseType: "perpetual" | "subscription" | "concurrent";
  purchaseDate?: Date;
  renewalDate?: Date;
  // ... other fields
}
```

### Existing Context Methods ✅

**LicenseContext** (`contexts/LicenseContext.tsx`):
- `assignLicenseToPool()` - Assigns license to employee
- `reclaimLicenseFromPool()` - Revokes license from employee
- `getPoolAssignments()` - Gets assignments for a pool
- `getPoolAvailableSeats()` - Calculate available seats
- `getPoolUtilization()` - Calculate % utilization

### What's Missing ❌

1. **No global assignments view** - Can only view assignments per pool
2. **No employee-centric view** - Can't see all licenses for one employee
3. **No cross-pool search** - Can't search assignments across all pools
4. **No employee master list** - Only pre-hires tracked, not all employees
5. **No historical tracking** - Can't see assignment audit trail

---

## Navigation Restructure

### Phase 1: Simplify Packages Navigation

**Before:**
- Packages (parent)
  - Manage Packages
  - Hardware (redundant)
  - Software (redundant)
  - Licenses (redundant)

**After:**
- Packages (single item, no children)

**Implementation:**
```typescript
// CollapsibleNavigation.tsx - PACKAGES section
{
  section: 'PACKAGES',
  items: [
    {
      id: 'manage-packages',
      label: 'Packages',
      icon: 'clipboard-list',
      description: 'Manage equipment packages',
      // No children
    },
  ],
}
```

### Phase 2: Create Software Inventory Hierarchy

**New Structure:**
```typescript
{
  section: 'INVENTORY',
  items: [
    {
      id: 'hardware-inventory',
      label: 'Hardware Inventory',
      icon: 'box',
      description: 'Manage hardware items',
    },
    {
      id: 'software-inventory',
      label: 'Software Inventory',
      icon: 'disc',
      description: 'Manage software and licenses',
      children: [
        {
          id: 'software-catalog',
          label: 'Software Catalog',
          icon: 'grid',
          description: 'All software and applications',
        },
        {
          id: 'license-pools',
          label: 'License Pool Dashboard',
          icon: 'key',
          description: 'License inventory and utilization',
        },
        {
          id: 'user-license-assignments',
          label: 'User License Assignments',
          icon: 'user-check',
          description: 'View all user license assignments',
        },
      ],
    },
  ],
}
```

**Navigation Type Update:**
```typescript
export type NavigationSection =
  | 'pre-hires'
  | 'approvals'
  | 'hardware-inventory'
  | 'software-catalog'      // Renamed from software-inventory
  | 'license-pools'
  | 'user-license-assignments' // NEW
  | 'manage-packages'
  | 'refresh-calendar'
  | 'refresh-finance'
  | 'refresh-notifications'
  | 'freeze-period-admin'
  | 'freeze-period-dashboard'
  | 'role-management';
```

---

## Data Model

### Enhanced Employee Tracking

**Option A: Extend Employee Interface** (Recommended)
```typescript
// types.ts - Add to existing Employee interface
export interface Employee {
  // ... existing fields

  // License tracking
  assignedLicenses?: LicenseAssignment[]; // All licenses assigned to this employee
  licenseHistory?: LicenseAssignmentHistory[]; // Audit trail
}
```

**Option B: New EmployeeLicenseSummary Type**
```typescript
// For efficient querying and display
export interface EmployeeLicenseSummary {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  status: 'active' | 'inactive' | 'withdrawn' | 'pre-hire';
  assignedLicenses: Array<{
    licensePoolId: string;
    licenseName: string;
    poolName: string;
    assignedDate: Date;
    expirationDate?: Date;
    status: 'active' | 'expired' | 'revoked';
  }>;
  totalLicenses: number;
  activeLicenses: number;
}
```

### Assignment History Tracking

```typescript
export interface LicenseAssignmentHistory {
  id: string;
  assignmentId: string; // FK to LicenseAssignment.id
  action: 'assigned' | 'revoked' | 'expired' | 'renewed';
  performedBy: string;
  performedAt: Date;
  reason?: string;
  notes?: string;
}
```

---

## User Journey & UX

### Persona: HR Administrator (Camille)

**Scenario 1: View All License Assignments**
1. Navigate to Inventory → Software Inventory → User License Assignments
2. See table of all employees with licenses
3. Search for specific employee by name
4. See all licenses assigned to that employee
5. Check expiration dates and renewal needs

**Scenario 2: Assign License to Employee**
1. From User License Assignments screen
2. Click "Assign License" button
3. Select employee from dropdown (all employees, not just pre-hires)
4. Select license pool
5. Set expiration date (if applicable)
6. Add notes
7. Submit → Assignment created

**Scenario 3: Bulk Import Existing Assignments**
1. Navigate to User License Assignments
2. Click "Import Assignments" button
3. Download CSV template
4. Fill in: Employee Email, License Name, Assignment Date, Expiration Date
5. Upload CSV
6. Review validation results
7. Confirm import → Assignments created

**Scenario 4: View Employee License History**
1. Search for employee
2. Click on employee row to expand
3. See all current licenses
4. See historical assignments (past revocations, expirations)
5. See who assigned each license and when

### Persona: IT Administrator (Chris Kumar)

**Scenario 1: Find Expiring Licenses**
1. Navigate to User License Assignments
2. Filter by: Status = Active, Expiration within 30 days
3. Sort by expiration date ascending
4. Export list to CSV
5. Prepare renewal notifications

**Scenario 2: Reclaim Licenses from Departing Employee**
1. Search for employee by name/email
2. View all assigned licenses
3. Select licenses to reclaim
4. Bulk revoke with reason "Employee departure"
5. Licenses returned to pool

---

## UI Design

### UserLicenseAssignments Component

**Layout: Master-Detail Pattern**

```
┌─────────────────────────────────────────────────────────────────┐
│ User License Assignments                                         │
│ ─────────────────────────────────────────────────────────────   │
│                                                                   │
│ 🔍 Search: [_____________] │ 📋 License: [All ▾] │ Status: [All ▾]│
│ ➕ Assign License  📤 Export CSV  📥 Import CSV                 │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│ Summary Cards                                                     │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │ Total Users  │ Total        │ Active       │ Expiring     │  │
│ │              │ Assignments  │ Assignments  │ (30 days)    │  │
│ │    245       │     1,024    │     987      │     42       │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│ Assignments Table                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Employee ▲│ Email          │ License   │ Assigned │Status │  │
│ ├───────────┼────────────────┼───────────┼──────────┼───────┤  │
│ │ 👤 Alice  │alice@mww.com   │Adobe CC   │2024-01-15│●Active│  │
│ │   Brown   │                │Figma Pro  │2024-02-01│●Active│  │
│ │           │                │           │          │       │  │
│ │ 👤 Bob    │bob@mww.com     │Smartsheet │2024-03-10│🔶Exp. │  │
│ │   Chen    │                │           │          │30 days│  │
│ └───────────┴────────────────┴───────────┴──────────┴───────┘  │
│                                                                   │
│ ⬅ Prev │ Page 1 of 25 │ Next ➡                                 │
└───────────────────────────────────────────────────────────────────┘
```

### Expandable Row Details

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Alice Brown                                                   │
│ ────────────────────────────────────────────────────────────────│
│ Email: alice.brown@momentumww.com                                │
│ Department: Creative                                              │
│ Status: Active                                                    │
│                                                                   │
│ Assigned Licenses (3):                                           │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ License      │ Pool        │ Assigned   │ Expires  │ By   │   │
│ ├──────────────┼─────────────┼────────────┼──────────┼──────┤   │
│ │ Adobe CC     │ CC-Pool-001 │ 2024-01-15 │ 2025-01-15│ HR  │   │
│ │ Figma Pro    │ Figma-002   │ 2024-02-01 │ -        │ IT   │   │
│ │ Slack        │ Slack-Main  │ 2023-12-01 │ -        │ Auto │   │
│ └──────────────┴─────────────┴────────────┴──────────┴──────┘   │
│                                                                   │
│ Actions: [➕ Assign License] [🔄 Revoke Selected] [📜 History]  │
└───────────────────────────────────────────────────────────────────┘
```

### Features

**Search & Filter:**
- 🔍 Full-text search: Employee name, email
- 📋 Filter by license type/pool
- 🎯 Filter by status (active, expiring, expired, revoked)
- 📅 Filter by date range

**Sorting:**
- Sort by: Employee Name, Department, License Count, Assignment Date, Expiration Date
- Ascending/descending toggle

**Actions:**
- ➕ Assign License (modal)
- 🔄 Revoke License (with confirmation)
- 📤 Export to CSV
- 📥 Import from CSV
- 📜 View Assignment History
- 🔗 Link to Employee Profile (if available)
- 🔗 Link to License Pool Details

**Bulk Operations:**
- Select multiple rows
- Bulk revoke
- Bulk export
- Bulk status update

---

## Database Schema

### SQL Tables

**1. Employees Table** (Master list)
```sql
CREATE TABLE Employees (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'withdrawn', 'pre-hire')),
    startDate DATE,
    endDate DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_department (department)
);
```

**2. LicenseAssignments Table** (Already partially exists)
```sql
CREATE TABLE LicenseAssignments (
    id VARCHAR(50) PRIMARY KEY,
    licensePoolId VARCHAR(50) NOT NULL,
    employeeId VARCHAR(50) NOT NULL,
    employeeName VARCHAR(255) NOT NULL,
    employeeEmail VARCHAR(255) NOT NULL,
    assignedDate DATE NOT NULL,
    assignedBy VARCHAR(255) NOT NULL,
    expirationDate DATE,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (licensePoolId) REFERENCES LicensePools(id) ON DELETE CASCADE,
    FOREIGN KEY (employeeId) REFERENCES Employees(id) ON DELETE CASCADE,

    INDEX idx_employee (employeeId),
    INDEX idx_pool (licensePoolId),
    INDEX idx_status (status),
    INDEX idx_expiration (expirationDate),
    INDEX idx_assigned_date (assignedDate)
);
```

**3. LicenseAssignmentHistory Table** (NEW - Audit Trail)
```sql
CREATE TABLE LicenseAssignmentHistory (
    id VARCHAR(50) PRIMARY KEY,
    assignmentId VARCHAR(50) NOT NULL,
    action VARCHAR(20) CHECK (action IN ('assigned', 'revoked', 'expired', 'renewed')) NOT NULL,
    performedBy VARCHAR(255) NOT NULL,
    performedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT,

    FOREIGN KEY (assignmentId) REFERENCES LicenseAssignments(id) ON DELETE CASCADE,

    INDEX idx_assignment (assignmentId),
    INDEX idx_action (action),
    INDEX idx_performed_at (performedAt)
);
```

### Indexes for Performance

```sql
-- Composite index for common queries
CREATE INDEX idx_assignments_employee_status
    ON LicenseAssignments(employeeId, status);

CREATE INDEX idx_assignments_pool_status
    ON LicenseAssignments(licensePoolId, status);

-- Full-text search index
CREATE FULLTEXT INDEX idx_employee_search
    ON Employees(name, email);
```

### Views for Reporting

**Employee License Summary View:**
```sql
CREATE VIEW EmployeeLicenseSummary AS
SELECT
    e.id AS employeeId,
    e.name AS employeeName,
    e.email AS employeeEmail,
    e.department,
    e.status AS employeeStatus,
    COUNT(la.id) AS totalLicenses,
    SUM(CASE WHEN la.status = 'active' THEN 1 ELSE 0 END) AS activeLicenses,
    SUM(CASE WHEN la.status = 'expired' THEN 1 ELSE 0 END) AS expiredLicenses,
    SUM(CASE WHEN la.status = 'revoked' THEN 1 ELSE 0 END) AS revokedLicenses,
    GROUP_CONCAT(la.id) AS assignmentIds
FROM Employees e
LEFT JOIN LicenseAssignments la ON e.id = la.employeeId
GROUP BY e.id, e.name, e.email, e.department, e.status;
```

**Expiring Licenses View:**
```sql
CREATE VIEW ExpiringLicenses AS
SELECT
    la.*,
    e.name AS employeeName,
    e.department,
    s.name AS licenseName,
    lp.totalSeats,
    lp.assignedSeats,
    DATEDIFF(la.expirationDate, CURRENT_DATE) AS daysUntilExpiration
FROM LicenseAssignments la
INNER JOIN Employees e ON la.employeeId = e.id
INNER JOIN LicensePools lp ON la.licensePoolId = lp.id
INNER JOIN Software s ON lp.softwareId = s.id
WHERE la.status = 'active'
  AND la.expirationDate IS NOT NULL
  AND la.expirationDate <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY la.expirationDate ASC;
```

---

## Implementation Phases

### Phase 1: Navigation Restructure ⏱️ 2 hours

**Tasks:**
- [ ] Update `CollapsibleNavigation.tsx` section types
- [ ] Simplify Packages navigation (remove children)
- [ ] Create Software Inventory hierarchy
- [ ] Update `App.tsx` conditional rendering
- [ ] Rename `software-inventory` → `software-catalog`
- [ ] Add `user-license-assignments` route handler
- [ ] Test navigation flow

**Files Modified:**
- `components/CollapsibleNavigation.tsx`
- `App.tsx`

### Phase 2: Data Model Extension ⏱️ 3 hours

**Tasks:**
- [ ] Add `EmployeeLicenseSummary` type to `types.ts`
- [ ] Add `LicenseAssignmentHistory` type to `types.ts`
- [ ] Extend `LicenseContext` with new methods:
  - `getAllAssignments()` - Get all assignments across all pools
  - `getEmployeeAssignments(employeeId)` - Get all licenses for one employee
  - `getEmployeeLicenseSummaries()` - Get summary for all employees
  - `searchAssignments(query)` - Search by employee name/email
  - `filterAssignments(filters)` - Filter by status, license type, date range
- [ ] Create mock data for testing

**Files Modified:**
- `types.ts`
- `contexts/LicenseContext.tsx`
- `utils/mockData.ts`

### Phase 3: UI Component Development ⏱️ 8 hours

**Tasks:**
- [ ] Create `UserLicenseAssignments.tsx` component
  - Statistics cards (total users, assignments, expiring)
  - Search bar with real-time filtering
  - Filter controls (license, status, date range)
  - Sortable table with pagination
  - Expandable rows showing all licenses per employee
  - Action buttons (assign, revoke, export, import)
- [ ] Create `UserLicenseAssignModal.tsx`
  - Employee selector (all employees, not just pre-hires)
  - License pool selector
  - Expiration date picker
  - Notes field
- [ ] Create `BulkLicenseImportModal.tsx`
  - CSV template download
  - File upload
  - Validation preview
  - Import confirmation
- [ ] Create `LicenseAssignmentHistoryModal.tsx`
  - Timeline view of assignment actions
  - Filter by action type
  - Export audit trail

**Files Created:**
- `components/UserLicenseAssignments.tsx`
- `components/UserLicenseAssignModal.tsx`
- `components/BulkLicenseImportModal.tsx`
- `components/LicenseAssignmentHistoryModal.tsx`

### Phase 4: Backend Integration ⏱️ 5 hours

**Tasks:**
- [ ] Create SQL migration scripts for new tables
- [ ] Create `employeeService.ts` for employee CRUD
- [ ] Extend `licenseService.ts` with new queries:
  - Get all assignments
  - Get employee assignments
  - Get employee license summary
  - Search assignments
  - Filter assignments
- [ ] Create `licenseAssignmentHistoryService.ts`
- [ ] Add API endpoints in backend
- [ ] Update LicenseContext to use backend APIs

**Files Created:**
- `backend/migrations/005_employee_tracking.sql`
- `backend/migrations/006_license_assignment_history.sql`
- `services/employeeService.ts`
- `services/licenseAssignmentHistoryService.ts`

**Files Modified:**
- `services/licenseService.ts`
- `backend/routes/licenses.js`
- `backend/routes/employees.js` (new)

### Phase 5: Testing & Refinement ⏱️ 3 hours

**Tasks:**
- [ ] Unit test LicenseContext methods
- [ ] Integration test assignment workflows
- [ ] Test search/filter performance with large datasets
- [ ] Test CSV import/export
- [ ] Test bulk operations
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Mobile responsiveness testing
- [ ] Dark mode testing

### Phase 6: Documentation & Training ⏱️ 2 hours

**Tasks:**
- [ ] Update CLAUDE.md with new navigation structure
- [ ] Document User License Assignments feature
- [ ] Create user guide for HR team
- [ ] Create SQL query examples for reporting
- [ ] Update API documentation

---

## Testing Strategy

### Unit Tests

**LicenseContext Methods:**
```typescript
describe('LicenseContext', () => {
  test('getAllAssignments returns all assignments across pools', () => {
    // Test implementation
  });

  test('getEmployeeAssignments filters by employeeId', () => {
    // Test implementation
  });

  test('searchAssignments finds by name and email', () => {
    // Test implementation
  });

  test('filterAssignments applies multiple filters', () => {
    // Test implementation
  });
});
```

### Integration Tests

**Assignment Workflow:**
1. Create employee
2. Assign license from pool
3. Verify pool seats decremented
4. Verify assignment appears in employee list
5. Revoke license
6. Verify pool seats incremented
7. Verify assignment status = revoked

### Performance Tests

**Large Dataset Scenarios:**
- 10,000 employees
- 100 license pools
- 50,000 assignments
- Search response time < 500ms
- Filter response time < 300ms
- Export 10,000 records < 5s

### User Acceptance Tests

**Scenarios:**
1. HR assigns license to new employee
2. IT reclaims licenses from departing employee
3. Manager searches for team member's licenses
4. Admin imports 500 historical assignments via CSV
5. Admin exports expiring licenses report

---

## Success Metrics

- [ ] All navigation items work without blank screens
- [ ] Can view all license assignments in one screen
- [ ] Can search assignments by employee name/email < 500ms
- [ ] Can filter assignments by multiple criteria
- [ ] Can assign license to any employee (not just pre-hires)
- [ ] Can import historical assignments via CSV
- [ ] Can export assignments to CSV
- [ ] Supports 10,000+ employees and 50,000+ assignments
- [ ] Mobile-responsive UI
- [ ] Accessible (WCAG 2.1 AA compliant)

---

## Risk Mitigation

**Risk 1: Performance degradation with large datasets**
- **Mitigation**: Implement pagination, lazy loading, database indexes
- **Fallback**: Virtual scrolling, server-side search

**Risk 2: Data migration complexity for existing assignments**
- **Mitigation**: Create robust CSV import with validation
- **Fallback**: Manual data entry with bulk operations

**Risk 3: Incomplete employee data in system**
- **Mitigation**: Allow manual employee creation
- **Fallback**: Sync with HR system (Workday, AD)

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Begin Phase 1: Navigation Restructure
3. ⏳ Implement Phase 2: Data Model Extension
4. ⏳ Develop Phase 3: UI Components
5. ⏳ Integrate Phase 4: Backend APIs
6. ⏳ Execute Phase 5: Testing
7. ⏳ Complete Phase 6: Documentation

**Estimated Total Time**: ~23 hours
**Target Completion**: 3-4 days

---

**Questions or concerns?** Please review and provide feedback before implementation begins.
