import { msalInstance, loginRequest } from '../auth/authConfig';
import { GraphData } from '../types';

/**
 * Get a Graph API access token
 * @returns Access token string
 */
export const getGraphToken = async (): Promise<string> => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
        throw new Error('No active accounts found');
    }

    const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        scopes: ["User.Read", "User.ReadBasic.All", "Presence.Read.All"],
        account: accounts[0]
    });

    return response.accessToken;
};

/**
 * Searches for users in Microsoft Graph API by display name (fuzzy search)
 * Uses $search parameter with ConsistencyLevel header for substring matching
 * @param name The display name to search for (e.g., "Luis Bustos")
 * @returns Array of matching users with their profile data
 */
export const searchUsersByDisplayName = async (name: string): Promise<GraphData[]> => {
    const trimmedName = name?.trim();

    if (!trimmedName || trimmedName.length < 2) {
        return [];
    }

    try {
        console.log(`[GraphSearch] Searching for name: "${trimmedName}"`);

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            console.warn('No active accounts found');
            return [];
        }

        // Acquire token (User.ReadBasic.All for now, will be User.Read.All when admin consent granted)
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            scopes: ["User.Read", "User.ReadBasic.All"],
            account: accounts[0]
        });

        const headers = {
            'Authorization': `Bearer ${response.accessToken}`,
            'ConsistencyLevel': 'eventual' // Required for advanced $search queries
        };

        // Use $search for fuzzy matching on displayName
        const searchQuery = encodeURIComponent(`"displayName:${trimmedName}"`);
        const endpoint = `https://graph.microsoft.com/v1.0/users?$search=${searchQuery}&$select=displayName,jobTitle,department,mail,companyName,officeLocation,userPrincipalName,accountEnabled,id&$top=30`;

        console.log(`[GraphSearch] Endpoint: ${endpoint}`);

        const searchResponse = await fetch(endpoint, { headers });

        if (!searchResponse.ok) {
            console.error(`Graph API search failed: ${searchResponse.status} ${searchResponse.statusText}`);
            return [];
        }

        const data = await searchResponse.json();

        console.log(`[GraphSearch] Found ${data.value?.length || 0} total results`);

        if (!data.value || !Array.isArray(data.value)) {
            return [];
        }

        // Log all results before filtering
        data.value.forEach((user: any) => {
            console.log(`[GraphSearch] User: ${user.displayName}, Company: ${user.companyName || 'N/A'}, UPN: ${user.userPrincipalName}, Enabled: ${user.accountEnabled}`);
        });

        // Filter for automatic matching: IPG network users, enabled accounts, no external users
        const ipgUsers = data.value.filter((user: any) => {
            const userPrincipalName = user.userPrincipalName || '';
            const mail = user.mail || '';
            const accountEnabled = user.accountEnabled;

            const isNotExternal = !userPrincipalName.includes('#EXT#');
            // Consider null as enabled (not explicitly disabled)
            const isEnabled = accountEnabled === true || accountEnabled === null;
            // Check if IPG network email
            const isIPGNetwork = mail.toLowerCase().includes('@momentumww.com') ||
                                mail.toLowerCase().includes('@interpublic.') ||
                                mail.toLowerCase().includes('@ipgnetwork.') ||
                                userPrincipalName.toLowerCase().includes('@momentumww.com') ||
                                userPrincipalName.toLowerCase().includes('@interpublic.') ||
                                userPrincipalName.toLowerCase().includes('@ipgnetwork.');

            const passes = isNotExternal && isEnabled && isIPGNetwork;

            console.log(`[GraphSearch] ${user.displayName}: NotExt=${isNotExternal}, Enabled=${isEnabled}, IPG=${isIPGNetwork} => ${passes ? 'PASS' : 'FILTERED OUT'}`);

            return passes;
        });

        console.log(`[GraphSearch] After filtering: ${ipgUsers.length} IPG network users`);

        // Rank results by quality score (best match first)
        const rankedUsers = ipgUsers.map((user: any) => {
            let score = 0;

            // Prefer explicitly enabled accounts over null
            if (user.accountEnabled === true) score += 10;

            // CRITICAL: Momentum accounts MUST always rank highest - this is the PRIMARY sort criteria
            const companyName = (user.companyName || '').toLowerCase();
            const userEmail = (user.mail || user.userPrincipalName || '').toLowerCase();
            const userDisplayName = (user.displayName || '').toLowerCase();

            const isMomentumAccount = companyName.includes('momentum') || userEmail.includes('@momentumww.com');
            if (isMomentumAccount) {
                score += 200; // MUST be higher than exact match bonus to ensure Momentum always wins
            }

            // Prefer users with company name populated
            if (user.companyName) score += 3;

            // Prefer exact or close display name matches
            const searchName = trimmedName.toLowerCase();
            if (userDisplayName === searchName) {
                score += 100; // Exact match
            } else if (userDisplayName.includes(searchName) || searchName.includes(userDisplayName)) {
                score += 10; // Partial match
            }

            // STRONG PENALTY: Admin accounts (e.g., "Admin.Sebastian.Jouhans")
            // Check both displayName and email for "admin"
            if (userDisplayName.includes('admin') || userEmail.includes('admin')) {
                score -= 50; // Heavy penalty to deprioritize admin accounts
            }

            // STRONG PENALTY: Test/service accounts
            if (userDisplayName.includes('test') || userEmail.includes('test')) {
                score -= 40;
            }
            if (userDisplayName.includes('svc') || userEmail.includes('svc')) {
                score -= 40;
            }

            // PENALTY: Numbered accounts (e.g., "luis.bustos5@" or "luis.bustos.4@")
            // Match patterns like: digits before @, digits at end of name part
            const nameBeforeAt = userEmail.split('@')[0];
            if (/\d+$/.test(nameBeforeAt) || /\.\d+$/.test(nameBeforeAt)) {
                score -= 30; // Numbered accounts rank lower than clean accounts
            }

            return { user, score };
        });

        // Sort by score (descending) and take users
        rankedUsers.sort((a: {user: any, score: number}, b: {user: any, score: number}) => b.score - a.score);

        console.log('[GraphSearch] Ranked results:');
        rankedUsers.forEach((ranked: {user: any, score: number}, idx: number) => {
            console.log(`  ${idx + 1}. ${ranked.user.displayName} (${ranked.user.mail}) - Score: ${ranked.score}`);
        });

        // Fetch photos for each user in parallel
        const usersWithPhotos = await Promise.all(
            rankedUsers.map(async (ranked: {user: any, score: number}) => {
                const user = ranked.user;
                const photoUrl = await fetchUserPhoto(user.id, response.accessToken);
                return {
                    id: user.id,
                    displayName: user.displayName,
                    jobTitle: user.jobTitle,
                    department: user.department,
                    companyName: user.companyName,
                    officeLocation: user.officeLocation,
                    mail: user.mail,
                    photoUrl: photoUrl
                } as GraphData;
            })
        );

        return usersWithPhotos;
    } catch (error) {
        console.error(`Failed to search users by display name "${name}":`, error);
        return [];
    }
};

