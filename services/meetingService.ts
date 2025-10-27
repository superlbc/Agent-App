/**
 * MeetingService - High-level orchestrator for meeting selection feature
 *
 * This service coordinates between GraphService and TranscriptService
 * to provide a simple API for UI components.
 *
 * Main responsibilities:
 * - Pre-load calendar data
 * - Cache management
 * - Coordinate transcript search
 * - Provide enriched meeting data to UI
 */

import { GraphService, Meeting, MeetingDetails, Attendee } from './graphService';
import { TranscriptService, TranscriptSearchResult } from './transcriptService';

export interface MeetingWithTranscript extends MeetingDetails {
  transcript?: {
    available: boolean;
    content?: string;
    source?: string;
    error?: string;
  };
}

export interface CacheEntry {
  meetings: Meeting[];
  timestamp: number;
  userId: string;
  version: number; // Cache version to invalidate when range changes
}

export class MeetingService {
  private graphService: GraphService;
  private transcriptService: TranscriptService;

  private static readonly CACHE_KEY = 'momo_meetings_cache_v2';
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private static readonly CACHE_VERSION = 2; // Increment when changing date range logic

  constructor() {
    this.graphService = new GraphService();
    this.transcriptService = new TranscriptService(this.graphService);
  }

  /**
   * Pre-load calendar data for the current user
   * Call this after successful authentication
   */
  async preloadCalendar(): Promise<void> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28); // Last 4 weeks

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28); // Next 4 weeks

    try {
      const meetings = await this.getCalendarMeetings(
        startDate,
        endDate
      );

      console.log(`Pre-loaded ${meetings.length} meetings`);
    } catch (error) {
      console.error('Failed to pre-load calendar:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get calendar meetings for a date range
   * Uses cache if available and valid
   */
  async getCalendarMeetings(
    startDate: Date,
    endDate: Date
  ): Promise<Meeting[]> {
    // Try cache first
    const cached = this.getCachedMeetings();
    if (cached) {
      console.log('Returning cached meetings');
      return this.filterMeetingsByDateRange(cached, startDate, endDate);
    }

    // Fetch from API
    console.log('Fetching meetings from Graph API...');
    const meetings = await this.graphService.getCalendarView(startDate, endDate);

    // Cache the results
    this.setCachedMeetings(meetings);

    return meetings;
  }

  /**
   * Get full meeting details including transcript
   * This is called when user selects a meeting from the list
   */
  async getMeetingWithTranscript(meetingId: string): Promise<MeetingWithTranscript> {
    try {
      // Fetch meeting details
      console.log('Fetching meeting details...');
      const meetingDetails = await this.graphService.getMeetingDetails(meetingId);

      // Try to fetch transcript
      console.log('Searching for transcript...');
      console.log('Meeting has onlineMeetingId:', meetingDetails.onlineMeetingId);
      console.log('Meeting has joinUrl:', meetingDetails.joinUrl);
      const transcriptResult = await this.transcriptService.searchTranscript(
        meetingDetails.subject,
        meetingDetails.start,
        meetingDetails.onlineMeetingId,
        meetingDetails.joinUrl
      );

      return {
        ...meetingDetails,
        transcript: {
          available: transcriptResult.found,
          content: transcriptResult.content,
          source: transcriptResult.source,
          error: transcriptResult.error
        }
      };
    } catch (error) {
      console.error('Failed to get meeting with transcript:', error);
      throw new Error('Unable to load meeting. Please try again or use manual paste.');
    }
  }

  /**
   * Check if transcript is likely available for a meeting
   * (Used for optimistic badge display)
   */
  isTranscriptLikely(meeting: Meeting): boolean {
    return this.transcriptService.isTranscriptLikely(meeting.end);
  }

  /**
   * Invalidate cache (call when user manually refreshes or logs out)
   */
  invalidateCache(): void {
    sessionStorage.removeItem(MeetingService.CACHE_KEY);
    console.log('Cache invalidated');
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Get cached meetings if valid
   */
  private getCachedMeetings(): Meeting[] | null {
    try {
      const cached = sessionStorage.getItem(MeetingService.CACHE_KEY);
      if (!cached) return null;

      const cacheEntry: CacheEntry = JSON.parse(cached);

      // Check cache version - invalidate if outdated
      if (!cacheEntry.version || cacheEntry.version !== MeetingService.CACHE_VERSION) {
        console.log(`Cache version mismatch (cached: ${cacheEntry.version}, current: ${MeetingService.CACHE_VERSION}). Invalidating cache.`);
        this.invalidateCache();
        return null;
      }

      // Check if cache is still valid
      const age = Date.now() - cacheEntry.timestamp;
      if (age > MeetingService.CACHE_TTL) {
        console.log('Cache expired');
        this.invalidateCache();
        return null;
      }

      // Parse dates (they're stored as strings in JSON)
      return cacheEntry.meetings.map(m => ({
        ...m,
        start: new Date(m.start),
        end: new Date(m.end)
      }));
    } catch (error) {
      console.error('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Save meetings to cache
   */
  private setCachedMeetings(meetings: Meeting[]): void {
    try {
      const cacheEntry: CacheEntry = {
        meetings,
        timestamp: Date.now(),
        userId: this.getCurrentUserId(),
        version: MeetingService.CACHE_VERSION
      };

      sessionStorage.setItem(
        MeetingService.CACHE_KEY,
        JSON.stringify(cacheEntry)
      );

      console.log('Meetings cached');
    } catch (error) {
      console.error('Failed to cache meetings:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Filter cached meetings by date range
   */
  private filterMeetingsByDateRange(
    meetings: Meeting[],
    startDate: Date,
    endDate: Date
  ): Meeting[] {
    return meetings.filter(meeting =>
      meeting.start >= startDate && meeting.start <= endDate
    );
  }

  /**
   * Get current user ID for cache validation
   * Prevents one user seeing another user's cached data
   */
  private getCurrentUserId(): string {
    // This should come from your auth state
    // For now, using a simple approach
    try {
      const accounts = msalInstance.getAllAccounts();
      return accounts[0]?.homeAccountId || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// Import at the end to avoid circular dependency
import { msalInstance } from '../auth/authConfig';
