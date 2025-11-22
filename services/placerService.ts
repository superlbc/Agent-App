// ============================================================================
// PLACER.AI SERVICE
// ============================================================================
// Integration with Placer.ai for footfall analytics and venue performance tracking

import { Venue } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PlacerConfig {
  apiKey: string;
  baseUrl: string;
  cacheTTL?: number; // Cache time-to-live in milliseconds (default: 1 hour)
  useMockData?: boolean;
}

export interface PlacerFootfallData {
  venueId: string;
  venueName: string;
  date: string;
  visits: number;
  uniqueVisitors: number;
  avgDwellTime: number; // in minutes
  peakHour?: string; // e.g., "14:00"
  trafficByHour?: { hour: string; visits: number }[];
}

export interface PlacerMovementData {
  venueId: string;
  date: string;
  timeOfDay: string; // e.g., "morning", "afternoon", "evening"
  trafficLevel: 'low' | 'medium' | 'high';
  peakHours: string[];
  averageVisitDuration: number; // minutes
}

export interface PlacerDemographics {
  venueId: string;
  date: string;
  ageGroups: {
    range: string; // e.g., "18-24", "25-34"
    percentage: number;
  }[];
  genderSplit?: {
    male: number;
    female: number;
    other: number;
  };
  visitFrequency?: {
    firstTime: number;
    occasional: number;
    regular: number;
  };
}

export interface PlacerAnalytics {
  footfall: PlacerFootfallData;
  movement: PlacerMovementData;
  demographics?: PlacerDemographics;
  lastUpdated: string;
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class PlacerCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number;

  constructor(ttlMs: number = 3600000) { // Default 1 hour
    this.ttl = ttlMs;
  }

  set<T>(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    return Date.now() <= entry.expiresAt;
  }

  getCacheAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    return Date.now() - entry.timestamp;
  }
}

// ============================================================================
// PLACER.AI CLIENT
// ============================================================================

class PlacerClient {
  private config: PlacerConfig;
  private cache: PlacerCache;
  private useMock: boolean;

  constructor(config: PlacerConfig) {
    this.config = config;
    this.cache = new PlacerCache(config.cacheTTL);
    this.useMock = config.useMockData || !config.apiKey || config.apiKey === 'your-placer-api-key';
  }

  /**
   * Make API request to Placer.ai
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useMock) {
      console.log('[PlacerService] Using mock data for:', endpoint);
      return this.getMockResponse<T>(endpoint);
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'Placer.ai API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('[PlacerService] API Error:', error);
      throw error;
    }
  }

  /**
   * Mock response generator for MVP testing
   */
  private getMockResponse<T>(endpoint: string): T {
    const venueId = endpoint.split('/')[2] || 'venue_001';
    const now = new Date();

    // Mock footfall data
    if (endpoint.includes('/footfall')) {
      return {
        venueId,
        venueName: 'MetLife Stadium',
        date: now.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 50000) + 10000,
        uniqueVisitors: Math.floor(Math.random() * 40000) + 8000,
        avgDwellTime: Math.floor(Math.random() * 120) + 60,
        peakHour: '14:00',
        trafficByHour: Array.from({ length: 24 }, (_, hour) => ({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          visits: Math.floor(Math.random() * 3000) + 500,
        })),
      } as T;
    }

    // Mock movement data
    if (endpoint.includes('/movement')) {
      return {
        venueId,
        date: now.toISOString().split('T')[0],
        timeOfDay: 'afternoon',
        trafficLevel: 'high',
        peakHours: ['12:00', '13:00', '14:00', '15:00'],
        averageVisitDuration: 180,
      } as T;
    }

    // Mock demographics
    if (endpoint.includes('/demographics')) {
      return {
        venueId,
        date: now.toISOString().split('T')[0],
        ageGroups: [
          { range: '18-24', percentage: 20 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 15 },
          { range: '55+', percentage: 5 },
        ],
        genderSplit: {
          male: 55,
          female: 43,
          other: 2,
        },
        visitFrequency: {
          firstTime: 40,
          occasional: 45,
          regular: 15,
        },
      } as T;
    }

