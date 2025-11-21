// ============================================================================
// HARDWARE CATALOG COMPONENT
// ============================================================================
// Browse and select hardware items for equipment packages

import React, { useState, useMemo } from 'react';
import { Hardware } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HardwareCatalogProps {
  hardware: Hardware[];
  selectedItems?: Hardware[];
  onSelect?: (item: Hardware) => void;
  onDeselect?: (item: Hardware) => void;
  multiSelect?: boolean;
  showCost?: boolean;
  className?: string;
}

// ============================================================================
// HARDWARE TYPE CONFIGURATION
// ============================================================================

const HARDWARE_TYPES = [
  { value: 'all', label: 'All Hardware', icon: 'package' as const },
  { value: 'computer', label: 'Computers', icon: 'monitor' as const },
  { value: 'monitor', label: 'Monitors', icon: 'monitor' as const },
  { value: 'keyboard', label: 'Keyboards', icon: 'keyboard' as const },
  { value: 'mouse', label: 'Mice', icon: 'mouse' as const },
  { value: 'dock', label: 'Docks', icon: 'link' as const },
  { value: 'headset', label: 'Headsets', icon: 'headphones' as const },
  { value: 'accessory', label: 'Accessories', icon: 'package' as const },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const HardwareCatalog: React.FC<HardwareCatalogProps> = ({
  hardware,
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

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  const filteredHardware = useMemo(() => {
    return hardware.filter((item) => {
      // Filter by type
      const typeMatch = selectedType === 'all' || item.type === selectedType;

      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        item.model.toLowerCase().includes(searchLower) ||
        item.manufacturer.toLowerCase().includes(searchLower) ||
        Object.values(item.specifications || {}).some((spec) =>
          spec?.toLowerCase().includes(searchLower)
        );

      return typeMatch && searchMatch;
    });
  }, [hardware, selectedType, searchQuery]);

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const isSelected = (item: Hardware): boolean => {
    return selectedItems.some((selected) => selected.id === item.id);
  };

  const handleItemClick = (item: Hardware) => {
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
    return {
      total: filteredHardware.length,
      selected: selectedItems.length,
      totalCost: selectedItems.reduce((sum, item) => sum + (item.cost || 0), 0),
    };
  }, [filteredHardware, selectedItems]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSpecs = (specs: Hardware['specifications']) => {
    if (!specs) return null;

    const specEntries = Object.entries(specs).filter(([_, value]) => value);
    if (specEntries.length === 0) return null;

    return (
      <div className="mt-3 space-y-1">
        {specEntries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderHardwareCard = (item: Hardware) => {
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
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.model}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {item.manufacturer}
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

          {/* Specifications */}
          {renderSpecs(item.specifications)}

          {/* Footer */}
          {showCost && item.cost !== undefined && (
            <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${item.cost.toFixed(2)}
              </span>
            </div>
          )}
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
            Hardware Catalog
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and select hardware for your equipment package
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
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Total: ${stats.totalCost.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search by model, manufacturer, or specs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon="search"
        />

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          {HARDWARE_TYPES.map((type) => (
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
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing <strong>{stats.total}</strong>{' '}
          {selectedType === 'all' ? 'items' : HARDWARE_TYPES.find((t) => t.value === selectedType)?.label.toLowerCase()}
        </span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            <Icon name="x" className="w-4 h-4 mr-1" />
            Clear search
          </Button>
        )}
      </div>

      {/* Hardware Grid */}
      {filteredHardware.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHardware.map(renderHardwareCard)}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <Icon name="search" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hardware found
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search or filter criteria'
                : 'No hardware items available in this category'}
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear search
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
 * <HardwareCatalog
 *   hardware={mockHardware}
 *   selectedItems={selectedHardware}
 *   onSelect={(item) => setSelectedHardware([...selectedHardware, item])}
 *   onDeselect={(item) => setSelectedHardware(selectedHardware.filter(h => h.id !== item.id))}
 *   multiSelect={true}
 *   showCost={true}
 * />
 *
 * Single-select mode (for replacement selection):
 * <HardwareCatalog
 *   hardware={mockHardware}
 *   selectedItems={selectedItem ? [selectedItem] : []}
 *   onSelect={(item) => setSelectedItem(item)}
 *   onDeselect={() => setSelectedItem(null)}
 *   multiSelect={false}
 * />
 *
 * Browse-only mode (no selection):
 * <HardwareCatalog
 *   hardware={mockHardware}
 *   showCost={false}
 * />
 */
