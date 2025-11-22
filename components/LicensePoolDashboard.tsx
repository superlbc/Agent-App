// ============================================================================
// LICENSE POOL DASHBOARD COMPONENT
// ============================================================================
// Displays license utilization, tracks available vs assigned seats,
// highlights over-allocated and expiring licenses
//
// **Phase 3 Update**: Now uses LicensePool interface instead of deprecated Software fields

import React, { useState, useMemo } from 'react';
import { LicensePool, Software } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { CompactStatsBar, CompactStat } from './ui/CompactStatsBar';
import { LicensePoolCreateModal } from './LicensePoolCreateModal';
import { LicensePoolEditModal } from './LicensePoolEditModal';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicensePoolDashboardProps {
  licensePools: LicensePool[];
  software?: Software[]; // Optional: for fetching software names/vendors
  onAssignLicense?: (pool: LicensePool) => void;
  onViewAssignments?: (pool: LicensePool) => void;
  onEditLicense?: (pool: LicensePool) => void;
  onCreateLicense?: (pool: Partial<LicensePool>) => void;
  onUpdateLicense?: (pool: LicensePool) => void;
  className?: string;
}

interface LicenseStats {
  totalPools: number;
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
 * Calculate available seats for a license pool
 */
const getAvailableSeats = (pool: LicensePool): number => {
  return Math.max(0, pool.totalSeats - pool.assignedSeats);
};

/**
 * Calculate utilization percentage
 */
const getUtilization = (pool: LicensePool): number => {
  if (pool.totalSeats === 0) return 0;
  return (pool.assignedSeats / pool.totalSeats) * 100;
};

/**
 * Get utilization status
 */
const getUtilizationStatus = (pool: LicensePool): 'ok' | 'warning' | 'critical' | 'over' => {
  const utilization = getUtilization(pool);
  if (utilization > 100) return 'over';
  if (utilization >= 90) return 'critical';
  if (utilization >= 75) return 'warning';
  return 'ok';
};

/**
 * Check if license is expiring within 30 days
 */
const isExpiringSoon = (pool: LicensePool): boolean => {
  if (!pool.renewalDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const renewalDate = new Date(pool.renewalDate);
  return renewalDate <= thirtyDaysFromNow;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LicensePoolDashboard: React.FC<LicensePoolDashboardProps> = ({
  licensePools,
  software = [],
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
  const [editingPool, setEditingPool] = useState<LicensePool | null>(null);

  // Helper to get software info by ID
  const getSoftwareInfo = (softwareId: string): { name: string; vendor: string } => {
    const sw = software.find((s) => s.id === softwareId);
    return sw
      ? { name: sw.name, vendor: sw.vendor }
      : { name: 'Unknown Software', vendor: 'Unknown Vendor' };
  };

  // ============================================================================
  // STATS CALCULATION
  // ============================================================================

  const stats: LicenseStats = useMemo(() => {
    return licensePools.reduce(
      (acc, pool) => {
        return {
          totalPools: acc.totalPools + 1,
          totalSeats: acc.totalSeats + pool.totalSeats,
          assignedSeats: acc.assignedSeats + pool.assignedSeats,
          availableSeats: acc.availableSeats + Math.max(0, pool.totalSeats - pool.assignedSeats),
          overAllocated: acc.overAllocated + (pool.assignedSeats > pool.totalSeats ? 1 : 0),
          expiringWithin30Days: acc.expiringWithin30Days + (isExpiringSoon(pool) ? 1 : 0),
        };
      },
      {
        totalPools: 0,
        totalSeats: 0,
        assignedSeats: 0,
        availableSeats: 0,
        overAllocated: 0,
        expiringWithin30Days: 0,
      }
    );
  }, [licensePools]);

  // Compact stats for header bar
  const compactStats: CompactStat[] = useMemo(() => {
    const utilizationPercent = stats.totalSeats > 0
      ? Math.round((stats.assignedSeats / stats.totalSeats) * 100)
      : 0;

    return [
      {
        label: 'Pools',
        value: stats.totalPools,
        icon: 'key',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        description: `${stats.totalPools} license pools with ${stats.totalSeats} total seats`,
      },
      {
        label: 'Assigned',
        value: stats.assignedSeats,
        icon: 'check-circle',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        description: `${stats.assignedSeats} seats assigned (${utilizationPercent}% utilization)`,
      },
      {
        label: 'Available',
        value: stats.availableSeats,
        icon: 'package',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/30',
        description: `${stats.availableSeats} seats ready to assign`,
      },
      {
        label: 'Over-Allocated',
        value: stats.overAllocated,
        icon: 'alert-triangle',
        color: stats.overAllocated > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400',
        bgColor: stats.overAllocated > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-900/30',
        description: stats.overAllocated > 0
          ? `${stats.overAllocated} pools with more assignments than seats`
          : 'No over-allocated pools',
      },
      {
        label: 'Expiring',
        value: stats.expiringWithin30Days,
        icon: 'clock',
        color: stats.expiringWithin30Days > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400',
        bgColor: stats.expiringWithin30Days > 0 ? 'bg-orange-50 dark:bg-orange-900/30' : 'bg-gray-50 dark:bg-gray-900/30',
        description: stats.expiringWithin30Days > 0
          ? `${stats.expiringWithin30Days} pools expiring within 30 days`
          : 'No licenses expiring soon',
      },
    ];
  }, [stats]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const uniqueVendors = useMemo(() => {
    const vendors = licensePools
      .map((pool) => getSoftwareInfo(pool.softwareId).vendor)
      .filter((v) => v !== 'Unknown Vendor');
    return Array.from(new Set(vendors)).sort();
  }, [licensePools, software]);

  const filteredPools = useMemo(() => {
    return licensePools.filter((pool) => {
      const swInfo = getSoftwareInfo(pool.softwareId);

      // Search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        swInfo.name.toLowerCase().includes(searchLower) ||
        swInfo.vendor.toLowerCase().includes(searchLower) ||
        pool.id.toLowerCase().includes(searchLower);

      // License type filter
      const typeMatch = licenseTypeFilter === 'all' || pool.licenseType === licenseTypeFilter;

      // Vendor filter
      const vendorMatch = vendorFilter === 'all' || swInfo.vendor === vendorFilter;

      // Utilization filter
      let utilizationMatch = true;
      if (utilizationFilter !== 'all') {
        const status = getUtilizationStatus(pool);
        switch (utilizationFilter) {
          case 'available':
            utilizationMatch = getAvailableSeats(pool) > 0;
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
  }, [licensePools, searchQuery, licenseTypeFilter, vendorFilter, utilizationFilter, software]);

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
  const handleCreatePool = (pool: Partial<LicensePool>) => {
    if (onCreateLicense) {
      onCreateLicense(pool);
    }
    setIsCreateModalOpen(false);
  };

  const handleUpdatePool = (pool: LicensePool) => {
    if (onUpdateLicense) {
      onUpdateLicense(pool);
    }
    setEditingPool(null);
  };

  const handleEditClick = (pool: LicensePool) => {
    if (onEditLicense) {
      onEditLicense(pool);
    }
    setEditingPool(pool);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Compact Stats Bar Header */}
      <CompactStatsBar
        title="License Pool Dashboard"
        headerIcon="key"
        stats={compactStats}
        actionButton={onCreateLicense ? {
          label: 'Create License Pool',
          icon: 'plus',
          onClick: () => setIsCreateModalOpen(true),
        } : undefined}
      />

      {/* Secondary Description Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monitor license utilization and manage software seat allocations
        </p>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6 space-y-6">

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search license pools by software name, vendor, or pool ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* License Pool List */}
      {filteredPools.length > 0 ? (
        <div className="space-y-3">
          {filteredPools.map((pool) => {
            const swInfo = getSoftwareInfo(pool.softwareId);
            const available = getAvailableSeats(pool);
            const utilization = getUtilization(pool);
            const status = getUtilizationStatus(pool);
            const expiringSoon = isExpiringSoon(pool);

            // Determine bar color based on status
            let barColor = 'bg-blue-500';
            if (status === 'over') barColor = 'bg-red-500';
            else if (status === 'critical') barColor = 'bg-orange-500';
            else if (status === 'warning') barColor = 'bg-yellow-500';
            else barColor = 'bg-green-500';

            return (
              <Card key={pool.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Pool Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{swInfo.name}</h3>
                      {expiringSoon && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Icon name="building" className="w-4 h-4" />
                        {swInfo.vendor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="key" className="w-4 h-4" />
                        {pool.licenseType.charAt(0).toUpperCase() + pool.licenseType.slice(1)}
                      </span>
                      {pool.renewalFrequency && (
                        <span className="flex items-center gap-1">
                          <Icon name="refresh" className="w-4 h-4" />
                          {pool.renewalFrequency.charAt(0).toUpperCase() + pool.renewalFrequency.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Utilization Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {pool.assignedSeats} of {pool.totalSeats} seats assigned
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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onViewAssignments && (
                      <Button variant="outline" size="sm" onClick={() => onViewAssignments(pool)}>
                        <Icon name="users" className="w-4 h-4 mr-1" />
                        View ({pool.assignments?.length || 0})
                      </Button>
                    )}
                    {onAssignLicense && available > 0 && (
                      <Button variant="primary" size="sm" onClick={() => onAssignLicense(pool)}>
                        <Icon name="add" className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    {(onEditLicense || onUpdateLicense) && (
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(pool)}>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No license pools found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filter criteria' : 'No license pools available'}
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
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <LicensePoolCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePool}
        />
      )}

      {editingPool && (
        <LicensePoolEditModal
          license={editingPool as any} // Type compatibility with existing modal
          onClose={() => setEditingPool(null)}
          onSubmit={handleUpdatePool as any} // Type compatibility with existing modal
        />
      )}
    </div>
  );
};