/**
 * Searches for a user by exact email address
 * @param email The email address to search for
 * @returns User profile data or null if not found
 */
export const searchUserByEmail = async (email: string): Promise<GraphData | null> => {
    if (!email || !email.includes('@')) {
        return null;
    }

    try {
        console.log(`[GraphSearch] Searching by email: ${email}`);

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            console.warn('No active accounts found');
            return null;
        }

        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            scopes: ["User.Read", "User.ReadBasic.All"],
            account: accounts[0]
        });

        const headers = { 'Authorization': `Bearer ${response.accessToken}` };

        // Encode email for URL
        const encodedEmail = encodeURIComponent(email);
        const endpoint = `https://graph.microsoft.com/v1.0/users/${encodedEmail}?$select=displayName,jobTitle,department,mail,companyName,officeLocation,userPrincipalName,accountEnabled,id`;

        console.log(`[GraphSearch] Email lookup endpoint: ${endpoint}`);

        const userResponse = await fetch(endpoint, { headers });

        if (!userResponse.ok) {
            console.warn(`User not found for email: ${email}`);
            return null;
        }

        const user = await userResponse.json();

        // Log full profile details for debugging
        console.log(`[GraphSearch] User found by email:`, {
            displayName: user.displayName,
            mail: user.mail,
            companyName: user.companyName,
            userPrincipalName: user.userPrincipalName,
            accountEnabled: user.accountEnabled,
            jobTitle: user.jobTitle,
            department: user.department
        });

        // Check if user would pass auto-match filters
        const isNotExternal = user.userPrincipalName && !user.userPrincipalName.includes('#EXT#');
        const isEnabled = user.accountEnabled === true;
        const isMomentum = user.companyName && user.companyName.toLowerCase().includes('momentum');

        console.log(`[GraphSearch] Auto-match filter check: NotExt=${isNotExternal}, Enabled=${isEnabled}, Momentum=${isMomentum} => Would ${isNotExternal && isEnabled && isMomentum ? 'PASS' : 'FAIL'}`);

        const photoUrl = await fetchUserPhoto(user.id, response.accessToken);

        return {
            id: user.id,
            displayName: user.displayName,
            jobTitle: user.jobTitle,
            department: user.department,
            companyName: user.companyName,
            officeLocation: user.officeLocation,
            mail: user.mail,
            photoUrl: photoUrl
        };
    } catch (error) {
        console.error(`Failed to search user by email "${email}":`, error);
        return null;
    }
};

