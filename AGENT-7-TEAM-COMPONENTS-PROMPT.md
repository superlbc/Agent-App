# Agent 7: People & Team Management Components

**Priority**: HIGH
**Estimated Time**: 4-5 days
**Agent Type**: @agent-feature-developer
**Model**: Sonnet
**Dependencies**: Agent 6 (Navigation) complete

---

## 🎯 Objective

Build the complete People & Team Management system for UXP, enabling event staff assignment, availability tracking, and travel planning for field marketing teams.

---

## 📋 Requirements (from UXP-MIGRATION-MASTER-PLAN.md lines 968-1021)

Implement four core components for managing people assignments to events:

1. **AssignmentManager.tsx** - Assign people to events with roles
2. **AvailabilityCalendar.tsx** - View team member calendars and conflicts
3. **TravelPlanner.tsx** - Calculate distances and coordinate travel
4. **AssignmentContext.tsx** - State management for assignments
5. **distanceService.ts** - Distance/time calculations from office

---

## 📊 Data Model

**Already Defined** in `/home/user/UXP/types.ts` (lines ~465-492):

```typescript
export interface PeopleAssignment {
  id: string;
  eventId: string;             // FK to Event

  // User Identity
  userId: string;              // Azure AD User ID
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userRole: string;            // e.g., "Field Manager", "Brand Ambassador"

  // On-site Status
  onSite: boolean;             // Will this person be physically on-site?

  // Travel Planning
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;

  // Manager Info
  managerName?: string;
  managerEmail?: string;
  managerRole?: string;

  // Assignment Metadata
  assignedByName?: string;
  assignedByEmail?: string;
  assignedOn: Date;
}
```

**Role Options**:
- Field Manager
- Brand Ambassador
- Event Lead
- Setup Crew
- Logistics Coordinator
- Client Liaison
- Safety Officer

---

## 🏗️ Component Specifications

### Component 1: AssignmentManager.tsx

**Location**: `/home/user/UXP/components/team/AssignmentManager.tsx`

**Features**:
- **Two View Modes**:
  - By Event: Show all people assigned to each event
  - By Person: Show all events each person is assigned to
- **Assign People to Events**:
  - Search Azure AD users
  - Select role
  - Toggle on-site status
  - Assign manager
- **Bulk Assignment**:
  - Select multiple events
  - Assign same person to all
- **Filters**:
  - By date range
  - By event
  - By person
  - By role
  - By on-site status
- **Actions**:
  - Add assignment
  - Edit assignment (change role, on-site status)
  - Remove assignment
  - Bulk remove

**UI Structure**:
```
┌─────────────────────────────────────────────┐
│ Assignment Manager                    [+Add]│
├─────────────────────────────────────────────┤
│ View: [By Event ▼] [By Person]             │
│ Filters: Event [___] Person [___] Role [___]│
├─────────────────────────────────────────────┤
│                                             │
│ BY EVENT VIEW:                              │
│ ┌─────────────────────────────────────┐   │
│ │ Event: Verizon NFL Kickoff          │   │
│ │ Date: 2025-09-10                    │   │
│ │ ─────────────────────────────────── │   │
│ │ 👤 John Doe (Field Manager) ✅       │   │
│ │ 👤 Jane Smith (Brand Ambassador) ✅  │   │
│ │ 👤 Mike Johnson (Setup Crew) ❌      │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ BY PERSON VIEW:                             │
│ ┌─────────────────────────────────────┐   │
│ │ 👤 John Doe                          │   │
│ │ Department: Field Operations        │   │
│ │ ─────────────────────────────────── │   │
│ │ • Verizon NFL Kickoff (Sep 10)      │   │
│ │ • AMEX US Open (Sep 15)             │   │
│ │ • Coca-Cola Sampling (Sep 20)       │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface AssignmentManagerProps {
  events: Event[];
  assignments: PeopleAssignment[];
  onCreateAssignment: (assignment: Omit<PeopleAssignment, 'id' | 'assignedOn'>) => Promise<void>;
  onUpdateAssignment: (assignmentId: string, updates: Partial<PeopleAssignment>) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  currentUser: { name: string; email: string };
}
```

**Key Sub-Components**:
- `AssignmentFormModal` - Add/edit assignment
- `EventAssignmentCard` - Show event with assigned people
- `PersonAssignmentCard` - Show person with assigned events
- `BulkAssignmentModal` - Assign one person to multiple events

**Integration Points**:
- Use `graphService.ts` to search Azure AD users
- Use `departmentService.ts` for department lookup
- Use `distanceService.ts` to calculate travel distances (create this service)

---

