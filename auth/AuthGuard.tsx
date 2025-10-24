import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { BrowserAuthError, AccountInfo } from "@azure/msal-browser";
import { msalInstance, loginRequest, graphConfig, getRedirectUri, REQUIRED_GROUP_ID, ADMIN_GROUP_ID } from './authConfig';
import { AuthContext } from '../contexts/AuthContext';
import { GraphData } from '../types';
import { SignInPage } from './SignInPage';
import { LoadingModal } from '../components/ui/LoadingModal';
import { AccessDenied } from './AccessDenied';
import { telemetryService, AccessDeniedEventPayload } from '../utils/telemetryService';
import { getBrowserContext } from '../utils/browserContext';

const isInAiStudio = () => {
    try {
        if ((window as any).google?.aistudio?.inAiStudio) {
            return true;
        }
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
};

const MockAuthenticatedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Try to get real user from MSAL if available, otherwise use mock
    const accounts = msalInstance.getAllAccounts();
    const realAccount = accounts.length > 0 ? accounts[0] : null;

    const devEmail = realAccount ? `${realAccount.username}` : 'dev-user@localhost.com';
    const devName = realAccount ? `${realAccount.name || 'Dev User'} (Dev)` : 'Dev User (Local)';

    const mockUser: AccountInfo = {
        homeAccountId: realAccount?.homeAccountId || 'mock-home-account-id',
        environment: realAccount?.environment || 'mock-env',
        tenantId: realAccount?.tenantId || 'mock-tenant-id',
        username: devEmail,
        localAccountId: realAccount?.localAccountId || 'mock-local-account-id',
        name: devName,
    };

    const mockGraphData: GraphData = {
        displayName: devName,
        jobTitle: realAccount ? 'Development Mode' : 'Lead Prompt Engineer',
        mail: devEmail,
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: true, isAuthorized: true, isAdmin: true, user: mockUser, graphData: mockGraphData, logout: () => console.log("Mock logout") }}>
            {children}
        </AuthContext.Provider>
    );
};

// Helper function to check if user is in the required Azure AD group
const checkGroupMembership = (account: AccountInfo | null): boolean => {
    if (!account) return false;

    // Check if the idTokenClaims contains the groups claim
    const claims = account.idTokenClaims as any;

    if (claims && claims.groups && Array.isArray(claims.groups)) {
        // Check if our required group ID is in the groups array
        const isMember = claims.groups.includes(REQUIRED_GROUP_ID);
        console.log('Group membership check:', {
            userEmail: account.username,
            requiredGroup: REQUIRED_GROUP_ID,
            userGroups: claims.groups,
            isMember
        });

        // Track access denied event if user is not in the required group
        if (!isMember) {
            trackAccessDenied(account, claims.groups || []);
        }

        return isMember;
    }

    // If groups claim is not present, deny access (token configuration may not be correct)
    console.warn('Groups claim not found in token. User access denied by default.');

    // Track access denied with empty groups array
    trackAccessDenied(account, []);

    return false;
};

// Helper function to check if user is in the admin Azure AD group (for settings access)
const checkAdminMembership = (account: AccountInfo | null): boolean => {
    if (!account) return false;

    // Check if the idTokenClaims contains the groups claim
    const claims = account.idTokenClaims as any;

    if (claims && claims.groups && Array.isArray(claims.groups)) {
        // Check if the admin group ID is in the groups array
        const isAdmin = claims.groups.includes(ADMIN_GROUP_ID);
        console.log('Admin membership check:', {
            userEmail: account.username,
            adminGroup: ADMIN_GROUP_ID,
            userGroups: claims.groups,
            isAdmin
        });

        return isAdmin;
    }

    // If groups claim is not present, deny admin access by default
    console.warn('Groups claim not found in token. Admin access denied by default.');
    return false;
};

// Helper function to track access denied telemetry
const trackAccessDenied = (account: AccountInfo, userGroups: string[]): void => {
    try {
        // Get browser context for additional data
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const browserContext = getBrowserContext(isDarkMode);

        const payload: AccessDeniedEventPayload = {
            userName: account.name || 'Unknown',
            userEmail: account.username,
            userId: account.localAccountId,
            tenantId: account.tenantId || '',
            requiredGroupId: REQUIRED_GROUP_ID,
            requiredGroupName: 'MOM WW All Users 1 SG',
            userGroups: userGroups,
            browser: browserContext.browser,
            platform: browserContext.platform,
            deviceType: browserContext.deviceType,
        };

        // Set user context first
        telemetryService.setUser(account);

        // Track the access denied event
        telemetryService.trackEvent('accessDenied', payload);

        console.log('📊 Access denied event tracked:', payload);
    } catch (error) {
        console.error('Failed to track access denied event:', error);
    }
};

