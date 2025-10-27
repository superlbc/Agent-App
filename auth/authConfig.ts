import { PublicClientApplication, Configuration, LogLevel } from "@azure/msal-browser";

export const getRedirectUri = (): string => {
    // Fully dynamic - uses the current origin (protocol + hostname + port)
    // Works for localhost, Cloud Run, and any future deployment URLs
    // IMPORTANT: All redirect URIs must be registered in Azure AD app registration
    return window.location.origin;
};

// IMPORTANT: The authority must be a full URL.
const MSAL_CLIENT_ID = "5fa64631-ea56-4676-b6d5-433d322a4da1";
const MSAL_TENANT_ID = "d026e4c1-5892-497a-b9da-ee493c9f0364";

// Azure AD Security Group for Momentum Worldwide users
// Group Name: "MOM WW All Users 1 SG"
export const REQUIRED_GROUP_ID = "2c08b5d8-7def-4845-a48c-740b987dcffb";

// Azure AD Security Group for Admin users (Settings Access)
// TODO: Replace with actual admin security group ID when created
// Currently using the same group as REQUIRED_GROUP_ID as a placeholder
export const ADMIN_GROUP_ID = "2c08b5d8-7def-4845-a48c-740b987dcffb";

export const msalConfig: Configuration = {
    auth: {
        clientId: MSAL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
        redirectUri: getRedirectUri(),
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        // console.info(message); // Uncomment for verbose logging
                        return;
                    case LogLevel.Verbose:
                        // console.debug(message); // Uncomment for verbose logging
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// IMPORTANT: User.Read.All requires admin consent from IPG IT
// When approved, change User.ReadBasic.All to User.Read.All below to enable full profile data
// (job title, department, company, office location) for all users

// Combined scopes for all features - user consents once at login
export const loginRequest = {
    scopes: [
        "User.Read",                        // Sign in and read user profile
        "User.Read.All",                    // Read full profiles of all users (participant matching) - ADMIN APPROVED
        "Presence.Read.All",                // Read presence status (participant matching)
        "Calendars.Read",                   // Read user's calendar (meeting selection)
        "OnlineMeetings.Read",              // Read meeting details (meeting selection)
        "OnlineMeetingTranscript.Read.All", // Read meeting transcripts (Graph API) - ADMIN APPROVED
        "Files.Read",                       // Read OneDrive/Teams Files (transcript retrieval fallback)
        "profile"                           // OpenID Connect profile
    ]
};

// Alias for meeting selection feature - uses same scopes as loginRequest
// Kept for backwards compatibility with code that references this
export const meetingSelectionScopes = {
    scopes: [
        "User.Read",                        // User profile
        "Calendars.Read",                   // Read user's calendar
        "OnlineMeetings.Read",              // Read meeting details
        "OnlineMeetingTranscript.Read.All", // Read meeting transcripts - ADMIN APPROVED
        "Files.Read"                        // Read OneDrive/Teams Files (for transcripts)
    ]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMePhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};