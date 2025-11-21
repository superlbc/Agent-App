import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';

interface AccessDeniedProps {
    userEmail?: string;
    onSignOut: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ userEmail, onSignOut }) => {
    const { t } = useTranslation(['common']);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md p-8 text-center">
                {/* Momentum Logo */}
                <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />

                {/* Access Restricted Icon */}
                <div className="mt-6 flex items-center justify-center">
                    <div className="relative">
                        <svg
                            className="h-16 w-16 text-red-500 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="2" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                    {t('common:auth.accessDenied.title')}
                </h1>

                {/* Message */}
                <p
                    className="mt-4 text-gray-600 dark:text-gray-400"
                    dangerouslySetInnerHTML={{ __html: t('common:auth.accessDenied.message') }}
                />

                {/* User Info Box */}
                {userEmail && (
                    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t('common:auth.accessDenied.signedInAs')}
                        </p>
                        <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                            {userEmail}
                        </p>
                    </div>
                )}

                {/* Additional Info */}
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    {t('common:auth.accessDenied.contactAdmin')}
                </p>

                {/* Sign Out Button */}
                <Button size="lg" className="w-full mt-8" onClick={onSignOut}>
                    {t('common:auth.accessDenied.signOutButton')}
                </Button>
            </Card>
        </div>
    );
};
