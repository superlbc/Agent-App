import { msalInstance, loginRequest } from '../auth/authConfig';
import { GraphData } from '../types';

/**
 * Fetches a specific user's profile data from Microsoft Graph API by email
 * @param userEmail The email address of the user to fetch
 * @returns GraphData with user's display name, job title, mail, and photo
 */
export const fetchUserByEmail = async (userEmail: string): Promise<GraphData | null> => {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            console.warn('No active accounts found');
            return null;
        }

        // Acquire token silently - we need User.Read.All or User.ReadBasic.All to read other users
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            scopes: ["User.Read", "User.ReadBasic.All"], // Add scope to read other users
            account: accounts[0]
        });

        const headers = { Authorization: `Bearer ${response.accessToken}` };

        // Encode email for URL
        const encodedEmail = encodeURIComponent(userEmail);

        // Fetch user profile by email
        const profileEndpoint = `https://graph.microsoft.com/v1.0/users/${encodedEmail}`;
        const photoEndpoint = `https://graph.microsoft.com/v1.0/users/${encodedEmail}/photo/$value`;

        const fetchProfile = fetch(profileEndpoint, { headers }).then(res => {
            if (!res.ok) {
                throw new Error(`Failed to fetch user profile: ${res.status}`);
            }
            return res.json();
        });

        const fetchPhoto = fetch(photoEndpoint, { headers }).then(res =>
            res.ok ? res.blob() : null
        ).catch(() => null); // Photo might not exist, that's ok

        const [profileData, photoBlob] = await Promise.all([fetchProfile, fetchPhoto]);

        const photoUrl = photoBlob ? URL.createObjectURL(photoBlob) : undefined;

        return {
            displayName: profileData.displayName,
            jobTitle: profileData.jobTitle,
            mail: profileData.mail,
            photoUrl: photoUrl,
        };
    } catch (error) {
        console.error(`Failed to fetch user data for ${userEmail}:`, error);
        return null;
    }
};