/**
 * Multi-field search across displayName, mail, and userPrincipalName
 * Best for general search when user types in search box
 * @param query The search query string
 * @returns Array of matching users
 */
export const searchUsersMultiField = async (query: string): Promise<GraphData[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            console.warn('No active accounts found');
            return [];
        }

        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            scopes: ["User.Read", "User.ReadBasic.All"],
            account: accounts[0]
        });

        const headers = {
            'Authorization': `Bearer ${response.accessToken}`,
            'ConsistencyLevel': 'eventual'
        };

        // Search across multiple fields using OR
        const searchQuery = encodeURIComponent(`"displayName:${query}" OR "mail:${query}"`);
        const endpoint = `https://graph.microsoft.com/v1.0/users?$search=${searchQuery}&$select=displayName,jobTitle,department,mail,companyName,officeLocation,id&$top=30`;

        const searchResponse = await fetch(endpoint, { headers });

        if (!searchResponse.ok) {
            console.error(`Graph API multi-field search failed: ${searchResponse.status} ${searchResponse.statusText}`);
            return [];
        }

        const data = await searchResponse.json();

        if (!data.value || !Array.isArray(data.value)) {
            return [];
        }

        // Apply same ranking logic as searchUsersByDisplayName
        const rankedUsers = data.value.map((user: any) => {
            let score = 0;

            // Prefer explicitly enabled accounts over null
            if (user.accountEnabled === true) score += 10;

            // CRITICAL: Momentum accounts MUST always rank highest - this is the PRIMARY sort criteria
            const companyName = (user.companyName || '').toLowerCase();
            const userEmail = (user.mail || user.userPrincipalName || '').toLowerCase();
            const userDisplayName = (user.displayName || '').toLowerCase();
            const searchQuery = query.toLowerCase();

            const isMomentumAccount = companyName.includes('momentum') || userEmail.includes('@momentumww.com');
            if (isMomentumAccount) {
                score += 200; // MUST be higher than exact match bonus to ensure Momentum always wins
            }

            // Prefer users with company name populated
            if (user.companyName) score += 3;

            // Prefer exact or close display name/email matches
            if (userDisplayName === searchQuery || userEmail === searchQuery) {
                score += 100; // Exact match
            } else if (userDisplayName.includes(searchQuery) || searchQuery.includes(userDisplayName) ||
                       userEmail.includes(searchQuery) || searchQuery.includes(userEmail)) {
                score += 10; // Partial match
            }

            // STRONG PENALTY: Admin accounts
            if (userDisplayName.includes('admin') || userEmail.includes('admin')) {
                score -= 50;
            }

            // STRONG PENALTY: Test/service accounts
            if (userDisplayName.includes('test') || userEmail.includes('test')) {
                score -= 40;
            }
            if (userDisplayName.includes('svc') || userEmail.includes('svc')) {
                score -= 40;
            }

            // PENALTY: Numbered accounts
            const nameBeforeAt = userEmail.split('@')[0];
            if (/\d+$/.test(nameBeforeAt) || /\.\d+$/.test(nameBeforeAt)) {
                score -= 30;
            }

            return { user, score };
        });

        // Sort by score descending
        rankedUsers.sort((a, b) => b.score - a.score);

        console.log('[GraphSearch] Multi-field ranked results:');
        rankedUsers.slice(0, 10).forEach((ranked, idx) => {
            console.log(`  ${idx + 1}. ${ranked.user.displayName} (${ranked.user.mail}) - Score: ${ranked.score}`);
        });

        // Fetch photos in parallel for ranked users
        const usersWithPhotos = await Promise.all(
            rankedUsers.map(async (ranked) => {
                const user = ranked.user;
                const photoUrl = await fetchUserPhoto(user.id, response.accessToken);
                return {
                    id: user.id,
                    displayName: user.displayName,
                    jobTitle: user.jobTitle,
                    department: user.department,
                    companyName: user.companyName,
                    officeLocation: user.officeLocation,
                    mail: user.mail,
                    photoUrl: photoUrl
                } as GraphData;
            })
        );

        return usersWithPhotos;
    } catch (error) {
        console.error(`Failed to search users with query "${query}":`, error);
        return [];
    }
};

/**
 * Helper function to fetch user photo
 * @param userId The user's Graph API ID
 * @param accessToken The access token for authentication
 * @returns Photo URL or undefined if not available
 */
const fetchUserPhoto = async (userId: string, accessToken: string): Promise<string | undefined> => {
    try {
        const photoEndpoint = `https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`;
        const photoResponse = await fetch(photoEndpoint, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob();
            return URL.createObjectURL(photoBlob);
        }
    } catch (error) {
        // Photo fetch failures are non-critical, return undefined
    }
    return undefined;
};
