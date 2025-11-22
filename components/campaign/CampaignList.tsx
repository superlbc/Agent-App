import React, { useState, useMemo } from 'react';
import { useCampaigns, CampaignFilters, CampaignWithClient } from '../../contexts/CampaignContext';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { SkeletonLoader } from '../ui/SkeletonLoader';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'client' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface CampaignListProps {
  onCampaignClick?: (campaign: CampaignWithClient) => void;
  onCreateClick?: () => void;
  onEditClick?: (campaign: CampaignWithClient) => void;
  onDeleteClick?: (campaign: CampaignWithClient) => void;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-300 dark:border-green-600',
  },
  inactive: {
    label: 'Inactive',
    color: 'gray',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-300 dark:border-gray-600',
  },
  archived: {
    label: 'Archived',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-300 dark:border-orange-600',
  },
} as const;

// ============================================================================
// CAMPAIGN LIST COMPONENT
// ============================================================================

export const CampaignList: React.FC<CampaignListProps> = ({
  onCampaignClick,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}) => {
  const { campaigns, clients, loading, error } = useCampaigns();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter state
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredAndSortedCampaigns = useMemo(() => {
    let result = [...campaigns];

    // Apply filters
    if (filters.clientId) {
      result = result.filter(c => c.clientId === filters.clientId);
    }
    if (filters.region) {
      result = result.filter(c => c.region === filters.region);
    }
    if (filters.eventType) {
      result = result.filter(c => c.eventType === filters.eventType);
    }
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.clientName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'client':
          comparison = (a.clientName || '').localeCompare(b.clientName || '');
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [campaigns, filters, searchQuery, sortField, sortDirection]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterChange = (key: keyof CampaignFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ============================================================================
  // EXTRACT UNIQUE VALUES FOR FILTERS
  // ============================================================================

  const uniqueRegions = useMemo(() => {
    const regions = campaigns
      .map(c => c.region)
      .filter((r): r is string => Boolean(r));
    return Array.from(new Set(regions)).sort();
  }, [campaigns]);

  const uniqueEventTypes = useMemo(() => {
    const types = campaigns.map(c => c.eventType);
    return Array.from(new Set(types)).sort();
  }, [campaigns]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: CampaignWithClient['status']) => {
    const config = STATUS_CONFIG[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        {config.label}
      </span>
    );
  };

  const renderCampaignCard = (campaign: CampaignWithClient) => (
    <Card
      key={campaign.id}
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onCampaignClick?.(campaign)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {campaign.code}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            {renderStatusBadge(campaign.status)}
            <div className="flex gap-1">
              <Tooltip content="Edit Campaign">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick?.(campaign);
                  }}
                  aria-label={`Edit ${campaign.name}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Icon name="edit" className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Delete Campaign">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick?.(campaign);
                  }}
                  aria-label={`Delete ${campaign.name}`}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Icon name="building" className="w-4 h-4 mr-2" />
            <span className="font-medium">{campaign.clientName || 'Unknown Client'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Icon name="globe" className="w-4 h-4 mr-2" />
            <span>{campaign.region || 'No region'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Icon name="sparkles" className="w-4 h-4 mr-2" />
            <span>{campaign.eventType}</span>
          </div>
          {campaign.eventCount !== undefined && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Icon name="calendar" className="w-4 h-4 mr-2" />
              <span>{campaign.eventCount} {campaign.eventCount === 1 ? 'event' : 'events'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Created {campaign.createdAt.toLocaleDateString()}</span>
            <span>Updated {campaign.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderCampaignRow = (campaign: CampaignWithClient) => (
    <tr
      key={campaign.id}
      onClick={() => onCampaignClick?.(campaign)}
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition-colors"
    >
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{campaign.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">{campaign.code}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {campaign.clientName || 'Unknown'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {campaign.region || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {campaign.eventType}
      </td>
      <td className="px-6 py-4">
        {renderStatusBadge(campaign.status)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {campaign.eventCount || 0}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Tooltip content="Edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.(campaign);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Icon name="edit" className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick?.(campaign);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Icon name="error" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Error loading campaigns</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredAndSortedCampaigns.length} {filteredAndSortedCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button variant="primary" onClick={onCreateClick}>
          <Icon name="add" className="w-5 h-5 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <Input
              type="text"
              placeholder="Search campaigns by name, code, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              aria-label="Search campaigns"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select
              value={filters.clientId || ''}
              onChange={(e) => handleFilterChange('clientId', e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>

            <Select
              value={filters.region || ''}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>

            <Select
              value={filters.eventType || ''}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
            >
              <option value="">All Event Types</option>
              {uniqueEventTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>

            <Select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as any)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </Select>

            <Button variant="ghost" onClick={handleClearFilters}>
              <Icon name="close" className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="px-3 py-2"
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Icon name="grid" className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="px-3 py-2"
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <Icon name="list" className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <Select value={sortField} onChange={(e) => handleSortChange(e.target.value as SortField)}>
            <option value="name">Name</option>
            <option value="client">Client</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
          </Select>
          <Button
            variant="ghost"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-2"
          >
            <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-64" />
          ))}
        </div>
      ) : filteredAndSortedCampaigns.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center h-64 text-center" role="status">
            <Icon name="info" className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No campaigns found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {Object.keys(filters).length > 0 || searchQuery
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first campaign'}
            </p>
            {!(Object.keys(filters).length > 0 || searchQuery) && (
              <Button variant="primary" onClick={onCreateClick}>
                <Icon name="add" className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCampaigns.map(renderCampaignCard)}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Region
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Events
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedCampaigns.map(renderCampaignRow)}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
