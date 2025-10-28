/**
 * Speaker Matching Service
 *
 * Matches extracted speaker names from VTT transcripts to participant records
 * using fuzzy name matching, email matching, and various name format heuristics.
 *
 * Handles common variations:
 * - "John Smith" matches "Smith, John"
 * - "Mike Johnson" matches "Michael Johnson"
 * - "john.smith" (email) matches "John Smith"
 * - Case-insensitive matching
 */

import { Participant } from '../types';
import { calculateStringSimilarity } from './participantExtraction';
import { normalizeSpeakerName } from './vttSpeakerExtraction';

export interface SpeakerMatchResult {
  participantId: string;
  speakerName: string;
  matchConfidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy-name' | 'email-prefix' | 'partial';
}

/**
 * Matches extracted speaker names to participants.
 *
 * @param speakers - Array of speaker names extracted from VTT transcript
 * @param participants - Array of meeting participants
 * @returns Map of participant IDs to match results
 */
export function matchSpeakersToParticipants(
  speakers: string[],
  participants: Participant[]
): Map<string, SpeakerMatchResult> {
  const matches = new Map<string, SpeakerMatchResult>();

  if (!speakers || speakers.length === 0 || !participants || participants.length === 0) {
    return matches;
  }

  console.log(`[SpeakerMatching] Matching ${speakers.length} speakers to ${participants.length} participants`);

  // For each speaker, try to find best matching participant
  for (const speaker of speakers) {
    const match = findBestParticipantMatch(speaker, participants);

    if (match) {
      console.log(`[SpeakerMatching] Matched speaker "${speaker}" to participant "${match.participantId}" (${match.matchType}, ${match.matchConfidence})`);
      matches.set(match.participantId, match);
    } else {
      console.log(`[SpeakerMatching] No match found for speaker "${speaker}"`);
    }
  }

  return matches;
}

/**
 * Finds the best matching participant for a given speaker name.
 *
 * @param speakerName - Name of speaker from transcript
 * @param participants - Array of meeting participants
 * @returns Best match result or null if no good match found
 */
function findBestParticipantMatch(
  speakerName: string,
  participants: Participant[]
): SpeakerMatchResult | null {
  const normalizedSpeaker = normalizeSpeakerName(speakerName);
  let bestMatch: SpeakerMatchResult | null = null;
  let bestScore = 0;

  for (const participant of participants) {
    const result = matchSpeakerToParticipant(speakerName, normalizedSpeaker, participant);

    if (result && result.score > bestScore) {
      bestScore = result.score;
      bestMatch = {
        participantId: participant.id,
        speakerName,
        matchConfidence: result.confidence,
        matchType: result.type
      };
    }
  }

  // Only return matches with confidence >= medium
  if (bestMatch && (bestMatch.matchConfidence === 'high' || bestMatch.matchConfidence === 'medium')) {
    return bestMatch;
  }

  return null;
}

/**
 * Attempts to match a speaker to a specific participant using multiple strategies.
 *
 * @param speakerName - Original speaker name from transcript
 * @param normalizedSpeaker - Normalized speaker name
 * @param participant - Participant to match against
 * @returns Match result with score, confidence, and type
 */
function matchSpeakerToParticipant(
  speakerName: string,
  normalizedSpeaker: string,
  participant: Participant
): { score: number; confidence: 'high' | 'medium' | 'low'; type: 'exact' | 'fuzzy-name' | 'email-prefix' | 'partial' } | null {
  // Strategy 1: Exact match on display name
  if (participant.displayName) {
    const normalizedDisplay = normalizeSpeakerName(participant.displayName);
    if (normalizedSpeaker === normalizedDisplay) {
      return { score: 1.0, confidence: 'high', type: 'exact' };
    }
  }

  // Strategy 2: Exact match on extracted text (for manually extracted participants)
  if (participant.extractedText) {
    const normalizedExtracted = normalizeSpeakerName(participant.extractedText);
    if (normalizedSpeaker === normalizedExtracted) {
      return { score: 1.0, confidence: 'high', type: 'exact' };
    }
  }

  // Strategy 3: Email prefix matching (john.smith@domain.com matches "John Smith")
  if (participant.email) {
    const emailPrefix = participant.email.split('@')[0].toLowerCase();
    const emailAsName = emailPrefix.replace(/[._-]/g, ' '); // "john.smith" → "john smith"

    if (normalizedSpeaker === emailAsName) {
      return { score: 0.95, confidence: 'high', type: 'email-prefix' };
    }
  }

  // Strategy 4: Reverse name format matching ("Smith, John" matches "John Smith")
  if (participant.displayName) {
    const reversedMatch = matchReversedName(speakerName, participant.displayName);
    if (reversedMatch) {
      return { score: 0.9, confidence: 'high', type: 'fuzzy-name' };
    }
  }

  // Strategy 5: Common nickname matching (Mike → Michael, Bob → Robert, etc.)
  if (participant.displayName) {
    const nicknameMatch = matchWithNicknames(normalizedSpeaker, participant.displayName);
    if (nicknameMatch) {
      return { score: 0.85, confidence: 'high', type: 'fuzzy-name' };
    }
  }

  // Strategy 6: Fuzzy string similarity (handles typos, partial names)
  if (participant.displayName) {
    const similarity = calculateStringSimilarity(speakerName, participant.displayName);

    if (similarity >= 0.8) {
      return { score: similarity, confidence: 'high', type: 'fuzzy-name' };
    } else if (similarity >= 0.6) {
      return { score: similarity, confidence: 'medium', type: 'partial' };
    }
  }

  // Strategy 7: Partial name matching (speaker "John" matches participant "John Smith")
  if (participant.displayName) {
    const partialMatch = matchPartialName(normalizedSpeaker, participant.displayName);
    if (partialMatch) {
      return { score: 0.7, confidence: 'medium', type: 'partial' };
    }
  }

  return null;
}

