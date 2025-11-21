// ============================================================================
// LICENSE POOL DASHBOARD COMPONENT
// ============================================================================
// Displays license utilization, tracks available vs assigned seats,
// highlights over-allocated and expiring licenses

import React, { useState, useMemo } from 'react';
import { Software, LicenseAssignment } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { LicensePoolCreateModal } from './LicensePoolCreateModal';
import { LicensePoolEditModal } from './LicensePoolEditModal';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicensePoolDashboardProps {
  licenses: Software[];
  onAssignLicense?: (license: Software) => void;
  onViewAssignments?: (license: Software) => void;
  onEditLicense?: (license: Software) => void;
  onCreateLicense?: (license: Partial<Software>) => void;
  onUpdateLicense?: (license: Software) => void;
  className?: string;
}

interface LicenseStats {
  totalLicenses: number;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  overAllocated: number;
  expiringWithin30Days: number;
}

type LicenseTypeFilter = 'all' | 'perpetual' | 'subscription' | 'concurrent';
type UtilizationFilter = 'all' | 'available' | 'near-capacity' | 'full' | 'over-allocated';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate available seats for a license
 */
const getAvailableSeats = (license: Software): number => {
  if (!license.seatCount) return 0;
  const assigned = license.assignedSeats || 0;
  return license.seatCount - assigned;
};

/**
 * Calculate utilization percentage
 */
const getUtilization = (license: Software): number => {
  if (!license.seatCount) return 0;
  const assigned = license.assignedSeats || 0;
  return (assigned / license.seatCount) * 100;
};

/**
 * Get utilization status
 */
const getUtilizationStatus = (license: Software): 'ok' | 'warning' | 'critical' | 'over' => {
  const utilization = getUtilization(license);
  if (utilization > 100) return 'over';
  if (utilization >= 90) return 'critical';
  if (utilization >= 75) return 'warning';
  return 'ok';
};

/**
 * Check if license is expiring within 30 days
 */
