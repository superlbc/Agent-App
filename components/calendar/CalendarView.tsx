// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================
// Event calendar visualization with filters, color-coding, and interactions

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { ConfirmModal } from '../ui/ConfirmModal';

// TypeScript Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  extendedProps: {
    eventId: string;
    venueName: string;
    status: string;
    clientId: string;
  };
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  clients: Array<{ value: string; label: string }>;
  programs: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  onEventClick: (event: CalendarEvent) => void;
  onEventReschedule: (eventId: string, newDate: Date) => Promise<void>;
  onExport: () => void;
}

type ViewMode = 'month' | 'week' | 'day';
type ColorMode = 'client' | 'status';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  clients,
  programs,
  statuses,
  onEventClick,
  onEventReschedule,
  onExport,
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [colorMode, setColorMode] = useState<ColorMode>('client');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [rescheduleInfo, setRescheduleInfo] = useState<{ event: CalendarEvent; newDate: Date } | null>(null);

  // Filtered events
  const filteredEvents = events.filter((event) => {
    if (selectedClients.length > 0 && !selectedClients.includes(event.extendedProps.clientId)) {
      return false;
    }
    if (selectedPrograms.length > 0) {
      // Would need program ID in event data
      return true; // Placeholder
    }
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(event.extendedProps.status)) {
      return false;
    }
    return true;
  });

  // Navigation helpers
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format display text for current period
  const getCurrentPeriodText = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDrop = (newDate: Date) => {
    if (draggedEvent) {
      setRescheduleInfo({ event: draggedEvent, newDate });
      setShowRescheduleConfirm(true);
      setDraggedEvent(null);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (rescheduleInfo) {
      await onEventReschedule(rescheduleInfo.event.id, rescheduleInfo.newDate);
      setRescheduleInfo(null);
    }
  };

  // Simple month view grid (7 days x 5-6 weeks)
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;

    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startingDayOfWeek + 1;
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
      const dayEvents = isValidDay ? filteredEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      }) : [];

      days.push(
        <div
          key={i}
          className={`min-h-[100px] border border-gray-200 dark:border-gray-700 p-2 ${
            !isValidDay ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
          } ${dayNumber === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'ring-2 ring-primary-500' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => isValidDay && handleDrop(date)}
        >
          {isValidDay && (
            <>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {dayNumber}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-1 rounded cursor-pointer truncate"
                    style={{ backgroundColor: event.color, color: 'white' }}
                    draggable
                    onDragStart={() => handleDragStart(event)}
                    onClick={() => onEventClick(event)}
                    title={`${event.title} - ${event.extendedProps.venueName}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200 dark:border-gray-700">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-gray-100 dark:bg-gray-700 border-r border-b border-gray-200 dark:border-gray-600 px-2 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
        {/* Day cells */}
        {days}
      </div>
    );
  };

  // Placeholder for week and day views
  const renderWeekView = () => (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      Week view coming soon
    </div>
  );

  const renderDayView = () => (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      Day view coming soon
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousPeriod}>
              <Icon name="chevron-left" className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextPeriod}>
              <Icon name="chevron-right" className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[200px] text-center">
              {getCurrentPeriodText()}
            </span>
          </div>

          {/* Filters */}
          <div className="flex-1 flex flex-wrap gap-2 justify-end">
            <select
              multiple
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              value={selectedClients}
              onChange={(e) => setSelectedClients(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {clients.map(client => (
                <option key={client.value} value={client.value}>{client.label}</option>
              ))}
            </select>

            <select
              multiple
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              value={selectedPrograms}
              onChange={(e) => setSelectedPrograms(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {programs.map(program => (
                <option key={program.value} value={program.value}>{program.label}</option>
              ))}
            </select>

            <select
              multiple
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              value={selectedStatuses}
              onChange={(e) => setSelectedStatuses(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Color mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={colorMode === 'client' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setColorMode('client')}
            >
              By Client
            </Button>
            <Button
              variant={colorMode === 'status' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setColorMode('status')}
            >
              By Status
            </Button>
          </div>

          {/* Export button */}
          <Button variant="outline" size="sm" onClick={onExport}>
            <Icon name="download" className="w-4 h-4 mr-2" />
            Export iCal
          </Button>
        </div>
      </Card>

      {/* Calendar grid */}
      <Card className="p-4">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Legend ({colorMode === 'client' ? 'By Client' : 'By Status'})
        </h3>
        <div className="flex flex-wrap gap-3">
          {colorMode === 'client' ? (
            clients.map((client, idx) => (
              <div key={client.value} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `hsl(${(idx * 360) / clients.length}, 70%, 60%)` }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{client.label}</span>
              </div>
            ))
          ) : (
            statuses.map((status, idx) => (
              <div key={status.value} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b' }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{status.label}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Reschedule confirmation modal */}
      <ConfirmModal
        isOpen={showRescheduleConfirm}
        onClose={() => setShowRescheduleConfirm(false)}
        onConfirm={handleRescheduleConfirm}
        title="Reschedule Event?"
        message={`Are you sure you want to move "${rescheduleInfo?.event.title}" to ${rescheduleInfo?.newDate.toLocaleDateString()}?`}
        confirmText="Reschedule"
        variant="warning"
      />
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const events: CalendarEvent[] = [
 *   {
 *     id: '1',
 *     title: 'Verizon 5G Activation',
 *     start: new Date(2025, 10, 15),
 *     end: new Date(2025, 10, 15),
 *     color: '#3b82f6',
 *     extendedProps: {
 *       eventId: '1',
 *       venueName: 'Times Square',
 *       status: 'confirmed',
 *       clientId: 'verizon'
 *     }
 *   }
 * ];
 *
 * <CalendarView
 *   events={events}
 *   clients={[{ value: 'verizon', label: 'Verizon' }]}
 *   programs={[{ value: 'hyperlocal', label: 'Hyperlocal' }]}
 *   statuses={[{ value: 'planned', label: 'Planned' }, { value: 'confirmed', label: 'Confirmed' }]}
 *   onEventClick={(event) => console.log('Clicked:', event)}
 *   onEventReschedule={async (eventId, newDate) => {
 *     console.log('Reschedule:', eventId, newDate);
 *   }}
 *   onExport={() => console.log('Export to iCal')}
 * />
 */
