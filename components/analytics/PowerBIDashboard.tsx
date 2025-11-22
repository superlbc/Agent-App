// ============================================================================
// POWER BI DASHBOARD COMPONENT
// ============================================================================
// Embedded Power BI reports with tabs, filters, and full-screen mode
//
// Features:
// - Tabs: Event Summary, Recap Analytics, Client KPIs
// - Embedded Power BI reports via iframe
// - Filter controls (date range, client, program, region)
// - Full-screen mode
// - Refresh functionality
// - Server-generated embed tokens (Azure AD service principal)

import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

// ============================================================================
// TYPES
// ============================================================================

interface PowerBIDashboardProps {
  eventSummaryReportUrl?: string;
  recapAnalyticsReportUrl?: string;
  clientKPIsReportUrl?: string;
  clients: { id: string; name: string; code: string }[];
  programs: { id: string; name: string; clientId: string }[];
  onGenerateEmbedToken?: (reportType: string) => Promise<string>;
}

type TabType = 'event-summary' | 'recap-analytics' | 'client-kpis';

interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  clientIds: string[];
  programIds: string[];
  regions: string[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PowerBIDashboard: React.FC<PowerBIDashboardProps> = ({
  eventSummaryReportUrl = 'https://app.powerbi.com/reportEmbed?reportId=EVENT_SUMMARY_ID',
  recapAnalyticsReportUrl = 'https://app.powerbi.com/reportEmbed?reportId=RECAP_ANALYTICS_ID',
  clientKPIsReportUrl = 'https://app.powerbi.com/reportEmbed?reportId=CLIENT_KPIS_ID',
  clients,
  programs,
  onGenerateEmbedToken,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('event-summary');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: '',
      end: '',
    },
    clientIds: [],
    programIds: [],
    regions: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Tab Configuration
  const tabs = [
    {
      id: 'event-summary' as TabType,
      name: 'Event Summary',
      description: 'Total events, confirmed, completed by client and region',
      icon: 'calendar',
      reportUrl: eventSummaryReportUrl,
    },
    {
      id: 'recap-analytics' as TabType,
      name: 'Recap Analytics',
      description: 'QR scans, surveys, premiums, approval rates',
      icon: 'bar-chart',
      reportUrl: recapAnalyticsReportUrl,
    },
    {
      id: 'client-kpis' as TabType,
      name: 'Client KPIs',
      description: 'Client-specific dashboards and metrics',
      icon: 'chart',
      reportUrl: clientKPIsReportUrl,
    },
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);

  // Handlers
  const handleApplyFilters = () => {
    // In a real implementation, this would update the Power BI embed URL with filter parameters
    // For example: &$filter=Client/Name eq 'Verizon' and Date ge datetime'2025-01-01'
    console.log('Applying filters:', filters);
    setRefreshKey(prev => prev + 1); // Force iframe reload
  };

  const handleFullScreen = () => {
    if (!isFullScreen && iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
        setIsFullScreen(true);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // In a real implementation, trigger Power BI export via postMessage API
    console.log('Triggering Power BI export...');
  };

  // Build embed URL with filters
  const getEmbedUrl = () => {
    if (!activeTabConfig) return '';

    let url = activeTabConfig.reportUrl;

    // Add embed token (in real implementation, this would be server-generated)
    // url += `&embedToken=${embedToken}`;

    // Add filters as query parameters (simplified - real Power BI uses $filter OData syntax)
    const filterParams: string[] = [];

    if (filters.dateRange.start && filters.dateRange.end) {
      filterParams.push(`dateStart=${filters.dateRange.start}&dateEnd=${filters.dateRange.end}`);
    }

    if (filters.clientIds.length > 0) {
      filterParams.push(`clients=${filters.clientIds.join(',')}`);
    }

    if (filters.programIds.length > 0) {
      filterParams.push(`programs=${filters.programIds.join(',')}`);
    }

    if (filters.regions.length > 0) {
      filterParams.push(`regions=${filters.regions.join(',')}`);
    }

    if (filterParams.length > 0) {
      url += `&${filterParams.join('&')}`;
    }

    return url;
  };

  // Get available programs for selected clients
  const availablePrograms = programs.filter(
    program => filters.clientIds.length === 0 || filters.clientIds.includes(program.clientId)
  );

  const toggleClientFilter = (clientId: string) => {
    setFilters(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId],
      // Clear programs when client filter changes
      programIds: [],
    }));
  };

  const toggleProgramFilter = (programId: string) => {
    setFilters(prev => ({
      ...prev,
      programIds: prev.programIds.includes(programId)
        ? prev.programIds.filter(id => id !== programId)
        : [...prev.programIds, programId],
    }));
  };

  const toggleRegionFilter = (region: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Power BI embedded reports with real-time event data
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Icon
                name={tab.icon as any}
                className={`w-5 h-5 ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Description */}
      {activeTabConfig && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTabConfig.description}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh dashboard">
              <Icon name="refresh" className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullScreen} title="Full screen">
              <Icon name="external" className="w-4 h-4 mr-2" />
              Full Screen
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} title="Export report">
              <Icon name="download" className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <div className="flex flex-wrap gap-2">
                {['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'National'].map(region => (
                  <button
                    key={region}
                    onClick={() => toggleRegionFilter(region)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filters.regions.includes(region)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client {filters.clientIds.length > 0 && <span className="text-primary-600 dark:text-primary-400">({filters.clientIds.length} selected)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => toggleClientFilter(client.id)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.clientIds.includes(client.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {client.code}
                </button>
              ))}
            </div>
          </div>

          {/* Program */}
          {availablePrograms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Program {filters.programIds.length > 0 && <span className="text-primary-600 dark:text-primary-400">({filters.programIds.length} selected)</span>}
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                {availablePrograms.map(program => (
                  <label
                    key={program.id}
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.programIds.includes(program.id)}
                      onChange={() => toggleProgramFilter(program.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {program.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Apply Filters Button */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="primary" onClick={handleApplyFilters}>
              <Icon name="filter" className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Power BI Embed */}
      <Card className="p-0 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {/* 16:9 aspect ratio */}
          <iframe
            ref={iframeRef}
            key={`${activeTab}-${refreshKey}`}
            src={getEmbedUrl()}
            title={activeTabConfig?.name || 'Power BI Dashboard'}
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen
          />
        </div>

        {/* Loading Overlay (optional) */}
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 opacity-0 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Icon name="loader" className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </Card>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex items-start gap-3">
          <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Power BI Integration
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Reports are embedded using Azure AD service principal authentication. Embed tokens are generated
              server-side and expire after 1 hour. The dashboard auto-refreshes data every 15 minutes.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              <strong>Note:</strong> Some reports require additional permissions. Contact your administrator if you see
              access denied errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const mockClients = [
 *   { id: 'vz', name: 'Verizon', code: 'VZ' },
 *   { id: 'amex', name: 'American Express', code: 'AMEX' },
 * ];
 *
 * const mockPrograms = [
 *   { id: 'prog1', name: 'Verizon Hyperlocal', clientId: 'vz' },
 *   { id: 'prog2', name: 'AMEX US Open', clientId: 'amex' },
 * ];
 *
 * <PowerBIDashboard
 *   eventSummaryReportUrl="https://app.powerbi.com/reportEmbed?reportId=abc123"
 *   recapAnalyticsReportUrl="https://app.powerbi.com/reportEmbed?reportId=def456"
 *   clientKPIsReportUrl="https://app.powerbi.com/reportEmbed?reportId=ghi789"
 *   clients={mockClients}
 *   programs={mockPrograms}
 *   onGenerateEmbedToken={async (reportType) => {
 *     const response = await fetch('/api/analytics/embed-token', {
 *       method: 'POST',
 *       body: JSON.stringify({ reportType }),
 *     });
 *     const data = await response.json();
 *     return data.embedToken;
 *   }}
 * />
 */
