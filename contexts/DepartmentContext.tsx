/**
 * Department Context
 *
 * Provides global access to Momentum department data throughout the application.
 *
 * This context stores a Map of all active Momentum users with their department,
 * role, and organizational information. The data is fetched once at login and
 * used throughout the session to enrich meeting attendee information.
 *
 * Usage:
 *   const { departmentMap, isLoading, error, refreshDepartmentData } = useDepartmentContext();
 *   const userData = departmentMap?.get('user@momentum.com');
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MomentumUserData } from '../services/departmentService';

interface DepartmentContextType {
  /** Map of email -> Momentum user data (null if not loaded or failed) */
  departmentMap: Map<string, MomentumUserData> | null;

  /** Whether department data is currently being fetched */
  isLoading: boolean;

  /** Error message if fetch failed (null if no error) */
  error: string | null;

  /** Timestamp when data was last fetched (null if not yet fetched) */
  lastFetchedAt: Date | null;

  /** Function to update the department map (called by AuthGuard after fetch) */
  setDepartmentData: (data: Map<string, MomentumUserData> | null) => void;

  /** Function to set loading state */
  setIsLoading: (loading: boolean) => void;

  /** Function to set error state */
  setError: (error: string | null) => void;

  /** Function to manually refresh department data */
  refreshDepartmentData: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

interface DepartmentProviderProps {
  children: ReactNode;
}

export const DepartmentProvider: React.FC<DepartmentProviderProps> = ({ children }) => {
  const [departmentMap, setDepartmentMapState] = useState<Map<string, MomentumUserData> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const setDepartmentData = (data: Map<string, MomentumUserData> | null) => {
    setDepartmentMapState(data);
    setLastFetchedAt(data ? new Date() : null);
    setError(null);
  };

  const refreshDepartmentData = async () => {
    // Refresh functionality to be implemented when needed
    // This would re-fetch the department data from Power Automate
    };

  const value: DepartmentContextType = {
    departmentMap,
    isLoading,
    error,
    lastFetchedAt,
    setDepartmentData,
    setIsLoading,
    setError,
    refreshDepartmentData,
  };

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
};

/**
 * Hook to access department context
 *
 * @throws Error if used outside DepartmentProvider
 * @returns Department context
 *
 * @example
 * const { departmentMap } = useDepartmentContext();
 * const userData = departmentMap?.get('user@momentum.com');
 * if (userData) {
 *   * }
 */
export const useDepartmentContext = (): DepartmentContextType => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartmentContext must be used within a DepartmentProvider');
  }
  return context;
};

/**
 * Hook to lookup a single user's department data by email
 *
 * Convenience hook that combines context access with email lookup.
 *
 * @param email - User's email address (case-insensitive)
 * @returns User data if found, null otherwise
 *
 * @example
 * const userData = useDepartmentLookup('user@momentum.com');
 * // "Technology"
 */
export const useDepartmentLookup = (email: string | null | undefined): MomentumUserData | null => {
  const { departmentMap } = useDepartmentContext();

  if (!departmentMap || !email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  return departmentMap.get(normalizedEmail) || null;
};
