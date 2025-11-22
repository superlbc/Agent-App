# Employee Onboarding System - Architecture Proposal

## 🎯 Problem Statement

The current architecture merges "Software Catalog" and "License Pool" into a single `Software` interface, causing confusion about:
- Where to create new licenses vs software items
- How software catalog relates to license pooling
- Whether all software has license tracking

This document proposes a clearer separation of concerns.

---

## 📐 Proposed Architecture: Separated Concerns

### **1. Software Catalog (Software interface)**

**Purpose**: Catalog of ALL software available in the organization (whether licensed or not)

```typescript
interface Software {
  id: string;
  name: string;              // e.g., "Adobe Creative Cloud", "Figma", "Cinema 4D"
  vendor: string;            // e.g., "Adobe", "Figma Inc.", "Maxon"
  category: "design" | "development" | "productivity" | "communication" | "other";
  description?: string;
  cost: number;              // Base cost (per seat/per license)
  costFrequency?: "one-time" | "monthly" | "annual";
  requiresApproval: boolean; // Does requesting this software require approval?
  approver?: string;         // Who approves requests (e.g., "Steve Sanderson")

  // Metadata
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}
```

**Key Points**:
- ✅ **Pure catalog** - No seat tracking, no assignments
- ✅ Works for BOTH pooled licenses AND unlimited software (e.g., open-source tools)
- ✅ Used in package definitions (what software comes with "XD Designer Standard"?)

---

### **2. License Pool (NEW - Separate entity)**

**Purpose**: Tracks license inventory with seat counts and assignments

```typescript
interface LicensePool {
  id: string;
  softwareId: string;        // FK to Software.id (which software this pool is for)

  // Pool Sizing
  totalSeats: number;        // Total licenses purchased
  assignedSeats: number;     // Currently assigned (calculated from assignments)
  availableSeats: number;    // totalSeats - assignedSeats (calculated)

  // License Type
  licenseType: "perpetual" | "subscription" | "concurrent";

  // Lifecycle
  purchaseDate?: Date;
  renewalDate?: Date;        // Next renewal date for subscriptions
  renewalFrequency?: "monthly" | "annual";
  autoRenew: boolean;

  // Contacts
  vendorContact?: string;    // Vendor sales/support contact
  internalContact?: string;  // Internal license administrator

  // Tracking
  assignments: LicenseAssignment[]; // Individual seat assignments

  // Metadata
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
}
```

**Key Points**:
- ✅ **Explicit license tracking** - Separate from software catalog
- ✅ Allows multiple license pools for same software (e.g., different subscription tiers)
- ✅ Clear ownership: LicensePool manages utilization, Software is just catalog

---

### **3. License Assignment (Existing - No changes)**

```typescript
interface LicenseAssignment {
  id: string;
  licensePoolId: string;     // FK to LicensePool.id (changed from licenseId)
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  assignedDate: Date;
  assignedBy: string;
  expirationDate?: Date;     // For temporary assignments
  notes?: string;
  status: "active" | "expired" | "revoked";
}
```

---

## 🔄 **Workflow Comparison**

### **Current Workflow** (Merged Approach)
```
1. Create Software item (e.g., "Adobe CC")
   ├─ name: "Adobe Creative Cloud"
   ├─ seatCount: 10
   └─ assignments: []

2. Assign license to employee
   ├─ Software.assignedSeats++
   └─ Software.assignments.push(newAssignment)

3. View License Pool Dashboard
   └─ Filters Software where seatCount > 0
```

### **Proposed Workflow** (Separated Approach)
```
1. Create Software item (catalog only)
   ├─ name: "Adobe Creative Cloud"
   └─ cost: $54.99/month

2. Create License Pool (if licenses purchased)
   ├─ softwareId: "adobe-cc-001"
   ├─ totalSeats: 10
   └─ licenseType: "subscription"

3. Assign license to employee
   ├─ LicensePool.assignedSeats++
   └─ LicensePool.assignments.push(newAssignment)

4. View License Pool Dashboard
   └─ Displays all LicensePool records with utilization
```

---

## 📂 **Navigation & Tab Structure Redesign**

### **Current Structure** (Confusing)
```
INVENTORY
├─ Hardware Inventory
├─ Software & Licenses          ← Ambiguous: Catalog or Pool?
└─ License Pool Dashboard       ← Separate view, unclear relationship

PACKAGES
├─ Manage Packages
├─ Hardware                     ← Duplicates "Hardware Inventory"?
├─ Software                     ← Duplicates "Software & Licenses"?
└─ Licenses                     ← What's the difference from Software?
```

