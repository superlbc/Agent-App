/**
 * VTT Speaker Extraction Utility
 *
 * Extracts unique speaker names from WebVTT transcript format.
 * Used to identify who actually spoke during a meeting for comparison
 * with the invited attendees list.
 *
 * VTT Format Example:
 * ```
 * WEBVTT
 *
 * 00:00:00.000 --> 00:00:03.450
 * <v John Smith>Good morning everyone, let's start the standup.
 *
 * 00:00:03.500 --> 00:00:07.200
 * <v Sarah Johnson>Hi John, I'll go first.
 * ```
 *
 * Output: ["John Smith", "Sarah Johnson"]
 */

export interface SpeakerStats {
  name: string;
  mentionCount: number; // How many times they spoke
}

/**
 * Extracts unique speaker names from VTT transcript.
 *
 * @param vttContent - WebVTT format transcript content
 * @returns Array of unique speaker names found in transcript
 */
export function extractSpeakersFromVTT(vttContent: string): string[] {
  if (!vttContent || typeof vttContent !== 'string' || vttContent.trim().length === 0) {
    return [];
  }

  const speakers = new Set<string>();
  const lines = vttContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines, timestamps, and VTT headers
    if (!trimmedLine || trimmedLine.includes('-->') || trimmedLine === 'WEBVTT') {
      continue;
    }

    // Match speaker format: <v Speaker Name>Text
    // Example: <v John Smith>Good morning everyone
    const speakerMatch = trimmedLine.match(/<v\s+([^>]+)>/);

    if (speakerMatch && speakerMatch[1]) {
      const speakerName = speakerMatch[1].trim();

      // Filter out empty or invalid speaker names
      if (speakerName && speakerName.length > 0) {
        speakers.add(speakerName);
      }
    }
  }

  return Array.from(speakers);
}

/**
 * Extracts speaker names with mention counts from VTT transcript.
 *
 * @param vttContent - WebVTT format transcript content
 * @returns Array of speaker statistics (name + mention count)
 */
export function extractSpeakerStatsFromVTT(vttContent: string): SpeakerStats[] {
  if (!vttContent || typeof vttContent !== 'string' || vttContent.trim().length === 0) {
    return [];
  }

  const speakerCounts = new Map<string, number>();
  const lines = vttContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines, timestamps, and VTT headers
    if (!trimmedLine || trimmedLine.includes('-->') || trimmedLine === 'WEBVTT') {
      continue;
    }

    // Match speaker format: <v Speaker Name>Text
    const speakerMatch = trimmedLine.match(/<v\s+([^>]+)>/);

    if (speakerMatch && speakerMatch[1]) {
      const speakerName = speakerMatch[1].trim();

      // Filter out empty or invalid speaker names
      if (speakerName && speakerName.length > 0) {
        speakerCounts.set(speakerName, (speakerCounts.get(speakerName) || 0) + 1);
      }
    }
  }

  // Convert Map to sorted array (most active speakers first)
  return Array.from(speakerCounts.entries())
    .map(([name, mentionCount]) => ({ name, mentionCount }))
    .sort((a, b) => b.mentionCount - a.mentionCount);
}

/**
 * Normalizes speaker name for comparison.
 *
 * Handles common variations:
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 * - Removes common suffixes (Jr., Sr., III, etc.)
 *
 * @param name - Speaker name to normalize
 * @returns Normalized name for matching
 */
export function normalizeSpeakerName(name: string): string {
  if (!name) return '';

  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space

  // Remove common suffixes
  normalized = normalized
    .replace(/\s+(jr\.?|sr\.?|iii|ii|iv)$/i, '')
    .trim();

  return normalized;
}

/**
 * Checks if a VTT transcript contains speaker information.
 *
 * @param vttContent - WebVTT format transcript content
 * @returns true if transcript has speaker tags, false otherwise
 */
export function hasSpeakerInfo(vttContent: string): boolean {
  if (!vttContent || typeof vttContent !== 'string') {
    return false;
  }

  // Check if transcript contains any speaker tags
  return /<v\s+[^>]+>/.test(vttContent);
}
