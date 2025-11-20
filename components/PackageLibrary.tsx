// ============================================================================
// PACKAGE LIBRARY COMPONENT
// ============================================================================
// Browse and filter all available equipment packages

import React, { useState, useMemo } from 'react';
import { Package } from '../types';
import { PackageCard } from './PackageCard';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { calculatePackageCost } from '../utils/mockData';
import { DEPARTMENTS, ROLES } from '../constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageLibraryProps {
  packages: Package[];
  selectedPackage?: Package | null;
  onSelect?: (pkg: Package) => void;
  onView?: (pkg: Package) => void;
  onEdit?: (pkg: Package) => void;
  onDelete?: (pkg: Package) => void;
  onDuplicate?: (pkg: Package) => void;
  onCreate?: () => void;
  className?: string;
}

type SortField = 'name' | 'cost' | 'createdDate';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// ============================================================================
// COMPONENT
// ============================================================================

export const PackageLibrary: React.FC<PackageLibraryProps> = ({
  packages,
  selectedPackage,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onCreate,
  className = '',
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'standard' | 'exception'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // ============================================================================
  // FILTERING, SORTING & SEARCH
  // ============================================================================

  const filteredAndSortedPackages = useMemo(() => {
    let filtered = packages.filter((pkg) => {
      // Search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.description.toLowerCase().includes(searchLower);

      // Role filter
      const roleMatch =
        roleFilter === 'all' || pkg.roleTarget.includes(roleFilter);

      // Department filter
      const departmentMatch =
        departmentFilter === 'all' || pkg.departmentTarget.includes(departmentFilter);

      // Type filter
      const typeMatch =
        typeFilter === 'all' ||
        (typeFilter === 'standard' && pkg.isStandard) ||
        (typeFilter === 'exception' && !pkg.isStandard);

      return searchMatch && roleMatch && departmentMatch && typeMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cost':
          comparison = calculatePackageCost(a) - calculatePackageCost(b);
          break;
        case 'createdDate':
          comparison = a.createdDate.getTime() - b.createdDate.getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [packages, searchQuery, roleFilter, departmentFilter, typeFilter, sortField, sortOrder]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    return {
      total: filteredAndSortedPackages.length,
      standard: filteredAndSortedPackages.filter((p) => p.isStandard).length,
      exception: filteredAndSortedPackages.filter((p) => !p.isStandard).length,
    };
  }, [filteredAndSortedPackages]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    setTypeFilter('all');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all';

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Package Library
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and manage equipment packages for pre-hire assignment
          </p>
        </div>

        {onCreate && (
          <Button variant="primary" onClick={onCreate}>
            <Icon name="add" className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Role Filter */}
          <Select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Role"
            options={[
              { value: 'all', label: 'All Roles' },
              ...ROLES.map((role) => ({ value: role, label: role }))
            ]}
          />

          {/* Department Filter */}
          <Select
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            label="Department"
            options={[
              { value: 'all', label: 'All Departments' },
              ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))
            ]}
          />

          {/* Type Filter */}
          <Select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            label="Package Type"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'standard', label: 'Standard (Auto-approve)' },
              { value: 'exception', label: 'Exception (SVP Approval)' }
            ]}
          />

          {/* Sort */}
          <Select
            id="sort-by"
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            label="Sort By"
            options={[
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
              { value: 'cost-asc', label: 'Cost (Low to High)' },
              { value: 'cost-desc', label: 'Cost (High to Low)' },
              { value: 'createdDate-desc', label: 'Newest First' },
              { value: 'createdDate-asc', label: 'Oldest First' }
            ]}
          />
        </div>

        {/* View Mode & Stats */}
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <strong>{stats.total}</strong> package{stats.total !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="text-green-600 dark:text-green-400">
              {stats.standard} standard
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              {stats.exception} exception
            </span>
          </div>

          {/* View Mode & Clear Filters */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <Icon name="x" className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="!px-3 !py-1"
              >
                <Icon name="grid" className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="!px-3 !py-1"
              >
                <Icon name="list" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Package Grid/List */}
      {filteredAndSortedPackages.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredAndSortedPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onSelect={onSelect}
              isSelected={selectedPackage?.id === pkg.id}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Icon
              name="package"
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No packages found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first equipment package'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <Icon name="x" className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
              {onCreate && (
                <Button variant="primary" onClick={onCreate}>
                  <Icon name="add" className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Full management mode (with all actions):
 * <PackageLibrary
 *   packages={mockPackages}
 *   onView={(pkg) => setViewingPackage(pkg)}
 *   onEdit={(pkg) => setEditingPackage(pkg)}
 *   onDelete={(pkg) => handleDeletePackage(pkg.id)}
 *   onDuplicate={(pkg) => handleDuplicatePackage(pkg)}
 *   onCreate={() => setCreating(true)}
 * />
 *
 * Selection mode (for pre-hire assignment):
 * <PackageLibrary
 *   packages={mockPackages}
 *   selectedPackage={selectedPackage}
 *   onSelect={(pkg) => setSelectedPackage(pkg)}
 *   onView={(pkg) => setViewingPackage(pkg)}
 * />
 *
 * Browse-only mode:
 * <PackageLibrary
 *   packages={mockPackages}
 *   onView={(pkg) => setViewingPackage(pkg)}
 * />
 */
