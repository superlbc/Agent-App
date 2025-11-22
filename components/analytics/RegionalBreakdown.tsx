// ============================================================================
// REGIONAL BREAKDOWN COMPONENT
// ============================================================================
// Shows events distributed across regions, cities, and countries
//
// Features:
// - Region filter
// - Regional performance chart (events by region)
// - Top cities list
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
import type { Event, Venue } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface RegionalBreakdownProps {
  events: Event[];
  venues: Venue[];
  selectedRegion?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}

interface RegionalData {
  regionalData: { region: string; count: number; percentage: number }[];
  topCities: { city: string; count: number }[];
  topVenues: { venue: string; city: string; count: number }[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregateRegionalData(events: Event[]): RegionalData {
  // Group events by region
  const eventsByRegion = events.reduce((acc, event) => {
    const region = event.country || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regionalData = Object.entries(eventsByRegion)
    .map(([region, count]) => ({
      region,
      count,
      percentage: (count / events.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Group events by city
  const eventsByCity = events.reduce((acc, event) => {
    const city = `${event.city}, ${event.country}`;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(eventsByCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group events by venue
  const eventsByVenue = events.reduce((acc, event) => {
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
      city: data.city,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    regionalData,
    topCities,
    topVenues,
  };
}

function exportRegionalDataToCSV(data: RegionalData, dateRange?: { start: Date; end: Date }) {
  const csvRows: string[] = [];

  // Header
  csvRows.push('Regional Breakdown Report');
  if (dateRange) {
    csvRows.push(
      `Date Range: ${format(dateRange.start, 'yyyy-MM-dd')} to ${format(dateRange.end, 'yyyy-MM-dd')}`
    );
  }
  csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  csvRows.push('');

  // Regional Data
  csvRows.push('Region,Events,Percentage');
  data.regionalData.forEach(item => {
    csvRows.push(`"${item.region}",${item.count},${item.percentage.toFixed(1)}%`);
  });
  csvRows.push('');

  // Top Cities
  csvRows.push('Top Cities');
  csvRows.push('City,Events');
  data.topCities.forEach(item => {
    csvRows.push(`"${item.city}",${item.count}`);
  });
  csvRows.push('');

  // Top Venues
  csvRows.push('Top Venues');
  csvRows.push('Venue,City,Events');
  data.topVenues.forEach(item => {
    csvRows.push(`"${item.venue}","${item.city}",${item.count}`);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `regional-breakdown-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RegionalBreakdown: React.FC<RegionalBreakdownProps> = ({
  events,
  venues,
  selectedRegion,
  dateRange,
  onExport,
}) => {
  const [regionFilter, setRegionFilter] = useState<string>(selectedRegion || 'all');

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by region
    if (regionFilter !== 'all') {
      filtered = filtered.filter(e => e.country === regionFilter);
    }

    // Filter by date range
    if (dateRange) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.eventStartDate);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }

    return filtered;
  }, [events, regionFilter, dateRange]);

  const regionalData = useMemo(() => {
    return aggregateRegionalData(filteredEvents);
  }, [filteredEvents]);

  const handleExport = () => {
    exportRegionalDataToCSV(regionalData, dateRange);
    if (onExport) {
      onExport();
    }
  };

  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = new Set(events.map(e => e.country || 'Unknown'));
    return Array.from(uniqueRegions).sort();
  }, [events]);

  if (events.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Icon name="map" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Events Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create events to see regional breakdown.
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
            Regional Breakdown
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Events distributed across regions, cities, and venues
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Icon name="download" className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region Filter
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            {regionFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegionFilter('all')}
                className="mt-7"
              >
                <Icon name="x" className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>
      </Card>

      {/* Regional Performance Chart */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Events by Region
          </h3>
          {regionalData.regionalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData.regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis type="number" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                <YAxis
                  type="category"
                  dataKey="region"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '0.375rem',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number, name: string) => {
                    const item = regionalData.regionalData.find(d => d.count === value);
                    return [
                      `${value} events (${item?.percentage.toFixed(1)}%)`,
                      'Events',
                    ];
                  }}
                />
                <Legend wrapperStyle={{ color: '#6B7280' }} />
                <Bar dataKey="count" fill="#10B981" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Icon name="bar-chart" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No regional data to display
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Top Cities and Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Cities
            </h3>
            {regionalData.topCities.length > 0 ? (
              <div className="space-y-3">
                {regionalData.topCities.map((item, index) => (
                  <div
                    key={item.city}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
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
                  No cities to display
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
            {regionalData.topVenues.length > 0 ? (
              <div className="space-y-3">
                {regionalData.topVenues.map((item, index) => (
                  <div
                    key={item.venue}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 font-bold text-sm">
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
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
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
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <RegionalBreakdown
 *   events={events}
 *   venues={venues}
 *   selectedRegion="United States"
 *   dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
 *   onExport={() => console.log('Exporting...')}
 * />
 */
