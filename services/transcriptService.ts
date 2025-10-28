/**
 * TranscriptService - Transcript Retrieval and Parsing
 *
 * Uses Microsoft Graph API with OnlineMeetingTranscript.Read.All permission
 * to retrieve meeting transcripts directly from Teams.
 *
 * How it works:
 * 1. Resolve calendar event ID to online meeting ID using joinWebUrl
 * 2. List transcripts for the meeting via /me/onlineMeetings/{id}/transcripts
 * 3. Download transcript content in VTT format
 * 4. Parse and format for AI agent
 */

import { GraphService } from './graphService';

export interface TranscriptIteration {
  id: string;
  content: string;
  createdDateTime: string;
}

export interface TranscriptSearchResult {
  found: boolean;
  content?: string; // Primary/current transcript content
  source?: 'graph-api';
  error?: string;
  iterations?: TranscriptIteration[]; // All transcript iterations (for recurring meetings)
  onlineMeetingId?: string; // For lazy loading additional transcripts
  joinWebUrl?: string; // For lazy loading additional transcripts
}

export class TranscriptService {
  private graphService: GraphService;

  constructor(graphService: GraphService) {
    this.graphService = graphService;
  }

  /**
   * Search for transcript using Graph API only
   * Uses OnlineMeetingTranscript.Read.All permission
   */
  async searchTranscript(
    meetingSubject: string,
    meetingDate: Date,
    onlineMeetingId?: string,
    joinWebUrl?: string
  ): Promise<TranscriptSearchResult> {
    console.log(`[Transcript] ============================================`);
    console.log(`[Transcript] Starting transcript search`);
    console.log(`[Transcript] Meeting: "${meetingSubject}"`);
    console.log(`[Transcript] Date: ${meetingDate.toISOString()}`);
    console.log(`[Transcript] Meeting ID: ${onlineMeetingId}`);
    console.log(`[Transcript] Join URL: ${joinWebUrl?.substring(0, 80)}...`);
    console.log(`[Transcript] ============================================`);

    if (!onlineMeetingId) {
      console.log(`[Transcript] ❌ No online meeting ID available`);
      return {
        found: false,
        error: 'No meeting ID available. This meeting may not be a Teams online meeting.'
      };
    }

    if (!joinWebUrl) {
      console.log(`[Transcript] ⚠️ No join URL available, will try with meeting ID only`);
    }

    try {
      console.log(`[Transcript] Calling Graph API...`);
      const graphResult = await this.searchViaGraphAPI(onlineMeetingId, joinWebUrl, meetingDate);

      if (graphResult.found) {
        console.log(`[Transcript] ✅ SUCCESS! Found transcript via Graph API`);
        return { ...graphResult, source: 'graph-api' };
      }

      console.log(`[Transcript] ❌ Graph API returned no transcript`);
      return {
        found: false,
        error: 'Transcript not found. The meeting may not have been recorded or transcription was disabled.'
      };
    } catch (error) {
      console.error('[Transcript] ❌ ERROR during transcript search:', error);
      return {
        found: false,
        error: `Unable to search for transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search for transcript using official Graph API
   * This is the preferred method as it directly accesses transcript data
   *
   * IMPORTANT: For recurring meetings, this filters transcripts to match the specific meeting date.
   * Recurring meetings share the same onlineMeetingId, so we need to filter by creation time
   * to ensure we get the transcript for the correct instance.
   */
  private async searchViaGraphAPI(onlineMeetingId: string, joinWebUrl?: string, meetingDate?: Date): Promise<TranscriptSearchResult> {
    console.log(`[Transcript] searchViaGraphAPI called`);
    console.log(`[Transcript]   - Meeting ID: ${onlineMeetingId}`);
    console.log(`[Transcript]   - Join URL: ${joinWebUrl ? 'provided' : 'not provided'}`);
    console.log(`[Transcript]   - Meeting Date: ${meetingDate?.toISOString() || 'not provided'}`);

    try {
      // List all transcripts for this meeting
      console.log(`[Transcript] Step 1: Listing transcripts...`);
      const transcripts = await this.graphService.listTranscripts(onlineMeetingId, joinWebUrl);

      if (transcripts.length === 0) {
        console.log(`[Transcript] ❌ No transcripts found via Graph API`);
        return { found: false };
      }

      console.log(`[Transcript] ✅ Found ${transcripts.length} transcript(s) for this meeting series`);

      // Log all transcripts with their creation dates
      transcripts.forEach((t, i) => {
        console.log(`[Transcript]   Transcript ${i + 1}: Created ${t.createdDateTime}`);
      });

      // For recurring meetings, return metadata only (no content download)
      // Content will be fetched lazily when user clicks on a specific tab
      if (transcripts.length > 1) {
        console.log(`[Transcript] 🔄 Recurring meeting detected - returning metadata for ${transcripts.length} iterations (lazy loading)`);

        // Sort transcripts by creation date (newest first)
        const sortedTranscripts = transcripts.sort((a, b) =>
          new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
        );

        // Return metadata only - no content download yet
        const iterationsMetadata: TranscriptIteration[] = sortedTranscripts.map(t => ({
          id: t.id,
          content: '', // Empty - will be fetched on demand
          createdDateTime: t.createdDateTime
        }));

        // Find the iteration closest to the selected meeting date (if provided)
        let primaryIterationIndex = 0; // Default to most recent

        if (meetingDate) {
          const meetingTime = new Date(meetingDate).getTime();
          let closestDiff = Infinity;

          iterationsMetadata.forEach((iteration, index) => {
            const iterationTime = new Date(iteration.createdDateTime).getTime();
            const diff = Math.abs(iterationTime - meetingTime);

            if (diff < closestDiff) {
              closestDiff = diff;
              primaryIterationIndex = index;
            }
          });

          console.log(`[Transcript] 📍 Selected meeting date: ${meetingDate.toISOString()}`);
          console.log(`[Transcript] 📍 Closest transcript: ${iterationsMetadata[primaryIterationIndex].createdDateTime} (index ${primaryIterationIndex})`);
        }

        // Download ONLY the primary transcript content (the one matching selected date)
        console.log(`[Transcript] 📥 Downloading primary transcript: ${sortedTranscripts[primaryIterationIndex].createdDateTime}`);

        try {
          const primaryContent = await this.graphService.getTranscriptContent(
            onlineMeetingId,
            sortedTranscripts[primaryIterationIndex].id,
            joinWebUrl
          );

          const parsedPrimaryContent = this.parseVTT(primaryContent);
          iterationsMetadata[primaryIterationIndex].content = parsedPrimaryContent;

          console.log(`[Transcript] ✅ Downloaded ${parsedPrimaryContent.length} characters for primary transcript`);
        } catch (error) {
          console.error(`[Transcript] ❌ Failed to download primary transcript:`, error);
          return { found: false };
        }

        // Return primary transcript content plus metadata for all iterations
        return {
          found: true,
          content: iterationsMetadata[primaryIterationIndex].content,
          iterations: iterationsMetadata,
          onlineMeetingId: onlineMeetingId, // Pass meeting ID for lazy loading
          joinWebUrl: joinWebUrl // Pass join URL for lazy loading
        };
      }

      // Single meeting - download just one transcript
      const singleTranscript = transcripts[0];
      console.log(`[Transcript] Step 2: Using transcript ID: ${singleTranscript.id}`);
      console.log(`[Transcript]   - Created: ${singleTranscript.createdDateTime}`);

      // Download single transcript content
      console.log(`[Transcript] Step 3: Downloading transcript content...`);
      const content = await this.graphService.getTranscriptContent(
        onlineMeetingId,
        singleTranscript.id,
        joinWebUrl
      );

      console.log(`[Transcript] ✅ Downloaded ${content.length} characters`);

      // Parse VTT format
      console.log(`[Transcript] Step 4: Parsing VTT format...`);
      const parsedTranscript = this.parseVTT(content);

      console.log(`[Transcript] ✅ Parsed transcript: ${parsedTranscript.length} characters`);

      return {
        found: true,
        content: parsedTranscript
      };
    } catch (error) {
      console.error(`[Transcript] ❌ Graph API search failed:`, error);
      if (error instanceof Error) {
        console.error(`[Transcript] Error message: ${error.message}`);
        console.error(`[Transcript] Error stack:`, error.stack);
      }
      return { found: false };
    }
  }

  /**
   * Parse WebVTT format transcript
   *
   * WebVTT format example:
   * ```
   * WEBVTT
   *
   * 00:00:00.000 --> 00:00:03.450
   * <v John Smith>Good morning everyone, let's start the standup.
   *
   * 00:00:03.500 --> 00:00:07.200
   * <v Sarah Johnson>Hi John, I'll go first. Yesterday I completed the dashboard redesign.
   * ```
   *
   * Output format (for AI agent):
   * ```
   * John Smith: Good morning everyone, let's start the standup.
   * Sarah Johnson: Hi John, I'll go first. Yesterday I completed the dashboard redesign.
   * ```
   */
  private parseVTT(content: string): string {
    try {
      // Safety check: ensure content is a string
      if (!content || typeof content !== 'string') {
        console.error(`[Transcript] ❌ parseVTT received invalid content:`, typeof content, content);
        throw new Error('Invalid transcript content: expected string, got ' + typeof content);
      }

      const lines = content.split('\n');
      const transcript: Array<{ speaker: string; text: string }> = [];
      let currentSpeaker = '';
      let currentText = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and timestamps
        if (!line || line.includes('-->') || line === 'WEBVTT') {
          continue;
        }

        // Match speaker format: <v Speaker Name>Text
        const speakerMatch = line.match(/<v\s+([^>]+)>(.+)/);
        if (speakerMatch) {
          // Save previous speaker's text if exists
          if (currentSpeaker && currentText) {
            transcript.push({
              speaker: currentSpeaker,
              text: currentText.trim()
            });
          }

          currentSpeaker = speakerMatch[1].trim();
          currentText = speakerMatch[2].trim();
          continue;
        }

        // Continuation of current speaker's text
        if (currentSpeaker) {
          currentText += ' ' + line;
        }
      }

      // Save last speaker's text
      if (currentSpeaker && currentText) {
        transcript.push({
          speaker: currentSpeaker,
          text: currentText.trim()
        });
      }

      // If VTT parsing failed, try simple text extraction
      if (transcript.length === 0) {
        return this.extractPlainText(content);
      }

      // Format for AI agent
      return transcript
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n\n');
    } catch (error) {
      console.error('VTT parsing failed:', error);
      // Fallback to plain text
      return this.extractPlainText(content);
    }
  }

  /**
   * Extract plain text from transcript (fallback if VTT parsing fails)
   */
  private extractPlainText(content: string): string {
    // Remove VTT headers and timestamps
    let text = content.replace(/WEBVTT[\s\S]*?\n\n/, '');
    text = text.replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/g, '');

    // Remove speaker tags but keep the text
    text = text.replace(/<v\s+[^>]+>/g, '');

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
  }

  /**
   * Fetch a single transcript by ID (for lazy loading)
   * Used when user clicks on a tab to load that specific transcript
   */
  async fetchTranscriptById(
    onlineMeetingId: string,
    transcriptId: string,
    joinWebUrl?: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    console.log(`[Transcript] 🔄 Lazy loading transcript: ${transcriptId}`);

    try {
      const content = await this.graphService.getTranscriptContent(
        onlineMeetingId,
        transcriptId,
        joinWebUrl
      );

      const parsedContent = this.parseVTT(content);

      console.log(`[Transcript] ✅ Lazy loaded ${parsedContent.length} characters`);

      return {
        success: true,
        content: parsedContent
      };
    } catch (error) {
      console.error(`[Transcript] ❌ Failed to lazy load transcript:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if transcript is likely to exist for a meeting
   * (Used for optimistic badge display)
   */
  isTranscriptLikely(meetingDate: Date): boolean {
    const now = new Date();
    const minutesSinceMeeting = (now.getTime() - meetingDate.getTime()) / 1000 / 60;

    // Transcript should exist if meeting ended >10 minutes ago
    // (Teams needs 5-10 minutes to process)
    return minutesSinceMeeting > 10;
  }
}
