/**
 * GraphService - Microsoft Graph API Client
 *
 * Handles all interactions with Microsoft Graph API for:
 * - Calendar access
 * - Meeting details
 * - OneDrive file access (for transcripts)
 *
 * Tested: 2025-10-27
 * Strategy: OneDrive Search (Strategy 2)
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { msalInstance } from '../auth/authConfig';

export interface Meeting {
  id: string;
  subject: string;
  start: Date;
  end: Date;
  organizer: {
    name: string;
    email: string;
  };
  attendees: Attendee[];
  isOrganizer: boolean;
  hasOnlineMeeting: boolean;
  joinUrl?: string;
  onlineMeetingId?: string; // Microsoft Teams online meeting ID for transcript access
}

export interface MeetingDetails extends Meeting {
  agenda: string;
  location: string;
  body: string;
}

export interface Attendee {
  name: string;
  email: string;
  type: 'required' | 'optional' | 'organizer';
}

export interface DriveItem {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
}

export interface Transcript {
  id: string;
  createdDateTime: string;
  meetingOrganizerId: string;
}

export class GraphService {
  private client: Client;

  constructor() {
    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const account = msalInstance.getAllAccounts()[0];

          if (!account) {
            throw new Error('No account found. Please log in.');
          }

          const response = await msalInstance.acquireTokenSilent({
            scopes: [
              'User.Read',
              'User.Read.All',
              'Calendars.Read',
              'OnlineMeetings.Read',
              'OnlineMeetingTranscript.Read.All',
              'Files.Read'
            ],
            account
          });

          done(null, response.accessToken);
        } catch (error) {
          console.error('Token acquisition failed:', error);
          done(error as Error, null);
        }
      }
    });
  }

  /**
   * Get calendar events for a date range
   * Only returns Teams meetings (with onlineMeeting property)
   */
  async getCalendarView(startDate: Date, endDate: Date): Promise<Meeting[]> {
    try {
      console.log(`[GraphService] getCalendarView called with:`);
      console.log(`  Start: ${startDate.toISOString()} (${startDate.toLocaleDateString()})`);
      console.log(`  End: ${endDate.toISOString()} (${endDate.toLocaleDateString()})`);

      const response = await this.client
        .api('/me/calendar/calendarView')
        .query({
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          $select: 'id,subject,start,end,organizer,attendees,onlineMeeting,isOrganizer',
          $orderby: 'start/dateTime',
          $top: 999
        })
        .get();

      console.log(`[GraphService] Graph API returned ${response.value.length} events`);

      // Filter to Teams meetings only
      const teamsMeetings = response.value.filter((event: any) =>
        event.onlineMeeting && event.onlineMeeting.joinUrl
      );

      return teamsMeetings.map((event: any) => this.mapToMeeting(event));
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      throw new Error('Unable to load calendar. Please try again.');
    }
  }

  /**
   * Get detailed information for a specific meeting
   */
  async getMeetingDetails(meetingId: string): Promise<MeetingDetails> {
    try {
      const event = await this.client
        .api(`/me/events/${meetingId}`)
        .select('subject,start,end,organizer,attendees,body,location,onlineMeeting,isOrganizer')
        .get();

      return {
        ...this.mapToMeeting(event),
        agenda: this.extractAgenda(event.body?.content || ''),
        location: event.location?.displayName || 'Teams Meeting',
        body: event.body?.content || ''
      };
    } catch (error) {
      console.error('Failed to fetch meeting details:', error);
      throw new Error('Unable to load meeting details. Please try again.');
    }
  }

  /**
   * List files in a OneDrive folder
   * Used for searching transcripts in /Recordings or /Microsoft Teams Chat Files
   */
  async listFilesInFolder(folderPath: string): Promise<DriveItem[]> {
    try {
      const response = await this.client
        .api(`/me/drive/root:/${folderPath}:/children`)
        .get();

      return response.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdDateTime: file.createdDateTime,
        lastModifiedDateTime: file.lastModifiedDateTime,
        webUrl: file.webUrl
      }));
    } catch (error) {
      // 404 means folder doesn't exist (not an error, just empty result)
      if ((error as any).statusCode === 404) {
        return [];
      }

      console.error(`Failed to list files in ${folderPath}:`, error);
      throw new Error(`Unable to access ${folderPath} folder.`);
    }
  }

  /**
   * Download file content from OneDrive
   */
  async downloadFile(fileId: string): Promise<string> {
    try {
      const response = await this.client
        .api(`/me/drive/items/${fileId}/content`)
        .get();

      // Response is the file content as text
      return response;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Unable to download transcript file.');
    }
  }

  /**
   * Search for files matching a pattern
   */
  async searchFiles(query: string): Promise<DriveItem[]> {
    try {
      const response = await this.client
        .api('/me/drive/root/search(q=\'{query}\')')
        .get();

      return response.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdDateTime: file.createdDateTime,
        lastModifiedDateTime: file.lastModifiedDateTime,
        webUrl: file.webUrl
      }));
    } catch (error) {
      console.error('File search failed:', error);
      return [];
    }
  }

  /**
   * Get online meeting ID from joinWebUrl
   * Calendar events don't expose the online meeting ID directly,
   * so we filter /onlineMeetings by joinWebUrl to find it
   *
   * @param joinWebUrl - The Teams meeting join URL
   * @returns The online meeting ID or undefined if not found
   */
  async getOnlineMeetingIdFromUrl(joinWebUrl: string): Promise<string | undefined> {
    try {
      console.log(`[Graph API] Looking up online meeting by joinWebUrl: ${joinWebUrl.substring(0, 80)}...`);

      // Filter online meetings by join URL
      const response = await this.client
        .api('/me/onlineMeetings')
        .filter(`JoinWebUrl eq '${joinWebUrl}'`)
        .get();

      if (response.value && response.value.length > 0) {
        const meetingId = response.value[0].id;
        console.log(`[Graph API] ✅ Found online meeting ID: ${meetingId}`);
        return meetingId;
      }

      console.log(`[Graph API] ❌ No online meeting found for this joinWebUrl`);
      return undefined;
    } catch (error: any) {
      console.log(`[Graph API] ❌ Failed to lookup online meeting:`, error.message);
      return undefined;
    }
  }

  /**
   * List transcripts for an online meeting using Graph API
   * Tries multiple endpoint patterns as the API can be accessed different ways
   *
   * @param onlineMeetingId - The online meeting ID (from event.onlineMeetingId)
   * @param joinWebUrl - Optional join URL to resolve calendar event IDs to online meeting IDs
   * @returns Array of transcript metadata
   */
  async listTranscripts(onlineMeetingId: string, joinWebUrl?: string): Promise<Transcript[]> {
    console.log(`[Graph API] Listing transcripts for meeting: ${onlineMeetingId}`);

    // If we have a joinWebUrl and the ID looks like a calendar event ID, try to get the real meeting ID
    if (joinWebUrl && (onlineMeetingId.includes('AAM') || onlineMeetingId.includes('AQMkAD'))) {
      console.log(`[Graph API] Detected calendar event ID, attempting to resolve to online meeting ID...`);
      const realMeetingId = await this.getOnlineMeetingIdFromUrl(joinWebUrl);
      if (realMeetingId) {
        onlineMeetingId = realMeetingId;
      }
    }

    // Try different API endpoint patterns
    const endpoints = [
      `/me/onlineMeetings/${onlineMeetingId}/transcripts`,
      `/communications/onlineMeetings/${onlineMeetingId}/transcripts`,
      `/users/me/onlineMeetings/${onlineMeetingId}/transcripts`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`[Graph API] Trying endpoint: ${endpoint}`);
        const response = await this.client
          .api(endpoint)
          .get();

        const transcripts = response.value.map((t: any) => ({
          id: t.id,
          createdDateTime: t.createdDateTime,
          meetingOrganizerId: t.meetingOrganizer?.user?.id || ''
        }));

        console.log(`[Graph API] ✅ Found ${transcripts.length} transcripts`);
        return transcripts;
      } catch (error: any) {
        console.log(`[Graph API] ❌ Endpoint ${endpoint} failed:`, error.message);
        // Continue to next endpoint
      }
    }

    console.log(`[Graph API] ❌ No transcripts found using any endpoint`);
    return [];
  }

  /**
   * Get transcript content using Graph API
   * Returns the transcript text in VTT or DOCX format
   *
   * @param onlineMeetingId - The online meeting ID (or calendar event ID if joinWebUrl provided)
   * @param transcriptId - The transcript ID (from listTranscripts)
   * @param joinWebUrl - Optional join URL to resolve calendar event ID to online meeting ID
   * @returns Transcript content as string
   */
  async getTranscriptContent(onlineMeetingId: string, transcriptId: string, joinWebUrl?: string): Promise<string> {
    console.log(`[Graph API] Fetching transcript content: ${transcriptId}`);

    // If we have a joinWebUrl and the ID looks like a calendar event ID, try to get the real meeting ID
    if (joinWebUrl && (onlineMeetingId.includes('AAM') || onlineMeetingId.includes('AQMkAD'))) {
      console.log(`[Graph API] Detected calendar event ID for content fetch, attempting to resolve to online meeting ID...`);
      const realMeetingId = await this.getOnlineMeetingIdFromUrl(joinWebUrl);
      if (realMeetingId) {
        console.log(`[Graph API] ✅ Using resolved online meeting ID for content fetch: ${realMeetingId}`);
        onlineMeetingId = realMeetingId;
      } else {
        console.log(`[Graph API] ⚠️ Could not resolve meeting ID, will try with calendar event ID`);
      }
    }

    // Try different API endpoint patterns
    const endpoints = [
      `/me/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`,
      `/communications/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`,
      `/users/me/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`[Graph API] Trying endpoint: ${endpoint}`);

        // Request VTT format (text-based, easier to parse)
        // Use getStream() or responseType to get raw content
        const response = await this.client
          .api(endpoint)
          .header('Accept', 'text/vtt')
          .get();

        console.log(`[Graph API] Raw response type: ${typeof response}`);
        console.log(`[Graph API] Raw response constructor:`, response?.constructor?.name);

        // Handle different response formats
        let content: string;

        if (typeof response === 'string') {
          content = response;
        } else if (response instanceof ReadableStream) {
          // Handle ReadableStream
          console.log(`[Graph API] Response is ReadableStream, reading...`);
          const reader = response.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const blob = new Blob(chunks);
          content = await blob.text();
        } else if (response && typeof response === 'object') {
          // Check for common properties
          if (response.value !== undefined) {
            content = String(response.value);
          } else if (response.content !== undefined) {
            content = String(response.content);
          } else if (response.body !== undefined) {
            content = String(response.body);
          } else {
            // Last resort - try to stringify
            const stringified = JSON.stringify(response);
            console.log(`[Graph API] ⚠️ Object response, stringified length: ${stringified.length}`);

            // If the stringified object is just "{}" or very small, it's likely empty
            if (stringified.length > 10) {
              content = stringified;
            } else {
              throw new Error('Response object is empty or invalid');
            }
          }
        } else {
          console.log(`[Graph API] ⚠️ Unexpected response format, attempting to convert to string`);
          content = String(response || '');
        }

        console.log(`[Graph API] ✅ Downloaded ${content.length} characters`);

        if (content.length < 10) {
          throw new Error('Content too short, likely invalid');
        }

        return content;
      } catch (error: any) {
        console.log(`[Graph API] ❌ Endpoint ${endpoint} failed:`, error.message);
        // Continue to next endpoint
      }
    }

    throw new Error('Unable to fetch transcript content from any Graph API endpoint');
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Map Graph API event to our Meeting interface
   */
  private mapToMeeting(event: any): Meeting {
    console.log(`[GraphService] Mapping event to meeting:`);
    console.log(`[GraphService]   - Subject: ${event.subject}`);
    console.log(`[GraphService]   - Organizer: ${event.organizer?.emailAddress?.name} (${event.organizer?.emailAddress?.address})`);
    console.log(`[GraphService]   - Attendees count from API: ${event.attendees?.length || 0}`);

    // Map attendees from the event
    const attendees = (event.attendees || []).map((a: any) => ({
      name: a.emailAddress.name,
      email: a.emailAddress.address,
      type: a.type.toLowerCase()
    }));

    // IMPORTANT: Always include the organizer in the attendees list
    // The Graph API attendees list doesn't include the organizer
    const organizerEmail = event.organizer?.emailAddress?.address;
    const organizerName = event.organizer?.emailAddress?.name;

    if (organizerEmail) {
      const organizerAlreadyInList = attendees.some(
        (a) => a.email.toLowerCase() === organizerEmail.toLowerCase()
      );

      if (!organizerAlreadyInList) {
        console.log(`[GraphService]   - Adding organizer to attendees list: ${organizerName}`);
        attendees.unshift({
          name: organizerName || 'Unknown',
          email: organizerEmail,
          type: 'organizer'
        });
      }
    }

    console.log(`[GraphService]   - Total attendees (including organizer): ${attendees.length}`);

    return {
      id: event.id,
      subject: event.subject || 'Untitled Meeting',
      start: new Date(event.start.dateTime + 'Z'), // Add Z for UTC
      end: new Date(event.end.dateTime + 'Z'),
      organizer: {
        name: organizerName || 'Unknown',
        email: organizerEmail || ''
      },
      attendees,
      isOrganizer: event.isOrganizer || false,
      hasOnlineMeeting: !!event.onlineMeeting,
      joinUrl: event.onlineMeeting?.joinUrl,
      onlineMeetingId: this.extractOnlineMeetingId(event)
    };
  }

  /**
   * Extract online meeting ID from event for transcript access
   *
   * IMPORTANT LIMITATION:
   * Calendar events don't expose the onlineMeeting ID that the transcript API requires.
   * The calendar event ID (event.id) is NOT compatible with /onlineMeetings/{id}/transcripts endpoint.
   *
   * This is a known Microsoft Graph API limitation. The workaround is to use OneDrive file search.
   * See: https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting
   */
  private extractOnlineMeetingId(event: any): string | undefined {
    console.log('[OnlineMeeting ID] Extracting from event:', {
      eventId: event.id,
      hasOnlineMeeting: !!event.onlineMeeting,
      onlineMeetingId: event.onlineMeeting?.id,
      joinUrl: event.onlineMeeting?.joinUrl?.substring(0, 80) + '...'
    });

    // Method 1: Direct ID from onlineMeeting object (if available)
    if (event.onlineMeeting?.id) {
      console.log('[OnlineMeeting ID] Using onlineMeeting.id:', event.onlineMeeting.id);
      return event.onlineMeeting.id;
    }

    // Method 2: Extract thread ID from joinUrl
    // Format: https://teams.microsoft.com/l/meetup-join/...threadId=...
    if (event.onlineMeeting?.joinUrl) {
      const threadMatch = event.onlineMeeting.joinUrl.match(/threadId=([^&]+)/);
      if (threadMatch) {
        const threadId = decodeURIComponent(threadMatch[1]);
        console.log('[OnlineMeeting ID] Using threadId from URL:', threadId);
        return threadId;
      }
    }

    // Method 3: Use calendar event ID as fallback (will likely fail for transcript API)
    console.log('[OnlineMeeting ID] WARNING: Falling back to calendar event ID - transcript API will likely fail');
    return event.id;
  }

  /**
   * Extract agenda from meeting body HTML
   * Looks for common patterns like "Agenda:", numbered lists, etc.
   */
  private extractAgenda(htmlBody: string): string {
    if (!htmlBody) return '';

    // Strip HTML tags and decode HTML entities
    let text = htmlBody
      .replace(/<[^>]*>/g, ' ')  // Replace tags with spaces
      .replace(/&nbsp;/g, ' ')    // Replace &nbsp; with space
      .replace(/&amp;/g, '&')     // Decode &amp;
      .replace(/&lt;/g, '<')      // Decode &lt;
      .replace(/&gt;/g, '>')      // Decode &gt;
      .replace(/&quot;/g, '"')    // Decode &quot;
      .trim();

    // Clean up multiple spaces and line breaks
    text = text
      .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
      .replace(/[\r\n]+/g, '\n')  // Normalize line breaks
      .trim();

    // Remove lines that are just formatting characters (hyphens, underscores, etc.)
    text = text.split('\n')
      .filter(line => {
        const cleaned = line.trim();
        // Filter out lines that are only hyphens, underscores, or other formatting
        return cleaned.length > 0 && !/^[-_=*#]+$/.test(cleaned);
      })
      .join('\n')
      .trim();

    // Look for "Agenda:" section
    const agendaMatch = text.match(/agenda:?\s*([\s\S]*?)(?:\n\n|$)/i);
    if (agendaMatch) {
      const agendaText = agendaMatch[1].trim();
      return agendaText.length > 0 ? agendaText : '';
    }

    // Look for numbered list at the start
    const numberedMatch = text.match(/^(\d+\.[\s\S]*?)(?:\n\n|$)/);
    if (numberedMatch) {
      return numberedMatch[1].trim();
    }

    // Return first paragraph if nothing else matches and it's meaningful
    const firstParagraph = text.split('\n\n')[0].trim();

    // Only return if it's not too long and contains actual content
    if (firstParagraph.length === 0 || firstParagraph.length > 500) {
      return '';
    }

    // Check if it's just formatting characters or whitespace
    if (/^[-_=*#\s]+$/.test(firstParagraph)) {
      return '';
    }

    return firstParagraph;
  }
}
