// ============================================================================
// VENUE DATABASE
// ============================================================================
// Searchable venue list with filters, sorting, and pagination
// Displays venues in table format with CRUD actions

import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Venue } from '../../types';
import { useVenue } from '../../contexts/VenueContext';
import { useRole } from '../../contexts/RoleContext';

interface VenueDatabaseProps {
  onCreateClick?: () => void;
  onEditClick?: (venue: Venue) => void;
  onViewClick?: (venue: Venue) => void;
}

const VenueDatabase: React.FC<VenueDatabaseProps> = ({
  onCreateClick,
  onEditClick,
  onViewClick,
}) => {
  const {
    venues,
    deleteVenue,
    loading,
    error,
    startView,
    startEdit,
  } = useVenue();

  const { hasPermission } = useRole();

  // Permission checks
  const canCreate = hasPermission('VENUE_CREATE');
  const canUpdate = hasPermission('VENUE_UPDATE');
  const canDelete = hasPermission('VENUE_DELETE');
  const canRead = hasPermission('VENUE_READ');

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'eventsCount' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  // ============================================================================
  // FILTER OPTIONS (derived from data)
  // ============================================================================

  const cityOptions = useMemo(() => {
    const cities = new Set(venues.map((v) => v.city));
    return Array.from(cities).sort();
  }, [venues]);

  const countryOptions = useMemo(() => {
    const countries = new Set(venues.map((v) => v.country));
    return Array.from(countries).sort();
  }, [venues]);

  const categoryOptions = [
    'Stadium',
    'Arena',
    'Convention Center',
    'Park',
    'Street',
    'Other',
  ];

  const statusOptions = ['active', 'verified', 'archived'];

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredAndSortedVenues = useMemo(() => {
    return venues
      .filter((venue) => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          venue.name.toLowerCase().includes(searchLower) ||
          venue.fullAddress.toLowerCase().includes(searchLower) ||
          venue.city.toLowerCase().includes(searchLower) ||
          venue.country.toLowerCase().includes(searchLower) ||
          venue.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          false;

        if (searchQuery && !matchesSearch) return false;

        // City filter
        if (filterCity.length > 0 && !filterCity.includes(venue.city)) return false;

        // Country filter
        if (filterCountry.length > 0 && !filterCountry.includes(venue.country)) return false;

        // Category filter
        if (filterCategory.length > 0 && venue.category && !filterCategory.includes(venue.category)) return false;

        // Status filter
        if (filterStatus.length > 0 && !filterStatus.includes(venue.status)) return false;

        return true;
      })
      .sort((a, b) => {
        let compareValue = 0;

        switch (sortBy) {
          case 'name':
            compareValue = a.name.localeCompare(b.name);
            break;
          case 'city':
            compareValue = a.city.localeCompare(b.city);
            break;
          case 'eventsCount':
            compareValue = (a.eventsCount || 0) - (b.eventsCount || 0);
            break;
          case 'status':
            compareValue = a.status.localeCompare(b.status);
            break;
        }

        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
  }, [venues, searchQuery, filterCity, filterCountry, filterCategory, filterStatus, sortBy, sortOrder]);

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const totalFilteredItems = filteredAndSortedVenues.length;
  const paginatedVenues = filteredAndSortedVenues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCity, filterCountry, filterCategory, filterStatus, itemsPerPage]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteClick = (venue: Venue) => {
    setVenueToDelete(venue);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (venueToDelete) {
      try {
        await deleteVenue(venueToDelete.id);
        setVenueToDelete(null);
      } catch (err) {
        console.error('Failed to delete venue:', err);
      }
    }
  };

  const handleViewClick = (venue: Venue) => {
    if (onViewClick) {
      onViewClick(venue);
    } else {
      startView(venue);
    }
  };

  const handleEditClick = (venue: Venue) => {
    if (onEditClick) {
      onEditClick(venue);
    } else {
      startEdit(venue);
    }
  };

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCity([]);
    setFilterCountry([]);
    setFilterCategory([]);
    setFilterStatus([]);
  };

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const statistics = useMemo(() => {
    return {
      total: venues.length,
      active: venues.filter((v) => v.status === 'active').length,
      verified: venues.filter((v) => v.status === 'verified').length,
      archived: venues.filter((v) => v.status === 'archived').length,
      filtered: totalFilteredItems,
      stadiums: venues.filter((v) => v.category === 'Stadium').length,
      arenas: venues.filter((v) => v.category === 'Arena').length,
      totalEvents: venues.reduce((sum, v) => sum + (v.eventsCount || 0), 0),
    };
  }, [venues, totalFilteredItems]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!canRead) {
    return (
      <div className="p-6 text-center">
        <Icon name="lock" className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600 dark:text-gray-400">
          You do not have permission to view venues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Icon name="map-pin" className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Venues</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Icon name="check-circle" className="text-green-600 dark:text-green-300" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.active}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Icon name="calendar" className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.totalEvents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Icon name="filter" className="text-orange-600 dark:text-orange-300" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.filtered}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search venues by name, address, city, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon="search"
              rightIcon={searchQuery ? 'x' : undefined}
              onRightIconClick={() => setSearchQuery('')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon="filter"
            >
              Filters {(filterCity.length + filterCountry.length + filterCategory.length + filterStatus.length) > 0 &&
                `(${filterCity.length + filterCountry.length + filterCategory.length + filterStatus.length})`}
            </Button>

            {canCreate && (
              <Button variant="primary" onClick={handleCreateClick} leftIcon="plus">
                Create Venue
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <Select
                  value=""
                  onChange={(e) => {
                    const city = e.target.value;
                    if (city && !filterCity.includes(city)) {
                      setFilterCity([...filterCity, city]);
                    }
                  }}
                >
                  <option value="">Select city...</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
                {filterCity.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filterCity.map((city) => (
                      <span
                        key={city}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {city}
                        <button
                          onClick={() => setFilterCity(filterCity.filter((c) => c !== city))}
                          className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <Select
                  value=""
                  onChange={(e) => {
                    const country = e.target.value;
                    if (country && !filterCountry.includes(country)) {
                      setFilterCountry([...filterCountry, country]);
                    }
                  }}
                >
                  <option value="">Select country...</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </Select>
                {filterCountry.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filterCountry.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        {country}
                        <button
                          onClick={() => setFilterCountry(filterCountry.filter((c) => c !== country))}
                          className="ml-1 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Select
                  value=""
                  onChange={(e) => {
                    const category = e.target.value;
                    if (category && !filterCategory.includes(category)) {
                      setFilterCategory([...filterCategory, category]);
                    }
                  }}
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
                {filterCategory.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filterCategory.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {category}
                        <button
                          onClick={() => setFilterCategory(filterCategory.filter((c) => c !== category))}
                          className="ml-1 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  value=""
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status && !filterStatus.includes(status)) {
                      setFilterStatus([...filterStatus, status]);
                    }
                  }}
                >
                  <option value="">Select status...</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </Select>
                {filterStatus.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filterStatus.map((status) => (
                      <span
                        key={status}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      >
                        {status}
                        <button
                          onClick={() => setFilterStatus(filterStatus.filter((s) => s !== status))}
                          className="ml-1 text-orange-600 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-100"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(filterCity.length + filterCountry.length + filterCategory.length + filterStatus.length) > 0 && (
              <div className="mt-4">
                <Button variant="ghost" size="sm" onClick={handleClearFilters} leftIcon="x">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {sortBy === 'name' && (
                      <Icon name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center space-x-1">
                    <span>City</span>
                    {sortBy === 'city' && (
                      <Icon name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('eventsCount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Events</span>
                    {sortBy === 'eventsCount' && (
                      <Icon name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      <Icon name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedVenues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Icon name="map-pin" className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery || filterCity.length > 0 || filterCountry.length > 0 || filterCategory.length > 0 || filterStatus.length > 0
                        ? 'No venues match your search or filters.'
                        : 'No venues found. Create your first venue to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedVenues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {venue.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {venue.fullAddress}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {venue.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {venue.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {venue.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-1">
                        <Icon name="calendar" size={16} className="text-gray-400" />
                        <span>{venue.eventsCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={venue.status}
                        statusMap={{
                          active: { label: 'Active', color: 'green' },
                          verified: { label: 'Verified', color: 'blue' },
                          archived: { label: 'Archived', color: 'gray' },
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(venue)}
                          leftIcon="eye"
                        >
                          View
                        </Button>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(venue)}
                            leftIcon="edit"
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(venue)}
                            leftIcon="trash"
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalFilteredItems > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalItems={totalFilteredItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && venueToDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Venue"
          message={`Are you sure you want to delete "${venueToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

export default VenueDatabase;