### **Proposed Structure** (Clear Separation)
```
INVENTORY
├─ 📦 Hardware Inventory        ← All physical equipment
├─ 💿 Software Catalog          ← All software (catalog only, no seats)
└─ 🔑 License Pools             ← License inventory with seat tracking

PACKAGES
├─ 📋 Manage Packages           ← Create/edit equipment packages
└─ 📊 Package Analytics         ← Cost analysis, usage stats

HARDWARE REFRESH (NEW - Top-level section)
├─ 📅 Refresh Calendar          ← Upcoming refresh eligibility dates
├─ 💰 Budget Forecast           ← Financial planning for refreshes
└─ 🔔 Notifications             ← Alerts for upcoming refreshes
```

**Key Changes**:
1. ✅ **Remove duplicate tabs**: Hardware/Software under PACKAGES (redundant)
2. ✅ **Rename "Software & Licenses" → "Software Catalog"** (clarifies purpose)
3. ✅ **"License Pool Dashboard" → "License Pools"** (shorter, clearer)
4. ✅ **Elevate Hardware Refresh** to top-level section (it's a major workflow)

---

## 🔗 **How Components Work Together**

### **Example: Assigning Adobe CC to a Pre-hire**

**Step 1: Software Catalog**
```typescript
// Software catalog entry (created once)
const adobeCC: Software = {
  id: "sw-adobe-cc-001",
  name: "Adobe Creative Cloud",
  vendor: "Adobe",
  category: "design",
  cost: 54.99,
  costFrequency: "monthly",
  requiresApproval: true,
  approver: "Steve Sanderson"
};
```

**Step 2: License Pool**
```typescript
// License pool (created when licenses purchased)
const adobeCCPool: LicensePool = {
  id: "pool-adobe-cc-001",
  softwareId: "sw-adobe-cc-001",  // References software catalog
  totalSeats: 10,
  assignedSeats: 0,               // Calculated from assignments
  availableSeats: 10,             // totalSeats - assignedSeats
  licenseType: "subscription",
  renewalDate: new Date("2026-01-01"),
  assignments: []
};
```

**Step 3: Package Definition**
```typescript
// Package includes software from catalog (not license pool!)
const xdDesignerPackage: Package = {
  id: "pkg-xd-std-001",
  name: "XD Designer Standard",
  software: [adobeCC],  // References Software catalog
  // ...
};
```

**Step 4: Pre-hire Assignment**
```typescript
// When pre-hire accepts offer, assign package
const preHire: PreHire = {
  assignedPackage: xdDesignerPackage  // Package includes Adobe CC
};

// On start date, create license assignment
const assignment: LicenseAssignment = {
  licensePoolId: "pool-adobe-cc-001",  // References license pool
  employeeId: "emp-jane-001",
  assignedDate: new Date("2025-12-01"),
  status: "active"
};

// Update pool
adobeCCPool.assignedSeats++;  // Now 1/10 seats used
adobeCCPool.assignments.push(assignment);
```

---

## 💡 **Benefits of Separation**

### **1. Clarity**
- ✅ **Software Catalog** = "What software exists in our organization?"
- ✅ **License Pool** = "How many seats do we have? Who's using them?"
- ❌ No more confusion: "Is this catalog or inventory?"

### **2. Flexibility**
- ✅ Track software that doesn't need licensing (open-source, free tools)
- ✅ Multiple license pools for same software (different tiers, regions)
- ✅ Software can exist in catalog WITHOUT a license pool (requested but not yet purchased)

### **3. Accurate Costing**
```typescript
// Package cost = Software catalog cost (NOT license pool cost!)
packageCost = sum(software.cost for software in package.software)

// License pool cost = Separate financial tracking
licensePoolTotalCost = totalSeats * software.cost * renewalFrequency
```

### **4. Better Reporting**
- **Software Catalog Report**: All software we support (for IT knowledge base)
- **License Pool Report**: Utilization metrics, renewal forecasts, over-allocation alerts
- **Package Cost Report**: Accurate first-year vs ongoing costs

---

## 📊 **Inventory, Packages, Hardware Refresh - Unified Vision**

### **The Big Picture: Equipment Lifecycle**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EQUIPMENT LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: CATALOG & INVENTORY
────────────────────────────
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Hardware   │    │   Software   │    │License Pools │
│   Inventory  │    │   Catalog    │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
                           ▼
PHASE 2: PACKAGE DEFINITION
────────────────────────────
              ┌─────────────┐
              │  Packages   │ ← References Hardware + Software
              └──────┬──────┘
                     │
                     ▼
PHASE 3: ASSIGNMENT
────────────────────────────
         ┌────────────────┐
         │   Pre-hires    │ ← Assigned packages
         │   Employees    │
         └────────┬───────┘
                  │
                  ▼
PHASE 4: PROVISIONING
────────────────────────────
    ┌───────────┐      ┌──────────────┐
    │ Hardware  │      │License Assign│
    │Assignment │      │              │
    └───────────┘      └──────────────┘
                  │
                  ▼
PHASE 5: LIFECYCLE MANAGEMENT
────────────────────────────
         ┌────────────────┐
         │Hardware Refresh│ ← 3-year cycle, budget forecasting
         └────────────────┘
```

---

## 🏗️ **Recommended Data Flow**

### **Creating a Package (HR/Director)**
```
1. Browse Hardware Inventory → Select items
   ├─ MacBook Pro M3 Max
   ├─ Dell UltraSharp 27" 4K
   └─ Logitech MX Master 3

2. Browse Software Catalog → Select items
   ├─ Adobe Creative Cloud
   ├─ Figma Professional
   └─ Cinema 4D

3. Create Package
   ├─ Name: "XD Designer Premium"
   ├─ Hardware: [hw-mbp-001, hw-monitor-001, hw-mouse-001]
   └─ Software: [sw-adobe-001, sw-figma-001, sw-c4d-001]

4. Set Approval Rules
   └─ approverIds: [] (auto-approve) OR ["steve@momentumww.com"] (needs approval)
```

### **Assigning to Pre-hire (HR)**
```
1. Create pre-hire record
   ├─ Jane Smith
   ├─ Role: "XD Designer"
   └─ Start Date: 2025-12-01

2. Assign package
   └─ assignedPackage: "XD Designer Premium" (v2 - latest version)

3. On start date, provision equipment
   ├─ Hardware: Order from inventory
   └─ Software: Assign licenses from pools
```

### **License Assignment (Automated)**
```
On employee start date:
1. For each software in package:
   ├─ Find corresponding LicensePool (by softwareId)
   ├─ Check availableSeats > 0
   ├─ Create LicenseAssignment
   └─ Update LicensePool.assignedSeats++

2. If no seats available:
   ├─ Create ApprovalRequest for additional seats
   └─ Notify license administrator
```

### **Hardware Refresh (IT + Finance)**
```
1. System monitors hardware assignment dates
   ├─ MacBook assigned: 2022-01-01
   ├─ Refresh cycle: 3 years
   └─ Eligibility date: 2025-01-01

2. 4 months before eligibility (Sept 2024):
   ├─ Generate RefreshSchedule record
   ├─ Send notification to IT + Finance
   └─ Add to budget forecast: $3,500 (MacBook M4 cost)

3. On eligibility date:
   ├─ Create ApprovalRequest for new MacBook
   ├─ Auto-populate with superseding hardware (MacBook M4)
   └─ Await approval from Finance/Director

4. After approval:
   ├─ Order new hardware
   ├─ Update RefreshSchedule.status = "refreshed"
   ├─ Retire old hardware
   └─ Update employee.actualHardware
```

---

## 🎨 **Recommended Tab Structure (Final)**

```
EMPLOYEE ONBOARDING SYSTEM
──────────────────────────

PRE-HIRES & PACKAGES
├─ 👥 Pre-hires                    ← Candidate tracking
├─ 📦 Packages                     ← Pre-configured equipment bundles
└─ ✅ Approvals                    ← Approval queue (pending, approved, rejected)

INVENTORY
├─ 🖥️  Hardware Inventory          ← Computers, monitors, accessories
├─ 💿 Software Catalog             ← All software (catalog only)
└─ 🔑 License Pools                ← License inventory + utilization

HARDWARE REFRESH
├─ 📅 Refresh Calendar             ← Upcoming eligibility dates
├─ 💰 Budget Forecast              ← Financial planning
└─ 🔔 Notifications                ← Alerts for upcoming refreshes

FREEZE PERIOD ADMIN
├─ ❄️  Freeze Period Admin         ← Configure freeze periods
└─ 📊 Freeze Period Dashboard      ← Monitor start/end date actions
```

**Key Improvements**:
1. ✅ **Pre-hires & Packages** together (they're tightly coupled)
2. ✅ **Approvals** elevated to top-level (major workflow)
3. ✅ **Hardware Refresh** as own section (not buried)
4. ✅ **Clear hierarchy**: Who uses what, when

---

## 🚀 **Migration Plan: Current → Proposed**

### **Phase 1: Backward-Compatible Changes (No Breaking Changes)**

**Step 1: Create LicensePool interface** (types.ts)
```typescript
// Add new interface (doesn't break existing code)
export interface LicensePool {
  id: string;
  softwareId: string;  // FK to Software.id
  totalSeats: number;
  assignedSeats: number;
  // ... (full definition above)
}
```

**Step 2: Mark Software license fields as deprecated**
```typescript
export interface Software {
  // ... existing fields ...

  /** @deprecated Use LicensePool instead */
  seatCount?: number;
  /** @deprecated Use LicensePool instead */
  assignedSeats?: number;
  /** @deprecated Use LicensePool instead */
  assignments?: LicenseAssignment[];
}
```

**Step 3: Create migration utility**
```typescript
// utils/licensePoolMigration.ts
export function migrateToLicensePool(software: Software): LicensePool {
  return {
    id: `pool-${software.id}`,
    softwareId: software.id,
    totalSeats: software.seatCount || 0,
    assignedSeats: software.assignedSeats || 0,
    licenseType: software.licenseType,
    assignments: software.assignments || [],
    // ... map remaining fields
  };
}
```

### **Phase 2: UI Updates (Progressive Enhancement)**

**Step 1: Rename navigation tabs**
- ✅ "Software & Licenses" → "Software Catalog"
- ✅ "License Pool Dashboard" → "License Pools"

**Step 2: Update LicensePoolDashboard to use LicensePool**
```typescript
// Before
<LicensePoolDashboard licenses={software} />

// After
<LicensePoolDashboard licensePools={licensePools} />
```

**Step 3: Create LicensePoolContext**
```typescript
// contexts/LicensePoolContext.tsx
export const useLicensePools = () => {
  const [pools, setPools] = useState<LicensePool[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);

  // CRUD operations
  const createPool = (pool: LicensePool) => { /* ... */ };
  const updatePool = (pool: LicensePool) => { /* ... */ };
  const deletePool = (poolId: string) => { /* ... */ };

  // Utilization helpers
  const getAvailableSeats = (poolId: string) => { /* ... */ };
  const assignSeat = (poolId: string, employeeId: string) => { /* ... */ };

  return { pools, software, createPool, /* ... */ };
};
```

### **Phase 3: Database Migration (One-Time Script)**

**Pseudocode**:
```typescript
// Migration script: migrateLicensePools.ts
async function migrateLicensePools() {
  // 1. Fetch all Software records with seatCount > 0
  const softwareWithSeats = await db.software.where({ seatCount: { gt: 0 } });

  // 2. Create LicensePool records
  for (const software of softwareWithSeats) {
    await db.licensePool.create({
      id: `pool-${software.id}`,
      softwareId: software.id,
      totalSeats: software.seatCount,
      assignedSeats: software.assignedSeats || 0,
      licenseType: software.licenseType,
      assignments: software.assignments || [],
      // ... map remaining fields
    });
  }

  // 3. Update LicenseAssignments to reference LicensePool
  await db.licenseAssignment.updateMany({
    licensePoolId: db.raw('CONCAT("pool-", licenseId)')
  });

  // 4. Mark Software fields as deprecated (don't delete yet!)
  console.log("Migration complete. Software.seatCount is now deprecated.");
}
```

---

## ✅ **Implementation Checklist**

### **Quick Wins (1-2 days)**
- [ ] Rename "Software & Licenses" → "Software Catalog"
- [ ] Rename "License Pool Dashboard" → "License Pools"
- [ ] Remove duplicate "Hardware" and "Software" tabs under PACKAGES
- [ ] Create "Approvals" top-level section
- [ ] Create "Hardware Refresh" top-level section

### **Medium Effort (3-5 days)**
- [ ] Create `LicensePool` interface in types.ts
- [ ] Mark `Software` license fields as `@deprecated`
- [ ] Create `LicensePoolContext` with CRUD operations
- [ ] Update `LicensePoolDashboard` to use `LicensePool` instead of `Software`
- [ ] Create migration utility `migrateToLicensePool()`

### **Long-term (1-2 weeks)**
- [ ] Write database migration script
- [ ] Update all components to use `LicensePool` instead of `Software.seatCount`
- [ ] Remove deprecated fields from `Software` interface
- [ ] Update mockData.ts with separate `mockLicensePools` array
- [ ] Create comprehensive test suite for license assignment logic

---

## 🎯 **Success Metrics**

After migration, you should have:
- ✅ **Zero confusion**: "Where do I create a license?" → License Pools section
- ✅ **Zero duplication**: One source of truth for software catalog, one for license inventory
- ✅ **Accurate reporting**: Package costs calculated from Software.cost, license utilization from LicensePool
- ✅ **Flexible licensing**: Can add software to catalog WITHOUT license pool (e.g., free tools)
- ✅ **Clear workflows**: Software Catalog (catalog) → License Pools (inventory) → Assignments (provisioning)

---

## 📞 **Questions?**

This architecture proposal addresses:
1. ✅ **How license pool works**: Separated from software catalog
2. ✅ **Where to create new ones**: Dedicated "License Pools" section
3. ✅ **How they work together**: Software references catalog, LicensePool tracks seats, Assignments link employees
4. ✅ **Better structure**: Clear navigation hierarchy, no duplication, workflows aligned

Let me know if you'd like me to start implementing this migration!
