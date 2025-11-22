# Agent 6: Navigation Component Update - CRITICAL 🔴

**Priority**: HIGHEST - Must complete first (blocks user access to UXP components)
**Estimated Time**: 2-3 hours
**Agent Type**: @agent-feature-developer
**Model**: Sonnet (requires careful refactoring)

---

## 🎯 Objective

Transform the Navigation component from Employee Onboarding sections to UXP (Unified Experience Platform) sections, enabling access to all completed Campaign, Event, and Venue management components.

---

## 📋 Current State Analysis

**File**: `/home/user/UXP/components/Navigation.tsx`

**Current Sections** (Employee Onboarding):
```typescript
NavigationSection =
  | 'pre-hires'
  | 'packages'
  | 'approvals'
  | 'hardware-inventory'
  | 'software-catalog'
  | 'license-pools'
  | 'user-license-assignments'
  | 'refresh-calendar'
  | 'refresh-budget'
  | 'refresh-notifications'
  | 'freeze-period-admin'
  | 'freeze-period-dashboard'
  | 'role-management';
```

**Navigation Groups**:
- PRE-HIRES & PACKAGES (3 items)
- INVENTORY (4 items)
- HARDWARE REFRESH (3 items)
- ADMINISTRATION (2 items)
- SYSTEM (1 item)

---

## 🎯 Target State (UXP Platform)

**New Sections** (per UXP-MIGRATION-MASTER-PLAN.md lines 529-565):

```typescript
NavigationSection =
  | 'campaigns'
  | 'events-calendar'
  | 'events-map'
  | 'events-list'
  | 'venues'
  | 'team-assignments'
  | 'integrations'
  | 'analytics-dashboard'
  | 'analytics-export'
  | 'admin-users'
  | 'admin-clients'
  | 'admin-programs'
  | 'settings';
```

**Navigation Groups**:

### 📊 CAMPAIGNS
- **All Campaigns** - Campaign list/grid view
  - Icon: `briefcase`
  - Route: `campaigns`

### 📅 EVENTS
- **Event Calendar** - Calendar view of all events
  - Icon: `calendar`
  - Route: `events-calendar`
- **Event Map** - Geographic map view
  - Icon: `map-pin`
  - Route: `events-map`
- **Event List** - Filterable event list
  - Icon: `list`
  - Route: `events-list`

### 🏢 VENUES
- **Venue Database** - All venues with search/filter
  - Icon: `map`
  - Route: `venues`

### 👥 TEAM (Note: Components don't exist yet, but add to nav)
- **Team Assignments** - Who's assigned to what event
  - Icon: `users`
  - Route: `team-assignments`

### 📲 INTEGRATIONS
- **Integration Settings** - Brandscopic, QR Tiger, Qualtrics
  - Icon: `zap`
  - Route: `integrations`

### 📊 ANALYTICS
- **Power BI Dashboard** - Reports and KPIs
  - Icon: `bar-chart`
  - Route: `analytics-dashboard`
- **Report Export** - Excel/PDF/CSV exports
  - Icon: `download`
  - Route: `analytics-export`

### ⚙️ ADMIN
- **User Management** - User roles and access
  - Icon: `user-check`
  - Route: `admin-users`
- **Client Management** - Client configuration
  - Icon: `building`
  - Route: `admin-clients`
- **Program Management** - Program setup
  - Icon: `folder`
  - Route: `admin-programs`

---

## 📝 Detailed Tasks

### Task 1: Update Navigation Types

**File**: `/home/user/UXP/components/Navigation.tsx`

1. **Replace NavigationSection type** (lines 13-26):
```typescript
export type NavigationSection =
  | 'campaigns'
  | 'events-calendar'
  | 'events-map'
  | 'events-list'
  | 'venues'
  | 'team-assignments'
  | 'integrations'
  | 'analytics-dashboard'
  | 'analytics-export'
  | 'admin-users'
  | 'admin-clients'
  | 'admin-programs'
  | 'settings';
```

### Task 2: Update Navigation Groups Configuration

**File**: `/home/user/UXP/components/Navigation.tsx`

2. **Replace NAVIGATION_GROUPS constant** (lines 52-end):

