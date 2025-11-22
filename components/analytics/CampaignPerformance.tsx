// ============================================================================
// CAMPAIGN PERFORMANCE COMPONENT
// ============================================================================
// Shows performance metrics for campaigns (event count, budget, timeline)
//
// Features:
// - Campaign selection dropdown
// - Key metrics cards (total, completed, upcoming, cancelled events)
// - Event timeline chart (events per month)
// - Top venues list
// - CSV export

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import type { Campaign, Event, Venue } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface CampaignPerformanceProps {
  campaigns: Campaign[];
  events: Event[];
  venues: Venue[];
  selectedCampaignId?: string;
  onSelectCampaign?: (campaignId: string) => void;
  onExport?: () => void;
}

interface CampaignMetrics {
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  cancelledEvents: number;
  timelineData: { month: string; events: number }[];
  topVenues: { venue: string; count: number; city: string }[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregateCampaignMetrics(
  campaign: Campaign,
  events: Event[],
  venues: Venue[]
): CampaignMetrics {
  const campaignEvents = events.filter(e => e.campaignId === campaign.id);

  const totalEvents = campaignEvents.length;
  const completedEvents = campaignEvents.filter(e => e.status === 'completed').length;
  const upcomingEvents = campaignEvents.filter(
    e => e.status === 'planning' || e.status === 'active'
  ).length;
  const cancelledEvents = campaignEvents.filter(e => e.status === 'cancelled').length;

  // Group events by month for timeline
  const eventsByMonth = campaignEvents.reduce((acc, event) => {
    const month = format(new Date(event.eventStartDate), 'MMM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort months chronologically
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timelineData = monthOrder
    .filter(month => eventsByMonth[month])
    .map(month => ({
      month,
      events: eventsByMonth[month],
    }));

  // Group events by venue
  const eventsByVenue = campaignEvents.reduce((acc, event) => {
    const venue = event.eventVenue;
    if (venue) {
      if (!acc[venue]) {
        acc[venue] = { count: 0, city: event.city };
      }
      acc[venue].count += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; city: string }>);

  const topVenues = Object.entries(eventsByVenue)
    .map(([venue, data]) => ({
      venue,
      count: data.count,
      city: data.city,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents,
    completedEvents,
    upcomingEvents,
    cancelledEvents,
    timelineData,
    topVenues,
  };
}

function exportCampaignMetricsToCSV(campaign: Campaign, metrics: CampaignMetrics) {
  const csvRows: string[] = [];

  // Header
  csvRows.push('Campaign Performance Report');
  csvRows.push(`Campaign: ${campaign.campaignName}`);
  csvRows.push(`Client: ${campaign.client}`);
  csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  csvRows.push('');

  // Metrics
  csvRows.push('Metric,Value');
  csvRows.push(`Total Events,${metrics.totalEvents}`);
  csvRows.push(`Completed Events,${metrics.completedEvents}`);
  csvRows.push(`Upcoming Events,${metrics.upcomingEvents}`);
  csvRows.push(`Cancelled Events,${metrics.cancelledEvents}`);
  csvRows.push('');

  // Timeline
  csvRows.push('Month,Events');
  metrics.timelineData.forEach(item => {
    csvRows.push(`${item.month},${item.events}`);
  });
  csvRows.push('');

  // Top Venues
  csvRows.push('Venue,City,Events');
  metrics.topVenues.forEach(item => {
    csvRows.push(`"${item.venue}","${item.city}",${item.count}`);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campaign-performance-${campaign.campaignName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CampaignPerformance: React.FC<CampaignPerformanceProps> = ({
  campaigns,
  events,
  venues,
  selectedCampaignId,
  onSelectCampaign,
  onExport,
}) => {
  const [internalSelectedCampaignId, setInternalSelectedCampaignId] = useState<string>(
    selectedCampaignId || (campaigns.length > 0 ? campaigns[0].id : '')
  );

  const currentCampaignId = selectedCampaignId || internalSelectedCampaignId;
  const currentCampaign = campaigns.find(c => c.id === currentCampaignId);

  const metrics = useMemo(() => {
    if (!currentCampaign) {
      return {
        totalEvents: 0,
        completedEvents: 0,
        upcomingEvents: 0,
        cancelledEvents: 0,
        timelineData: [],
        topVenues: [],
      };
    }
    return aggregateCampaignMetrics(currentCampaign, events, venues);
  }, [currentCampaign, events, venues]);

  const handleSelectCampaign = (campaignId: string) => {
    if (onSelectCampaign) {
      onSelectCampaign(campaignId);
    } else {
      setInternalSelectedCampaignId(campaignId);
    }
  };

  const handleExport = () => {
    if (currentCampaign) {
      exportCampaignMetricsToCSV(currentCampaign, metrics);
    }
    if (onExport) {
      onExport();
    }
  };

  if (campaigns.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Icon name="calendar" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Campaigns Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a campaign to see performance metrics.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Campaign Performance
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Event count, timeline, and venue metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Icon name="download" className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Campaign Selection */}
      <Card>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Campaign
          </label>
          <select
            value={currentCampaignId}
            onChange={(e) => handleSelectCampaign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.campaignName} ({campaign.client})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Events</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {metrics.totalEvents}
              </p>
            </div>
            <Icon name="calendar" className="w-10 h-10 text-blue-400 dark:text-blue-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {metrics.completedEvents}
              </p>
            </div>
            <Icon name="check" className="w-10 h-10 text-green-400 dark:text-green-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Upcoming</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                {metrics.upcomingEvents}
              </p>
            </div>
            <Icon name="clock" className="w-10 h-10 text-orange-400 dark:text-orange-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Cancelled</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                {metrics.cancelledEvents}
              </p>
            </div>
            <Icon name="x" className="w-10 h-10 text-red-400 dark:text-red-600" />
          </div>
        </Card>
      </div>

      {/* Event Timeline Chart */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Event Timeline {currentCampaign && `(${currentCampaign.year})`}
          </h3>
          {metrics.timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '0.375rem',
                    color: '#F3F4F6',
                  }}
                />
                <Legend wrapperStyle={{ color: '#6B7280' }} />
                <Bar dataKey="events" fill="#3B82F6" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Icon name="bar-chart" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No events to display for timeline
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Top Venues */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top Venues
          </h3>
          {metrics.topVenues.length > 0 ? (
            <div className="space-y-3">
              {metrics.topVenues.map((item, index) => (
                <div
                  key={item.venue}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {item.venue}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {item.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {item.count === 1 ? 'event' : 'events'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="map-pin" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No venues to display
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <CampaignPerformance
 *   campaigns={campaigns}
 *   events={events}
 *   venues={venues}
 *   selectedCampaignId="campaign-1"
 *   onSelectCampaign={(id) => console.log('Selected:', id)}
 *   onExport={() => console.log('Exporting...')}
 * />
 */
