/**
 * Transcript Parser Utility
 *
 * Parses both WebVTT and plain text transcript formats into conversation blocks.
 * Supports:
 * - VTT format: <v Speaker Name>Message
 * - Plain text format: Speaker Name (Details): Message
 *
 * Handles speaker identification, timestamp extraction, and message grouping.
 */

export interface ConversationBlock {
  speaker: string;        // Speaker name from transcript
  timestamp: string;      // Formatted timestamp (e.g., "00:05:23")
  message: string;        // Full message text
  startTime: number;      // Start time in seconds (for sorting)
}

export interface Match {
  blockIndex: number;     // Which conversation block contains the match
  charIndex: number;      // Position in message text
  length: number;         // Length of matched text
  text: string;           // The matched text
}

/**
 * Parses transcript content into conversation blocks.
 * Merges consecutive messages from the same speaker into a single block.
 *
 * Supports:
 * - VTT Format: 00:00:00.000 --> 00:00:03.450 \n <v John Smith>Good morning everyone.
 * - Plain Text Format: Bustos, Luis (LDN-MOM): Good morning everyone.
 *
 * @param content - Transcript content (VTT or plain text)
 * @returns Array of conversation blocks
 */
export function parseVTTToConversation(content: string): ConversationBlock[] {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return [];
  }

  // Detect format
  const isVTT = /<v\s+[^>]+>/.test(content);

  if (isVTT) {
    return parseVTTFormat(content);
  } else {
    return parsePlainTextFormat(content);
  }
}

/**
 * Parses VTT format transcript
 */
function parseVTTFormat(vttContent: string): ConversationBlock[] {
  const blocks: ConversationBlock[] = [];
  const lines = vttContent.split('\n');

  let currentTimestamp = '';
  let currentStartTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and WEBVTT header
    if (!line || line === 'WEBVTT') {
      continue;
    }

    // Check for timestamp line (e.g., "00:00:00.000 --> 00:00:03.450")
    if (line.includes('-->')) {
      const parts = line.split('-->');
      if (parts.length === 2) {
        currentTimestamp = formatTimestamp(parts[0].trim());
        currentStartTime = parseTimestampToSeconds(parts[0].trim());
      }
      continue;
    }

    // Handle multiple <v Speaker>text</v> patterns in a single line
    // Match all occurrences of <v Speaker>text</v> or <v Speaker>text
    const vtagPattern = /<v\s+([^>]+)>(.*?)(?:<\/v>|(?=<v\s)|$)/g;
    let match;
    const segments: { speaker: string; text: string }[] = [];

    while ((match = vtagPattern.exec(line)) !== null) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      if (text) {
        segments.push({ speaker, text });
      }
    }

    // Process each segment
    for (const segment of segments) {
      const { speaker, text } = segment;

      // Check if we should merge with previous block (same speaker, within 5 seconds)
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock &&
          lastBlock.speaker === speaker &&
          currentStartTime - lastBlock.startTime < 5) {
        // Merge with previous block, adding a line break between segments
        lastBlock.message += '\n' + text;
      } else {
        // Create new block
        blocks.push({
          speaker,
          timestamp: currentTimestamp,
          message: text,
          startTime: currentStartTime
        });
      }
    }
  }

  return blocks;
}

/**
 * Parses plain text format transcript
 * Format: "Speaker Name (Details): Message text"
 */
function parsePlainTextFormat(content: string): ConversationBlock[] {
  const blocks: ConversationBlock[] = [];
  const lines = content.split('\n');

  let messageIndex = 0; // Use line index as pseudo-timestamp

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Match pattern: "Name (Details): Message" or "Name: Message"
    // Examples:
    // - "Bustos, Luis (LDN-MOM): Message text"
    // - "John Smith: Message text"
    const speakerMatch = line.match(/^([^:]+?):\s*(.+)$/);

    if (speakerMatch && speakerMatch[1] && speakerMatch[2]) {
      let speaker = speakerMatch[1].trim();
      let messageText = speakerMatch[2].trim();

      // Remove any trailing tags like </v>
      messageText = messageText.replace(/<\/v>\s*$/, '').trim();

      // Extract clean speaker name (remove details in parentheses for comparison)
      // "Bustos, Luis (LDN-MOM)" -> "Bustos, Luis"
      const cleanSpeaker = speaker.replace(/\s*\([^)]+\)\s*$/, '').trim();

      // Check if we should merge with previous block (same speaker, consecutive lines)
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.speaker === speaker) {
        // Merge with previous block
        lastBlock.message += ' ' + messageText;
      } else {
        // Create new block
        blocks.push({
          speaker: speaker,  // Keep full speaker name with details
          timestamp: '',     // No timestamp in plain text format
          message: messageText,
          startTime: messageIndex
        });
        messageIndex++;
      }
    }
  }

  return blocks;
}

/**
 * Formats a VTT timestamp for display.
 * Converts "00:05:23.450" to "00:05:23"
 */
function formatTimestamp(timestamp: string): string {
  // Remove milliseconds if present
  const withoutMs = timestamp.split('.')[0];
  return withoutMs;
}

/**
 * Converts a VTT timestamp to seconds.
 * "00:05:23.450" -> 323
 */
function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Finds all text matches within conversation blocks.
 * Used for search functionality.
 *
 * @param blocks - Conversation blocks to search
 * @param query - Search query (case-insensitive)
 * @returns Array of match locations
 */
export function findTextMatches(blocks: ConversationBlock[], query: string): Match[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const matches: Match[] = [];
  const lowerQuery = query.toLowerCase();

  blocks.forEach((block, blockIndex) => {
    const lowerMessage = block.message.toLowerCase();
    let index = 0;

    while ((index = lowerMessage.indexOf(lowerQuery, index)) !== -1) {
      matches.push({
        blockIndex,
        charIndex: index,
        length: query.length,
        text: block.message.substring(index, index + query.length)
      });
      index += query.length;
    }
  });

  return matches;
}

/**
 * Checks if a transcript has speaker information (VTT or plain text format).
 *
 * Detects:
 * - VTT format: <v Speaker Name>Message
 * - Plain text format: Speaker Name (Details): Message
 *
 * @param content - Transcript content to check
 * @returns true if transcript has speaker information
 */
export function hasSpeakerInfo(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check for VTT format: <v Speaker Name>
  if (/<v\s+[^>]+>/.test(content)) {
    return true;
  }

  // Check for plain text format: Name (Details): Message or Name: Message
  // Look for lines that start with a name followed by colon
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Match pattern: "Name (Details): " or "Name: "
    if (/^[^:]+?\s*(?:\([^)]+\))?\s*:\s*.+/.test(trimmed)) {
      return true;
    }
  }

  return false;
}
