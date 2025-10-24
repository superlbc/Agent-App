import { useState, useEffect, useCallback } from 'react';
import { Participant, GraphData } from '../types';
import { extractAllParticipants, calculateMatchConfidence, deduplicateParticipants } from '../utils/participantExtraction';
import { searchUsersByDisplayName, searchUserByEmail } from '../utils/graphSearchService';
import { fetchBatchPresence } from '../utils/presenceService';
import { ParsedContact, isExternalEmail } from '../utils/emailListParser';

export interface BatchAddResult {
    added: number;
    matched: number;
    external: number;
    skipped: number; // Already exists
}

export interface BatchAddProgress {
    current: number;
    total: number;
    currentEmail: string;
}

export interface UseParticipantExtractionReturn {
    participants: Participant[];
    isExtracting: boolean;
    extractAndMatch: (transcript: string) => Promise<void>;
    addParticipant: (graphData: GraphData) => void;
    batchAddParticipantsFromEmails: (
        contacts: ParsedContact[],
        source: 'emailList' | 'csv',
        onProgress?: (progress: BatchAddProgress) => void
    ) => Promise<BatchAddResult>;
    removeParticipant: (id: string) => void;
    searchAndMatch: (participantId: string, searchQuery: string) => Promise<GraphData[]>;
    confirmMatch: (participantId: string, graphData: GraphData) => void;
    markAsExternal: (participantId: string, email: string) => void;
    rematchParticipant: (participantId: string) => void;
    clearParticipants: () => void;
}

/**
 * Custom hook for managing participant extraction, matching, and state
 * Handles automatic extraction from transcript and Graph API matching
 */
