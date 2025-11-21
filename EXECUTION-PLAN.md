# Employee Onboarding System - Complete Execution Plan

**Version**: 1.0
**Date**: November 20, 2025
**Status**: Phase 1 (Documentation) - Ready for Implementation

---

## Executive Summary

This document outlines a **12-phase implementation plan** to transform the Employee Onboarding System from its current state (Phase 1 complete) to a fully functional production system with:

- Role-based package assignment with multi-option support (Department Group + Role)
- Cost calculation fixes (one-time hardware vs. monthly software)
- Standard vs. exception package approval workflow with configurable approvers
- Package versioning to prevent retroactive changes
- Hardware superseding for automatic package updates
- License pool creation and expansion capabilities
- Pre-hire to employee linking via vw_Personnel.csv
- Hardware refresh calendar with financial forecasting
- Enhanced Department Group + Role selection UX
- Hiring manager search via Azure AD
- Reorganized navigation with pre-hire management as primary focus

**Estimated Timeline**: 25-45 days (5-9 weeks) depending on parallelization

---

## Phase Breakdown

### **Phase 2: Cost Calculation Fix** (LOW - 1-2 days)
**Objectives**: Differentiate one-time (hardware) vs. monthly (software/licenses) costs

**Data Model Changes**:
```typescript
// Add to Hardware interface
costFrequency: "one-time" | "subscription"
```

**Files to Modify**:
- types.ts - Add costFrequency to Hardware
- utils/mockData.ts - Update calculatePackageCost()
- components/PackageCard.tsx - Display breakdown
- components/PackageDetailView.tsx - Show itemized costs

**Sub-agent**: @agent-feature-developer

---

### **Phase 3: Package Versioning System** (HIGH - 5-7 days)
**Objectives**: Create version snapshot every time package is updated, link assignments to specific PackageVersion

**New Entities**:
```typescript
interface PackageVersion {
  id: string;
  packageId: string;
  versionNumber: number;
  snapshotDate: Date;
  hardware: Hardware[];
  software: Software[];
  isStandard: boolean;
}

interface PackageAssignment {
  id: string;
  preHireId?: string;
  employeeId?: string;
  packageVersionId: string;  // FK to PackageVersion, NOT Package
  assignedDate: Date;
}
```

**SQL Schema**:
```sql
CREATE TABLE PackageVersions (
  id VARCHAR(50) PRIMARY KEY,
  packageId VARCHAR(50) NOT NULL,
  versionNumber INT NOT NULL,
  snapshotDate DATETIME NOT NULL,
  hardware NVARCHAR(MAX), -- JSON array
  software NVARCHAR(MAX), -- JSON array
  isStandard BIT,
  createdBy VARCHAR(100),
  createdDate DATETIME,
  FOREIGN KEY (packageId) REFERENCES Packages(id)
);

CREATE TABLE PackageAssignments (
  id VARCHAR(50) PRIMARY KEY,
  preHireId VARCHAR(50),
  employeeId VARCHAR(50),
  packageVersionId VARCHAR(50) NOT NULL,
  assignedDate DATETIME NOT NULL,
  assignedBy VARCHAR(100),
  FOREIGN KEY (packageVersionId) REFERENCES PackageVersions(id)
);
```

**Sub-agent**: @agent-feature-developer

---

### **Phase 4: Hardware Superseding** (MEDIUM - 3-4 days)
**Objectives**: Add superseding relationship, auto-update packages when new hardware added

**Data Model Changes**:
```typescript
interface Hardware {
  supersededById?: string;  // ID of hardware that replaces this
  // Remove: status, serialNumber
}
```

**SQL Schema**:
```sql
ALTER TABLE Hardware
  ADD supersededById VARCHAR(50),
  DROP COLUMN status,
  DROP COLUMN serialNumber;
```

**Sub-agent**: @agent-feature-developer
**Dependencies**: Phase 3 (versioning prevents retroactive changes)

---

### **Phase 5: License Pool Creation & Expansion** (MEDIUM - 3-4 days)
**Objectives**: Add UI to create new license pools and expand existing pools

**Files to Create**:
- components/LicensePoolCreateModal.tsx
- components/LicensePoolExpandModal.tsx
- contexts/LicenseContext.tsx

**Sub-agent**: @agent-feature-developer
**Can run parallel**: Yes (with Phases 2-4)

---

### **Phase 6: Role-Based Package Assignment** (HIGH - 5-7 days)
**Objectives**: Match packages based on Department Group + Role, handle multiple options

