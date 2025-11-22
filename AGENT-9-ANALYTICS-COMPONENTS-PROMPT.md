# Agent 9: Analytics Components - Campaign Performance, Regional, Team, Venue Metrics

**Priority**: MEDIUM
**Estimated Time**: 2-3 days
**Agent Type**: @agent-feature-developer
**Model**: Sonnet
**Can Run in Parallel**: Yes (with Agents 7, 8 after Agent 6 complete)

---

## 🎯 Objective

Build 4 analytics dashboard components to complement the existing PowerBIDashboard and ReportExport components, providing visual insights into campaign performance, regional distribution, team utilization, and venue metrics.

---

## 📋 Requirements (from UXP-MIGRATION-MASTER-PLAN.md lines 1139-1178)

Build 4 analytics components with charts, filters, and export functionality:

1. **CampaignPerformance.tsx** - Budget vs actual, event count, timeline visualization
2. **RegionalBreakdown.tsx** - Events by region, map view, top cities/venues
3. **TeamUtilization.tsx** - Assignments per person, workload distribution
4. **VenueMetrics.tsx** - Most used venues, Placer.ai footfall aggregation

---

## 📊 Current State

**Already Built** (by Agent 4):
- ✅ `components/analytics/PowerBIDashboard.tsx` (Power BI embed with filters)
- ✅ `components/analytics/ReportExport.tsx` (Excel/PDF/CSV export)