```typescript
const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: 'CAMPAIGNS',
    items: [
      {
        id: 'campaigns',
        label: 'All Campaigns',
        icon: 'briefcase',
        description: 'Campaign management and tracking',
      },
    ],
  },
  {
    label: 'EVENTS',
    items: [
      {
        id: 'events-calendar',
        label: 'Event Calendar',
        icon: 'calendar',
        description: 'Calendar view of all events',
      },
      {
        id: 'events-map',
        label: 'Event Map',
        icon: 'map-pin',
        description: 'Geographic map view',
      },
      {
        id: 'events-list',
        label: 'Event List',
        icon: 'list',
        description: 'Filterable event list',
      },
    ],
  },
  {
    label: 'VENUES',
    items: [
      {
        id: 'venues',
        label: 'Venue Database',
        icon: 'map',
        description: 'Venue search and management',
      },
    ],
  },
  {
    label: 'TEAM',
    items: [
      {
        id: 'team-assignments',
        label: 'Team Assignments',
        icon: 'users',
        description: 'Event team assignments',
      },
    ],
  },
  {
    label: 'INTEGRATIONS',
    items: [
      {
        id: 'integrations',
        label: 'Integration Settings',
        icon: 'zap',
        description: 'Brandscopic, QR Tiger, Qualtrics',
      },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      {
        id: 'analytics-dashboard',
        label: 'Power BI Dashboard',
        icon: 'bar-chart',
        description: 'Reports and KPIs',
      },
      {
        id: 'analytics-export',
        label: 'Report Export',
        icon: 'download',
        description: 'Excel, PDF, CSV exports',
      },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      {
        id: 'admin-users',
        label: 'User Management',
        icon: 'user-check',
        description: 'User roles and access control',
      },
      {
        id: 'admin-clients',
        label: 'Client Management',
        icon: 'building',
        description: 'Client configuration',
      },
      {
        id: 'admin-programs',
        label: 'Program Management',
        icon: 'folder',
        description: 'Program setup and tracking',
      },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        description: 'Application settings',
      },
    ],
  },
];
```

### Task 3: Update App.tsx to Route Sections

**File**: `/home/user/UXP/App.tsx`

3. **Find the section rendering logic** (search for `currentSection === ` patterns)

4. **Replace old section routing** with new UXP sections:

```typescript
// Remove all Employee Onboarding section renders:
// - pre-hires
// - packages
// - approvals
// - hardware-inventory
// - software-catalog
// - license-pools
// - user-license-assignments
// - refresh-calendar
// - refresh-budget
// - refresh-notifications
// - freeze-period-admin
// - freeze-period-dashboard
// - role-management

// Add new UXP section renders:

{currentSection === 'campaigns' && (
  <CampaignList
    campaigns={campaigns}
    onCreateCampaign={handleCreateCampaign}
    onUpdateCampaign={handleUpdateCampaign}
    onDeleteCampaign={handleDeleteCampaign}
    onSelectCampaign={handleSelectCampaign}
  />
)}

{currentSection === 'events-calendar' && (
  <EventCalendar
    events={events}
    campaigns={campaigns}
    onEventClick={handleEventClick}
    onDateRangeChange={handleDateRangeChange}
  />
)}

{currentSection === 'events-map' && (
  <EventMap
    events={events}
    venues={venues}
    onEventClick={handleEventClick}
    onVenueClick={handleVenueClick}
  />
)}

{currentSection === 'events-list' && (
  <EventList
    events={events}
    campaigns={campaigns}
    venues={venues}
    onCreateEvent={handleCreateEvent}
    onUpdateEvent={handleUpdateEvent}
    onDeleteEvent={handleDeleteEvent}
    onSelectEvent={handleSelectEvent}
  />
)}

{currentSection === 'venues' && (
  <VenueDatabase
    venues={venues}
    events={events}
    onCreateVenue={handleCreateVenue}
    onUpdateVenue={handleUpdateVenue}
    onDeleteVenue={handleDeleteVenue}
  />
)}

{currentSection === 'team-assignments' && (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold mb-4">Team Assignments</h2>
    <p className="text-gray-600 dark:text-gray-400">Coming soon - under development</p>
  </div>
)}

{currentSection === 'integrations' && (
  <IntegrationSettings
    clients={clients}
    onUpdateClient={handleUpdateClient}
  />
)}

{currentSection === 'analytics-dashboard' && (
  <PowerBIDashboard
    clients={clients}
    programs={programs}
    onGenerateEmbedToken={handleGenerateEmbedToken}
  />
)}

{currentSection === 'analytics-export' && (
  <ReportExport
    clients={clients}
    programs={programs}
    exportHistory={exportHistory}
    onExport={handleExport}
  />
)}

{currentSection === 'admin-users' && (
  <UserManagement
    initialUsers={users}
    clients={clients}
    currentUser={currentUser}
    onCreateUser={handleCreateUser}
    onUpdateUser={handleUpdateUser}
    onDeleteUser={handleDeleteUser}
  />
)}

{currentSection === 'admin-clients' && (
  <ClientManagement
    initialClients={clients}
    onCreateClient={handleCreateClient}
    onUpdateClient={handleUpdateClient}
    onDeleteClient={handleDeleteClient}
  />
)}

{currentSection === 'admin-programs' && (
  <ProgramManagement
    initialPrograms={programs}
    clients={clients}
    onCreateProgram={handleCreateProgram}
    onUpdateProgram={handleUpdateProgram}
    onDeleteProgram={handleDeleteProgram}
  />
)}

{currentSection === 'settings' && (
  <SettingsPanel
    onClose={() => {}}
  />
)}
```

