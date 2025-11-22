// ============================================================================
// BRANDSCOPIC SERVICE
// ============================================================================
// Integration with Brandscopic field marketing platform for event sync

import { Campaign, Event } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BrandscopicConfig {
  apiKey: string;
  baseUrl: string;
  tenantId?: string;
  useMockData?: boolean; // For MVP testing without real API
}

export interface BrandscopicProject {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  events: BrandscopicEvent[];
  externalId?: string; // UXP Campaign ID
  createdAt: string;
  updatedAt: string;
}

export interface BrandscopicEvent {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  date: string;
  endDate?: string;
  location: {
    venueName?: string;
    address?: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  teamMembers?: string[];
  externalId?: string; // UXP Event ID
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
  syncedItems: Array<{
    id: string;
    name: string;
    brandscopicId?: string;
  }>;
}

export interface BrandscopicEventStatus {
  eventId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  lastUpdated: string;
  teamSize?: number;
  checkIns?: number;
}

// ============================================================================
// BRANDSCOPIC CLIENT
// ============================================================================

class BrandscopicClient {
  private config: BrandscopicConfig;
  private useMock: boolean;

  constructor(config: BrandscopicConfig) {
    this.config = config;
    this.useMock = config.useMockData || !config.apiKey || config.apiKey === 'your-brandscopic-api-key';
  }

  /**
   * Make API request to Brandscopic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useMock) {
      console.log('[BrandscopicService] Using mock data for:', endpoint);
      return this.getMockResponse<T>(endpoint, options);
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.config.tenantId && { 'X-Tenant-ID': this.config.tenantId }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'Brandscopic API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('[BrandscopicService] API Error:', error);
      throw error;
    }
  }

  /**
   * Mock response generator for MVP testing
   */
  private getMockResponse<T>(endpoint: string, options: RequestInit): T {
    const method = options.method || 'GET';

    // Mock project creation
    if (endpoint.includes('/projects') && method === 'POST') {
      return {
        id: `bs_proj_${Date.now()}`,
        name: 'Mock Project',
        status: 'active',
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as T;
    }

    // Mock event creation
    if (endpoint.includes('/events') && method === 'POST') {
      return {
        id: `bs_event_${Date.now()}`,
        name: 'Mock Event',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as T;
    }

    // Mock event status
    if (endpoint.includes('/events/') && endpoint.includes('/status')) {
      return {
        eventId: endpoint.split('/')[2],
        status: 'active',
        lastUpdated: new Date().toISOString(),
        teamSize: 5,
        checkIns: 3,
      } as T;
    }

    // Default mock response
    return { success: true } as T;
  }

  /**
   * Create Brandscopic project from UXP campaign
   */
  async createProject(campaign: Campaign): Promise<BrandscopicProject> {
    const projectData = {
      name: campaign.campaignName,
      description: campaign.campaignDescription,
      startDate: new Date(campaign.year, campaign.month - 1, 1).toISOString(),
      endDate: new Date(campaign.year, campaign.month, 0).toISOString(),
      externalId: campaign.id,
      status: campaign.status === 'active' ? 'active' : 'draft',
    };

    return this.request<BrandscopicProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  /**
   * Sync single event to Brandscopic
   */
  async syncEvent(event: Event, projectId: string): Promise<BrandscopicEvent> {
    const eventData = {
      projectId,
      name: event.eventName,
      description: event.eventDetails,
      date: event.eventStartDate.toISOString(),
      endDate: event.eventEndDate.toISOString(),
      location: {
        venueName: event.eventVenue,
        address: event.address1,
        city: event.city,
        country: event.country,
        latitude: event.latitude,
        longitude: event.longitude,
      },
      status: event.status,
      externalId: event.id,
    };

    return this.request<BrandscopicEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  /**
   * Get event status from Brandscopic
   */
  async getEventStatus(brandscopicEventId: string): Promise<BrandscopicEventStatus> {
    return this.request<BrandscopicEventStatus>(`/events/${brandscopicEventId}/status`);
  }

  /**
   * Bulk sync events to Brandscopic
   */
  async bulkSyncEvents(events: Event[], projectId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
      syncedItems: [],
    };

    for (const event of events) {
      try {
        const brandscopicEvent = await this.syncEvent(event, projectId);
        result.syncedCount++;
        result.syncedItems.push({
          id: event.id,
          name: event.eventName,
          brandscopicId: brandscopicEvent.id,
        });
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Failed to sync "${event.eventName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.failedCount === 0;
    return result;
  }

  /**
   * Test connection to Brandscopic API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.useMock) {
      return {
        success: true,
        message: 'Mock mode: Connection test simulated successfully',
      };
    }

    try {
      await this.request('/health');
      return {
        success: true,
        message: 'Connection to Brandscopic API successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

let brandscopicClient: BrandscopicClient | null = null;

/**
 * Initialize Brandscopic service with configuration
 */
export function initializeBrandscopicService(config: BrandscopicConfig): void {
  brandscopicClient = new BrandscopicClient(config);
}

/**
 * Get Brandscopic client instance
 */
function getClient(): BrandscopicClient {
  if (!brandscopicClient) {
    // Auto-initialize with environment variables if available
    const config: BrandscopicConfig = {
      apiKey: import.meta.env.VITE_BRANDSCOPIC_API_KEY || 'your-brandscopic-api-key',
      baseUrl: import.meta.env.VITE_BRANDSCOPIC_API_URL || 'https://api.brandscopic.com/v1',
      useMockData: true, // Default to mock for MVP
    };
    brandscopicClient = new BrandscopicClient(config);
  }
  return brandscopicClient;
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function createBrandscopicProject(campaign: Campaign): Promise<BrandscopicProject> {
  return getClient().createProject(campaign);
}

export async function syncEventToBrandscopic(event: Event, projectId: string): Promise<BrandscopicEvent> {
  return getClient().syncEvent(event, projectId);
}

export async function getBrandscopicEventStatus(brandscopicEventId: string): Promise<BrandscopicEventStatus> {
  return getClient().getEventStatus(brandscopicEventId);
}

export async function bulkSyncEventsToBrandscopic(events: Event[], projectId: string): Promise<SyncResult> {
  return getClient().bulkSyncEvents(events, projectId);
}

export async function testBrandscopicConnection(): Promise<{ success: boolean; message: string }> {
  return getClient().testConnection();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map UXP campaign status to Brandscopic project status
 */
export function mapCampaignStatus(uxpStatus: Campaign['status']): BrandscopicProject['status'] {
  const statusMap: Record<Campaign['status'], BrandscopicProject['status']> = {
    planning: 'draft',
    active: 'active',
    completed: 'completed',
    cancelled: 'archived',
  };
  return statusMap[uxpStatus] || 'draft';
}

/**
 * Map UXP event status to Brandscopic event status
 */
export function mapEventStatus(uxpStatus: Event['status']): BrandscopicEvent['status'] {
  const statusMap: Record<Event['status'], BrandscopicEvent['status']> = {
    planning: 'pending',
    active: 'active',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return statusMap[uxpStatus] || 'pending';
}
