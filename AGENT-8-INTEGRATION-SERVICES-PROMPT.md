# Agent 8: Integration Services - Brandscopic, Placer.ai, Smartsheet, QRtiger

**Priority**: MEDIUM
**Estimated Time**: 3-4 days
**Agent Type**: @agent-feature-developer
**Model**: Sonnet
**Can Run in Parallel**: Yes (independent of other agents except Agent 6)

---

## 🎯 Objective

Complete the external system integration layer for UXP by building service modules for Brandscopic, Placer.ai, Smartsheet, and QRtiger APIs. These services enable field marketing data synchronization, footfall analytics, project tracking, and QR code management.

---

## 📋 Requirements (from UXP-MIGRATION-MASTER-PLAN.md lines 1080-1127)

Build 4 integration services and enhance the existing IntegrationDashboard component:

1. **brandscopicService.ts** - Brandscopic API integration for field marketing workflows
2. **placerService.ts** - Placer.ai API integration for footfall analytics
3. **smartsheetService.ts** - Smartsheet API integration for project tracking
4. **qrtigerService.ts** - QRtiger API integration for QR code generation/tracking
5. **Enhanced IntegrationDashboard** - Comprehensive integration status and management

---

## 🔗 Current State

**Already Built** (by previous agents):
- ✅ `components/integrations/IntegrationSettings.tsx` (19,604 bytes)
- ✅ `components/integrations/BrandscopicSyncStatus.tsx` (8,925 bytes)
- ✅ `components/integrations/QRCodeManager.tsx` (18,933 bytes)
- ✅ `components/integrations/SurveyLinkModal.tsx` (9,716 bytes)

