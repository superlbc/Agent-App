import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

interface UseTableSortReturn<T> {
  sortedData: T[];
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
  getSortIndicator: (key: keyof T) => '↑' | '↓' | '↕' | null;
}

/**
 * Custom hook for table sorting with multi-column support
 *
 * @param data - The array of data to sort
 * @param initialSortKey - Optional initial sort column
 * @param initialSortDirection - Optional initial sort direction
 * @returns Sorted data and sort controls
 *
 * @example
 * const { sortedData, sortConfig, requestSort, getSortIndicator } = useTableSort(data, 'name');
 */
export function useTableSort<T extends Record<string, any>>(
  data: T[],
  initialSortKey: keyof T | null = null,
  initialSortDirection: SortDirection = 'asc'
): UseTableSortReturn<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey,
    direction: initialSortDirection,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      // Handle dates (check if value looks like a date)
      const aDate = tryParseDate(aValue);
      const bDate = tryParseDate(bValue);
      if (aDate && bDate) {
        return aDate.getTime() - bDate.getTime();
      }

      // Fallback: convert to string and compare
      return String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
    });

    return sortConfig.direction === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortConfig]);

  const requestSort = useCallback((key: keyof T) => {
    setSortConfig((prevConfig) => {
      // If clicking the same column, cycle through: asc -> desc -> null (unsorted)
      if (prevConfig.key === key) {
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        if (prevConfig.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      // Otherwise, start with ascending
      return { key, direction: 'asc' };
    });
  }, []);

  const getSortIndicator = useCallback(
    (key: keyof T): '↑' | '↓' | '↕' | null => {
      if (sortConfig.key !== key) {
        return '↕'; // Sortable indicator
      }
      if (sortConfig.direction === 'asc') {
        return '↑';
      }
      if (sortConfig.direction === 'desc') {
        return '↓';
      }
      return null;
    },
    [sortConfig]
  );

  return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIndicator,
  };
}

/**
 * Attempts to parse a value as a date
 */
function tryParseDate(value: any): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    // Check for common date patterns
    const patterns = [
      /^\d{4}-\d{2}-\d{2}$/, // ISO date
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // US date
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Month Day, Year
    ];

    const matchesPattern = patterns.some((pattern) => pattern.test(value));
    if (matchesPattern) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
}