const isExpiringSoon = (license: Software): boolean => {
  if (!license.renewalDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return license.renewalDate <= thirtyDaysFromNow;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LicensePoolDashboard: React.FC<LicensePoolDashboardProps> = ({
  licenses,
  onAssignLicense,
  onViewAssignments,
  onEditLicense,
  onCreateLicense,
  onUpdateLicense,
  className = '',
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<LicenseTypeFilter>('all');
  const [utilizationFilter, setUtilizationFilter] = useState<UtilizationFilter>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<Software | null>(null);

  // ============================================================================
  // STATS CALCULATION
  // ============================================================================

  const stats: LicenseStats = useMemo(() => {
    return licenses.reduce(
      (acc, license) => {
        const seatCount = license.seatCount || 0;
        const assigned = license.assignedSeats || 0;

        return {
          totalLicenses: acc.totalLicenses + 1,
          totalSeats: acc.totalSeats + seatCount,
          assignedSeats: acc.assignedSeats + assigned,
          availableSeats: acc.availableSeats + Math.max(0, seatCount - assigned),
          overAllocated: acc.overAllocated + (assigned > seatCount ? 1 : 0),
          expiringWithin30Days: acc.expiringWithin30Days + (isExpiringSoon(license) ? 1 : 0),
        };
      },
      {
        totalLicenses: 0,
        totalSeats: 0,
        assignedSeats: 0,
        availableSeats: 0,
        overAllocated: 0,
        expiringWithin30Days: 0,
      }
    );
  }, [licenses]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(licenses.map((l) => l.vendor))).sort();
  }, [licenses]);

  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      // Search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        license.name.toLowerCase().includes(searchLower) ||
        license.vendor.toLowerCase().includes(searchLower) ||
        license.description?.toLowerCase().includes(searchLower);

      // License type filter
      const typeMatch = licenseTypeFilter === 'all' || license.licenseType === licenseTypeFilter;

      // Vendor filter
      const vendorMatch = vendorFilter === 'all' || license.vendor === vendorFilter;

      // Utilization filter
      let utilizationMatch = true;
      if (utilizationFilter !== 'all') {
        const status = getUtilizationStatus(license);
        switch (utilizationFilter) {
          case 'available':
            utilizationMatch = getAvailableSeats(license) > 0;
            break;
          case 'near-capacity':
            utilizationMatch = status === 'warning';
            break;
          case 'full':
            utilizationMatch = status === 'critical';
            break;
          case 'over-allocated':
            utilizationMatch = status === 'over';
            break;
        }
      }

      return searchMatch && typeMatch && vendorMatch && utilizationMatch;
    });
  }, [licenses, searchQuery, licenseTypeFilter, vendorFilter, utilizationFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClearFilters = () => {
    setSearchQuery('');
    setLicenseTypeFilter('all');
    setUtilizationFilter('all');
    setVendorFilter('all');
  };

  const hasActiveFilters =
    searchQuery || licenseTypeFilter !== 'all' || utilizationFilter !== 'all' || vendorFilter !== 'all';

  // ============================================================================
  // RENDER
  // ============================================================================

  // Handlers
  const handleCreateLicense = (license: Partial<Software>) => {
    if (onCreateLicense) {
      onCreateLicense(license);
    }
    setIsCreateModalOpen(false);
  };

  const handleUpdateLicense = (license: Software) => {
    if (onUpdateLicense) {
      onUpdateLicense(license);
    }
    setEditingLicense(null);
  };

  const handleEditClick = (license: Software) => {
    if (onEditLicense) {
      onEditLicense(license);
    }
    setEditingLicense(license);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">License Pool Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor license utilization and manage software seat allocations
          </p>
        </div>

        {onCreateLicense && (
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Icon name="add" className="w-4 h-4 mr-2" />
            Create License Pool
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Licenses */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Licenses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalLicenses}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats.totalSeats} total seats</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Icon name="key" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Assigned Seats */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Seats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.assignedSeats}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {stats.totalSeats > 0 ? Math.round((stats.assignedSeats / stats.totalSeats) * 100) : 0}% utilization
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Icon name="check-circle" className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Available Seats */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Seats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.availableSeats}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ready to assign</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Icon name="package" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alerts</p>
              <div className="flex items-center gap-3 mt-1">
                {stats.overAllocated > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overAllocated}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">over</span>
                  </div>
                )}
                {stats.expiringWithin30Days > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.expiringWithin30Days}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">expiring</span>
                  </div>
                )}
                {stats.overAllocated === 0 && stats.expiringWithin30Days === 0 && (
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">All Good</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Icon name="alert" className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses by name, vendor, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* License Type Filter */}
          <Select
            id="license-type-filter"
            value={licenseTypeFilter}
            onChange={(e) => setLicenseTypeFilter(e.target.value as LicenseTypeFilter)}
            label="License Type"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'perpetual', label: 'Perpetual' },
              { value: 'subscription', label: 'Subscription' },
              { value: 'concurrent', label: 'Concurrent' },
            ]}
          />

          {/* Utilization Filter */}
          <Select
            id="utilization-filter"
            value={utilizationFilter}
            onChange={(e) => setUtilizationFilter(e.target.value as UtilizationFilter)}
            label="Utilization"
            options={[
              { value: 'all', label: 'All' },
              { value: 'available', label: 'Available Seats' },
              { value: 'near-capacity', label: 'Near Capacity (75-89%)' },
              { value: 'full', label: 'Full (90-100%)' },
              { value: 'over-allocated', label: 'Over-Allocated (>100%)' },
            ]}
          />

          {/* Vendor Filter */}
          <Select
            id="vendor-filter"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            label="Vendor"
            options={[{ value: 'all', label: 'All Vendors' }, ...uniqueVendors.map((v) => ({ value: v, label: v }))]}
          />

          {/* Clear Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button variant="outline" size="md" onClick={handleClearFilters} className="w-full">
                <Icon name="x" className="w-4 h-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* License List */}
      {filteredLicenses.length > 0 ? (
        <div className="space-y-3">
          {filteredLicenses.map((license) => {
            const available = getAvailableSeats(license);
            const utilization = getUtilization(license);
            const status = getUtilizationStatus(license);
            const expiringSoon = isExpiringSoon(license);

            // Determine bar color based on status
            let barColor = 'bg-blue-500';
            if (status === 'over') barColor = 'bg-red-500';
            else if (status === 'critical') barColor = 'bg-orange-500';
            else if (status === 'warning') barColor = 'bg-yellow-500';
            else barColor = 'bg-green-500';

            return (
              <Card key={license.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* License Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{license.name}</h3>
                      {expiringSoon && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Icon name="building" className="w-4 h-4" />
                        {license.vendor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="key" className="w-4 h-4" />
                        {license.licenseType.charAt(0).toUpperCase() + license.licenseType.slice(1)}
                      </span>
                      {license.renewalFrequency && (
                        <span className="flex items-center gap-1">
                          <Icon name="refresh" className="w-4 h-4" />
                          {license.renewalFrequency.charAt(0).toUpperCase() + license.renewalFrequency.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Utilization Bar */}
                    {license.seatCount && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {license.assignedSeats || 0} of {license.seatCount} seats assigned
                            {available > 0 && (
                              <span className="text-green-600 dark:text-green-400 ml-2">({available} available)</span>
                            )}
                            {available < 0 && (
                              <span className="text-red-600 dark:text-red-400 ml-2">
                                ({Math.abs(available)} over-allocated)
                              </span>
                            )}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{Math.round(utilization)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-300`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onViewAssignments && (
                      <Button variant="outline" size="sm" onClick={() => onViewAssignments(license)}>
                        <Icon name="users" className="w-4 h-4 mr-1" />
                        View ({license.assignments?.length || 0})
                      </Button>
                    )}
                    {onAssignLicense && available > 0 && (
                      <Button variant="primary" size="sm" onClick={() => onAssignLicense(license)}>
                        <Icon name="add" className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    {(onEditLicense || onUpdateLicense) && (
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(license)}>
                        <Icon name="edit" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <Icon name="key" className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No licenses found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filter criteria' : 'No software licenses available'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <Icon name="x" className="w-4 h-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <LicensePoolCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateLicense}
        />
      )}

      {editingLicense && (
        <LicensePoolEditModal
          license={editingLicense}
          onClose={() => setEditingLicense(null)}
          onSubmit={handleUpdateLicense}
        />
      )}
    </div>
  );
};
