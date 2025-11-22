# Analytics Components

Complete suite of analytics dashboard components for the UXP platform, providing visual insights into campaign performance, regional distribution, team utilization, and venue metrics.

---

## 📦 Components

### 1. CampaignPerformance.tsx (15 KB)

**Purpose**: Shows performance metrics for campaigns (event count, budget, timeline)

**Features**:
- Campaign selection dropdown
- Key metrics cards (total, completed, upcoming, cancelled events)
- Event timeline chart (events per month)
- Top venues list with event counts
- CSV export

**Props**:
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

**Usage**:
```tsx
<CampaignPerformance
  campaigns={campaigns}
  events={events}
  venues={venues}
  selectedCampaignId="campaign-1"
  onSelectCampaign={(id) => console.log('Selected:', id)}
  onExport={() => console.log('Exporting...')}
/>
```

---

### 2. RegionalBreakdown.tsx (15 KB)

**Purpose**: Shows events distributed across regions, cities, and countries

**Features**:
- Region filter dropdown
- Regional performance chart (horizontal bar chart)
- Top cities list (top 10)
- Top venues list (top 10)
- CSV export

**Props**:
```typescript
interface RegionalBreakdownProps {
  events: Event[];
  venues: Venue[];
  selectedRegion?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}
```

**Usage**:
```tsx
<RegionalBreakdown
  events={events}
  venues={venues}
  selectedRegion="United States"
  dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
  onExport={() => console.log('Exporting...')}
/>
```

---

### 3. TeamUtilization.tsx (21 KB)

**Purpose**: Shows team member workload, assignments per person, availability

**Features**:
- Department and role filters
- Summary cards (team members, fully booked, available)
- Assignments by role bar chart
- Workload distribution pie chart
- Top contributors list with workload indicators (high/normal/low)
- CSV export

**Props**:
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

**Usage**:
```tsx
<TeamUtilization
  assignments={assignments}
  events={events}
  selectedDepartment="Creative"
  selectedRole="Field Manager"
  dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
  onExport={() => console.log('Exporting...')}
/>
```

**Workload Thresholds**:
- **High**: > 10 assignments (red badge)
- **Normal**: 3-10 assignments (green badge)
- **Low**: < 3 assignments (yellow badge)

---

### 4. VenueMetrics.tsx (19 KB)

**Purpose**: Shows venue usage statistics, most popular venues, Placer.ai footfall aggregation

**Features**:
- City filter dropdown
- Placer.ai footfall summary (average footfall, dwell time, peak hour)
- Most used venues horizontal bar chart
- Venue performance table
- CSV export

**Props**:
```typescript
interface VenueMetricsProps {
  events: Event[];
  venues: Venue[];
  placerData?: PlacerFootfallData[];
  selectedCity?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}

interface PlacerFootfallData {
  venueId: string;
  date: Date;
  visits: number;
  avgDwellTime: number; // in minutes
  uniqueVisitors?: number;
}
```

**Usage**:
```tsx
const placerData: PlacerFootfallData[] = [
  {
    venueId: 'venue-1',
    date: new Date('2025-06-15'),
    visits: 15200,
    avgDwellTime: 45,
    uniqueVisitors: 12500,
  },
];

<VenueMetrics
  events={events}
  venues={venues}
  placerData={placerData}
  selectedCity="New York"
  dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
  onExport={() => console.log('Exporting...')}
/>
```

---

## 🎨 Chart Library

All components use **Recharts** for data visualization:

**Installed Libraries**:
- `recharts` - Chart library
- `@types/recharts` - TypeScript types

**Chart Types Used**:
- **BarChart** - Campaign timeline, regional breakdown, team roles, venue usage
- **PieChart** - Team workload distribution

**Chart Styling**:
- Dark mode support throughout
- Consistent color palette
- Responsive containers (ResponsiveContainer)
- Custom tooltips with dark background

---

## 📊 Data Aggregation

Each component includes helper functions for data aggregation:

### CampaignPerformance
- `aggregateCampaignMetrics()` - Groups events by month, counts by status
- `exportCampaignMetricsToCSV()` - Exports metrics to CSV