**Data Model Changes**:
```typescript
interface Package {
  roleTargets: Array<{
    departmentGroup: string,
    role: string,
    gradeGroup?: string,
    grade?: string
  }>;
  osPreference?: "Windows" | "Mac" | "Either";
}
```

**Files to Create**:
- services/departmentGroupService.ts - Read/parse DepartmentGroup.csv
- utils/matchingUtils.ts - matchPackages(departmentGroup, role)

**Sub-agent**: @agent-feature-developer

---

### **Phase 7: Standard vs Exception Package Workflow** (MEDIUM - 3-4 days)
**Objectives**: Configurable approvers, email-based approval workflow

**Data Model Changes**:
```typescript
interface Package {
  approverIds: string[]; // Empty = auto-approve
  approvalEmailTemplate?: {
    subject: string,
    body: string
  };
}
```

**Sub-agent**: @agent-feature-developer
**Dependencies**: Phase 6

---

### **Phase 8: Pre-hire to Employee Linking** (MEDIUM - 3-4 days)
**Objectives**: Search vw_Personnel.csv, retrieve Employee ID, hybrid auto-match with approval

**Data Model Changes**:
```typescript
interface PreHire {
  employeeId?: string; // FK to vw_Personnel
  linkedDate?: Date;
  linkConfidence?: "auto" | "manual" | "verified";
}
```

**Files to Create**:
- services/personnelService.ts - Read/search vw_Personnel.csv
- components/EmployeeLinkingModal.tsx

**Sub-agent**: @agent-feature-developer

---

### **Phase 9: Hardware Refresh Calendar** (HIGH - 5-7 days)
**Objectives**: Track refresh eligibility, calendar view, finance forecasting, notifications

**New Entity**:
```typescript
interface RefreshSchedule {
  id: string;
  hardwareId: string;
  employeeId?: string;
  assignedDate: Date;
  refreshCycleYears: number; // 3 for computers, 2 for phones
  refreshEligibilityDate: Date;
  status: "active" | "refresh-pending" | "refreshed" | "retired";
}
```

**Files to Create**:
- components/RefreshCalendar.tsx
- components/RefreshFinanceView.tsx
- components/RefreshNotifications.tsx
- services/refreshService.ts
- contexts/RefreshContext.tsx

**Sub-agent**: @agent-feature-developer
**Dependencies**: Phase 8

---

### **Phase 10: Department Group & Role Selection UX** (MEDIUM - 3-4 days)
**Objectives**: Searchable combo box for Department Group + Role, show Grade info

**Files to Create**:
- components/DepartmentGroupRoleSelector.tsx

**Sub-agent**: @agent-feature-developer
**Dependencies**: Phase 6 (uses same department group service)

---

### **Phase 11: Hiring Manager Selection** (LOW - 1-2 days)
**Objectives**: Azure AD search with profile images/initials

**Files to Create**:
- components/ManagerSelector.tsx

**Sub-agent**: @agent-feature-developer
**Can run parallel**: Yes (with Phase 10)

---

### **Phase 12: Navigation & Main View Reorganization** (LOW - 1-2 days)
**Objectives**: Pre-hire as primary view, stats dashboard, remove UXP branding

**Files to Create**:
- components/PreHireDashboard.tsx

**Files to Modify**:
- components/Navigation.tsx - Reorder, update labels
- App.tsx - Verify default section
- components/Header.tsx - Remove UXP branding

**Sub-agent**: @agent-feature-developer
**Dependencies**: All other phases (final polish)

---

## Critical Path & Dependencies

```
START
  │
  ├─ Phase 2 (Cost Fix) ──────────┐
  │                                │
  ├─ Phase 3 (Versioning) ─────┐  │
  │   │                         │  │
  │   └─→ Phase 4 (Superseding) ┘  │
  │                                │
  ├─ Phase 5 (License Pools) ─────┤ (parallel)
  │                                │
  ├─ Phase 6 (Role-Based) ────────┤
  │   │                            │
  │   └─→ Phase 7 (Approval) ──────┤
  │                                │
  ├─ Phase 8 (Employee Linking) ──┤
  │   │                            │
  │   └─→ Phase 9 (Refresh Cal) ───┤
  │                                │
  ├─ Phase 10 (Dept/Role UX) ─────┤
  │                                │
  ├─ Phase 11 (Manager Select) ───┤ (parallel)
  │                                │
  └─ Phase 12 (Navigation) ────────┘
  │
PRODUCTION READY
```

---

## Effort Estimates