### Task 4: Add Component Imports

**File**: `/home/user/UXP/App.tsx`

5. **Add imports for all UXP components**:

```typescript
// Campaign Components
import { CampaignList } from './components/campaign/CampaignList';

// Event Components
import { EventCalendar } from './components/event/EventCalendar';
import { EventMap } from './components/event/EventMap';
import { EventList } from './components/event/EventList';

// Venue Components
import { VenueDatabase } from './components/venue/VenueDatabase';

// Integration Components
import { IntegrationSettings } from './components/integrations/IntegrationSettings';

// Analytics Components
import { PowerBIDashboard } from './components/analytics/PowerBIDashboard';
import { ReportExport } from './components/analytics/ReportExport';

// Admin Components
import { UserManagement } from './components/admin/UserManagement';
import { ClientManagement } from './components/admin/ClientManagement';
import { ProgramManagement } from './components/admin/ProgramManagement';
```

### Task 5: Update Default Section

**File**: `/home/user/UXP/App.tsx`

6. **Change default section** from `'pre-hires'` to `'campaigns'`:

```typescript
// Find this line (likely in useState or similar):
const [currentSection, setCurrentSection] = useState<NavigationSection>('pre-hires');

// Change to:
const [currentSection, setCurrentSection] = useState<NavigationSection>('campaigns');
```

### Task 6: Clean Up Unused Imports

**File**: `/home/user/UXP/App.tsx`

7. **Remove all Employee Onboarding component imports**:
- Remove PreHireForm, PreHireList imports
- Remove PackageLibrary, PackageBuilder imports
- Remove HardwareInventory imports
- Remove LicensePoolDashboard imports
- Remove FreezePeriodAdmin, FreezePeriodDashboard imports
- Remove RefreshCalendar imports
- Remove ApprovalQueue imports

---

## ✅ Acceptance Criteria

### Functional Requirements

1. **Navigation renders with UXP sections** ✅
   - All 8 navigation groups display
   - All 13 navigation items present
   - Icons display correctly

2. **Section routing works** ✅
   - Clicking "All Campaigns" shows CampaignList component
   - Clicking "Event Calendar" shows EventCalendar component
   - Clicking "Event Map" shows EventMap component
   - Clicking "Event List" shows EventList component
   - Clicking "Venue Database" shows VenueDatabase component
   - Clicking integration/analytics/admin sections shows respective components

3. **Active section highlighting** ✅
   - Current section has active styling
   - Navigation persists across page refreshes (localStorage)

4. **No console errors** ✅
   - No TypeScript errors
   - No missing component errors
   - No import errors

### Visual Requirements

5. **Dark mode support** ✅
   - Navigation styles work in both light and dark mode

6. **Mobile responsive** ✅
   - Navigation collapses on mobile
   - Hamburger menu works