    // Default mock
    return { success: true } as T;
  }

  /**
   * Get footfall data for a venue
   */
  async getFootfallData(venueId: string, date?: string): Promise<PlacerFootfallData> {
    const cacheKey = `footfall_${venueId}_${date || 'today'}`;

    // Check cache first
    const cached = this.cache.get<PlacerFootfallData>(cacheKey);
    if (cached) {
      console.log('[PlacerService] Using cached footfall data for:', venueId);
      return cached;
    }

    const dateParam = date || new Date().toISOString().split('T')[0];
    const endpoint = `/venues/${venueId}/footfall?date=${dateParam}`;

    const data = await this.request<PlacerFootfallData>(endpoint);
    this.cache.set(cacheKey, data);

    return data;
  }

  /**
   * Get movement patterns for a venue
   */
  async getMovementData(venueId: string, date?: string): Promise<PlacerMovementData> {
    const cacheKey = `movement_${venueId}_${date || 'today'}`;

    const cached = this.cache.get<PlacerMovementData>(cacheKey);
    if (cached) {
      console.log('[PlacerService] Using cached movement data for:', venueId);
      return cached;
    }

    const dateParam = date || new Date().toISOString().split('T')[0];
    const endpoint = `/venues/${venueId}/movement?date=${dateParam}`;

    const data = await this.request<PlacerMovementData>(endpoint);
    this.cache.set(cacheKey, data);

    return data;
  }

  /**
   * Get demographics for a venue
   */
  async getDemographics(venueId: string, date?: string): Promise<PlacerDemographics> {
    const cacheKey = `demographics_${venueId}_${date || 'today'}`;

    const cached = this.cache.get<PlacerDemographics>(cacheKey);
    if (cached) {
      console.log('[PlacerService] Using cached demographics for:', venueId);
      return cached;
    }

    const dateParam = date || new Date().toISOString().split('T')[0];
    const endpoint = `/venues/${venueId}/demographics?date=${dateParam}`;

    const data = await this.request<PlacerDemographics>(endpoint);
    this.cache.set(cacheKey, data);

    return data;
  }

  /**
   * Get complete analytics for a venue
   */
  async getVenueAnalytics(venueId: string, date?: string): Promise<PlacerAnalytics> {
    const [footfall, movement, demographics] = await Promise.all([
      this.getFootfallData(venueId, date),
      this.getMovementData(venueId, date),
      this.getDemographics(venueId, date),
    ]);

    return {
      footfall,
      movement,
      demographics,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Aggregate analytics across multiple venues
   */
  async getAggregateAnalytics(venueIds: string[], date?: string): Promise<{
    totalVisits: number;
    totalUniqueVisitors: number;
    avgDwellTime: number;
    venues: PlacerAnalytics[];
  }> {
    const venueAnalytics = await Promise.all(
      venueIds.map(id => this.getVenueAnalytics(id, date))
    );

    const totalVisits = venueAnalytics.reduce((sum, v) => sum + v.footfall.visits, 0);
    const totalUniqueVisitors = venueAnalytics.reduce((sum, v) => sum + v.footfall.uniqueVisitors, 0);
    const avgDwellTime = venueAnalytics.reduce((sum, v) => sum + v.footfall.avgDwellTime, 0) / venueAnalytics.length;

    return {
      totalVisits,
      totalUniqueVisitors,
      avgDwellTime,
      venues: venueAnalytics,
    };
  }

  /**
   * Test connection to Placer.ai API
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
        message: 'Connection to Placer.ai API successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

let placerClient: PlacerClient | null = null;

/**
 * Initialize Placer.ai service with configuration
 */
export function initializePlacerService(config: PlacerConfig): void {
  placerClient = new PlacerClient(config);
}

/**
 * Get Placer.ai client instance
 */
function getClient(): PlacerClient {
  if (!placerClient) {
    const config: PlacerConfig = {
      apiKey: import.meta.env.VITE_PLACER_API_KEY || 'your-placer-api-key',
      baseUrl: import.meta.env.VITE_PLACER_API_URL || 'https://api.placer.ai/v1',
      cacheTTL: 3600000, // 1 hour
      useMockData: true, // Default to mock for MVP
    };
    placerClient = new PlacerClient(config);
  }
  return placerClient;
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function getVenueFootfall(venueId: string, date?: string): Promise<PlacerFootfallData> {
  return getClient().getFootfallData(venueId, date);
}

export async function getVenueMovement(venueId: string, date?: string): Promise<PlacerMovementData> {
  return getClient().getMovementData(venueId, date);
}

export async function getVenueDemographics(venueId: string, date?: string): Promise<PlacerDemographics> {
  return getClient().getDemographics(venueId, date);
}

export async function getCompleteVenueAnalytics(venueId: string, date?: string): Promise<PlacerAnalytics> {
  return getClient().getVenueAnalytics(venueId, date);
}

export async function getMultiVenueAnalytics(venueIds: string[], date?: string) {
  return getClient().getAggregateAnalytics(venueIds, date);
}

export async function testPlacerConnection(): Promise<{ success: boolean; message: string }> {
  return getClient().testConnection();
}

export function clearPlacerCache(): void {
  getClient().clearCache();
}