export const useParticipantExtraction = (): UseParticipantExtractionReturn => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);

    /**
     * Fetches presence for all matched participants with graphId
     */
    const fetchPresenceForParticipants = useCallback(async (participantsList: Participant[]) => {
        const participantsWithIds = participantsList.filter(p => p.matched && p.graphId && !p.isExternal);

        if (participantsWithIds.length === 0) {
            return participantsList;
        }

        try {
            const userIds = participantsWithIds.map(p => p.graphId!);
            const presenceMap = await fetchBatchPresence(userIds);

            return participantsList.map(p => {
                if (p.graphId && presenceMap.has(p.graphId)) {
                    return {
                        ...p,
                        presence: presenceMap.get(p.graphId)
                    };
                }
                return p;
            });
        } catch (error) {
            console.error('[ParticipantExtraction] Failed to fetch presence:', error);
            return participantsList;
        }
    }, []);

    /**
     * Extracts participants from transcript and attempts to match with Graph API
     */
    const extractAndMatch = useCallback(async (transcript: string) => {
        if (!transcript || transcript.trim().length === 0) {
            setParticipants([]);
            return;
        }

        setIsExtracting(true);

        try {
            // Extract all participants (names and emails)
            const extracted = extractAllParticipants(transcript);
            const unique = deduplicateParticipants(extracted);

            console.log(`[ParticipantExtraction] Extracted ${unique.length} participants:`, unique);

            // Create initial participant objects with searching state
            const initialParticipants: Participant[] = unique.map((ext, index) => ({
                id: `participant-${Date.now()}-${index}`,
                extractedText: ext.rawText,
                matched: false,
                isSearching: true,
                source: 'transcript'
            }));

            setParticipants(initialParticipants);

            // Attempt to match each participant with Graph API
            const matchedParticipants = await Promise.all(
                unique.map(async (ext, index) => {
                    const participant = initialParticipants[index];

                    try {
                        let graphData: GraphData | null = null;

                        // Handle external participants differently - don't search Azure AD
                        if (ext.isExternal && ext.email) {
                            console.log(`[ParticipantExtraction] External email detected: ${ext.email} - skipping Azure AD search`);
                            return {
                                ...participant,
                                matched: true,
                                isExternal: true,
                                email: ext.email,
                                displayName: ext.email.split('@')[0], // Use email username as display name
                                isSearching: false,
                                source: 'transcript'
                            };
                        }

                        if (ext.source === 'transcript-email' && ext.email) {
                            // Search by email for internal email extractions
                            console.log(`[ParticipantExtraction] Searching by email: ${ext.email}`);
                            graphData = await searchUserByEmail(ext.email);

                            if (graphData) {
                                console.log(`[ParticipantExtraction] Email match found:`, {
                                    displayName: graphData.displayName,
                                    mail: graphData.mail,
                                    jobTitle: graphData.jobTitle,
                                    companyName: graphData.companyName,
                                    hasPhoto: !!graphData.photoUrl
                                });
                            }
                        } else if (ext.source === 'transcript-name' && ext.parsedName) {
                            // Search by display name for name extractions
                            console.log(`[ParticipantExtraction] Searching by name: "${ext.parsedName}" (from raw: "${ext.rawText}")`);
                            const results = await searchUsersByDisplayName(ext.parsedName);

                            if (results.length > 0) {
                                // Take the first result (already ranked with Momentum priority)
                                const bestMatch = results[0];
                                const confidence = calculateMatchConfidence(ext.parsedName, bestMatch);

                                console.log(`[ParticipantExtraction] Best match for "${ext.parsedName}":`, {
                                    displayName: bestMatch.displayName,
                                    mail: bestMatch.mail,
                                    jobTitle: bestMatch.jobTitle,
                                    companyName: bestMatch.companyName,
                                    department: bestMatch.department,
                                    officeLocation: bestMatch.officeLocation,
                                    hasPhoto: !!bestMatch.photoUrl,
                                    confidence
                                });

                                // Auto-match the top result (already ranked with Momentum priority)
                                graphData = bestMatch;
                                participant.matchConfidence = confidence;
                            } else {
                                console.log(`[ParticipantExtraction] No matches found for "${ext.parsedName}"`);
                            }
                        }

                        if (graphData) {
                            console.log(`[ParticipantExtraction] Creating participant from graphData:`, {
                                id: graphData.id,
                                displayName: graphData.displayName,
                                jobTitle: graphData.jobTitle,
                                department: graphData.department,
                                companyName: graphData.companyName,
                                officeLocation: graphData.officeLocation,
                                email: graphData.mail,
                                hasPhoto: !!graphData.photoUrl
                            });

                            return {
                                ...participant,
                                matched: true,
                                graphId: graphData.id,
                                displayName: graphData.displayName,
                                jobTitle: graphData.jobTitle,
                                department: graphData.department,
                                companyName: graphData.companyName,
                                officeLocation: graphData.officeLocation,
                                email: graphData.mail,
                                photoUrl: graphData.photoUrl,
                                isSearching: false,
                                source: 'transcript'
                            };
                        } else {
                            return {
                                ...participant,
                                matched: false,
                                isSearching: false,
                                source: 'transcript'
                            };
                        }
                    } catch (error) {
                        console.error('Error matching participant:', error);
                        return {
                            ...participant,
                            matched: false,
                            isSearching: false,
                            searchError: 'Failed to search',
                            source: 'transcript'
                        };
                    }
                })
            );

            setParticipants(matchedParticipants);

            // Fetch presence for matched participants
            const participantsWithPresence = await fetchPresenceForParticipants(matchedParticipants);
            setParticipants(participantsWithPresence);
        } catch (error) {
            console.error('Error extracting participants:', error);
        } finally {
            setIsExtracting(false);
        }
    }, [fetchPresenceForParticipants]);

    /**
     * Manually adds a participant from Graph API data
     */
    const addParticipant = useCallback(async (graphData: GraphData) => {
        // Check if participant already exists by email
        const exists = participants.some(p => p.email === graphData.mail);
        if (exists) {
            console.warn('Participant already exists:', graphData.mail);
            return;
        }

        const newParticipant: Participant = {
            id: `participant-manual-${Date.now()}`,
            extractedText: graphData.displayName || graphData.mail || 'Unknown',
            matched: true,
            matchConfidence: 'high',
            graphId: graphData.id,
            displayName: graphData.displayName,
            jobTitle: graphData.jobTitle,
            department: graphData.department,
            companyName: graphData.companyName,
            officeLocation: graphData.officeLocation,
            email: graphData.mail,
            photoUrl: graphData.photoUrl,
            source: 'manual'
        };

        const updatedList = [...participants, newParticipant];
        setParticipants(updatedList);

        // Fetch presence
        const withPresence = await fetchPresenceForParticipants(updatedList);
        setParticipants(withPresence);
    }, [participants, fetchPresenceForParticipants]);

    /**
     * Removes a participant from the list
     */
    const removeParticipant = useCallback((id: string) => {
        setParticipants(prev => prev.filter(p => p.id !== id));
    }, []);

    /**
     * Searches Graph API for potential matches for an unmatched participant
     */
    const searchAndMatch = useCallback(async (participantId: string, searchQuery: string): Promise<GraphData[]> => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            return [];
        }

        // Update participant to searching state
        setParticipants(prev =>
            prev.map(p =>
                p.id === participantId
                    ? { ...p, isSearching: true, searchError: undefined }
                    : p
            )
        );

        try {
            const { searchUsersMultiField } = await import('../utils/graphSearchService');
            const results = await searchUsersMultiField(searchQuery);

            // Clear searching state
            setParticipants(prev =>
                prev.map(p =>
                    p.id === participantId
                        ? { ...p, isSearching: false }
                        : p
                )
            );

            return results;
        } catch (error) {
            console.error('Error searching for participant match:', error);

            setParticipants(prev =>
                prev.map(p =>
                    p.id === participantId
                        ? { ...p, isSearching: false, searchError: 'Search failed' }
                        : p
                )
            );

            return [];
        }
    }, []);

    /**
     * Confirms a match between an unmatched participant and Graph API data
     */
    const confirmMatch = useCallback(async (participantId: string, graphData: GraphData) => {
        const updatedList = participants.map(p =>
            p.id === participantId
                ? {
                    ...p,
                    matched: true,
                    matchConfidence: 'high' as const,
                    graphId: graphData.id,
                    displayName: graphData.displayName,
                    jobTitle: graphData.jobTitle,
                    department: graphData.department,
                    companyName: graphData.companyName,
                    officeLocation: graphData.officeLocation,
                    email: graphData.mail,
                    photoUrl: graphData.photoUrl,
                    isSearching: false,
                    searchError: undefined
                }
                : p
        );

        setParticipants(updatedList);

        // Fetch presence
        const withPresence = await fetchPresenceForParticipants(updatedList);
        setParticipants(withPresence);
    }, [participants, fetchPresenceForParticipants]);

    /**
     * Marks an unmatched participant as external with their email
     */
    const markAsExternal = useCallback((participantId: string, email: string) => {
        setParticipants(prev =>
            prev.map(p =>
                p.id === participantId
                    ? {
                        ...p,
                        matched: true,
                        isExternal: true,
                        email,
                        displayName: email.split('@')[0],
                        matchConfidence: 'high',
                        isSearching: false,
                        searchError: undefined
                    }
                    : p
            )
        );
    }, []);

    /**
     * Clears a matched participant back to unmatched state for re-matching
     */
    const rematchParticipant = useCallback((participantId: string) => {
        setParticipants(prev =>
            prev.map(p =>
                p.id === participantId
                    ? {
                        id: p.id,
                        extractedText: p.extractedText,
                        matched: false,
                        isSearching: false
                    }
                    : p
            )
        );
    }, []);

    /**
     * Batch adds participants from email list or CSV
     * Automatically matches with Graph API and handles external contacts
     */
    const batchAddParticipantsFromEmails = useCallback(async (
        contacts: ParsedContact[],
        source: 'emailList' | 'csv',
        onProgress?: (progress: BatchAddProgress) => void
    ): Promise<BatchAddResult> => {
        const result: BatchAddResult = {
            added: 0,
            matched: 0,
            external: 0,
            skipped: 0
        };

        const newParticipants: Participant[] = [];
        const existingEmails = new Set(participants.map(p => p.email?.toLowerCase()).filter(Boolean));
        const total = contacts.length;

        console.log(`[BatchAdd] Processing ${total} contacts from ${source}`);

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const email = contact.email.toLowerCase();

            // Report progress
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total,
                    currentEmail: email
                });
            }

            // Skip if already exists
            if (existingEmails.has(email)) {
                console.log(`[BatchAdd] Skipping duplicate: ${email}`);
                result.skipped++;
                continue;
            }

            existingEmails.add(email);

            // Check if external
            const isExternal = isExternalEmail(email);

            if (isExternal) {
                // Add as external participant
                const externalParticipant: Participant = {
                    id: `participant-${source}-${Date.now()}-${result.added}`,
                    extractedText: contact.name || email,
                    matched: true,
                    isExternal: true,
                    email,
                    displayName: contact.name || email.split('@')[0],
                    source,
                    attendanceType: contact.attendanceType,
                    acceptanceStatus: contact.acceptanceStatus
                };

                newParticipants.push(externalParticipant);
                result.added++;
                result.external++;
                console.log(`[BatchAdd] Added external: ${email}`);
            } else {
                // Try to match with Graph API
                try {
                    const graphData = await searchUserByEmail(email);

                    if (graphData) {
                        // Successfully matched - log full profile data
                        console.log(`[BatchAdd] Graph API returned for ${email}:`, {
                            id: graphData.id,
                            displayName: graphData.displayName,
                            jobTitle: graphData.jobTitle,
                            department: graphData.department,
                            companyName: graphData.companyName,
                            officeLocation: graphData.officeLocation,
                            mail: graphData.mail,
                            hasPhoto: !!graphData.photoUrl
                        });

                        const matchedParticipant: Participant = {
                            id: `participant-${source}-${Date.now()}-${result.added}`,
                            extractedText: contact.name || email,
                            matched: true,
                            matchConfidence: 'high',
                            graphId: graphData.id,
                            displayName: graphData.displayName,
                            jobTitle: graphData.jobTitle,
                            department: graphData.department,
                            companyName: graphData.companyName,
                            officeLocation: graphData.officeLocation,
                            email: graphData.mail,
                            photoUrl: graphData.photoUrl,
                            source,
                            attendanceType: contact.attendanceType,
                            acceptanceStatus: contact.acceptanceStatus
                        };

                        console.log(`[BatchAdd] Created participant:`, {
                            displayName: matchedParticipant.displayName,
                            jobTitle: matchedParticipant.jobTitle,
                            department: matchedParticipant.department,
                            companyName: matchedParticipant.companyName,
                            officeLocation: matchedParticipant.officeLocation,
                            email: matchedParticipant.email,
                            hasPhoto: !!matchedParticipant.photoUrl
                        });

                        newParticipants.push(matchedParticipant);
                        result.added++;
                        result.matched++;
                        console.log(`[BatchAdd] Matched internal: ${graphData.displayName} (${email})`);
                    } else {
                        // No match found - add as external
                        const unmatchedParticipant: Participant = {
                            id: `participant-${source}-${Date.now()}-${result.added}`,
                            extractedText: contact.name || email,
                            matched: true,
                            isExternal: true,
                            email,
                            displayName: contact.name || email.split('@')[0],
                            source,
                            attendanceType: contact.attendanceType,
                            acceptanceStatus: contact.acceptanceStatus
                        };

                        newParticipants.push(unmatchedParticipant);
                        result.added++;
                        result.external++;
                        console.log(`[BatchAdd] No match found, added as external: ${email}`);
                    }
                } catch (error) {
                    console.error(`[BatchAdd] Error matching ${email}:`, error);
                    // On error, add as external
                    const errorParticipant: Participant = {
                        id: `participant-${source}-${Date.now()}-${result.added}`,
                        extractedText: contact.name || email,
                        matched: true,
                        isExternal: true,
                        email,
                        displayName: contact.name || email.split('@')[0],
                        source,
                        attendanceType: contact.attendanceType,
                        acceptanceStatus: contact.acceptanceStatus
                    };

                    newParticipants.push(errorParticipant);
                    result.added++;
                    result.external++;
                }
            }
        }

        // Update participants list
        const updatedList = [...participants, ...newParticipants];
        setParticipants(updatedList);

        // Fetch presence for all matched internal participants
        const withPresence = await fetchPresenceForParticipants(updatedList);
        setParticipants(withPresence);

        console.log(`[BatchAdd] Complete:`, result);
        return result;
    }, [participants, fetchPresenceForParticipants]);

    /**
     * Clears all participants
     */
    const clearParticipants = useCallback(() => {
        setParticipants([]);
    }, []);

    return {
        participants,
        isExtracting,
        extractAndMatch,
        addParticipant,
        batchAddParticipantsFromEmails,
        removeParticipant,
        searchAndMatch,
        confirmMatch,
        markAsExternal,
        rematchParticipant,
        clearParticipants
    };
};
