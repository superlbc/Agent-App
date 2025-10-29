import { useState, useMemo, useCallback, useEffect } from 'react';

export interface FilterConfig<T> {
  [key: string]: any; // Filter values by field name
}

export interface FilterOptions {
  searchFields?: string[]; // Fields to search across
  searchQuery?: string; // Global search text
}

interface UseTableFilterReturn<T> {
  filteredData: T[];
  filters: FilterConfig<T>;
  setFilter: (field: keyof T, value: any) => void;
  clearFilter: (field: keyof T) => void;
  clearAllFilters: () => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string;
  activeFilterCount: number;
}

/**
 * Custom hook for table filtering with multi-field and text search support
 *
 * @param data - The array of data to filter
 * @param searchFields - Optional array of field names to include in text search
 * @param persistKey - Optional localStorage key for filter persistence
 * @returns Filtered data and filter controls
 *
 * @example
 * const { filteredData, setFilter, clearAllFilters, setSearchQuery } = useTableFilter(
 *   data,
 *   ['department', 'owner', 'task']
 * );
 */
export function useTableFilter<T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[] = [],
  persistKey?: string
): UseTableFilterReturn<T> {
  // Load initial state from localStorage if persistKey provided
  const getInitialState = useCallback((): { filters: FilterConfig<T>; searchQuery: string } => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(`tableFilter_${persistKey}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('[useTableFilter] Failed to load persisted filters:', error);
      }
    }
    return { filters: {}, searchQuery: '' };
  }, [persistKey]);

  const initialState = getInitialState();
  const [filters, setFilters] = useState<FilterConfig<T>>(initialState.filters);
  const [searchQuery, setSearchQueryState] = useState<string>(initialState.searchQuery);

  // Persist filters to localStorage
  useEffect(() => {
    if (persistKey) {
      try {
        localStorage.setItem(
          `tableFilter_${persistKey}`,
          JSON.stringify({ filters, searchQuery })
        );
      } catch (error) {
        console.warn('[useTableFilter] Failed to persist filters:', error);
      }
    }
  }, [filters, searchQuery, persistKey]);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply field-specific filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue == null || filterValue === '' || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return; // Skip empty filters
      }

      result = result.filter((item) => {
        const itemValue = item[field as keyof T];

        // Handle array filters (multi-select)
        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }

        // Handle string comparison (case-insensitive)
        if (typeof filterValue === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(filterValue.toLowerCase());
        }

        // Handle exact match
        return itemValue === filterValue;
      });
    });

    // Apply global search query
    if (searchQuery && searchQuery.trim() !== '' && searchFields.length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    return result;
  }, [data, filters, searchQuery, searchFields]);

  const setFilter = useCallback((field: keyof T, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearFilter = useCallback((field: keyof T) => {
    setFilters((prev) => {
      const updated = { ...prev };
      delete updated[field as string];
      return updated;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQueryState('');
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filters).forEach((value) => {
      if (value != null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        count++;
      }
    });
    if (searchQuery && searchQuery.trim() !== '') {
      count++;
    }
    return count;
  }, [filters, searchQuery]);

  return {
    filteredData,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSearchQuery,
    searchQuery,
    activeFilterCount,
  };
}