**Missing** (this agent's task):
- ❌ Service layer files (4 services)
- ❌ Comprehensive IntegrationDashboard component
- ❌ Error handling and retry logic
- ❌ Mock data for MVP testing

---

## 🏗️ Service Specifications

### Service 1: brandscopicService.ts

**Location**: `/home/user/UXP/services/brandscopicService.ts`

**Purpose**: Sync event data with Brandscopic field marketing platform

**API Documentation** (if available):
- Base URL: `https://api.brandscopic.com/v1/`
- Authentication: API Key
- Endpoints: Projects, Events, Teams

**Features**:
- Sync event data to Brandscopic
- Fetch event status from Brandscopic
- Create Brandscopic projects from UXP campaigns
- Map UXP events to Brandscopic events
- Error handling and retry logic

**Interface**:
```typescript
export interface BrandscopicConfig {
  apiKey: string;
  baseUrl: string;
  tenantId?: string;
}

export interface BrandscopicProject {
  id: string;
  name: string;
  status: string;
  events: BrandscopicEvent[];
}

export interface BrandscopicEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'pending' | 'active' | 'completed';
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}
```

**Implementation**:
```typescript
import { Event, Campaign } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BRANDSCOPIC_BASE_URL = process.env.BRANDSCOPIC_API_URL || 'https://api.brandscopic.com/v1';
const BRANDSCOPIC_API_KEY = process.env.BRANDSCOPIC_API_KEY || '';

// ============================================================================
// API CLIENT
// ============================================================================

class BrandscopicClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: BrandscopicConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Brandscopic API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Brandscopic API request failed:`, error);
      throw error;
    }
  }

  // Create project in Brandscopic
  async createProject(campaign: Campaign): Promise<BrandscopicProject> {
    return this.request<BrandscopicProject>('/projects', 'POST', {
      name: campaign.campaignName,
      description: campaign.campaignDescription,
      client: campaign.client,
      region: campaign.region,
    });
  }

  // Sync event to Brandscopic
  async syncEvent(event: Event): Promise<BrandscopicEvent> {
    return this.request<BrandscopicEvent>('/events', 'POST', {
      projectId: event.campaignId,
      name: event.eventName,
      date: event.eventStartDate.toISOString(),
      location: `${event.city}, ${event.country}`,
      venue: event.eventVenue,
    });
  }

  // Get event status from Brandscopic
  async getEventStatus(brandscopicEventId: string): Promise<BrandscopicEvent> {
    return this.request<BrandscopicEvent>(`/events/${brandscopicEventId}`);
  }

  // Bulk sync events
  async bulkSyncEvents(events: Event[]): Promise<SyncResult> {
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        await this.syncEvent(event);
        syncedCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to sync event ${event.eventName}: ${error.message}`);
      }
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors,
    };
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

const client = new BrandscopicClient({
  apiKey: BRANDSCOPIC_API_KEY,
  baseUrl: BRANDSCOPIC_BASE_URL,
});

export const brandscopicService = {
  createProject: (campaign: Campaign) => client.createProject(campaign),
  syncEvent: (event: Event) => client.syncEvent(event),
  getEventStatus: (brandscopicEventId: string) => client.getEventStatus(brandscopicEventId),
  bulkSyncEvents: (events: Event[]) => client.bulkSyncEvents(events),
};

// ============================================================================
// MOCK DATA (for MVP testing when API not available)
// ============================================================================

export const mockBrandscopicService = {
  createProject: async (campaign: Campaign): Promise<BrandscopicProject> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return {
      id: `bs-proj-${Date.now()}`,
      name: campaign.campaignName,
      status: 'active',
      events: [],
    };
  },

  syncEvent: async (event: Event): Promise<BrandscopicEvent> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: `bs-event-${Date.now()}`,
      name: event.eventName,
      date: event.eventStartDate.toISOString(),
      location: `${event.city}, ${event.country}`,
      status: 'pending',
    };
  },

  getEventStatus: async (brandscopicEventId: string): Promise<BrandscopicEvent> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: brandscopicEventId,
      name: 'Sample Event',
      date: new Date().toISOString(),
      location: 'New York, USA',
      status: 'active',
    };
  },

  bulkSyncEvents: async (events: Event[]): Promise<SyncResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      syncedCount: events.length,
      failedCount: 0,
      errors: [],
    };
  },
};
```

---

### Service 2: placerService.ts

**Location**: `/home/user/UXP/services/placerService.ts`

**Purpose**: Fetch footfall analytics from Placer.ai for venue performance tracking

**API Documentation**:
- Base URL: `https://api.placer.ai/v1/`
- Authentication: API Key
- Endpoints: Venues, Footfall, Movement

**Features**:
- Fetch footfall data for venues
- Get movement patterns
- Aggregate analytics across multiple venues
- Cache results to minimize API calls

**Interface**:
```typescript
export interface PlacerFootfallData {
  venueId: string;
  date: string;
  visits: number;
  uniqueVisitors: number;
  avgDwellTime: number; // in minutes
}

export interface PlacerMovementData {
  venueId: string;
  timeOfDay: string;
  trafficLevel: 'low' | 'medium' | 'high';
  peakHours: string[];
}
```

**Implementation**:
```typescript
import { Venue } from '../types';

const PLACER_BASE_URL = process.env.PLACER_API_URL || 'https://api.placer.ai/v1';
const PLACER_API_KEY = process.env.PLACER_API_KEY || '';

class PlacerClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, any>;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  private async request<T>(endpoint: string): Promise<T> {
    // Check cache first
    const cacheKey = `${endpoint}`;
    if (this.cache.has(cacheKey)) {
      console.log(`[PlacerService] Cache hit: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

      if (!response.ok) {
        throw new Error(`Placer.ai API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache for 1 hour
      this.cache.set(cacheKey, data);
      setTimeout(() => this.cache.delete(cacheKey), 3600000);

      return data;
    } catch (error) {
      console.error(`Placer.ai API request failed:`, error);
      throw error;
    }
  }

  async getFootfallData(venueId: string, dateRange: { start: Date; end: Date }): Promise<PlacerFootfallData[]> {
    return this.request(`/venues/${venueId}/footfall?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`);
  }

  async getMovementData(venueId: string): Promise<PlacerMovementData> {
    return this.request(`/venues/${venueId}/movement`);
  }
}

const client = new PlacerClient(PLACER_API_KEY, PLACER_BASE_URL);

export const placerService = {
  getFootfallData: (venueId: string, dateRange: { start: Date; end: Date }) =>
    client.getFootfallData(venueId, dateRange),
  getMovementData: (venueId: string) => client.getMovementData(venueId),
};

// Mock data for MVP
export const mockPlacerService = {
  getFootfallData: async (venueId: string, dateRange: { start: Date; end: Date }): Promise<PlacerFootfallData[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => ({
      venueId,
      date: new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      visits: Math.floor(Math.random() * 1000) + 500,
      uniqueVisitors: Math.floor(Math.random() * 800) + 400,
      avgDwellTime: Math.floor(Math.random() * 60) + 30,
    }));
  },

  getMovementData: async (venueId: string): Promise<PlacerMovementData> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      venueId,
      timeOfDay: 'afternoon',
      trafficLevel: 'high',
      peakHours: ['12:00 PM', '1:00 PM', '5:00 PM', '6:00 PM'],
    };
  },
};
```

---

### Service 3: smartsheetService.ts

**Location**: `/home/user/UXP/services/smartsheetService.ts`

**Purpose**: Create and update Smartsheet trackers for campaign/event tracking

**Implementation**: Similar pattern to brandscopicService.ts

```typescript
// Create Smartsheet from template
async createSheet(campaign: Campaign): Promise<SmartsheetSheet>

// Update event data in Smartsheet
async updateEventRow(sheetId: string, eventId: string, data: Partial<Event>): Promise<void>

// Fetch all data from sheet
async getSheetData(sheetId: string): Promise<SmartsheetRow[]>
```

---

### Service 4: qrtigerService.ts

**Location**: `/home/user/UXP/services/qrtigerService.ts`

**Purpose**: Generate QR codes and track scan statistics via QRtiger API

**Implementation**: Similar pattern to brandscopicService.ts

```typescript
// Generate QR code for event
async generateQRCode(eventId: string, qrData: string): Promise<QRTigerCode>

// Get scan statistics
async getScanStats(qrCodeId: string): Promise<QRTigerStats>

// Update QR code (pause/resume/archive)
async updateQRCode(qrCodeId: string, status: 'active' | 'paused' | 'archived'): Promise<void>
```

---

## 🎨 Enhanced Integration Dashboard

**Location**: `/home/user/UXP/components/integrations/IntegrationDashboard.tsx`

**Purpose**: Unified dashboard showing all integration statuses

**Features**:
- **Integration Status Cards**:
  - Brandscopic: Connected, Last Sync, Event Count
  - Placer.ai: Connected, Data Available, Last Updated
  - Smartsheet: Connected, Sheet Count, Last Sync
  - QRtiger: Connected, Active QR Codes, Total Scans
- **Manual Sync Triggers**:
  - Button to manually trigger sync for each integration
  - Loading states during sync
  - Success/error toasts
- **Error Logs**:
  - Show last 10 errors per integration
  - Timestamp, error message, affected entity
- **API Configuration**:
  - API key entry/update (masked)
  - Base URL configuration
  - Test connection button

**UI Structure**:
```
┌──────────────────────────────────────────────────┐
│ Integration Dashboard                     [Test]│
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────┐ ┌────────────────┐          │
│ │ 🔗 Brandscopic │ │ 📊 Placer.ai   │          │
│ │ ✅ Connected   │ │ ✅ Connected   │          │
│ │ Last: 2m ago   │ │ Last: 15m ago  │          │
│ │ Events: 47     │ │ Venues: 23     │          │
│ │ [Sync Now]     │ │ [Refresh Data] │          │
│ └────────────────┘ └────────────────┘          │
│                                                  │
│ ┌────────────────┐ ┌────────────────┐          │
│ │ 📋 Smartsheet  │ │ 📱 QRtiger     │          │
│ │ ✅ Connected   │ │ ⚠️  API Key    │          │
│ │ Sheets: 12     │ │    Missing     │          │
│ │ Last: 1h ago   │ │ QR Codes: 0    │          │
│ │ [Sync Now]     │ │ [Configure]    │          │
│ └────────────────┘ └────────────────┘          │
│                                                  │
│ Recent Activity                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ ✅ Brandscopic: Synced 5 events (2m ago)  │ │
│ │ ✅ Placer.ai: Fetched footfall (15m ago)  │ │
│ │ ❌ Smartsheet: Failed to sync (1h ago)    │ │
│ │    Error: API rate limit exceeded          │ │
│ └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Props Interface**:
```typescript
interface IntegrationDashboardProps {
  onSyncBrandscopic: () => Promise<void>;
  onSyncPlacer: () => Promise<void>;
  onSyncSmartsheet: () => Promise<void>;
  onRefreshQRStats: () => Promise<void>;
  onTestConnection: (integration: string) => Promise<boolean>;
}
```

---

## ✅ Acceptance Criteria

### Service Layer

1. **brandscopicService.ts** ✅
   - Can create projects from campaigns
   - Can sync events to Brandscopic
   - Can fetch event status
   - Error handling and retry logic works
   - Mock service works without API

2. **placerService.ts** ✅
   - Can fetch footfall data for venues
   - Can fetch movement patterns
   - Caching works (1-hour TTL)
   - Mock service provides realistic test data

3. **smartsheetService.ts** ✅
   - Can create sheets from templates
   - Can update event rows
   - Can fetch sheet data
   - Mock service works

4. **qrtigerService.ts** ✅
   - Can generate QR codes
   - Can fetch scan statistics
   - Can update QR code status
   - Mock service works

### Integration Dashboard

5. **IntegrationDashboard Component** ✅
   - Displays status for all 4 integrations
   - Shows last sync time
   - Manual sync buttons work
   - Error logs display correctly
   - API configuration UI works
   - Test connection works

### Code Quality

6. **TypeScript Strict Mode** ✅
7. **Error Handling** ✅ (try/catch, retry logic)
8. **Caching** ✅ (Placer.ai has 1-hour cache)
9. **Mock Data** ✅ (All services have mock implementations)

---

## 📁 Deliverables

| File | Lines | Description |
|------|-------|-------------|
| `services/brandscopicService.ts` | ~300 | Brandscopic API client |
| `services/placerService.ts` | ~250 | Placer.ai API client |
| `services/smartsheetService.ts` | ~300 | Smartsheet API client |
| `services/qrtigerService.ts` | ~250 | QRtiger API client |
| `components/integrations/IntegrationDashboard.tsx` | ~500 | Unified dashboard |

**Total**: ~1,600 lines of code

---

## 🔧 Environment Variables

Add to `.env.local`:

```env
# Brandscopic
BRANDSCOPIC_API_URL=https://api.brandscopic.com/v1
BRANDSCOPIC_API_KEY=your-brandscopic-api-key

# Placer.ai
PLACER_API_URL=https://api.placer.ai/v1
PLACER_API_KEY=your-placer-api-key

# Smartsheet
SMARTSHEET_API_URL=https://api.smartsheet.com/2.0
SMARTSHEET_ACCESS_TOKEN=your-smartsheet-token

# QRtiger
QRTIGER_API_URL=https://api.qrtiger.com/v1
QRTIGER_API_KEY=your-qrtiger-api-key
```

---

## 🧪 Testing Strategy

### Unit Tests

For each service:
- Test successful API calls
- Test error handling
- Test retry logic
- Test caching (Placer.ai)
- Test mock implementations

### Integration Tests

- Test IntegrationDashboard with all 4 services
- Test manual sync triggers
- Test error log display
- Test API configuration updates

### Manual Testing

- [ ] Brandscopic sync works end-to-end
- [ ] Placer.ai data fetches correctly
- [ ] Smartsheet creates sheets
- [ ] QRtiger generates QR codes
- [ ] IntegrationDashboard displays all statuses
- [ ] Manual sync buttons trigger actions
- [ ] Error logs populate on failures
- [ ] Mock services work without API keys

---

## 🎯 Success Metrics

**Before**: Integration components exist but no service layer, can't actually sync data

**After**: Complete integration layer with 4 working services, unified dashboard, mock implementations for testing

**Impact**: UXP can sync with external systems for field marketing workflows, footfall analytics, project tracking, and QR code management

---

**AGENT: START HERE** 🚀

Build all 4 integration services and enhance the IntegrationDashboard component.

**Estimated Time**: 3-4 days
**Difficulty**: Medium (external API integration, error handling, caching)
**Can Run in Parallel**: Yes
