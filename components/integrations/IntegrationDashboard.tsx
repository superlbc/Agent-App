// ============================================================================
// INTEGRATION DASHBOARD COMPONENT
// ============================================================================
// Unified dashboard showing status and controls for all external integrations

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  testBrandscopicConnection,
  initializeBrandscopicService,
} from '../../services/brandscopicService';
import {
  testPlacerConnection,
  initializePlacerService,
  clearPlacerCache,
} from '../../services/placerService';
import {
  testSmartsheetConnection,
  initializeSmartsheetService,
} from '../../services/smartsheetService';
import {
  testQRTigerConnection,
  initializeQRTigerService,
} from '../../services/qrtigerService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: Date;
  itemCount?: number;
  error?: string;
  icon: 'building' | 'chart' | 'table' | 'qrcode';
}

export interface IntegrationActivity {
  id: string;
  integration: string;
  action: string;
  status: 'success' | 'error';
  message: string;
  timestamp: Date;
}

export interface IntegrationDashboardProps {
  onSync?: (integration: string) => Promise<void>;
  onConfigure?: (integration: string) => void;
}

// ============================================================================
// INTEGRATION DASHBOARD COMPONENT
// ============================================================================

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({
  onSync,
  onConfigure,
}) => {
  // State
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([
    {
      id: 'brandscopic',
      name: 'Brandscopic',
      connected: false,
      icon: 'building',
    },
    {
      id: 'placer',
      name: 'Placer.ai',
      connected: false,
      icon: 'chart',
    },
    {
      id: 'smartsheet',
      name: 'Smartsheet',
      connected: false,
      icon: 'table',
    },
    {
      id: 'qrtiger',
      name: 'QR Tiger',
      connected: false,
      icon: 'qrcode',
    },
  ]);

  const [activity, setActivity] = useState<IntegrationActivity[]>([]);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  // Initialize services on mount
  useEffect(() => {
    initializeServices();
    checkAllConnections();
  }, []);

  /**
   * Initialize all integration services
   */
  const initializeServices = () => {
    // Brandscopic
    initializeBrandscopicService({
      apiKey: import.meta.env.VITE_BRANDSCOPIC_API_KEY || 'your-brandscopic-api-key',
      baseUrl: import.meta.env.VITE_BRANDSCOPIC_API_URL || 'https://api.brandscopic.com/v1',
      useMockData: true,
    });

    // Placer.ai
    initializePlacerService({
      apiKey: import.meta.env.VITE_PLACER_API_KEY || 'your-placer-api-key',
      baseUrl: import.meta.env.VITE_PLACER_API_URL || 'https://api.placer.ai/v1',
      cacheTTL: 3600000,
      useMockData: true,
    });

    // Smartsheet
    initializeSmartsheetService({
      accessToken: import.meta.env.VITE_SMARTSHEET_ACCESS_TOKEN || 'your-smartsheet-token',
      baseUrl: import.meta.env.VITE_SMARTSHEET_API_URL || 'https://api.smartsheet.com/2.0',
      useMockData: true,
    });

    // QR Tiger
    initializeQRTigerService({
      apiKey: import.meta.env.VITE_QRTIGER_API_KEY || 'your-qrtiger-api-key',
      baseUrl: import.meta.env.VITE_QRTIGER_API_URL || 'https://api.qrtiger.com/v1',
      useMockData: true,
    });
  };

  /**
   * Check all connections on mount
   */
  const checkAllConnections = async () => {
    await Promise.all([
      testConnection('brandscopic'),
      testConnection('placer'),
      testConnection('smartsheet'),
      testConnection('qrtiger'),
    ]);
  };

  /**
   * Test connection for a specific integration
   */
  const testConnection = async (integrationId: string) => {
    setTesting((prev: Record<string, boolean>) => ({ ...prev, [integrationId]: true }));

    try {
      let result: { success: boolean; message: string };

      switch (integrationId) {
        case 'brandscopic':
          result = await testBrandscopicConnection();
          break;
        case 'placer':
          result = await testPlacerConnection();
          break;
        case 'smartsheet':
          result = await testSmartsheetConnection();
          break;
        case 'qrtiger':
          result = await testQRTigerConnection();
          break;
        default:
          result = { success: false, message: 'Unknown integration' };
      }

      // Update status
      setIntegrationStatus((prev: IntegrationStatus[]) =>
        prev.map((status: IntegrationStatus) =>
          status.id === integrationId
            ? {
                ...status,
                connected: result.success,
                error: result.success ? undefined : result.message,
                lastSync: result.success ? new Date() : status.lastSync,
              }
            : status
        )
      );

      // Add to activity log
      addActivity({
        integration: integrationId,
        action: 'Connection test',
        status: result.success ? 'success' : 'error',
        message: result.message,
      });
    } catch (error) {
      console.error(`Failed to test ${integrationId}:`, error);

      setIntegrationStatus((prev: IntegrationStatus[]) =>
        prev.map((status: IntegrationStatus) =>
          status.id === integrationId
            ? {
                ...status,
                connected: false,
                error: error instanceof Error ? error.message : 'Connection test failed',
              }
            : status
        )
      );

      addActivity({
        integration: integrationId,
        action: 'Connection test',
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTesting((prev: Record<string, boolean>) => ({ ...prev, [integrationId]: false }));
    }
  };

  /**
   * Manually sync an integration
   */
  const handleSync = async (integrationId: string) => {
    setSyncing((prev: Record<string, boolean>) => ({ ...prev, [integrationId]: true }));

    try {
      if (onSync) {
        await onSync(integrationId);
      }

      // Update last sync time
      setIntegrationStatus((prev: IntegrationStatus[]) =>
        prev.map((status: IntegrationStatus) =>
          status.id === integrationId
            ? { ...status, lastSync: new Date() }
            : status
        )
      );

      addActivity({
        integration: integrationId,
        action: 'Manual sync',
        status: 'success',
        message: 'Sync completed successfully',
      });
    } catch (error) {
      addActivity({
        integration: integrationId,
        action: 'Manual sync',
        status: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      setSyncing((prev: Record<string, boolean>) => ({ ...prev, [integrationId]: false }));
    }
  };

  /**
   * Clear Placer.ai cache
   */
  const handleClearCache = () => {
    clearPlacerCache();
    addActivity({
      integration: 'placer',
      action: 'Clear cache',
      status: 'success',
      message: 'Placer.ai cache cleared successfully',
    });
  };

  /**
   * Add activity to log
   */
  const addActivity = (activity: Omit<IntegrationActivity, 'id' | 'timestamp'>) => {
    const newActivity: IntegrationActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date(),
    };

    setActivity((prev: IntegrationActivity[]) => [newActivity, ...prev].slice(0, 10)); // Keep last 10
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (integration: IntegrationStatus) => {
    if (testing[integration.id]) {
      return <Icon name="refresh" className="w-5 h-5 animate-spin text-gray-500" />;
    }
    if (integration.connected) {
      return <Icon name="check-circle" className="w-5 h-5 text-green-500" />;
    }
    if (integration.error) {
      return <Icon name="x-circle" className="w-5 h-5 text-red-500" />;
    }
    return <Icon name="warning" className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="link" className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Integration Dashboard
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkAllConnections}
          disabled={Object.values(testing).some((t) => t)}
        >
          <Icon name="refresh" className="w-4 h-4 mr-2" />
          Test All
        </Button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrationStatus.map((integration) => (
          <Card
            key={integration.id}
            className="p-4 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    name={integration.icon}
                    className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {integration.name}
                  </h3>
                </div>
                {getStatusIcon(integration)}
              </div>

              {/* Status */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span
                    className={`font-medium ${
                      integration.connected
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {integration.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                {integration.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatTimeAgo(integration.lastSync)}
                    </span>
                  </div>
                )}

                {integration.itemCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Items:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {integration.itemCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Error message */}
              {integration.error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {integration.error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(integration.id)}
                  disabled={!integration.connected || syncing[integration.id]}
                  className="flex-1"
                >
                  {syncing[integration.id] ? (
                    <>
                      <Icon name="refresh" className="w-3 h-3 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" className="w-3 h-3 mr-1" />
                      Sync
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigure?.(integration.id)}
                  title="Configure"
                >
                  <Icon name="settings" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            <Icon name="trash" className="w-4 h-4 mr-2" />
            Clear Placer.ai Cache
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigure?.('all')}
          >
            <Icon name="settings" className="w-4 h-4 mr-2" />
            Manage All Integrations
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Recent Activity
        </h3>

        {activity.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                {/* Status Icon */}
                <div className="mt-0.5">
                  {item.status === 'success' ? (
                    <Icon name="check-circle" className="w-4 h-4 text-green-500" />
                  ) : (
                    <Icon name="x-circle" className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {item.integration}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {item.action}: {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default IntegrationDashboard;