### Component 2: AvailabilityCalendar.tsx

**Location**: `/home/user/UXP/components/team/AvailabilityCalendar.tsx`

**Features**:
- **Calendar View** (month/week view):
  - Show all events on calendar
  - Color-code by assignment status (available, assigned, conflict)
- **Person Filter**:
  - Select one or multiple people
  - See their availability across dates
- **Conflict Detection**:
  - Highlight if person is assigned to overlapping events
  - Show warning icon on calendar
- **Department Filter**:
  - Filter people by department (Field Ops, Creative, etc.)
- **Role Filter**:
  - Filter by role (Field Manager, Brand Ambassador, etc.)

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Team Availability Calendar                        │
├───────────────────────────────────────────────────┤
│ People: [John Doe ▼] [Jane Smith ▼]              │
│ Department: [All ▼] Role: [All ▼]                │
├───────────────────────────────────────────────────┤
│                 September 2025                    │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐    │
│ │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │    │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤    │
│ │  1  │  2  │  3  │  4  │  5  │  6  │  7  │    │
│ │     │     │     │     │     │     │     │    │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤    │
│ │  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │    │
│ │     │     │ 🟢  │     │ 🔴  │ 🟡  │     │    │
│ │     │     │ NFL │     │AMEX │BOTH │     │    │
│ │     │     │John │     │Jane │⚠️   │     │    │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘    │
│                                                   │
│ Legend: 🟢 Available  🔴 Assigned  🟡 Conflict   │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface AvailabilityCalendarProps {
  events: Event[];
  assignments: PeopleAssignment[];
  people: { id: string; name: string; email: string; department?: string }[];
  onEventClick: (eventId: string) => void;
  onDateClick: (date: Date) => void;
}
```

**Calendar Library**:
- Use `react-big-calendar` (already used in EventCalendar.tsx)
- Reuse calendar styling and configuration

**Conflict Detection Logic**:
```typescript
function detectConflicts(assignments: PeopleAssignment[], events: Event[]): string[] {
  const conflictIds: string[] = [];

  // Group assignments by person
  const byPerson = groupBy(assignments, 'userId');

  // For each person, check for overlapping events
  Object.entries(byPerson).forEach(([userId, personAssignments]) => {
    const sortedEvents = personAssignments
      .map(a => events.find(e => e.id === a.eventId))
      .filter(Boolean)
      .sort((a, b) => a.eventStartDate.getTime() - b.eventStartDate.getTime());

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];

      // Check if events overlap
      if (current.eventEndDate >= next.eventStartDate) {
        conflictIds.push(personAssignments[i].id, personAssignments[i + 1].id);
      }
    }
  });

  return conflictIds;
}
```

---

### Component 3: TravelPlanner.tsx

**Location**: `/home/user/UXP/components/team/TravelPlanner.tsx`

**Features**:
- **Calculate Travel Distances**:
  - For each assignment, show distance from office to event venue
  - Show estimated drive time
  - Group by proximity for carpool planning
- **Export Travel Manifest**:
  - CSV export with all assignments
  - Include: Person, Event, Venue, Distance, Time, Role
- **Map View**:
  - Show office location + all event venues
  - Show person's home office (if multi-office company)
  - Draw lines from office to venues
- **Carpool Grouping**:
  - Group people by proximity to venues
  - Suggest carpools for events in same area

**UI Structure**:
```
┌───────────────────────────────────────────────────┐
│ Travel Planner                          [Export] │
├───────────────────────────────────────────────────┤
│ Office: [New York HQ ▼]                          │
│ Date Range: [Sep 1] to [Sep 30]                  │
├───────────────────────────────────────────────────┤
│                                                   │
│ ┌───────────────────────────────────────────┐   │
│ │ Event: Verizon NFL Kickoff                │   │
│ │ Venue: MetLife Stadium, NJ                │   │
│ │ ──────────────────────────────────────────│   │
│ │ 👤 John Doe                                │   │
│ │    📍 15.2 mi • 25 mins from NY HQ         │   │
│ │ 👤 Jane Smith                              │   │
│ │    📍 14.8 mi • 23 mins from NY HQ         │   │
│ │ 💡 Carpool suggestion: Same area           │   │
│ └───────────────────────────────────────────┘   │
│                                                   │
│ ┌───────────────────────────────────────────┐   │
│ │ Event: AMEX US Open                        │   │
│ │ Venue: Arthur Ashe Stadium, Queens, NY    │   │
│ │ ──────────────────────────────────────────│   │
│ │ 👤 Jane Smith                              │   │
│ │    📍 8.5 mi • 18 mins from NY HQ          │   │
│ │ 👤 Mike Johnson                            │   │
│ │    📍 9.2 mi • 20 mins from NY HQ          │   │
│ │ 💡 Carpool suggestion: Same area           │   │
│ └───────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface TravelPlannerProps {
  events: Event[];
  assignments: PeopleAssignment[];
  venues: Venue[];
  officeLocations: { id: string; name: string; lat: number; lng: number }[];
  onExport: () => void;
}
```

**Export CSV Format**:
```csv
Event Name,Event Date,Venue,Person,Role,Distance (mi),Time (mins),Carpool Group
Verizon NFL Kickoff,2025-09-10,MetLife Stadium,John Doe,Field Manager,15.2,25,Group A
Verizon NFL Kickoff,2025-09-10,MetLife Stadium,Jane Smith,Brand Ambassador,14.8,23,Group A
AMEX US Open,2025-09-15,Arthur Ashe Stadium,Jane Smith,Brand Ambassador,8.5,18,Group B
```

---

### Component 4: AssignmentContext.tsx

**Location**: `/home/user/UXP/contexts/AssignmentContext.tsx`

**Purpose**: State management for assignments

**Features**:
- Store all assignments in context
- CRUD operations (create, update, delete)
- Conflict detection
- Filter/search helpers

**Context Interface**:
```typescript
interface AssignmentContextValue {
  // Data
  assignments: PeopleAssignment[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createAssignment: (assignment: Omit<PeopleAssignment, 'id' | 'assignedOn'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<PeopleAssignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  bulkDeleteAssignments: (ids: string[]) => Promise<void>;

  // Queries
  getAssignmentsByEvent: (eventId: string) => PeopleAssignment[];
  getAssignmentsByPerson: (userId: string) => PeopleAssignment[];
  detectConflicts: () => string[]; // Returns conflicting assignment IDs

  // Filters
  filterAssignments: (filters: {
    eventId?: string;
    userId?: string;
    role?: string;
    onSite?: boolean;
    dateRange?: { start: Date; end: Date };
  }) => PeopleAssignment[];
}
```

**Implementation Pattern** (similar to CampaignContext.tsx):
```typescript
export const AssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<PeopleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRUD operations
  const createAssignment = async (assignment: Omit<PeopleAssignment, 'id' | 'assignedOn'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      const newAssignment = await response.json();
      setAssignments([...assignments, newAssignment]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... other CRUD operations

  // Helper functions
  const getAssignmentsByEvent = (eventId: string) => {
    return assignments.filter(a => a.eventId === eventId);
  };

  const detectConflicts = () => {
    // Implementation from AvailabilityCalendar conflict detection
  };

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        loading,
        error,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        bulkDeleteAssignments,
        getAssignmentsByEvent,
        getAssignmentsByPerson,
        detectConflicts,
        filterAssignments,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
};
```

---

### Service 1: distanceService.ts

**Location**: `/home/user/UXP/services/distanceService.ts`

**Purpose**: Calculate distance and time from office to event venue

**Features**:
- Google Distance Matrix API integration
- Caching to avoid repeated API calls
- Fallback to straight-line distance if API unavailable

**API Integration**:
```typescript
interface DistanceResult {
  distanceMi: number;
  distanceKm: number;
  durationMins: number;
  status: 'success' | 'error';
}

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> {
  try {
    // Use Google Distance Matrix API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origin.lat},${origin.lng}&` +
      `destinations=${destination.lat},${destination.lng}&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    const element = data.rows[0]?.elements[0];
    if (element?.status === 'OK') {
      return {
        distanceMi: element.distance.value / 1609.34, // meters to miles
        distanceKm: element.distance.value / 1000, // meters to km
        durationMins: Math.round(element.duration.value / 60), // seconds to minutes
        status: 'success',
      };
    }

    // Fallback to straight-line distance
    return calculateStraightLineDistance(origin, destination);
  } catch (error) {
    console.error('Distance API error:', error);
    return calculateStraightLineDistance(origin, destination);
  }
}

function calculateStraightLineDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): DistanceResult {
  // Haversine formula for straight-line distance
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(destination.lat - origin.lat);
  const dLon = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) *
    Math.cos(toRadians(destination.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMi = R * c;

  return {
    distanceMi,
    distanceKm: distanceMi * 1.60934,
    durationMins: Math.round((distanceMi / 60) * 60), // Estimate: 60mph avg speed
    status: 'success',
  };
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Caching to avoid repeated API calls
const distanceCache = new Map<string, DistanceResult>();

export async function calculateDistanceWithCache(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> {
  const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;

  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const result = await calculateDistance(origin, destination);
  distanceCache.set(cacheKey, result);
  return result;
}
```

---

## 🔗 Integration Points

### Azure AD Integration (User Search)

Use existing `graphService.ts` to search for users:

```typescript
import { searchUsers } from '../services/graphService';

// In AssignmentFormModal:
const [userSearchResults, setUserSearchResults] = useState<GraphUser[]>([]);

const handleUserSearch = async (query: string) => {
  if (query.length < 2) return;
  const results = await searchUsers(query);
  setUserSearchResults(results);
};
```

### Department Service Integration

Use existing `departmentService.ts` to get user department:

```typescript
import { getDepartmentForUser } from '../services/departmentService';

const userDepartment = getDepartmentForUser(userEmail);
```

### Backend API Integration

**Already exists**: `/home/user/UXP/backend/routes/assignmentRoutes.js` (3 endpoints)

Expected endpoints:
- `GET /api/assignments` - Get all assignments (with filters)
- `POST /api/assignments` - Create assignment
- `DELETE /api/assignments/:id` - Delete assignment

---

## ✅ Acceptance Criteria

### Functional Requirements

1. **AssignmentManager Component** ✅
   - Can assign people to events
   - Can switch between "By Event" and "By Person" views
   - Can filter by event, person, role
   - Can bulk assign one person to multiple events
   - Azure AD user search works

2. **AvailabilityCalendar Component** ✅
   - Calendar displays events
   - Can filter by person and department
   - Conflict detection highlights overlapping assignments
   - Calendar is interactive (click event to view details)

3. **TravelPlanner Component** ✅
   - Displays distances and times for all assignments
   - Can export travel manifest as CSV
   - Suggests carpools for nearby events
   - Map view shows office and event locations (optional for MVP)

4. **AssignmentContext** ✅
   - CRUD operations work
   - Conflict detection works
   - Filter helpers work
   - Integrates with backend API

5. **distanceService.ts** ✅
   - Calculates distance using Google Distance Matrix API
   - Falls back to straight-line distance if API fails
   - Caches results to avoid repeated calls

### Visual Requirements

6. **Dark Mode Support** ✅
7. **Responsive Design** ✅
8. **Accessibility** ✅ (ARIA labels, keyboard navigation)

### Code Quality

9. **TypeScript Strict Mode** ✅
10. **No Console Errors** ✅
11. **Reuses Existing UI Components** ✅ (Button, Card, Input, Select, Icon)

---

## 📁 Deliverables

Create these files:

| File | Lines | Description |
|------|-------|-------------|
| `components/team/AssignmentManager.tsx` | ~600 | Main assignment management UI |
| `components/team/AvailabilityCalendar.tsx` | ~400 | Calendar view with conflicts |
| `components/team/TravelPlanner.tsx` | ~500 | Distance calculations and export |
| `contexts/AssignmentContext.tsx` | ~200 | State management |
| `services/distanceService.ts` | ~150 | Distance/time calculations |

**Total**: ~1,850 lines of code

---

## 🧪 Testing Checklist

- [ ] AssignmentManager loads and displays events/people
- [ ] Can create new assignment via modal
- [ ] Can edit existing assignment
- [ ] Can delete assignment
- [ ] Can bulk assign to multiple events
- [ ] View toggle (By Event / By Person) works
- [ ] Filters work correctly
- [ ] AvailabilityCalendar displays correctly
- [ ] Conflict detection highlights overlaps
- [ ] TravelPlanner calculates distances
- [ ] CSV export downloads correctly
- [ ] Carpool suggestions group nearby events
- [ ] distanceService caching works
- [ ] Dark mode works in all components
- [ ] TypeScript compiles without errors
- [ ] No console errors

---

## 🔧 Environment Variables

Add to `.env.local`:

```env
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

**Note**: Google Maps API requires billing enabled. For MVP, can use fallback straight-line distance only.

---

## 📚 Libraries to Install

```bash
npm install react-big-calendar
npm install @types/react-big-calendar --save-dev
```

Already installed (reuse from EventCalendar):
- moment (for date handling)
- date-fns (alternative to moment)

---

## 🎯 Success Metrics

**Before**: No team assignment functionality, manual spreadsheet tracking

**After**: Complete team assignment system with availability, conflicts, and travel planning

**Impact**: Field operations teams can efficiently assign staff, detect scheduling conflicts, and plan travel logistics

---

**AGENT: START HERE** 🚀

Build the complete People & Team Management system with all 4 components and 1 service.

**Estimated Time**: 4-5 days
**Difficulty**: Medium-High (complex UI, external API integration)
**Dependencies**: Navigation component updated (Agent 6 complete)