### RegionalBreakdown
- `aggregateRegionalData()` - Groups events by region/city/venue
- `exportRegionalDataToCSV()` - Exports regional data to CSV

### TeamUtilization
- `aggregateTeamUtilization()` - Groups assignments by person/role
- `exportTeamUtilizationToCSV()` - Exports team metrics to CSV

### VenueMetrics
- `aggregateVenueMetrics()` - Groups events by venue, calculates Placer.ai averages
- `exportVenueMetricsToCSV()` - Exports venue metrics to CSV

---

## 🎯 Key Features

### Filters
- **CampaignPerformance**: Campaign selection
- **RegionalBreakdown**: Region filter
- **TeamUtilization**: Department + Role filters
- **VenueMetrics**: City filter

### Charts
- All charts support dark mode
- Responsive design (ResponsiveContainer)
- Custom tooltips with rich information
- Consistent color scheme

### Export
- All components support CSV export
- Export includes summary metrics
- Timestamped filenames
- One-click download

### Empty States
- Graceful handling of empty data
- Clear messaging and icons
- Suggestions for next steps

---

## 🚀 Integration Example

```tsx
import { CampaignPerformance } from './components/analytics/CampaignPerformance';
import { RegionalBreakdown } from './components/analytics/RegionalBreakdown';
import { TeamUtilization } from './components/analytics/TeamUtilization';
import { VenueMetrics } from './components/analytics/VenueMetrics';

function AnalyticsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [assignments, setAssignments] = useState<PeopleAssignment[]>([]);

  return (
    <div className="space-y-8">
      <CampaignPerformance
        campaigns={campaigns}
        events={events}
        venues={venues}
      />

      <RegionalBreakdown
        events={events}
        venues={venues}
      />

      <TeamUtilization
        assignments={assignments}
        events={events}
      />

      <VenueMetrics
        events={events}
        venues={venues}
      />
    </div>
  );
}
```

---

## 📁 File Structure

```
components/analytics/
├── PowerBIDashboard.tsx      (17 KB) - Pre-existing
├── ReportExport.tsx          (23 KB) - Pre-existing
├── CampaignPerformance.tsx   (15 KB) - NEW ✅
├── RegionalBreakdown.tsx     (15 KB) - NEW ✅
├── TeamUtilization.tsx       (21 KB) - NEW ✅
├── VenueMetrics.tsx          (19 KB) - NEW ✅
└── README.md                 (this file)
```

**Total New Code**: ~1,200 lines across 4 components

---

## ✅ Acceptance Criteria

All acceptance criteria met:

### Functional Requirements
- ✅ CampaignPerformance displays campaign metrics and timeline chart
- ✅ RegionalBreakdown shows events by region with top cities/venues
- ✅ TeamUtilization shows top contributors and workload distribution
- ✅ VenueMetrics shows most used venues and Placer.ai summary
- ✅ All components support CSV export

### Visual Requirements
- ✅ Dark mode support throughout
- ✅ Responsive design (ResponsiveContainer)
- ✅ Charts render correctly with Recharts

### Code Quality
- ✅ TypeScript strict mode (no compilation errors)
- ✅ No console errors
- ✅ Reuses existing UI components (Button, Card, Icon)
- ✅ Consistent code style
- ✅ Clear prop interfaces

---

## 🧪 Testing Recommendations

1. **Test with Empty Data**: Ensure empty states display correctly
2. **Test with Large Datasets**: Verify charts handle 100+ items
3. **Test Filters**: Ensure all filters work correctly
4. **Test CSV Export**: Verify CSV downloads with correct data
5. **Test Dark Mode**: Toggle dark mode and verify styling
6. **Test Responsive**: View on mobile, tablet, desktop
7. **Test Chart Interactions**: Hover tooltips, click legend items

---

## 🎉 Success Metrics

**Before**: 2 analytics components (PowerBIDashboard, ReportExport)

**After**: 6 analytics components (4 new + 2 existing)

**Impact**: Complete analytics suite enabling users to visualize campaign performance, regional distribution, team workload, and venue usage without relying solely on external Power BI dashboards.

---

**Built on**: 2025-11-22
**Agent**: Agent 9 - Analytics Components
**Dependencies**: Recharts, date-fns, existing UI components