const AuthenticatedAppController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [popupBlocked, setPopupBlocked] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const hasFetchedGraphData = useRef(false);

    const handleLogin = useCallback(() => {
        setPopupBlocked(false);
        // Use popup for iframes (like AI Studio) and redirect for top-level windows.
        const authMethod = window.self !== window.top 
            ? instance.loginPopup(loginRequest) 
            : instance.loginRedirect(loginRequest);

        authMethod.catch(error => {
            if (error instanceof BrowserAuthError && (error.errorCode === "popup_window_error" || error.errorCode === "monitor_window_timeout")) {
                console.warn("Login popup blocked, showing fallback.", error);
                setPopupBlocked(true);
            } else {
                console.error("Login failed:", error);
            }
        });
    }, [instance]);

    const handleLogout = useCallback(() => {
        if (window.self !== window.top) {
            instance.logoutPopup({ postLogoutRedirectUri: "/" });
        } else {
            instance.logoutRedirect({ postLogoutRedirectUri: "/" });
        }
    }, [instance]);

    useEffect(() => {
        if (isAuthenticated && accounts.length > 0 && !hasFetchedGraphData.current) {
            hasFetchedGraphData.current = true; // Prevents re-fetching on re-renders
            setIsLoading(true);

            // Check group membership first
            const authorized = checkGroupMembership(accounts[0]);
            setIsAuthorized(authorized);

            // Check admin membership (for settings access)
            const admin = checkAdminMembership(accounts[0]);
            setIsAdmin(admin);

            // If not authorized, stop here - don't fetch Graph data
            if (!authorized) {
                setIsLoading(false);
                console.warn('User is not authorized to access this application.');
                return;
            }

            // User is authorized, proceed with fetching Graph data
            instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            }).then(response => {
                const headers = { Authorization: `Bearer ${response.accessToken}` };
                const fetchProfile = fetch(graphConfig.graphMeEndpoint, { headers }).then(res => res.json());
                const fetchPhoto = fetch(graphConfig.graphMePhotoEndpoint, { headers }).then(res => res.ok ? res.blob() : null);

                Promise.all([fetchProfile, fetchPhoto]).then(([profileData, photoBlob]) => {
                    const photoUrl = photoBlob ? URL.createObjectURL(photoBlob) : undefined;
                    setGraphData({
                        displayName: profileData.displayName,
                        jobTitle: profileData.jobTitle,
                        mail: profileData.mail,
                        photoUrl: photoUrl,
                    });
                }).catch(error => {
                    console.error("Failed to fetch graph data, using fallbacks:", error);
                    // Ensure app loads even if Graph calls fail
                    setGraphData({ displayName: accounts[0].name, mail: accounts[0].username });
                }).finally(() => {
                    setIsLoading(false);
                });
            }).catch(error => {
                console.error("Silent token acquisition failed:", error);
                setIsLoading(false);
                handleLogin(); // Prompt for interactive login if silent fails
            });
        } else if (!isAuthenticated) {
            setIsLoading(false);
        }
    }, [isAuthenticated, accounts, instance, handleLogin]);

    const contextValue = {
        isAuthenticated,
        isAuthorized,
        isAdmin,
        user: accounts[0] || null,
        graphData,
        logout: handleLogout
    };

    // While checking auth state or fetching profile, show a loading screen.
    if (isLoading) {
        return <LoadingModal isOpen={true} title="Authenticating..." messages={[{ progress: 0, text: 'Verifying session...' }]} />;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {!isAuthenticated ? (
                <SignInPage onLogin={handleLogin} popupBlocked={popupBlocked} onOpenInNewTab={() => window.open(window.location.href, '_blank')} />
            ) : !isAuthorized ? (
                <AccessDenied userEmail={accounts[0]?.username} onSignOut={handleLogout} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isInAiStudio()) {
        return <MockAuthenticatedApp>{children}</MockAuthenticatedApp>;
    }

    return (
        <MsalProvider instance={msalInstance}>
            <AuthenticatedAppController>{children}</AuthenticatedAppController>
        </MsalProvider>
    );
};