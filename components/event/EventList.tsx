/**
 * EventList - Table/List View Component
 *
 * Features:
 * - Table columns: Event Name, Campaign, Date, Venue, City, Status, Actions
 * - Filters: Campaign (dropdown), Date range (date picker), Status, City
 * - Search bar (event name or venue)
 * - Sort: Date, Name, City
 * - Actions per row: View, Edit, Delete, Duplicate
 * - Pagination (10/25/50 per page)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useEvents } from '../../contexts/EventContext';
import type { Event, Campaign } from '../../types';
import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';
import { Pagination } from '../ui/Pagination';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface EventListProps {
  campaigns?: Campaign[];
  onEventClick?: (event: Event) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventDuplicate?: (event: Event) => void;
  className?: string;
}

type SortField = 'eventName' | 'eventStartDate' | 'city' | 'status';
type SortDirection = 'asc' | 'desc';

const EventList: React.FC<EventListProps> = ({
  campaigns = [],
  onEventClick,
  onEventEdit,
  onEventDelete,
  onEventDuplicate,
  className = '',
}) => {
  const { filteredEvents, setFilters, filters, searchEvents } = useEvents();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('eventStartDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Unique values for filters
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

  const uniqueCities = useMemo(() => {
    const cities = new Set(filteredEvents.map((e) => e.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [filteredEvents]);

  // Sort events
  const sortedEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'eventName':
          comparison = a.eventName.localeCompare(b.eventName);
          break;
        case 'eventStartDate':
          comparison = new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime();
          break;
        case 'city':
          comparison = a.city.localeCompare(b.city);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredEvents, sortField, sortDirection]);

  // Paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedEvents.slice(startIndex, endIndex);
  }, [sortedEvents, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedEvents.length / pageSize);

  // Filter handlers
  const handleCampaignFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ campaigns: value === 'all' ? undefined : [value] });
    setCurrentPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ statuses: value === 'all' ? undefined : [value as Event['status']] });
    setCurrentPage(1);
  };

  const handleCityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ cities: value === 'all' ? undefined : [value] });
    setCurrentPage(1);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateFrom: value ? new Date(value) : undefined });
    setCurrentPage(1);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateTo: value ? new Date(value) : undefined });
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchEvents(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Page size handler
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Get campaign name
  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign?.campaignName || 'Unknown Campaign';
  };

  // Action handlers
  const handleView = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) onEventClick(event);
  };

  const handleEdit = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventEdit) onEventEdit(event);
  };

  const handleDelete = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventDelete) onEventDelete(event);
  };

  const handleDuplicate = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventDuplicate) onEventDuplicate(event);
  };

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="arrow-up-down" className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <Icon name="chevron-up" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <Icon name="chevron-down" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}>
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search events or venues..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftIcon="magnifying-glass"
            className="w-full"
          />
        </div>

        {/* Campaign Filter */}
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

        {/* Status Filter */}
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

        {/* City Filter */}
        <select
          onChange={handleCityFilter}
          value={filters.cities?.[0] || 'all'}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Cities</option>
          {uniqueCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <input
          type="date"
          onChange={handleDateFromChange}
          value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="From"
        />
        <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
        <input
          type="date"
          onChange={handleDateToChange}
          value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="To"
        />

        {/* Clear Filters */}
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
        >
          <Icon name="x-mark" className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Results Summary */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-gray-100">{paginatedEvents.length}</strong> of{' '}
            <strong className="text-gray-900 dark:text-gray-100">{sortedEvents.length}</strong> events
          </span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('eventName')}
              >
                <div className="flex items-center gap-2">
                  Event Name
                  <SortIcon field="eventName" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Campaign
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('eventStartDate')}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="eventStartDate" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Venue
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center gap-2">
                  City
                  <SortIcon field="city" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="folder-open" className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    <p>No events found</p>
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onEventClick?.(event)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.eventName}</div>
                    {event.eventDetails && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {event.eventDetails}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{getCampaignName(event.campaignId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(event.eventStartDate).toLocaleDateString()}
                    </div>
                    {event.eventStartDate !== event.eventEndDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        to {new Date(event.eventEndDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{event.eventVenue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{event.city}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{event.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleView(event, e)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="View"
                      >
                        <Icon name="eye" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEdit(event, e)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Icon name="pencil" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(event, e)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        title="Duplicate"
                      >
                        <Icon name="document-duplicate" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(event, e)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={sortedEvents.length}
          />
        </div>
      )}
    </div>
  );
};

export default EventList;
