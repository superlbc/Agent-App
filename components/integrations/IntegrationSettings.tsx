// ============================================================================
// INTEGRATION SETTINGS COMPONENT
// ============================================================================
// API configuration for Brandscopic, QR Tiger, Qualtrics, MOMO BI (Admin only)

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Textarea } from '../ui/Textarea';

// TypeScript Interfaces
export interface IntegrationConfig {
  brandscopic: {
    apiKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  qrTiger: {
    apiKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  qualtrics: {
    apiKey: string;
    datacenterId: string;
    enabled: boolean;
  };
  momoBi: {
    flowUrl: string;
    enabled: boolean;
  };
}

export interface IntegrationSettingsProps {
  config: IntegrationConfig;
  onSave: (config: IntegrationConfig) => Promise<void>;
  onTestConnection: (integration: 'brandscopic' | 'qrTiger' | 'qualtrics' | 'momoBi') => Promise<{ success: boolean; message: string }>;
}

type ActiveTab = 'brandscopic' | 'qrTiger' | 'qualtrics' | 'momoBi';

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  config,
  onSave,
  onTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('brandscopic');
  const [localConfig, setLocalConfig] = useState<IntegrationConfig>(config);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({
    brandscopic: null,
    qrTiger: null,
    qualtrics: null,
    momoBi: null,
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({
    brandscopic: false,
    qrTiger: false,
    qualtrics: false,
    momoBi: false,
  });

  // Handle config changes
  const updateConfig = (integration: keyof IntegrationConfig, field: string, value: string | boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        [field]: value,
      },
    }));
  };

  // Test connection
  const handleTestConnection = async (integration: ActiveTab) => {
    setTesting((prev) => ({ ...prev, [integration]: true }));
    try {
      const result = await onTestConnection(integration);
      setTestResults((prev) => ({ ...prev, [integration]: result }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [integration]: { success: false, message: 'Connection test failed' },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [integration]: false }));
    }
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localConfig);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Tab navigation
  const tabs = [
    { id: 'brandscopic' as const, label: 'Brandscopic', icon: 'building' as const },
    { id: 'qrTiger' as const, label: 'QR Tiger', icon: 'external' as const },
    { id: 'qualtrics' as const, label: 'Qualtrics', icon: 'chat-bubble' as const },
    { id: 'momoBi' as const, label: 'MOMO BI', icon: 'chart' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="settings" className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Integration Settings
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Brandscopic Settings */}
      {activeTab === 'brandscopic' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Brandscopic Settings
            </h3>
            <ToggleSwitch
              label="Enabled"
              id="brandscopic-enabled"
              checked={localConfig.brandscopic.enabled}
              onChange={(checked) => updateConfig('brandscopic', 'enabled', checked)}
            />
          </div>

          <div className="space-y-4">
            <Input
              label="API Key"
              id="brandscopic-api-key"
              type="password"
              value={localConfig.brandscopic.apiKey}
              onChange={(e) => updateConfig('brandscopic', 'apiKey', e.target.value)}
              placeholder="Enter Brandscopic API key"
            />

            <Input
              label="API Base URL"
              id="brandscopic-base-url"
              type="url"
              value={localConfig.brandscopic.baseUrl}
              onChange={(e) => updateConfig('brandscopic', 'baseUrl', e.target.value)}
              placeholder="https://api.brandscopic.com/v2"
            />

            <Button
              variant="outline"
              onClick={() => handleTestConnection('brandscopic')}
              disabled={testing.brandscopic || !localConfig.brandscopic.apiKey}
            >
              {testing.brandscopic ? (
                <>
                  <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {/* Test result */}
            {testResults.brandscopic && (
              <div
                className={`p-3 rounded-lg border ${
                  testResults.brandscopic.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={testResults.brandscopic.success ? 'check-circle' : 'x-circle'}
                    className={`w-5 h-5 ${
                      testResults.brandscopic.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      testResults.brandscopic.success
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {testResults.brandscopic.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* QR Tiger Settings */}
      {activeTab === 'qrTiger' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              QR Tiger Settings
            </h3>
            <ToggleSwitch
              label="Enabled"
              id="qrTiger-enabled"
              checked={localConfig.qrTiger.enabled}
              onChange={(checked) => updateConfig('qrTiger', 'enabled', checked)}
            />
          </div>

          <div className="space-y-4">
            <Input
              label="API Key"
              id="qrTiger-api-key"
              type="password"
              value={localConfig.qrTiger.apiKey}
              onChange={(e) => updateConfig('qrTiger', 'apiKey', e.target.value)}
              placeholder="Enter QR Tiger API key"
            />

            <Input
              label="API Base URL"
              id="qrTiger-base-url"
              type="url"
              value={localConfig.qrTiger.baseUrl}
              onChange={(e) => updateConfig('qrTiger', 'baseUrl', e.target.value)}
              placeholder="https://api.qrtiger.com/v1"
            />

            <Button
              variant="outline"
              onClick={() => handleTestConnection('qrTiger')}
              disabled={testing.qrTiger || !localConfig.qrTiger.apiKey}
            >
              {testing.qrTiger ? (
                <>
                  <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {/* Test result */}
            {testResults.qrTiger && (
              <div
                className={`p-3 rounded-lg border ${
                  testResults.qrTiger.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={testResults.qrTiger.success ? 'check-circle' : 'x-circle'}
                    className={`w-5 h-5 ${
                      testResults.qrTiger.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      testResults.qrTiger.success
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {testResults.qrTiger.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Qualtrics Settings */}
      {activeTab === 'qualtrics' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Qualtrics Settings
            </h3>
            <ToggleSwitch
              label="Enabled"
              id="qualtrics-enabled"
              checked={localConfig.qualtrics.enabled}
              onChange={(checked) => updateConfig('qualtrics', 'enabled', checked)}
            />
          </div>

          <div className="space-y-4">
            <Input
              label="API Key"
              id="qualtrics-api-key"
              type="password"
              value={localConfig.qualtrics.apiKey}
              onChange={(e) => updateConfig('qualtrics', 'apiKey', e.target.value)}
              placeholder="Enter Qualtrics API key"
            />

            <Input
              label="Datacenter ID"
              id="qualtrics-datacenter-id"
              value={localConfig.qualtrics.datacenterId}
              onChange={(e) => updateConfig('qualtrics', 'datacenterId', e.target.value)}
              placeholder="e.g., az1"
            />

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  Find your datacenter ID in your Qualtrics account URL: https://<strong>[datacenterId]</strong>.qualtrics.com
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => handleTestConnection('qualtrics')}
              disabled={testing.qualtrics || !localConfig.qualtrics.apiKey}
            >
              {testing.qualtrics ? (
                <>
                  <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {/* Test result */}
            {testResults.qualtrics && (
              <div
                className={`p-3 rounded-lg border ${
                  testResults.qualtrics.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={testResults.qualtrics.success ? 'check-circle' : 'x-circle'}
                    className={`w-5 h-5 ${
                      testResults.qualtrics.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      testResults.qualtrics.success
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {testResults.qualtrics.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MOMO BI Settings */}
      {activeTab === 'momoBi' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              MOMO BI Settings
            </h3>
            <ToggleSwitch
              label="Enabled"
              id="momoBi-enabled"
              checked={localConfig.momoBi.enabled}
              onChange={(checked) => updateConfig('momoBi', 'enabled', checked)}
            />
          </div>

          <div className="space-y-4">
            <Textarea
              label="Power Automate Flow URL"
              id="momoBi-flow-url"
              value={localConfig.momoBi.flowUrl}
              onChange={(e) => updateConfig('momoBi', 'flowUrl', e.target.value)}
              placeholder="https://prod-xx.eastus.logic.azure.com/workflows/..."
              rows={3}
            />

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  This URL triggers the Power Automate flow that sends approved recap data to MOMO BI (Power BI).
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => handleTestConnection('momoBi')}
              disabled={testing.momoBi || !localConfig.momoBi.flowUrl}
            >
              {testing.momoBi ? (
                <>
                  <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Test Flow
                </>
              )}
            </Button>

            {/* Test result */}
            {testResults.momoBi && (
              <div
                className={`p-3 rounded-lg border ${
                  testResults.momoBi.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={testResults.momoBi.success ? 'check-circle' : 'x-circle'}
                    className={`w-5 h-5 ${
                      testResults.momoBi.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      testResults.momoBi.success
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}
                  >
                    {testResults.momoBi.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icon name="save" className="w-4 h-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <IntegrationSettings
 *   config={{
 *     brandscopic: {
 *       apiKey: 'your-api-key',
 *       baseUrl: 'https://api.brandscopic.com/v2',
 *       enabled: true,
 *     },
 *     qrTiger: {
 *       apiKey: 'your-api-key',
 *       baseUrl: 'https://api.qrtiger.com/v1',
 *       enabled: true,
 *     },
 *     qualtrics: {
 *       apiKey: 'your-api-key',
 *       datacenterId: 'az1',
 *       enabled: true,
 *     },
 *     momoBi: {
 *       flowUrl: 'https://prod-xx.eastus.logic.azure.com/workflows/...',
 *       enabled: true,
 *     },
 *   }}
 *   onSave={async (config) => {
 *     await fetch('/api/integrations/settings', {
 *       method: 'PUT',
 *       body: JSON.stringify(config),
 *     });
 *   }}
 *   onTestConnection={async (integration) => {
 *     const response = await fetch(`/api/integrations/${integration}/test`);
 *     return response.json();
 *   }}
 * />
 */
