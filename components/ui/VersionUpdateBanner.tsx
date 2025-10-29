import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { Button } from './Button';
import { telemetryService } from '../../utils/telemetryService';

interface VersionUpdateBannerProps {
  currentVersion: string;
  serverVersion: string;
  onDismiss: () => void;
}

/**
 * Banner displayed when a new version of the application is available
 *
 * Prompts the user to refresh their browser to get the latest updates.
 * Includes telemetry tracking for user interactions.
 */
export const VersionUpdateBanner: React.FC<VersionUpdateBannerProps> = ({
  currentVersion,
  serverVersion,
  onDismiss,
}) => {
  const { t } = useTranslation(['common']);

  const handleRefresh = () => {
    // Track refresh action in telemetry
    telemetryService.trackEvent('versionUpdateRefreshed', {
      currentVersion,
      serverVersion,
    });

    // Reload the page to get the latest version
    window.location.reload();
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <Icon name="info" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              {t('common:versionUpdate.title', 'New Version Available')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              {t('common:versionUpdate.description', 'A new version of the application is available. Please refresh to get the latest updates.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleRefresh}
            variant="primary"
            size="sm"
            className="flex-shrink-0 text-xs"
          >
            <Icon name="refresh" className="h-4 w-4 mr-1" />
            {t('common:versionUpdate.refreshButton', 'Refresh')}
          </Button>
          <Button
            onClick={onDismiss}
            variant="secondary"
            size="sm"
            className="flex-shrink-0 text-xs"
          >
            {t('common:versionUpdate.dismissButton', 'Dismiss')}
          </Button>
        </div>
      </div>
    </div>
  );
};
