import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { BrowserAuthError, AccountInfo } from "@azure/msal-browser";
import { msalInstance, loginRequest, graphConfig, getRedirectUri } from './authConfig';
import { AuthContext } from '../contexts/AuthContext';
import { GraphData } from '../types';
import { SignInPage } from './SignInPage';
import { LoadingModal } from '../components/ui/LoadingModal';

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
    const mockUser: AccountInfo = {
        homeAccountId: 'mock-home-account-id',
        environment: 'mock-env',
        tenantId: 'mock-tenant-id',
        username: 'developer@aistudio.google.com',
        localAccountId: 'mock-local-account-id',
        name: 'AI Studio Developer',
    };

    const mockGraphData: GraphData = {
        displayName: 'AI Studio Developer',
        jobTitle: 'Lead Prompt Engineer',
        mail: 'developer@aistudio.google.com',
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: true, user: mockUser, graphData: mockGraphData, logout: () => console.log("Mock logout") }}>
            {children}
        </AuthContext.Provider>
    );
};

const AuthenticatedAppController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [popupBlocked, setPopupBlocked] = useState(false);
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
            {isAuthenticated ? children : <SignInPage onLogin={handleLogin} popupBlocked={popupBlocked} onOpenInNewTab={() => window.open(window.location.href, '_blank')} />}
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