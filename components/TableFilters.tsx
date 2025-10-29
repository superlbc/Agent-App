import React from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

export interface FilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Filters
  departments?: string[];
  selectedDepartments?: string[];
  onDepartmentsChange?: (departments: string[]) => void;

  owners?: string[];
  selectedOwners?: string[];
  onOwnersChange?: (owners: string[]) => void;

  statuses?: string[];
  selectedStatuses?: string[];
  onStatusesChange?: (statuses: string[]) => void;

  // Actions
  onClearAll: () => void;
  activeFilterCount: number;
}

/**
 * Collapsible filter panel for Next Steps table
 */
export const TableFilters: React.FC<TableFiltersProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search across all fields...',
  departments = [],
  selectedDepartments = [],
  onDepartmentsChange,
  owners = [],
  selectedOwners = [],
  onOwnersChange,
  statuses = [],
  selectedStatuses = [],
  onStatusesChange,
  onClearAll,
  activeFilterCount,
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
      {/* Search Box */}
      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Filter */}
        {onDepartmentsChange && (
          <MultiSelect
            label="Department"
            options={departments.map(d => ({ value: d, label: d }))}
            selected={selectedDepartments}
            onChange={onDepartmentsChange}
          />
        )}

        {/* Owner Filter */}
        {onOwnersChange && (
          <MultiSelect
            label="Owner"
            options={owners.map(o => ({ value: o, label: o }))}
            selected={selectedOwners}
            onChange={onOwnersChange}
          />
        )}

        {/* Status Filter */}
        {onStatusesChange && (
          <MultiSelect
            label="Status"
            options={statuses.map(s => ({ value: s, label: s }))}
            selected={selectedStatuses}
            onChange={onStatusesChange}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active` : 'No filters applied'}
        </span>
        {activeFilterCount > 0 && (
          <Button size="sm" variant="outline" onClick={onClearAll}>
            <Icon name="close" className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Multi-select dropdown component
 */
const MultiSelect: React.FC<{
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange(options.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm text-left border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
      >
        <span className="truncate">
          {selected.length === 0
            ? `All ${label}s`
            : selected.length === options.length
            ? `All ${label}s`
            : `${selected.length} ${label}${selected.length === 1 ? '' : 's'}`}
        </span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="h-4 w-4 flex-shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline focus:outline-none"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-slate-600 dark:text-slate-400 hover:underline focus:outline-none"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          <div className="py-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="h-4 w-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary focus:ring-offset-0 mr-3"
                />
                <span className="text-sm text-slate-900 dark:text-slate-100 truncate">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
