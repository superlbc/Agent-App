// ============================================================================
// HIERARCHICAL ROLE SELECTOR
// ============================================================================
// Searchable hierarchical dropdown for selecting Department Group + Role
// Data source: DepartmentGroup.csv
// Hierarchy: Department Group → Role (simplified from full hierarchy)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './Icon';

export interface RoleSelection {
  departmentGroup: string;
  role: string;
  fullDisplay: string; // "DepartmentGroup > Role"
}

export interface DepartmentRoleData {
  departmentGroup: string;
  department: string;
  role: string; // RoleWithoutNumbers
  gradeGroup?: string;
  grade?: string;
}

interface HierarchicalRoleSelectorProps {
  data: DepartmentRoleData[]; // All department/role combinations from CSV
  value: RoleSelection | null | RoleSelection[]; // Single or multi-select
  onChange: (selection: RoleSelection | null | RoleSelection[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
  multiSelect?: boolean; // Enable multi-select mode
}

export const HierarchicalRoleSelector: React.FC<HierarchicalRoleSelectorProps> = ({
  data,
  value,
  onChange,
  placeholder = 'Search department or role...',
  error,
  disabled = false,
  className = '',
  label,
  required = false,
  multiSelect = false,
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [tempSelections, setTempSelections] = useState<RoleSelection[]>([]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group data by department group with unique roles
  const groupedData = useMemo(() => {
    const groups: Record<string, Set<string>> = {};

    data.forEach((item) => {
      if (!groups[item.departmentGroup]) {
        groups[item.departmentGroup] = new Set();
      }
      groups[item.departmentGroup].add(item.role);
    });

    // Convert Sets to sorted arrays
    const result: Record<string, string[]> = {};
    Object.keys(groups).forEach((deptGroup) => {
      result[deptGroup] = Array.from(groups[deptGroup]).sort();
    });

    return result;
  }, [data]);

  // Flatten for searching
  const flatOptions = useMemo(() => {
    const options: RoleSelection[] = [];
    Object.entries(groupedData).forEach(([deptGroup, roles]) => {
      roles.forEach((role) => {
        options.push({
          departmentGroup: deptGroup,
          role,
          fullDisplay: `${deptGroup} > ${role}`,
        });
      });
    });
    return options;
  }, [groupedData]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return flatOptions;
    }

    const query = searchQuery.toLowerCase();
    return flatOptions.filter(
      (option) =>
        option.departmentGroup.toLowerCase().includes(query) ||
        option.role.toLowerCase().includes(query) ||
        option.fullDisplay.toLowerCase().includes(query)
    );
  }, [flatOptions, searchQuery]);

  // Group filtered options by department group
  const filteredGrouped = useMemo(() => {
    const groups: Record<string, RoleSelection[]> = {};
    filteredOptions.forEach((option) => {
      if (!groups[option.departmentGroup]) {
        groups[option.departmentGroup] = [];
      }
      groups[option.departmentGroup].push(option);
    });
    return groups;
  }, [filteredOptions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle selection
  const handleSelect = (selection: RoleSelection) => {
    onChange(selection);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div
        className={`
          relative flex items-center px-3 py-2 bg-white dark:bg-gray-700
          border rounded-lg cursor-text transition-all
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <Icon
          name="search"
          className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0"
        />

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : value?.fullDisplay || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={value ? value.fullDisplay : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            aria-label="Clear selection"
          >
            <Icon name="x" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}

        <Icon
          name="chevron-down"
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No matching roles found
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(filteredGrouped).map(([deptGroup, options]) => (
                <div key={deptGroup}>
                  {/* Department Group Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                    {deptGroup}
                  </div>

                  {/* Roles */}
                  {options.map((option) => {
                    const globalIndex = filteredOptions.findIndex(
                      (o) => o.fullDisplay === option.fullDisplay
                    );
                    const isHighlighted = globalIndex === highlightedIndex;

                    return (
                      <button
                        key={option.fullDisplay}
                        type="button"
                        data-index={globalIndex}
                        onClick={() => handleSelect(option)}
                        className={`
                          w-full px-6 py-2 text-left text-sm transition-colors
                          ${
                            isHighlighted
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                          ${
                            value?.fullDisplay === option.fullDisplay
                              ? 'font-medium'
                              : 'font-normal'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="briefcase" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>{option.role}</span>
                          {value?.fullDisplay === option.fullDisplay && (
                            <Icon
                              name="check"
                              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HierarchicalRoleSelector;
