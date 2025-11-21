// ============================================================================
// MANAGER SELECTOR COMPONENT
// ============================================================================
// Azure AD search for hiring managers with profile images/initials

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Participant } from '../types';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ManagerSelectorProps {
  value?: Participant | null;
  onChange: (manager: Participant | null) => void;
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
 * Get initials from name
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get background color for initials based on name
 */
const getInitialsColor = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const index = name.length % colors.length;
  return colors[index];
};

/**
 * Search Microsoft Graph API for users
 */
const searchUsers = async (query: string): Promise<Participant[]> => {
  // TODO: Implement actual Microsoft Graph API search
  // For now, return mock data for development

  if (!query || query.length < 2) {
    return [];
  }

  // Mock implementation - replace with real Graph API call
  // Example: GET https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName,'${query}')&$select=id,displayName,mail,jobTitle,department

  const mockUsers: Participant[] = [
    {
      id: 'user-001',
      displayName: 'Sarah Johnson',
      email: 'sarah.johnson@momentumww.com',
      jobTitle: 'VP of Creative',
      department: 'Creative',
      photoUrl: undefined,
      source: 'graph',
    },
    {
      id: 'user-002',
      displayName: 'Michael Chen',
      email: 'michael.chen@momentumww.com',
      jobTitle: 'Director of Technology',
      department: 'Technology',
      photoUrl: undefined,
      source: 'graph',
    },
    {
      id: 'user-003',
      displayName: 'Emily Rodriguez',
      email: 'emily.rodriguez@momentumww.com',
      jobTitle: 'Senior Manager',
      department: 'Operations',
      photoUrl: undefined,
      source: 'graph',
    },
  ];

  // Filter mock data based on query
  const lowerQuery = query.toLowerCase();
  return mockUsers.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery) ||
      user.department?.toLowerCase().includes(lowerQuery)
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ManagerSelector: React.FC<ManagerSelectorProps> = ({
  value,
  onChange,
  label = 'Hiring Manager',
  placeholder = 'Search for a manager...',
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // SEARCH LOGIC
  // ============================================================================

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const handleSelect = (user: Participant) => {
    onChange(user);
    setSearchQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleSelect(searchResults[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // ============================================================================
  // CLICK OUTSIDE TO CLOSE
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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

      {/* Selected Manager Display */}
      {value && !isOpen ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg">
          {/* Avatar */}
          {value.photoUrl ? (
            <img
              src={value.photoUrl}
              alt={value.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getInitialsColor(
                value.displayName || ''
              )}`}
            >
              {getInitials(value.displayName || '')}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {value.displayName}
            </div>
            {value.email && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {value.email}
              </div>
            )}
            {value.jobTitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {value.jobTitle}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              error={error}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isLoading ? (
                <Icon name="loader" className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <Icon name="search" className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Dropdown Results */}
          {isOpen && searchQuery.length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                <ul className="py-1">
                  {searchResults.map((user, index) => (
                    <li
                      key={user.id}
                      className={`
                        flex items-center gap-3 px-3 py-2 cursor-pointer
                        ${
                          index === focusedIndex
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                      onClick={() => handleSelect(user)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      {/* Avatar */}
                      {user.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getInitialsColor(
                            user.displayName || ''
                          )}`}
                        >
                          {getInitials(user.displayName || '')}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.displayName}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </div>
                        )}
                        {user.jobTitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.jobTitle} • {user.department}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Searching...
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No managers found
                </div>
              )}
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
 * const [manager, setManager] = useState<Participant | null>(null);
 *
 * <ManagerSelector
 *   value={manager}
 *   onChange={setManager}
 *   label="Hiring Manager"
 *   required
 * />
 *
 * Integration with forms:
 *
 * <ManagerSelector
 *   value={formData.hiringManager}
 *   onChange={(manager) => handleChange('hiringManager', manager)}
 *   label="Select Hiring Manager"
 *   placeholder="Search by name or email..."
 *   required
 *   error={errors.hiringManager}
 *   helpText="Start typing to search for managers in Azure AD"
 * />
 *
 * TODO: Replace mock searchUsers function with real Microsoft Graph API call:
 *
 * const searchUsers = async (query: string): Promise<Participant[]> => {
 *   const graphClient = getGraphClient(); // Your Graph client setup
 *   const response = await graphClient
 *     .api('/users')
 *     .filter(`startswith(displayName,'${query}') or startswith(mail,'${query}')`)
 *     .select('id,displayName,mail,jobTitle,department,officeLocation')
 *     .top(10)
 *     .get();
 *
 *   return response.value.map((user: any) => ({
 *     id: user.id,
 *     displayName: user.displayName,
 *     email: user.mail,
 *     jobTitle: user.jobTitle,
 *     department: user.department,
 *     officeLocation: user.officeLocation,
 *     source: 'graph',
 *   }));
 * };
 */
