// ============================================================================
// MANAGER SELECTOR COMPONENT
// ============================================================================
// Searchable component for selecting hiring managers via Graph API
// Shows user profile with photo, name, title, department, and email

import React, { useState, useEffect, useRef } from 'react';
import { GraphService } from '../services/graphService';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ManagerProfile {
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  photoUrl?: string;
}

interface ManagerSelectorProps {
  value: ManagerProfile | null;
  onChange: (manager: ManagerProfile | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ManagerSelector: React.FC<ManagerSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Search for hiring manager...',
  error,
  disabled = false,
  className = '',
  label,
  required = false,
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ManagerProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Graph service
  const graphService = GraphService.getInstance();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Click outside handler
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

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await graphService.searchUsers(searchQuery);

        // Map to ManagerProfile format
        const profiles: ManagerProfile[] = await Promise.all(
          users.slice(0, 10).map(async (user: any) => {
            let photoUrl: string | undefined;
            try {
              photoUrl = await graphService.getUserPhoto(user.userPrincipalName || user.mail);
            } catch {
              // Photo not available
            }

            return {
              displayName: user.displayName,
              email: user.userPrincipalName || user.mail,
              jobTitle: user.jobTitle,
              department: user.department,
              photoUrl,
            };
          })
        );

        setResults(profiles);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('[ManagerSelector] Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[highlightedIndex]) {
            handleSelect(results[highlightedIndex]);
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
  }, [isOpen, highlightedIndex, results]);

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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelect = (manager: ManagerProfile) => {
    onChange(manager);
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
        {/* Selected Manager Display */}
        {value && !isOpen ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value.photoUrl ? (
              <img
                src={value.photoUrl}
                alt={value.displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {value.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {value.displayName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {value.jobTitle || value.email}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Icon
              name="search"
              className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </>
        )}

        {/* Loading/Clear Button */}
        {isSearching ? (
          <Icon name="refresh" className="w-4 h-4 text-gray-400 animate-spin ml-2" />
        ) : value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors ml-2"
            aria-label="Clear selection"
          >
            <Icon name="x" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        ) : null}

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
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <Icon name="refresh" className="w-5 h-5 mx-auto mb-2 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {searchQuery.trim() ? 'No users found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((manager, index) => {
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={manager.email}
                    type="button"
                    data-index={index}
                    onClick={() => handleSelect(manager)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors flex items-center gap-3
                      ${
                        isHighlighted
                          ? 'bg-indigo-50 dark:bg-indigo-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {/* Photo */}
                    {manager.photoUrl ? (
                      <img
                        src={manager.photoUrl}
                        alt={manager.displayName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {manager.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {manager.displayName}
                      </p>
                      {manager.jobTitle && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {manager.jobTitle}
                        </p>
                      )}
                      {manager.department && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {manager.department}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {manager.email}
                      </p>
                    </div>

                    {/* Check mark if selected */}
                    {value?.email === manager.email && (
                      <Icon
                        name="check"
                        className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerSelector;
