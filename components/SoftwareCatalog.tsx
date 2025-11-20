// ============================================================================
// SOFTWARE CATALOG COMPONENT
// ============================================================================
// Browse and select software items for equipment packages

import React, { useState, useMemo } from 'react';
import { Software } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SoftwareCatalogProps {
  software: Software[];
  selectedItems?: Software[];
  onSelect?: (item: Software) => void;
  onDeselect?: (item: Software) => void;
  multiSelect?: boolean;
  showCost?: boolean;
  className?: string;
}

// ============================================================================
// LICENSE TYPE CONFIGURATION
// ============================================================================

const LICENSE_TYPES = [
  { value: 'all', label: 'All Software', icon: 'package' as const },
  { value: 'perpetual', label: 'Perpetual', icon: 'key' as const },
  { value: 'subscription', label: 'Subscription', icon: 'refresh' as const },
  { value: 'concurrent', label: 'Concurrent', icon: 'users' as const },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const SoftwareCatalog: React.FC<SoftwareCatalogProps> = ({
  software,
  selectedItems = [],
  onSelect,
  onDeselect,
  multiSelect = true,
  showCost = true,
  className = '',
}) => {
  // State
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showApprovalOnly, setShowApprovalOnly] = useState(false);

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  const filteredSoftware = useMemo(() => {
    return software.filter((item) => {
      // Filter by license type
      const typeMatch = selectedType === 'all' || item.licenseType === selectedType;

      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchLower) ||
        item.vendor.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower);

      // Filter by approval requirement
      const approvalMatch = !showApprovalOnly || item.requiresApproval;

      return typeMatch && searchMatch && approvalMatch;
    });
  }, [software, selectedType, searchQuery, showApprovalOnly]);

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const isSelected = (item: Software): boolean => {
    return selectedItems.some((selected) => selected.id === item.id);
  };

  const handleItemClick = (item: Software) => {
    if (!onSelect && !onDeselect) return;

    if (isSelected(item)) {
      onDeselect?.(item);
    } else {
      onSelect?.(item);
    }
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const monthlyCost = selectedItems.reduce((sum, item) => {
      if (item.renewalFrequency === 'monthly') {
        return sum + (item.cost || 0);
      } else if (item.renewalFrequency === 'annual') {
        return sum + (item.cost || 0) / 12;
      }
      return sum;
    }, 0);

    return {
      total: filteredSoftware.length,
      selected: selectedItems.length,
      monthlyCost,
      annualCost: monthlyCost * 12,
    };
  }, [filteredSoftware, selectedItems]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderLicenseInfo = (item: Software) => {
    return (
      <div className="mt-3 space-y-1">
        {/* License Type */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">License:</span>
          <span
            className={`
              px-2 py-0.5 rounded-full font-medium
              ${
                item.licenseType === 'perpetual'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : item.licenseType === 'subscription'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }
            `}
          >
            {item.licenseType.charAt(0).toUpperCase() + item.licenseType.slice(1)}
          </span>
        </div>

        {/* Renewal Frequency */}
        {item.renewalFrequency && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Renewal:</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">
              {item.renewalFrequency}
            </span>
          </div>
        )}

        {/* Seat Count */}
        {item.seatCount !== undefined && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Seats:</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {item.seatCount} concurrent
            </span>
          </div>
        )}

        {/* Approval Required */}
        {item.requiresApproval && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Approver:</span>
            <span className="text-orange-700 dark:text-orange-300 font-medium">
              {item.approver || 'Required'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderSoftwareCard = (item: Software) => {
    const selected = isSelected(item);

    return (
      <Card
        key={item.id}
        className={`
          ${onSelect || onDeselect ? 'cursor-pointer hover:shadow-lg transition-all' : ''}
          ${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
        `}
        onClick={() => handleItemClick(item)}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.name}
                </h4>
                {item.requiresApproval && (
                  <Icon
                    name="alert-circle"
                    className="w-4 h-4 text-orange-600 dark:text-orange-400"
                    title="Requires approval"
                  />
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {item.vendor}
              </p>
            </div>

            {/* Selection Indicator */}
            {selected && (
              <Icon
                name="check-circle"
                className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2"
              />
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* License Information */}
          {renderLicenseInfo(item)}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Cost */}
            {showCost && item.cost !== undefined && (
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${item.cost.toFixed(2)}
                </span>
                {item.renewalFrequency && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    /{item.renewalFrequency === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Software Catalog
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and select software for your equipment package
          </p>
        </div>

        {/* Selection Summary */}
        {multiSelect && selectedItems.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {stats.selected}
              </span>{' '}
              selected
            </p>
            {showCost && (
              <>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  ${stats.monthlyCost.toFixed(2)}/mo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  (${stats.annualCost.toFixed(2)}/yr)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search by name, vendor, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon="search"
        />

        {/* Type Filter & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {LICENSE_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType(type.value)}
            >
              <Icon name={type.icon} className="w-4 h-4 mr-2" />
              {type.label}
            </Button>
          ))}

          {/* Approval Filter */}
          <div className="ml-auto">
            <Button
              variant={showApprovalOnly ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowApprovalOnly(!showApprovalOnly)}
            >
              <Icon name="alert-circle" className="w-4 h-4 mr-2" />
              Requires Approval
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing <strong>{stats.total}</strong>{' '}
          {selectedType === 'all'
            ? 'items'
            : LICENSE_TYPES.find((t) => t.value === selectedType)?.label.toLowerCase() + ' licenses'}
        </span>
        {(searchQuery || showApprovalOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setShowApprovalOnly(false);
            }}
          >
            <Icon name="x" className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Software Grid */}
      {filteredSoftware.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSoftware.map(renderSoftwareCard)}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <Icon
              name="search"
              className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3"
            />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No software found
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery || showApprovalOnly
                ? 'Try adjusting your search or filter criteria'
                : 'No software items available in this category'}
            </p>
            {(searchQuery || showApprovalOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setShowApprovalOnly(false);
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Multi-select mode (for package builder):
 * <SoftwareCatalog
 *   software={mockSoftware}
 *   selectedItems={selectedSoftware}
 *   onSelect={(item) => setSelectedSoftware([...selectedSoftware, item])}
 *   onDeselect={(item) => setSelectedSoftware(selectedSoftware.filter(s => s.id !== item.id))}
 *   multiSelect={true}
 *   showCost={true}
 * />
 *
 * Single-select mode (for license assignment):
 * <SoftwareCatalog
 *   software={mockSoftware}
 *   selectedItems={selectedItem ? [selectedItem] : []}
 *   onSelect={(item) => setSelectedItem(item)}
 *   onDeselect={() => setSelectedItem(null)}
 *   multiSelect={false}
 * />
 *
 * Browse-only mode (no selection):
 * <SoftwareCatalog
 *   software={mockSoftware}
 *   showCost={false}
 * />
 */
