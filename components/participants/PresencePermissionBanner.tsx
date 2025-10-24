import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { msalInstance, loginRequest } from '../../auth/authConfig';

interface PresencePermissionBannerProps {
    hasParticipantsWithoutPresence: boolean;
}

/**
 * Banner that appears when presence data is not available
 * Prompts user to re-authenticate to get new permissions
 */
export const PresencePermissionBanner: React.FC<PresencePermissionBannerProps> = ({
    hasParticipantsWithoutPresence
}) => {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if user has dismissed the banner before
    useEffect(() => {
        const dismissed = localStorage.getItem('presencePermissionBannerDismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('presencePermissionBannerDismissed', 'true');
        setIsDismissed(true);
    };

    const handleReauthenticate = async () => {
        setIsReauthenticating(true);
        setError(null);

        try {
            // Use MSAL's interactive authentication to force consent for new scopes
            await msalInstance.acquireTokenPopup({
                ...loginRequest,
                scopes: ["User.Read", "User.ReadBasic.All", "Presence.Read.All"],
                prompt: "consent" // Force consent dialog even if already signed in
            });

            // Clear the dismissed flag so banner can appear again if needed
            localStorage.removeItem('presencePermissionBannerDismissed');

            // Reload to refresh the application with new permissions
            window.location.reload();
        } catch (err: any) {
            console.error('Re-authentication failed:', err);
            setIsReauthenticating(false);

            // Show user-friendly error message
            if (err.errorCode === 'user_cancelled') {
                setError('Authentication cancelled. Please try again to enable presence features.');
            } else {
                setError('Failed to re-authenticate. Please try again or contact support.');
            }
        }
    };

    if (!hasParticipantsWithoutPresence || isDismissed) {
        return null;
    }

    return (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
                <Icon name="info" className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Presence Status Unavailable
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                        The app now supports presence indicators (Available, Busy, etc.). Please re-authenticate to enable this feature.
                    </p>

                    {/* Error message */}
                    {error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReauthenticate}
                            disabled={isReauthenticating}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isReauthenticating ? 'Authenticating...' : 'Re-authenticate Now'}
                        </button>
                        <span className="text-xs text-blue-600 dark:text-blue-400">|</span>
                        <button
                            onClick={handleDismiss}
                            disabled={isReauthenticating}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    disabled={isReauthenticating}
                    className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close"
                >
                    <Icon name="close" className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
