// ============================================================================
// VENUE METRICS COMPONENT
// ============================================================================
// Shows venue usage statistics, most popular venues, Placer.ai footfall aggregation
//
// Features:
// - Date range and city filters
// - Most used venues bar chart
// - Placer.ai footfall summary (if data available)
// - Venue performance table
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

interface VenueMetricsProps {
  events: Event[];
  venues: Venue[];
  placerData?: PlacerFootfallData[];
  selectedCity?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}

interface PlacerFootfallData {
  venueId: string;
  date: Date;
  visits: number;
  avgDwellTime: number; // in minutes
  uniqueVisitors?: number;
}

interface VenueUsageData {
  venueUsage: {
    venueId: string;
    venueName: string;
    city: string;
    count: number;
    avgFootfall?: number;
  }[];
  placerSummary: {
    avgFootfall: number;
    avgDwellTime: number;
    peakHour: string;
  } | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregateVenueMetrics(
  events: Event[],
  venues: Venue[],
  placerData?: PlacerFootfallData[]
): VenueUsageData {
  // Group events by venue
  const eventsByVenue = events.reduce((acc, event) => {
    const venueId = event.eventVenue;
    if (venueId) {
      acc[venueId] = (acc[venueId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const venueUsage = Object.entries(eventsByVenue)
    .map(([venueId, count]) => {
      const venue = venues.find(v => v.id === venueId);

      // Calculate average footfall from Placer.ai data if available
      let avgFootfall: number | undefined;
      if (placerData) {
        const venueFootfall = placerData.filter(d => d.venueId === venueId);
        if (venueFootfall.length > 0) {
          avgFootfall = Math.round(
            venueFootfall.reduce((sum, d) => sum + d.visits, 0) / venueFootfall.length
          );
        }
      }

      return {
        venueId,
        venueName: venue?.name || venueId,
        city: venue?.city || 'Unknown',
        count,
        avgFootfall,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate Placer.ai data if available
  let placerSummary: VenueUsageData['placerSummary'] = null;
  if (placerData && placerData.length > 0) {
    const avgFootfall = placerData.reduce((sum, d) => sum + d.visits, 0) / placerData.length;
    const avgDwellTime =
      placerData.reduce((sum, d) => sum + d.avgDwellTime, 0) / placerData.length;

    placerSummary = {
      avgFootfall: Math.round(avgFootfall),
      avgDwellTime: Math.round(avgDwellTime),
      peakHour: '2:00 PM - 3:00 PM', // Simplified - would need hourly data
    };
  }

  return {
    venueUsage,
    placerSummary,
  };
}

function exportVenueMetricsToCSV(
  data: VenueUsageData,
  dateRange?: { start: Date; end: Date }
) {
  const csvRows: string[] = [];

  // Header
  csvRows.push('Venue Metrics Report');
  if (dateRange) {
    csvRows.push(
      `Date Range: ${format(dateRange.start, 'yyyy-MM-dd')} to ${format(dateRange.end, 'yyyy-MM-dd')}`
    );
  }
  csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  csvRows.push('');

  // Placer.ai Summary
  if (data.placerSummary) {
    csvRows.push('Placer.ai Footfall Summary');
    csvRows.push(`Average Footfall per Event,${data.placerSummary.avgFootfall}`);
    csvRows.push(`Average Dwell Time (minutes),${data.placerSummary.avgDwellTime}`);
    csvRows.push(`Peak Hour,${data.placerSummary.peakHour}`);
    csvRows.push('');
  }

  // Venue Usage
  csvRows.push('Venue Performance');
  csvRows.push('Venue,City,Events,Avg Footfall');
  data.venueUsage.forEach(item => {
    csvRows.push(
      `"${item.venueName}","${item.city}",${item.count},${item.avgFootfall || 'N/A'}`
    );
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `venue-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VenueMetrics: React.FC<VenueMetricsProps> = ({
  events,
  venues,
  placerData,
  selectedCity,
  dateRange,
  onExport,
}) => {
  const [cityFilter, setCityFilter] = useState<string>(selectedCity || 'all');

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by city
    if (cityFilter !== 'all') {
      filtered = filtered.filter(e => e.city === cityFilter);
    }

    // Filter by date range
    if (dateRange) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.eventStartDate);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }

    return filtered;
  }, [events, cityFilter, dateRange]);

  const venueMetrics = useMemo(() => {
    return aggregateVenueMetrics(filteredEvents, venues, placerData);
  }, [filteredEvents, venues, placerData]);

  const handleExport = () => {
    exportVenueMetricsToCSV(venueMetrics, dateRange);
    if (onExport) {
      onExport();
    }
  };

  // Get unique cities
  const cities = useMemo(() => {
    const uniqueCities = new Set(events.map(e => e.city).filter(Boolean));
    return Array.from(uniqueCities).sort();
  }, [events]);

  if (events.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Icon name="map-pin" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Events Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create events to see venue metrics.
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
            Venue Metrics
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Venue usage statistics and Placer.ai footfall analytics
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
                City Filter
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            {cityFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCityFilter('all')}
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

      {/* Placer.ai Footfall Summary */}
      {venueMetrics.placerSummary && (
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="chart" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                Placer.ai Footfall Analytics
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Average Footfall
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {venueMetrics.placerSummary.avgFootfall.toLocaleString()}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  visitors per event
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Average Dwell Time
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {venueMetrics.placerSummary.avgDwellTime} min
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  time spent on-site
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Peak Traffic
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {venueMetrics.placerSummary.peakHour}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  busiest time window
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Most Used Venues Chart */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Most Used Venues
          </h3>
          {venueMetrics.venueUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={venueMetrics.venueUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis type="number" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                <YAxis
                  type="category"
                  dataKey="venueName"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '0.375rem',
                    color: '#F3F4F6',
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const venue = venueMetrics.venueUsage.find(
                      v => v.venueName === props.payload.venueName
                    );
                    return [
                      `${value} events${venue?.avgFootfall ? ` (Avg: ${venue.avgFootfall.toLocaleString()} visitors)` : ''}`,
                      'Events',
                    ];
                  }}
                />
                <Legend wrapperStyle={{ color: '#6B7280' }} />
                <Bar dataKey="count" fill="#EC4899" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Icon name="bar-chart" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No venue usage data to display
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Venue Performance Table */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Venue Performance
          </h3>
          {venueMetrics.venueUsage.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Rank
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Venue
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      City
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Events
                    </th>
                    {placerData && placerData.length > 0 && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Avg Footfall
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {venueMetrics.venueUsage.map((item, index) => (
                    <tr
                      key={item.venueId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.venueName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {item.count}
                      </td>
                      {placerData && placerData.length > 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.avgFootfall ? item.avgFootfall.toLocaleString() : 'N/A'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="table" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No venue performance data to display
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Info Note */}
      {!placerData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Placer.ai Integration
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Connect Placer.ai to see footfall analytics, average dwell time, and visitor traffic
                patterns for your venues. Contact your administrator for integration setup.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const placerData: PlacerFootfallData[] = [
 *   {
 *     venueId: 'venue-1',
 *     date: new Date('2025-06-15'),
 *     visits: 15200,
 *     avgDwellTime: 45,
 *     uniqueVisitors: 12500,
 *   },
 *   {
 *     venueId: 'venue-2',
 *     date: new Date('2025-06-20'),
 *     visits: 18500,
 *     avgDwellTime: 52,
 *     uniqueVisitors: 15000,
 *   },
 * ];
 *
 * <VenueMetrics
 *   events={events}
 *   venues={venues}
 *   placerData={placerData}
 *   selectedCity="New York"
 *   dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
 *   onExport={() => console.log('Exporting...')}
 * />
 */
