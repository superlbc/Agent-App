/**
 * EventCalendar - Calendar View Component
 *
 * Features:
 * - Month/Week/Day view toggle
 * - Events displayed on calendar grid with campaign colors
 * - Status badges on events
 * - Click event → open detail modal
 * - Filter by Campaign, Status
 * - Date navigation (prev/next month)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEvents } from '../../contexts/EventContext';
import type { Event, Campaign, CalendarEvent } from '../../types';
import Icon from '../ui/Icon';
import StatusBadge from '../ui/StatusBadge';

// Configure date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventCalendarProps {
  campaigns?: Campaign[];
  onEventClick?: (event: Event) => void;
  className?: string;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ campaigns = [], onEventClick, className = '' }) => {
  const { filteredEvents, setFilters, filters } = useEvents();
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform events for calendar
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return filteredEvents.map((event) => {
      const campaign = campaigns.find((c) => c.id === event.campaignId);
      const color = campaign ? getCampaignColor(campaign.client) : '#3B82F6';

      return {
        id: event.id,
        title: event.eventName,
        start: new Date(event.eventStartDate),
        end: new Date(event.eventEndDate),
        resource: {
          event,
          campaign: campaign || ({ id: event.campaignId, client: 'Unknown' } as Campaign),
          color,
        },
      };
    });
  }, [filteredEvents, campaigns]);

  // Unique campaigns for filter dropdown
  const uniqueCampaigns = useMemo(() => {
    const campaignMap = new Map<string, Campaign>();
    filteredEvents.forEach((event) => {
      const campaign = campaigns.find((c) => c.id === event.campaignId);
      if (campaign && !campaignMap.has(campaign.id)) {
        campaignMap.set(campaign.id, campaign);
      }
    });
    return Array.from(campaignMap.values());
  }, [filteredEvents, campaigns]);

  // Event style getter - applies campaign color
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const backgroundColor = event.resource?.color || '#3B82F6';
      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: 0.9,
          color: 'white',
          border: '0px',
          display: 'block',
          fontSize: '0.875rem',
          padding: '2px 4px',
        },
      };
    },
    []
  );

  // Handle event selection
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick && event.resource?.event) {
        onEventClick(event.resource.event);
      }
    },
    [onEventClick]
  );

  // Filter handlers
  const handleCampaignFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ campaigns: undefined });
    } else {
      setFilters({ campaigns: [value] });
    }
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ statuses: undefined });
    } else {
      setFilters({ statuses: [value as Event['status']] });
    }
  };

  // Navigation handlers
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const status = event.resource?.event.status;
    return (
      <div className="flex items-center justify-between w-full h-full">
        <span className="truncate flex-1">{event.title}</span>
        {status && (
          <span className="ml-1 text-xs px-1 py-0.5 rounded bg-white/20">
            {status === 'planning' && '📋'}
            {status === 'confirmed' && '✓'}
            {status === 'in-progress' && '▶'}
            {status === 'completed' && '✔'}
            {status === 'cancelled' && '✖'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Left: View toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Today
          </button>
          <div className="inline-flex rounded-md shadow-sm">
            {[
              { view: Views.MONTH, label: 'Month' },
              { view: Views.WEEK, label: 'Week' },
              { view: Views.DAY, label: 'Day' },
            ].map(({ view, label }) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`
                  px-4 py-2 text-sm font-medium border
                  ${
                    currentView === view
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                  ${view === Views.MONTH ? 'rounded-l-md' : ''}
                  ${view === Views.DAY ? 'rounded-r-md' : ''}
                  ${view === Views.WEEK ? 'border-l-0 border-r-0' : ''}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current date */}
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {format(currentDate, 'MMMM yyyy')}
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3">
          {/* Campaign filter */}
          <select
            onChange={handleCampaignFilter}
            value={filters.campaigns?.[0] || 'all'}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Campaigns</option>
            {uniqueCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.campaignName}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            onChange={handleStatusFilter}
            value={filters.statuses?.[0] || 'all'}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          popup
          selectable
          className="rbc-calendar dark:rbc-calendar-dark"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Colors:</span>
        {uniqueCampaigns.slice(0, 8).map((campaign) => (
          <div key={campaign.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getCampaignColor(campaign.client) }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{campaign.client}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate consistent color for campaign client
 */
function getCampaignColor(client: string): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  let hash = 0;
  for (let i = 0; i < client.length; i++) {
    hash = client.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
