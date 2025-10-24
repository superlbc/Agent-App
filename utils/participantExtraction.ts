import { ExtractedParticipant, GraphData } from '../types';

/**
 * Extracts participant names from Teams transcript format
 * Matches patterns like: "Bustos, Luis (LDN-MOM)   10:17"
 * @param transcript The meeting transcript text
 * @returns Array of extracted participants with parsed names
 */
export const extractNamesFromTranscript = (transcript: string): ExtractedParticipant[] => {
    if (!transcript || transcript.trim().length === 0) {
        return [];
    }

    // Regex to match Teams transcript format: "LastName, FirstName (XXX-XXX)" or "LastName, FirstName MiddleName (XXX-XXX)"
    // Captures the name part before the parentheses
    const namePattern = /^([A-Z][a-zA-Z]+(?:[-'][A-Z][a-zA-Z]+)*,\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+\([A-Z]{3}-[A-Z]{3}\)/gm;

    const matches = transcript.matchAll(namePattern);
    const extracted: ExtractedParticipant[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
        const rawText = match[1].trim();

        // Skip if we've already seen this exact text
        if (seen.has(rawText)) {
            continue;
        }
        seen.add(rawText);

        // Parse "LastName, FirstName" to "FirstName LastName"
        const parsedName = parseTeamsDisplayName(rawText);

        extracted.push({
            rawText,
            parsedName,
            source: 'transcript-name'
        });
    }

    return extracted;
};

/**
 * Extracts email addresses from transcript text
 * @param transcript The meeting transcript text
 * @returns Array of extracted participants with email addresses
 */
export const extractEmailsFromTranscript = (transcript: string): ExtractedParticipant[] => {
    if (!transcript || transcript.trim().length === 0) {
        return [];
    }

    // Regex for email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    const matches = transcript.matchAll(emailPattern);
    const extracted: ExtractedParticipant[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
        const email = match[0].toLowerCase();

        // Skip if we've already seen this email
        if (seen.has(email)) {
            continue;
        }
        seen.add(email);

        // Detect external emails (not from IPG network)
        const isExternal = !email.includes('@momentumww.com') &&
                          !email.includes('@interpublic.') &&
                          !email.includes('@ipgnetwork.') &&
                          !email.match(/@[a-z]+\.ipg/); // Match any *.ipg domains

        extracted.push({
            rawText: email,
            email,
            source: 'transcript-email',
            isExternal
        });
    }

    return extracted;
};

/**
 * Extracts both names and emails from transcript
 * @param transcript The meeting transcript text
 * @returns Combined array of all extracted participants
 */
export const extractAllParticipants = (transcript: string): ExtractedParticipant[] => {
    const names = extractNamesFromTranscript(transcript);
    const emails = extractEmailsFromTranscript(transcript);
    return [...names, ...emails];
};

/**
 * Converts Teams display name format to standard display name
 * "Bustos, Luis" → "Luis Bustos"
 * "Smith-Jones, Mary Jane" → "Mary Jane Smith-Jones"
 * @param teamsName The name in LastName, FirstName format
 * @returns The name in FirstName LastName format
 */
export const parseTeamsDisplayName = (teamsName: string): string => {
    if (!teamsName || !teamsName.includes(',')) {
        return teamsName;
    }

    const parts = teamsName.split(',').map(p => p.trim());
    if (parts.length !== 2) {
        return teamsName;
    }

    const [lastName, firstName] = parts;
    return `${firstName} ${lastName}`;
};

/**
 * Calculates match confidence between extracted name and Graph API result
 * Uses fuzzy string matching to determine if they're likely the same person
 * @param extractedName The name extracted from transcript
 * @param graphData The user data from Graph API
 * @returns Confidence level: 'high', 'medium', or 'low'
 */
export const calculateMatchConfidence = (
    extractedName: string,
    graphData: GraphData
): 'high' | 'medium' | 'low' => {
    if (!extractedName || !graphData.displayName) {
        return 'low';
    }

    const extracted = extractedName.toLowerCase().trim();
    const graphName = graphData.displayName.toLowerCase().trim();

    // Exact match (case insensitive)
    if (extracted === graphName) {
        return 'high';
    }

    // Check if one contains the other
    if (extracted.includes(graphName) || graphName.includes(extracted)) {
        return 'high';
    }

    // Split into parts and check overlap
    const extractedParts = extracted.split(/\s+/);
    const graphParts = graphName.split(/\s+/);

    // Count matching parts
    const matchingParts = extractedParts.filter(part =>
        graphParts.some(gPart =>
            gPart.includes(part) || part.includes(gPart)
        )
    );

    const matchRatio = matchingParts.length / Math.max(extractedParts.length, graphParts.length);

    if (matchRatio >= 0.8) {
        return 'high';
    } else if (matchRatio >= 0.5) {
        return 'medium';
    } else {
        return 'low';
    }
};

/**
 * Calculates similarity score between two strings using Levenshtein distance
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score between 0 and 1 (1 = identical)
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    // Simple contains check first
    if (longer.includes(shorter)) {
        return 0.8; // Good match if one contains the other
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(s1, s2);
    const maxLength = longer.length;

    return 1 - distance / maxLength;
};

/**
 * Calculates Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Number of single-character edits needed to transform str1 into str2
 */
const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
};

/**
 * Removes duplicate participants based on email or name similarity
 * @param participants Array of extracted participants
 * @returns Deduplicated array
 */
export const deduplicateParticipants = (participants: ExtractedParticipant[]): ExtractedParticipant[] => {
    const seen = new Set<string>();
    const result: ExtractedParticipant[] = [];

    for (const participant of participants) {
        // Use email as unique key if available
        if (participant.email) {
            const emailKey = participant.email.toLowerCase();
            if (seen.has(emailKey)) {
                continue;
            }
            seen.add(emailKey);
        } else if (participant.parsedName) {
            const nameKey = participant.parsedName.toLowerCase();
            if (seen.has(nameKey)) {
                continue;
            }
            seen.add(nameKey);
        }

        result.push(participant);
    }

    return result;
};
