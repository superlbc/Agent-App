// ============================================================================
// DEPARTMENT GROUP & ROLE SELECTOR COMPONENT
// ============================================================================
// Phase 10: Searchable combo box for Department Group + Role selection
// Shows Grade Group and Grade info (read-only)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import type { DepartmentGroupData } from '../services/departmentGroupService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DepartmentGroupRoleValue {
  departmentGroup: string;
  role: string;
  department?: string;
  gradeGroup?: string;
  grade?: string;
}

interface DepartmentGroupRoleSelectorProps {
  value?: DepartmentGroupRoleValue | null;
  onChange: (value: DepartmentGroupRoleValue | null) => void;
  departmentGroupData: DepartmentGroupData[]; // Data from departmentGroupService
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get unique department groups from data
 */
const getUniqueDepartmentGroups = (data: DepartmentGroupData[]): string[] => {
  const unique = new Set(data.map(item => item.departmentGroup));
  return Array.from(unique).sort();
};

/**
 * Get unique roles from data (optionally filtered by department group)
 */
const getUniqueRoles = (
  data: DepartmentGroupData[],
  departmentGroup?: string
): string[] => {
  const filtered = departmentGroup
    ? data.filter(item => item.departmentGroup === departmentGroup)
    : data;
  const unique = new Set(filtered.map(item => item.role));
  return Array.from(unique).sort();
};

/**
 * Find matching data entry
 */
const findMatchingEntry = (
  data: DepartmentGroupData[],
  departmentGroup: string,
  role: string
): DepartmentGroupData | undefined => {
  return data.find(
    item => item.departmentGroup === departmentGroup && item.role === role
  );
};

/**
 * Filter items by search query
 */
const filterBySearch = (items: string[], query: string): string[] => {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter(item => item.toLowerCase().includes(lowerQuery));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DepartmentGroupRoleSelector: React.FC<DepartmentGroupRoleSelectorProps> = ({
  value,
  onChange,
  departmentGroupData,
  label = 'Department Group & Role',
  placeholder = 'Select department group and role...',
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'departmentGroup' | 'role'>('departmentGroup');
  const [tempDepartmentGroup, setTempDepartmentGroup] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allDepartmentGroups = getUniqueDepartmentGroups(departmentGroupData);
  const filteredDepartmentGroups = filterBySearch(allDepartmentGroups, searchQuery);

  const allRoles = getUniqueRoles(departmentGroupData, tempDepartmentGroup);
  const filteredRoles = filterBySearch(allRoles, searchQuery);

  const currentItems = step === 'departmentGroup' ? filteredDepartmentGroups : filteredRoles;

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const handleSelectDepartmentGroup = useCallback((deptGroup: string) => {
    setTempDepartmentGroup(deptGroup);
    setStep('role');
    setSearchQuery('');
    setFocusedIndex(-1);

    // Focus input for next step
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSelectRole = useCallback((role: string) => {
    const matchingEntry = findMatchingEntry(departmentGroupData, tempDepartmentGroup, role);

    const selectedValue: DepartmentGroupRoleValue = {
      departmentGroup: tempDepartmentGroup,
      role: role,
      department: matchingEntry?.department,
      gradeGroup: matchingEntry?.gradeGroup,
      grade: matchingEntry?.grade,
    };

    onChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
    setStep('departmentGroup');
    setTempDepartmentGroup('');
    setFocusedIndex(-1);
  }, [tempDepartmentGroup, departmentGroupData, onChange]);

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setStep('departmentGroup');
    setTempDepartmentGroup('');
    setFocusedIndex(-1);
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setStep('departmentGroup');
    setTempDepartmentGroup('');
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  const handleBack = () => {
    setStep('departmentGroup');
    setTempDepartmentGroup('');
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < currentItems.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < currentItems.length) {
          const selectedItem = currentItems[focusedIndex];
          if (step === 'departmentGroup') {
            handleSelectDepartmentGroup(selectedItem);
          } else {
            handleSelectRole(selectedItem);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setStep('departmentGroup');
        setTempDepartmentGroup('');
        setFocusedIndex(-1);
        break;
      case 'Backspace':
        if (step === 'role' && searchQuery === '') {
          e.preventDefault();
          handleBack();
        }
        break;
    }
  };

  // ============================================================================
  // CLICK OUTSIDE TO CLOSE
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setStep('departmentGroup');
        setTempDepartmentGroup('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Value Display */}
      {value && !isOpen ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Icon name="briefcase" className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {value.departmentGroup} • {value.role}
            </div>
            {value.department && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {value.department}
              </div>
            )}
            {(value.gradeGroup || value.grade) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {[value.gradeGroup, value.grade].filter(Boolean).join(' • ')}
              </div>
            )}
          </div>

          {/* Clear Button */}
          {!disabled && (
            <Button
              variant="outline"
              onClick={handleClear}
              title="Clear selection"
              className="!p-2"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleOpen}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              error={error}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="search" className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step === 'role' && (
                    <button
                      onClick={handleBack}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Back to department groups"
                    >
                      <Icon name="chevron-left" className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {step === 'departmentGroup' ? (
                      'Select Department Group'
                    ) : (
                      <>
                        <span className="text-primary-600 dark:text-primary-400">{tempDepartmentGroup}</span>
                        {' → Select Role'}
                      </>
                    )}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentItems.length} options
                </span>
              </div>

              {/* Results */}
              <div className="overflow-y-auto">
                {currentItems.length > 0 ? (
                  <ul className="py-1">
                    {currentItems.map((item, index) => (
                      <li
                        key={item}
                        className={`
                          px-3 py-2 cursor-pointer text-sm
                          ${
                            index === focusedIndex
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={() => {
                          if (step === 'departmentGroup') {
                            handleSelectDepartmentGroup(item);
                          } else {
                            handleSelectRole(item);
                          }
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No {step === 'departmentGroup' ? 'department groups' : 'roles'} found
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Basic usage:
 *
 * import { DepartmentGroupRoleSelector } from './components/DepartmentGroupRoleSelector';
 * import { fetchDepartmentGroupData } from './services/departmentGroupService';
 *
 * const [selection, setSelection] = useState<DepartmentGroupRoleValue | null>(null);
 * const [deptGroupData, setDeptGroupData] = useState<DepartmentGroupData[]>([]);
 *
 * useEffect(() => {
 *   const loadData = async () => {
 *     const data = await fetchDepartmentGroupData();
 *     setDeptGroupData(data);
 *   };
 *   loadData();
 * }, []);
 *
 * <DepartmentGroupRoleSelector
 *   value={selection}
 *   onChange={setSelection}
 *   departmentGroupData={deptGroupData}
 *   label="Department Group & Role"
 *   required
 *   helpText="Select your department group first, then choose your role"
 * />
 *
 * // Access selected values:
 * console.log(selection?.departmentGroup); // "Global Technology"
 * console.log(selection?.role); // "Developer"
 * console.log(selection?.gradeGroup); // "Individual Contributor"
 * console.log(selection?.grade); // "Senior"
 */
