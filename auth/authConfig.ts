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

export const loginRequest = {
    scopes: ["User.Read"]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMePhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};