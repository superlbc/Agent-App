import React, { useState, useMemo } from 'react';
import { EventCard, Event } from './EventCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

interface EventListProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
  onViewEvent: (event: Event) => void;
  onSubmitRecap?: (event: Event) => void;
  onCreateEvent: () => void;
  clients?: Array<{ id: string; name: string; }>;
  programs?: Array<{ id: string; name: string; clientId: string; }>;
}

interface Filters {
  clientId: string;
  programId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export const EventList: React.FC<EventListProps> = ({
  events = [],
  onEditEvent,
  onDeleteEvent,
  onViewEvent,
  onSubmitRecap,
  onCreateEvent,
  clients = [],
  programs = []
}) => {
  const [filters, setFilters] = useState<Filters>({
    clientId: '',
    programId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          event.eventName.toLowerCase().includes(searchLower) ||
          event.venueName.toLowerCase().includes(searchLower) ||
          event.city.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Client filter
      if (filters.clientId && event.clientName) {
        const clientMatch = clients.find(c => c.id === filters.clientId);
        if (clientMatch && event.clientName !== clientMatch.name) return false;
      }

      // Program filter
      if (filters.programId && event.masterProgramId !== filters.programId) {
        return false;
      }

      // Status filter
      if (filters.status && event.status !== filters.status) {
        return false;
      }

      // Date range filter
      const eventDate = new Date(event.eventDate);
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        if (eventDate > toDate) return false;
      }

      return true;
    });
  }, [events, filters, clients]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      clientId: '',
      programId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar */}
      <Card className="w-64 h-fit p-4 sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Event, venue, city..."
                className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
              />
            </div>
          </div>

          {/* Client */}
          {clients.length > 0 && (
            <Select
              id="clientFilter"
              label="Client"
              value={filters.clientId}
              onChange={(e) => handleFilterChange('clientId', e.target.value)}
              options={[
                { value: '', label: 'All Clients' },
                ...clients.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          )}

          {/* Program */}
          {programs.length > 0 && (
            <Select
              id="programFilter"
              label="Program"
              value={filters.programId}
              onChange={(e) => handleFilterChange('programId', e.target.value)}
              options={[
                { value: '', label: 'All Programs' },
                ...programs.map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          )}

          {/* Status */}
          <Select
            id="statusFilter"
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'planned', label: 'Planned' },
              { value: 'tentative', label: 'Tentative' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Icon name="grid" className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Icon name="list" className="w-4 h-4" />
              </Button>
            </div>

            {/* Create Event Button */}
            <Button variant="primary" onClick={onCreateEvent}>
              <Icon name="plus" className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        {/* Event Cards */}
        {paginatedEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Get started by creating your first event'}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" onClick={onCreateEvent}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
            }>
              {paginatedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  onView={onViewEvent}
                  onSubmitRecap={onSubmitRecap}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon name="chevron-left" className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Icon name="chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
