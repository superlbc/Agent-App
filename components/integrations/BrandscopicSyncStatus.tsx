// ============================================================================
// BRANDSCOPIC SYNC STATUS COMPONENT
// ============================================================================
// Display sync status with Brandscopic field management system

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';

// TypeScript Interfaces
export interface BrandscopicSyncStatusProps {
  eventId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  brandscopicProjectId?: string;
  lastSyncTime?: Date;
  errorMessage?: string;
  autoSyncSchedule?: string;
  syncHistory?: Array<{
    id: string;
    timestamp: Date;
    status: 'success' | 'failed';
    message?: string;
  }>;
  onManualSync: () => Promise<void>;
}

export const BrandscopicSyncStatus: React.FC<BrandscopicSyncStatusProps> = ({
  eventId,
  syncStatus,
  brandscopicProjectId,
  lastSyncTime,
  errorMessage,
  autoSyncSchedule = 'Auto-syncs nightly at 7:00 AM',
  syncHistory = [],
  onManualSync,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await onManualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Status badge variant mapping
  const statusVariants = {
    pending: 'warning' as const,
    synced: 'success' as const,
    failed: 'error' as const,
  };

  const statusLabels = {
    pending: 'Pending Sync',
    synced: 'Synced',
    failed: 'Sync Failed',
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Brandscopic Sync
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Field management system integration
          </p>
        </div>
        <StatusBadge variant={statusVariants[syncStatus]} label={statusLabels[syncStatus]} />
      </div>

      {/* Sync details */}
      <div className="space-y-3">
        {/* Brandscopic Project ID */}
        {brandscopicProjectId && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Brandscopic Project ID:
            </span>
            <a
              href={`https://brandscopic.com/projects/${brandscopicProjectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              {brandscopicProjectId}
              <Icon name="external" className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Last sync time */}
        {lastSyncTime && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Synced:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatRelativeTime(lastSyncTime)}
            </span>
          </div>
        )}

        {/* Auto-sync schedule */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-Sync:
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {autoSyncSchedule}
          </span>
        </div>

        {/* Error message */}
        {syncStatus === 'failed' && errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="alert-circle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Sync Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Icon name="refresh" className="w-4 h-4 mr-2" />
              Sync Now
            </>
          )}
        </Button>

        {syncHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <Icon name="clock" className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
        )}
      </div>

      {/* Sync history (expandable) */}
      {showHistory && syncHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Sync History (Last 5 Attempts)
          </h4>
          <div className="space-y-2">
            {syncHistory.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <Icon
                  name={entry.status === 'success' ? 'check-circle' : 'x-circle'}
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    entry.status === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.status === 'success' ? 'Sync Successful' : 'Sync Failed'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                  {entry.message && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {entry.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <BrandscopicSyncStatus
 *   eventId="event-123"
 *   syncStatus="synced"
 *   brandscopicProjectId="bs-12345"
 *   lastSyncTime={new Date(Date.now() - 2 * 60 * 60 * 1000)} // 2 hours ago
 *   autoSyncSchedule="Auto-syncs nightly at 7:00 AM"
 *   syncHistory={[
 *     {
 *       id: '1',
 *       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
 *       status: 'success',
 *     },
 *     {
 *       id: '2',
 *       timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
 *       status: 'failed',
 *       message: 'Connection timeout to Brandscopic API',
 *     },
 *   ]}
 *   onManualSync={async () => {
 *     // Call API to sync with Brandscopic
 *     await fetch('/api/integrations/brandscopic/sync/event-123', { method: 'POST' });
 *   }}
 * />
 */
