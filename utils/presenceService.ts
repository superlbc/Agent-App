import { PresenceData } from '../types';
import { getGraphToken } from './graphSearchService';

const PRESENCE_CACHE_DURATION = 60000; // 60 seconds
const presenceCache = new Map<string, { data: PresenceData; timestamp: number }>();

/**
 * Fetch presence for a single user
 * @param userId Graph API user ID
 * @returns PresenceData or null if failed
 */
export async function fetchUserPresence(userId: string): Promise<PresenceData | null> {
    // Check cache first
    const cached = presenceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < PRESENCE_CACHE_DURATION) {
        return cached.data;
    }

    try {
        const token = await getGraphToken();
        const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/presence`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                console.warn('[Presence] Missing Presence.Read permission. User needs to add Presence.Read.All to Azure App Registration.');
                return null;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const presenceData: PresenceData = {
            availability: normalizeAvailability(data.availability),
            activity: data.activity,
            lastUpdated: Date.now()
        };

        // Cache the result
        presenceCache.set(userId, { data: presenceData, timestamp: Date.now() });

        return presenceData;
    } catch (error) {
        console.error('[Presence] Failed to fetch presence for user:', userId, error);
        return null;
    }
}

/**
 * Batch fetch presence for multiple users
 * @param userIds Array of Graph API user IDs
 * @returns Map of userId -> PresenceData
 */
export async function fetchBatchPresence(userIds: string[]): Promise<Map<string, PresenceData>> {
    const results = new Map<string, PresenceData>();

    // Filter out users we already have in cache
    const now = Date.now();
    const uncachedIds: string[] = [];

    for (const userId of userIds) {
        const cached = presenceCache.get(userId);
        if (cached && now - cached.timestamp < PRESENCE_CACHE_DURATION) {
            results.set(userId, cached.data);
        } else {
            uncachedIds.push(userId);
        }
    }

    // If all are cached, return immediately
    if (uncachedIds.length === 0) {
        return results;
    }

    // Batch request using $batch endpoint (max 20 requests per batch)
    const batchSize = 20;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        const batchResults = await fetchPresenceBatch(batch);
        batchResults.forEach((data, userId) => {
            results.set(userId, data);
            presenceCache.set(userId, { data, timestamp: now });
        });
    }

    return results;
}

/**
 * Fetch presence for a batch of users using Graph API $batch endpoint
 */
async function fetchPresenceBatch(userIds: string[]): Promise<Map<string, PresenceData>> {
    const results = new Map<string, PresenceData>();

    try {
        const token = await getGraphToken();

        // Build batch requests
        const requests = userIds.map((userId, index) => ({
            id: index.toString(),
            method: 'GET',
            url: `/users/${userId}/presence`
        }));

        const response = await fetch('https://graph.microsoft.com/v1.0/$batch', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const batchResponse = await response.json();

        // Process responses
        for (const resp of batchResponse.responses) {
            const userId = userIds[parseInt(resp.id)];

            if (resp.status === 200 && resp.body) {
                results.set(userId, {
                    availability: normalizeAvailability(resp.body.availability),
                    activity: resp.body.activity,
                    lastUpdated: Date.now()
                });
            } else if (resp.status === 403 || resp.status === 401) {
                console.warn('[Presence] Missing Presence.Read permission for user:', userId);
            }
        }
    } catch (error) {
        console.error('[Presence] Batch fetch failed:', error);
    }

    return results;
}

/**
 * Normalize availability to match our PresenceData type
 */
function normalizeAvailability(availability: string): PresenceData['availability'] {
    const normalized = availability as PresenceData['availability'];

    // Map common values
    const validValues: PresenceData['availability'][] = [
        'Available',
        'AvailableIdle',
        'Away',
        'BeRightBack',
        'Busy',
        'BusyIdle',
        'DoNotDisturb',
        'Offline',
        'PresenceUnknown'
    ];

    if (validValues.includes(normalized)) {
        return normalized;
    }

    return 'PresenceUnknown';
}

/**
 * Clear presence cache (useful when user logs out or refreshes)
 */
export function clearPresenceCache(): void {
    presenceCache.clear();
}

/**
 * Get presence color for UI display
 */
export function getPresenceColor(availability: PresenceData['availability']): string {
    switch (availability) {
        case 'Available':
        case 'AvailableIdle':
            return 'green';
        case 'Busy':
        case 'BusyIdle':
        case 'DoNotDisturb':
            return 'red';
        case 'Away':
        case 'BeRightBack':
            return 'yellow';
        case 'Offline':
        case 'PresenceUnknown':
        default:
            return 'gray';
    }
}

/**
 * Get presence display text
 */
export function getPresenceText(availability: PresenceData['availability'], activity?: string): string {
    if (activity && activity !== 'Available') {
        return activity;
    }

    switch (availability) {
        case 'Available':
            return 'Available';
        case 'AvailableIdle':
            return 'Available';
        case 'Busy':
            return 'Busy';
        case 'BusyIdle':
            return 'Busy';
        case 'DoNotDisturb':
            return 'Do not disturb';
        case 'Away':
            return 'Away';
        case 'BeRightBack':
            return 'Be right back';
        case 'Offline':
            return 'Offline';
        case 'PresenceUnknown':
        default:
            return 'Unknown';
    }
}