| Phase | Complexity | Days | Can Parallelize? |
|-------|------------|------|------------------|
| Phase 2 | LOW | 1-2 | Yes |
| Phase 3 | HIGH | 5-7 | Yes |
| Phase 4 | MEDIUM | 3-4 | No (needs 3) |
| Phase 5 | MEDIUM | 3-4 | Yes |
| Phase 6 | HIGH | 5-7 | Yes |
| Phase 7 | MEDIUM | 3-4 | No (needs 6) |
| Phase 8 | MEDIUM | 3-4 | Yes |
| Phase 9 | HIGH | 5-7 | No (needs 8) |
| Phase 10 | MEDIUM | 3-4 | Yes (needs 6) |
| Phase 11 | LOW | 1-2 | Yes |
| Phase 12 | LOW | 1-2 | No (needs all) |
| **Sequential Total** | | **35-45 days** | |
| **Parallel Total** | | **25-30 days** | |

---

## Most Efficient Execution Strategy

### **Recommended Approach: 3-Track Parallelization**

#### **Track A: Core Package System** (Critical Path - 16-20 days)
1. Phase 3: Package Versioning (5-7 days)
2. Phase 4: Hardware Superseding (3-4 days)
3. Phase 6: Role-Based Assignment (5-7 days)
4. Phase 7: Approval Workflow (3-4 days)

#### **Track B: Employee & Refresh** (Critical Path - 11-15 days)
1. Phase 8: Employee Linking (3-4 days)
2. Phase 9: Refresh Calendar (5-7 days)
3. Phase 10: Dept/Role UX (3-4 days) - *starts after Phase 6 complete*

#### **Track C: Quick Wins** (Parallel - 5-8 days)
1. Phase 2: Cost Calculation Fix (1-2 days)
2. Phase 5: License Pool Management (3-4 days)
3. Phase 11: Manager Selection (1-2 days)

#### **Track D: Final Polish** (Sequential - 1-2 days)
1. Phase 12: Navigation & Branding (1-2 days) - *after all tracks complete*

**Total Duration: ~25-30 days** (vs. 35-45 days sequential)

---

## Token-Efficient Execution Pattern

To avoid sending full context repeatedly, use this pattern:

### **Pattern 1: Phase Reference**
```
"Execute Phase 3 from EXECUTION-PLAN.md"
```

### **Pattern 2: Track Reference**
```
"Execute Track A (Phases 3, 4, 6, 7) from EXECUTION-PLAN.md"
```

### **Pattern 3: Quick Status Check**
```
"Status update for Phase 3"
```

### **Pattern 4: Context-Free Resume**
```
"Continue with next phase after Phase 3 completion"
```

Each phase has:
- Clear objectives
- Data model changes
- File list
- Success criteria
- No need to repeat requirements

---

## SQL Tables to Create

### Tables from Plan
```sql
-- Phase 3: Package Versioning
CREATE TABLE PackageVersions (...);
CREATE TABLE PackageAssignments (...);

-- Phase 9: Refresh Calendar
CREATE TABLE RefreshSchedules (...);

-- Additional tables for core entities (Phase 2-3)
CREATE TABLE Packages (...);
CREATE TABLE Hardware (...);
CREATE TABLE Software (...);
CREATE TABLE PreHires (...);
CREATE TABLE ApprovalRequests (...);
```

**Full SQL schema script will be generated in Phase 2-3.**

---

## Open Decisions

### 1. License Pool Purchase Tracking (Phase 5)
**Options**:
- A) Track separate purchase batches (more complex, better audit trail)
- B) Just increment total pool (simpler, MVP-friendly) - THIS ONE

**Recommendation**: Start with B, add A later if needed

### 2. Employee Linking Auto-Match Threshold (Phase 8)
**Recommendation**: - ACCEPTED
- 100% match (name + email exact) → Auto-suggest with confirmation
- 80-99% match → Show suggestions
- <80% match → Manual search only

### 3. Hardware Refresh Notifications (Phase 9)
**Recommendation**: Power Automate flow (most flexible) - ACCEPTED

---

## Next Steps

1. **Review this plan** - Confirm all requirements captured
2. **Make decisions** - Resolve open questions above
3. **Choose execution strategy**:
   - Option A: Sequential (35-45 days, simpler)
   - Option B: 3-Track Parallel (25-30 days, recommended)
4. **Start with Track C** - Quick wins build momentum
5. **Reference this file** - Use phase numbers to minimize token usage

---

**END OF EXECUTION PLAN**