**Missing** (this agent's task):
- ❌ CampaignPerformance component
- ❌ RegionalBreakdown component
- ❌ TeamUtilization component
- ❌ VenueMetrics component

---

## 📚 Chart Library

**Use Recharts** (lightweight, React-native, easy to use):

```bash
npm install recharts
npm install @types/recharts --save-dev
```

**Chart Types Needed**:
- BarChart (campaign performance, regional breakdown)
- LineChart (timeline visualization)
- PieChart (team workload distribution)
- AreaChart (venue usage over time)

**Example**:
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="events" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

---

## 🏗️ Component Specifications

### Component 1: CampaignPerformance.tsx

**Location**: `/home/user/UXP/components/analytics/CampaignPerformance.tsx`

**Purpose**: Show performance metrics for campaigns (event count, budget, timeline)

**Features**:
- **Campaign Selection**: Dropdown to select campaign
- **Key Metrics Cards**:
  - Total Events
  - Completed Events
  - Upcoming Events
  - Cancelled Events
  - Budget (if available)
  - Actual Spend (if available)
- **Event Timeline Chart**:
  - X-axis: Months
  - Y-axis: Event count
  - Bar chart showing events per month
- **Budget Chart** (optional, if budget data available):
  - Budget vs Actual spending
  - Bar chart comparison
- **Export**: CSV export of campaign metrics

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Campaign Performance                     [Export]│
├───────────────────────────────────────────────────┤
│ Campaign: [Verizon Hyperlocal 2025 ▼]            │
├───────────────────────────────────────────────────┤
│                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │  Total   │ │Completed │ │ Upcoming │          │
│ │   47     │ │    32    │ │    15    │          │
│ │  Events  │ │  Events  │ │  Events  │          │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                   │
│ Event Timeline (2025)                             │
│ ┌─────────────────────────────────────────────┐ │
│ │        ███                                   │ │
│ │    ███ ███ ███                               │ │
│ │ ███████████████ ███ ███                     │ │
│ │ Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Top Venues                                        │
│ 1. MetLife Stadium (8 events)                    │
│ 2. Arthur Ashe Stadium (6 events)                │
│ 3. Madison Square Garden (5 events)              │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface CampaignPerformanceProps {
  campaigns: Campaign[];
  events: Event[];
  venues: Venue[];
  selectedCampaignId?: string;
  onSelectCampaign?: (campaignId: string) => void;
  onExport?: () => void;
}
```

**Data Aggregation**:
```typescript
function aggregateCampaignMetrics(campaign: Campaign, events: Event[]) {
  const campaignEvents = events.filter(e => e.campaignId === campaign.id);

  const totalEvents = campaignEvents.length;
  const completedEvents = campaignEvents.filter(e => e.status === 'completed').length;
  const upcomingEvents = campaignEvents.filter(e =>
    e.status === 'planning' || e.status === 'active'
  ).length;
  const cancelledEvents = campaignEvents.filter(e => e.status === 'cancelled').length;

  // Group events by month for timeline
  const eventsByMonth = campaignEvents.reduce((acc, event) => {
    const month = format(event.eventStartDate, 'MMM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = Object.entries(eventsByMonth).map(([month, count]) => ({
    month,
    events: count,
  }));

  return {
    totalEvents,
    completedEvents,
    upcomingEvents,
    cancelledEvents,
    timelineData,
  };
}
```

---

### Component 2: RegionalBreakdown.tsx

**Location**: `/home/user/UXP/components/analytics/RegionalBreakdown.tsx`

**Purpose**: Show events distributed across regions, cities, and countries

**Features**:
- **Region Filter**: Filter by region (Northeast, Southeast, Midwest, etc.)
- **Map View**: Geographic map showing event locations (optional for MVP)
- **Regional Performance Table**:
  - Region name
  - Event count
  - Top city
  - Percentage of total
- **Top Cities List**:
  - City name, event count, top venue
- **Top Venues List**:
  - Venue name, city, event count
- **Export**: CSV export of regional data

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Regional Breakdown                       [Export]│
├───────────────────────────────────────────────────┤
│ Date Range: [All Time ▼] Region: [All ▼]         │
├───────────────────────────────────────────────────┤
│                                                   │
│ Regional Performance                              │
│ ┌─────────────────────────────────────────────┐ │
│ │        Events by Region                      │ │
│ │    ███ Northeast (35%)                       │ │
│ │ ████████ Southeast (45%)                     │ │
│ │   ██ Midwest (15%)                           │ │
│ │   █ West (5%)                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Top Cities                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1. New York, NY         (23 events)         │ │
│ │ 2. Los Angeles, CA      (18 events)         │ │
│ │ 3. Chicago, IL          (12 events)         │ │
│ │ 4. Miami, FL            (10 events)         │ │
│ │ 5. Boston, MA           (8 events)          │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Top Venues                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1. MetLife Stadium, NJ  (8 events)          │ │
│ │ 2. Staples Center, LA   (7 events)          │ │
│ │ 3. Soldier Field, CHI   (6 events)          │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface RegionalBreakdownProps {
  events: Event[];
  venues: Venue[];
  selectedRegion?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}
```

**Data Aggregation**:
```typescript
function aggregateRegionalData(events: Event[]) {
  // Group events by region
  const eventsByRegion = events.reduce((acc, event) => {
    const region = event.region || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regionalData = Object.entries(eventsByRegion).map(([region, count]) => ({
    region,
    count,
    percentage: (count / events.length) * 100,
  }));

  // Group events by city
  const eventsByCity = events.reduce((acc, event) => {
    const city = `${event.city}, ${event.country}`;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(eventsByCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group events by venue
  const eventsByVenue = events.reduce((acc, event) => {
    const venue = event.eventVenue;
    if (venue) {
      acc[venue] = (acc[venue] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topVenues = Object.entries(eventsByVenue)
    .map(([venue, count]) => ({ venue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    regionalData,
    topCities,
    topVenues,
  };
}
```

---

### Component 3: TeamUtilization.tsx

**Location**: `/home/user/UXP/components/analytics/TeamUtilization.tsx`

**Purpose**: Show team member workload, assignments per person, availability

**Features**:
- **Department Filter**: Filter by department
- **Role Filter**: Filter by role
- **Date Range Filter**: Filter by date range
- **Utilization Chart**:
  - Pie chart: % of team assigned vs available
  - Bar chart: Assignments per person
- **Top Contributors Table**:
  - Person name, assignment count, roles, on-site count
- **Workload Distribution**:
  - Show who's overloaded (>5 events/month)
  - Show who's underutilized (<2 events/month)
- **Export**: CSV export of team assignments

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Team Utilization                         [Export]│
├───────────────────────────────────────────────────┤
│ Department: [All ▼] Role: [All ▼]                │
│ Date Range: [This Month ▼]                        │
├───────────────────────────────────────────────────┤
│                                                   │
│ Team Workload Distribution                        │
│ ┌─────────────────────────────────────────────┐ │
│ │  Top Contributors                            │ │
│ │  1. John Doe        15 events  ⚠️ High      │ │
│ │  2. Jane Smith      12 events  ⚠️ High      │ │
│ │  3. Mike Johnson    8 events   ✅ Normal     │ │
│ │  4. Sarah Lee       5 events   ✅ Normal     │ │
│ │  5. Tom Wilson      2 events   ⚠️ Low       │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Assignments by Role                               │
│ ┌─────────────────────────────────────────────┐ │
│ │        ████ Field Manager (32)              │ │
│ │    ███ Brand Ambassador (25)                │ │
│ │   ██ Setup Crew (18)                        │ │
│ │  █ Event Lead (12)                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Availability                                      │
│ • 12 team members fully booked (>10 events)      │
│ • 8 team members available (<5 events)           │
│ • 3 team members not assigned                    │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface TeamUtilizationProps {
  assignments: PeopleAssignment[];
  events: Event[];
  selectedDepartment?: string;
  selectedRole?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}
```

**Data Aggregation**:
```typescript
function aggregateTeamUtilization(assignments: PeopleAssignment[], events: Event[]) {
  // Group assignments by person
  const assignmentsByPerson = assignments.reduce((acc, assignment) => {
    const userId = assignment.userId;
    if (!acc[userId]) {
      acc[userId] = {
        name: assignment.userName,
        email: assignment.userEmail,
        department: assignment.userDepartment,
        assignments: [],
      };
    }
    acc[userId].assignments.push(assignment);
    return acc;
  }, {} as Record<string, any>);

  const topContributors = Object.values(assignmentsByPerson)
    .map(person => ({
      name: person.name,
      count: person.assignments.length,
      roles: [...new Set(person.assignments.map((a: any) => a.userRole))],
      onSiteCount: person.assignments.filter((a: any) => a.onSite).length,
      workload: person.assignments.length > 10 ? 'high' : person.assignments.length < 3 ? 'low' : 'normal',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group assignments by role
  const assignmentsByRole = assignments.reduce((acc, assignment) => {
    const role = assignment.userRole;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.entries(assignmentsByRole).map(([role, count]) => ({
    role,
    count,
  }));

  return {
    topContributors,
    roleData,
    totalAssigned: Object.keys(assignmentsByPerson).length,
    fullyBooked: topContributors.filter(p => p.workload === 'high').length,
    available: topContributors.filter(p => p.workload === 'low').length,
  };
}
```

---

### Component 4: VenueMetrics.tsx

**Location**: `/home/user/UXP/components/analytics/VenueMetrics.tsx`

**Purpose**: Show venue usage statistics, most popular venues, Placer.ai footfall aggregation

**Features**:
- **Date Range Filter**: Filter by date range
- **City Filter**: Filter by city
- **Venue Usage Chart**:
  - Bar chart: Events per venue
  - Top 10 venues
- **Placer.ai Footfall Summary** (if data available):
  - Average footfall per event
  - Total unique visitors
  - Peak traffic times
- **Venue Performance Table**:
  - Venue name, city, event count, avg attendance (if available)
- **Export**: CSV export of venue metrics

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Venue Metrics                            [Export]│
├───────────────────────────────────────────────────┤
│ Date Range: [This Year ▼] City: [All ▼]          │
├───────────────────────────────────────────────────┤
│                                                   │
│ Most Used Venues                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │        Events by Venue                       │ │
│ │ ████████ MetLife Stadium (8)                 │ │
│ │   ██████ Arthur Ashe Stadium (6)             │ │
│ │     ████ Madison Square Garden (5)           │ │
│ │       ██ Barclays Center (3)                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Placer.ai Footfall Analytics                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ Average Footfall: 12,500 visitors/event     │ │
│ │ Peak Hour: 2:00 PM - 3:00 PM                │ │
│ │ Avg Dwell Time: 45 minutes                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Venue Performance                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Venue               Events  Avg Footfall    │ │
│ │ MetLife Stadium     8       15,200          │ │
│ │ Arthur Ashe Stadium 6       18,500          │ │
│ │ MSG                 5       12,000          │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface VenueMetricsProps {
  events: Event[];
  venues: Venue[];
  placerData?: PlacerFootfallData[];
  selectedCity?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}
```

**Data Aggregation**:
```typescript
function aggregateVenueMetrics(
  events: Event[],
  venues: Venue[],
  placerData?: PlacerFootfallData[]
) {
  // Group events by venue
  const eventsByVenue = events.reduce((acc, event) => {
    const venueId = event.eventVenue;
    if (venueId) {
      acc[venueId] = (acc[venueId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const venueUsage = Object.entries(eventsByVenue)
    .map(([venueId, count]) => {
      const venue = venues.find(v => v.id === venueId);
      return {
        venueId,
        venueName: venue?.name || venueId,
        city: venue?.city || 'Unknown',
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate Placer.ai data if available
  let placerSummary: any = null;
  if (placerData && placerData.length > 0) {
    const avgFootfall = placerData.reduce((sum, d) => sum + d.visits, 0) / placerData.length;
    const avgDwellTime = placerData.reduce((sum, d) => sum + d.avgDwellTime, 0) / placerData.length;

    placerSummary = {
      avgFootfall: Math.round(avgFootfall),
      avgDwellTime: Math.round(avgDwellTime),
      peakHour: '2:00 PM - 3:00 PM', // Simplified for now
    };
  }

  return {
    venueUsage,
    placerSummary,
  };
}
```

---

## ✅ Acceptance Criteria

### Functional Requirements

1. **CampaignPerformance Component** ✅
   - Displays campaign metrics (total, completed, upcoming events)
   - Timeline chart shows events per month
   - Export to CSV works

2. **RegionalBreakdown Component** ✅
   - Shows events by region with bar chart
   - Top cities list displays correctly
   - Top venues list displays correctly
   - Export to CSV works

3. **TeamUtilization Component** ✅
   - Shows top contributors with workload indicators
   - Assignments by role chart displays
   - Availability summary shows
   - Export to CSV works

4. **VenueMetrics Component** ✅
   - Most used venues bar chart displays
   - Placer.ai summary shows (if data available)
   - Venue performance table displays
   - Export to CSV works

### Visual Requirements

5. **Dark Mode Support** ✅
6. **Responsive Design** ✅
7. **Charts Render Correctly** ✅ (Recharts integration)

### Code Quality

8. **TypeScript Strict Mode** ✅
9. **No Console Errors** ✅
10. **Reuses Existing UI Components** ✅

---

## 📁 Deliverables

| File | Lines | Description |
|------|-------|-------------|
| `components/analytics/CampaignPerformance.tsx` | ~350 | Campaign metrics and timeline |
| `components/analytics/RegionalBreakdown.tsx` | ~300 | Regional distribution |
| `components/analytics/TeamUtilization.tsx` | ~300 | Team workload analysis |
| `components/analytics/VenueMetrics.tsx` | ~250 | Venue usage statistics |

**Total**: ~1,200 lines of code

---

## 🧪 Testing Checklist

- [ ] CampaignPerformance loads with mock data
- [ ] Timeline chart renders correctly
- [ ] Campaign selection dropdown works
- [ ] Export CSV downloads
- [ ] RegionalBreakdown shows regional data
- [ ] Regional chart renders
- [ ] Top cities list populates
- [ ] TeamUtilization shows team members
- [ ] Workload indicators display correctly
- [ ] Role chart renders
- [ ] VenueMetrics shows venue usage
- [ ] Placer.ai summary displays (if data available)
- [ ] All charts render in dark mode
- [ ] Charts are responsive on mobile
- [ ] No console errors
- [ ] TypeScript compiles

---

## 🎯 Success Metrics

**Before**: Only PowerBIDashboard and ReportExport exist

**After**: Complete analytics suite with 6 components (4 new + 2 existing)

**Impact**: Users can visualize campaign performance, regional distribution, team workload, and venue usage without relying solely on external Power BI dashboards

---

**AGENT: START HERE** 🚀

Build 4 analytics dashboard components with charts and data aggregation.

**Estimated Time**: 2-3 days
**Difficulty**: Medium (chart integration, data aggregation)
**Can Run in Parallel**: Yes (with Agents 7, 8)
