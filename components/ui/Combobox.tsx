// ============================================================================
// COMBOBOX COMPONENT (SEARCHABLE SELECT)
// ============================================================================
// A searchable dropdown component for large option lists

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  required = false,
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get display text for selected value
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || '';

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

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
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchQuery('');
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;

      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Handle input click
  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={isOpen ? searchQuery : displayText}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? placeholder : displayText || placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10
            bg-white dark:bg-gray-800
            border rounded-lg
            text-sm text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${name}-listbox`}
          role="combobox"
          autoComplete="off"
        />

        {/* Dropdown Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            className="w-5 h-5 text-gray-400"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown List */}
      {isOpen && (
        <ul
          ref={listRef}
          id={`${name}-listbox`}
          role="listbox"
          className="
            absolute z-50 mt-1 w-full
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            rounded-lg shadow-lg
            max-h-60 overflow-y-auto
            py-1
          "
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No results found
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-3 py-2 cursor-pointer text-sm
                  ${
                    index === highlightedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/30'
                      : ''
                  }
                  ${
                    option.value === value
                      ? 'bg-primary-100 dark:bg-primary-900/50 font-medium'
                      : ''
                  }
                  hover:bg-primary-50 dark:hover:bg-primary-900/30
                  text-gray-900 dark:text-gray-100
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <Combobox
 *   label="Department"
 *   name="department"
 *   value={selectedDepartment}
 *   onChange={setSelectedDepartment}
 *   options={[
 *     { value: 'it', label: 'Information Technology' },
 *     { value: 'hr', label: 'Human Resources' },
 *     { value: 'finance', label: 'Finance' },
 *   ]}
 *   placeholder="Search departments..."
 *   required
 * />
 */