### Code Quality

7. **TypeScript strict mode** ✅
   - All types correctly defined
   - No `any` types

8. **Component isolation** ✅
   - Navigation component only handles routing
   - No business logic in Navigation

---

## 🚨 Critical Notes

### DO NOT Remove These Files Yet

Even though we're removing Employee Onboarding from navigation, **DO NOT DELETE** these component files yet:
- Keep all components in place
- Only remove from navigation and routing
- User may want to reference old code during transition

### Preserve Existing Contexts

Keep these contexts even if not used in initial UXP nav:
- `ApprovalContext.tsx` - May be reused for event approvals
- `LicenseContext.tsx` - Could be adapted for software licensing in UXP
- `RefreshContext.tsx` - Delete after confirming not needed

### Handle Missing Components Gracefully

For `team-assignments` section (components not built yet):
- Show "Coming soon" placeholder
- Add to navigation but display friendly message
- Don't throw errors

---

## 📁 Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `components/Navigation.tsx` | Replace navigation groups | ~200 |
| `App.tsx` | Replace section routing | ~500-1000 |

**Total Estimated Changes**: ~700-1200 lines

---

## 🧪 Testing Checklist

After implementation, verify:

- [ ] Navigation displays all 8 UXP sections
- [ ] Clicking "All Campaigns" loads CampaignList
- [ ] Clicking "Event Calendar" loads EventCalendar
- [ ] Clicking "Event Map" loads EventMap
- [ ] Clicking "Event List" loads EventList
- [ ] Clicking "Venue Database" loads VenueDatabase
- [ ] Clicking "Integration Settings" loads IntegrationSettings
- [ ] Clicking "Power BI Dashboard" loads PowerBIDashboard
- [ ] Clicking "Report Export" loads ReportExport
- [ ] Clicking "User Management" loads UserManagement
- [ ] Clicking "Client Management" loads ClientManagement
- [ ] Clicking "Program Management" loads ProgramManagement
- [ ] Active section highlighting works
- [ ] localStorage persistence works
- [ ] Dark mode works
- [ ] Mobile navigation works
- [ ] No console errors
- [ ] TypeScript compiles without errors

---

## 📊 Success Metrics

**Before**: Navigation shows 13 Employee Onboarding sections, UXP components inaccessible

**After**: Navigation shows 13 UXP sections, all completed components accessible

**Impact**: Users can now access Campaign, Event, Venue, Integration, Analytics, and Admin features

---

## 🔗 Dependencies

**Required Contexts** (already exist):
- ✅ `CampaignContext.tsx`
- ✅ `EventContext.tsx`
- ✅ `VenueContext.tsx`

**Required Components** (already built):
- ✅ Campaign: CampaignList, CampaignModal, CampaignDetailView
- ✅ Event: EventCalendar, EventMap, EventList, EventModal, EventDetailView
- ✅ Venue: VenueDatabase, VenueModal, VenueDetailView
- ✅ Integration: IntegrationSettings, BrandscopicSyncStatus, QRCodeManager
- ✅ Analytics: PowerBIDashboard, ReportExport
- ✅ Admin: UserManagement, ClientManagement, ProgramManagement

---

## 🎯 Execution Strategy

### Step 1: Backup Current Navigation
```bash
cp components/Navigation.tsx components/Navigation.tsx.backup
```

### Step 2: Update Navigation Types
- Modify NavigationSection type
- Update NAVIGATION_GROUPS constant

### Step 3: Update App.tsx Routing
- Add new component imports
- Replace section conditional renders
- Update default section

### Step 4: Test Compilation
```bash
npm run build
```

### Step 5: Test in Browser
- Start dev server
- Click through all navigation items
- Verify components load correctly

### Step 6: Commit Changes
```bash
git add components/Navigation.tsx App.tsx
git commit -m "feat: Update navigation from Employee Onboarding to UXP platform"
```

---

**AGENT: START HERE** 🚀

This is a **CRITICAL** task that must be completed before other agents can proceed. Once navigation is updated, users can access all the completed UXP components.

**Estimated Time**: 2-3 hours
**Difficulty**: Medium (requires careful refactoring but well-defined scope)
**Blockers**: None - all required components already exist