/**
 * Checks if speaker name matches participant name in reversed format.
 * Example: "Smith, John" (participant) matches "John Smith" (speaker)
 *
 * @param speakerName - Speaker name from transcript
 * @param participantName - Participant display name
 * @returns true if reversed format matches
 */
function matchReversedName(speakerName: string, participantName: string): boolean {
  const normalized = normalizeSpeakerName(speakerName);
  const participantNormalized = normalizeSpeakerName(participantName);

  // Check if participant name is in "LastName, FirstName" format
  if (participantNormalized.includes(',')) {
    const parts = participantNormalized.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const [lastName, firstName] = parts;
      const reversed = `${firstName} ${lastName}`;
      return normalized === reversed;
    }
  }

  // Also check if speaker name can be reversed to match participant
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const [lastName, firstName] = parts;
      const reversed = `${firstName} ${lastName}`;
      return reversed === participantNormalized;
    }
  }

  return false;
}

/**
 * Checks if speaker name matches participant name using common nickname mappings.
 *
 * @param normalizedSpeaker - Normalized speaker name
 * @param participantName - Participant display name
 * @returns true if nickname match found
 */
function matchWithNicknames(normalizedSpeaker: string, participantName: string): boolean {
  const nicknameMap: Record<string, string[]> = {
    'michael': ['mike', 'mick'],
    'mike': ['michael'],
    'robert': ['rob', 'bob', 'bobby'],
    'rob': ['robert'],
    'bob': ['robert'],
    'william': ['will', 'bill', 'billy'],
    'will': ['william'],
    'bill': ['william'],
    'richard': ['rick', 'dick', 'rich'],
    'rick': ['richard'],
    'james': ['jim', 'jimmy'],
    'jim': ['james'],
    'joseph': ['joe', 'joey'],
    'joe': ['joseph'],
    'christopher': ['chris'],
    'chris': ['christopher'],
    'daniel': ['dan', 'danny'],
    'dan': ['daniel'],
    'thomas': ['tom', 'tommy'],
    'tom': ['thomas'],
    'anthony': ['tony'],
    'tony': ['anthony'],
    'nicholas': ['nick'],
    'nick': ['nicholas'],
    'alexander': ['alex'],
    'alex': ['alexander'],
    'benjamin': ['ben'],
    'ben': ['benjamin'],
    'elizabeth': ['liz', 'beth', 'betsy'],
    'liz': ['elizabeth'],
    'beth': ['elizabeth'],
    'margaret': ['maggie', 'meg', 'peggy'],
    'maggie': ['margaret'],
    'katherine': ['kate', 'kathy', 'katie'],
    'kate': ['katherine'],
    'susan': ['sue', 'susie'],
    'sue': ['susan'],
    'patricia': ['pat', 'patty', 'trish'],
    'pat': ['patricia'],
    'jennifer': ['jen', 'jenny'],
    'jen': ['jennifer'],
    'jessica': ['jess', 'jessie'],
    'jess': ['jessica'],
    'rebecca': ['becky', 'becca'],
    'becky': ['rebecca']
  };

  const speakerParts = normalizedSpeaker.split(' ');
  const participantParts = normalizeSpeakerName(participantName).split(' ');

  // Check each part of the name
  for (const speakerPart of speakerParts) {
    for (const participantPart of participantParts) {
      // Direct nickname match
      if (nicknameMap[speakerPart]?.includes(participantPart)) {
        return true;
      }
      if (nicknameMap[participantPart]?.includes(speakerPart)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if speaker name is a partial match of participant name.
 * Example: "John" (speaker) matches "John Smith" (participant)
 *
 * @param normalizedSpeaker - Normalized speaker name
 * @param participantName - Participant display name
 * @returns true if partial match found
 */
function matchPartialName(normalizedSpeaker: string, participantName: string): boolean {
  const participantNormalized = normalizeSpeakerName(participantName);

  const speakerParts = normalizedSpeaker.split(' ');
  const participantParts = participantNormalized.split(' ');

  // Speaker name should match at least one significant part of participant name
  // Require at least 2 characters to avoid false positives
  for (const speakerPart of speakerParts) {
    if (speakerPart.length >= 2) {
      for (const participantPart of participantParts) {
        if (participantPart === speakerPart) {
          return true;
        }
      }
    }
  }

  return false;
}
