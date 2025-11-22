// ============================================================================
// PRE-HIRE CONTEXT
// ============================================================================
// Centralized state management for pre-hire records with CRUD operations
// Now connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PreHire } from '../types';
import { mockPreHires } from '../utils/mockData';
import * as preHireService from '../services/preHireService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireContextType {
  preHires: PreHire[];
  editingPreHire: PreHire | null;
  loading: boolean;
  error: string | null;
  createPreHire: (preHire: Partial<PreHire>) => Promise<void>;
  updatePreHire: (id: string, updates: Partial<PreHire>) => Promise<void>;
  deletePreHire: (id: string) => Promise<void>;
  refreshPreHires: () => Promise<void>;
  startEdit: (preHire: PreHire) => void;
  cancelEdit: () => void;
  getPreHireById: (id: string) => PreHire | undefined;
}

interface PreHireProviderProps {
  children: ReactNode;
  useMockData?: boolean; // Allow fallback to mock data for testing
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PreHireContext = createContext<PreHireContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const PreHireProvider: React.FC<PreHireProviderProps> = ({
  children,
  useMockData = false
}) => {
  // State
  const [preHires, setPreHires] = useState<PreHire[]>([]);
  const [editingPreHire, setEditingPreHire] = useState<PreHire | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all pre-hires from API
   */
  const fetchPreHires = async () => {
    if (useMockData) {
      // Use mock data if specified (for development/testing)
      setPreHires(mockPreHires);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await preHireService.getAllPreHires();
      setPreHires(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pre-hires';
      console.error('[PreHireContext] Error fetching pre-hires:', errorMessage);
      setError(errorMessage);

      // Fallback to mock data on error
      console.warn('[PreHireContext] Falling back to mock data');
      setPreHires(mockPreHires);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh pre-hires (public method for manual refresh)
   */
  const refreshPreHires = async () => {
    await fetchPreHires();
  };

  // Fetch on mount
  useEffect(() => {
    fetchPreHires();
  }, []);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new pre-hire record
   */
  const createPreHire = async (preHireData: Partial<PreHire>) => {
    if (useMockData) {
      // Mock implementation
      const newPreHire: PreHire = {
        id: preHireData.id || `pre-${Date.now()}`,
        candidateName: preHireData.candidateName || '',
        email: preHireData.email,
        role: preHireData.role || '',
        department: preHireData.department || '',
        startDate: preHireData.startDate || new Date(),
        hiringManager: preHireData.hiringManager || '',
        status: preHireData.status || 'candidate',
        assignedPackage: preHireData.assignedPackage,
        customizations: preHireData.customizations,
        linkedEmployeeId: preHireData.linkedEmployeeId,
        createdBy: preHireData.createdBy || 'Current User',
        createdDate: preHireData.createdDate || new Date(),
        lastModified: new Date(),
      };
      setPreHires((prev) => [newPreHire, ...prev]);
      return;
    }

    try {
      setError(null);
      const newPreHire = await preHireService.createPreHire(preHireData);
      setPreHires((prev) => [newPreHire, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pre-hire';
      console.error('[PreHireContext] Error creating pre-hire:', errorMessage);
      setError(errorMessage);
      throw err; // Re-throw so UI can handle it
    }
  };

  /**
   * Update an existing pre-hire record
   */
  const updatePreHire = async (id: string, updates: Partial<PreHire>) => {
    if (useMockData) {
      // Mock implementation
      setPreHires((prev) =>
        prev.map((preHire) =>
          preHire.id === id
            ? {
                ...preHire,
                ...updates,
                lastModified: new Date(),
              }
            : preHire
        )
      );
      if (editingPreHire?.id === id) {
        setEditingPreHire(null);
      }
      return;
    }

    try {
      setError(null);
      const updatedPreHire = await preHireService.updatePreHire(id, updates);

      setPreHires((prev) =>
        prev.map((preHire) => (preHire.id === id ? updatedPreHire : preHire))
      );

      // Clear editing state if the edited pre-hire was being edited
      if (editingPreHire?.id === id) {
        setEditingPreHire(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pre-hire';
      console.error('[PreHireContext] Error updating pre-hire:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Delete a pre-hire record
   */
  const deletePreHire = async (id: string) => {
    if (useMockData) {
      // Mock implementation
      setPreHires((prev) => prev.filter((preHire) => preHire.id !== id));
      if (editingPreHire?.id === id) {
        setEditingPreHire(null);
      }
      return;
    }

    try {
      setError(null);
      await preHireService.deletePreHire(id);

      setPreHires((prev) => prev.filter((preHire) => preHire.id !== id));

      // Clear editing state if the deleted pre-hire was being edited
      if (editingPreHire?.id === id) {
        setEditingPreHire(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pre-hire';
      console.error('[PreHireContext] Error deleting pre-hire:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Start editing a pre-hire record
   */
  const startEdit = (preHire: PreHire) => {
    setEditingPreHire(preHire);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingPreHire(null);
  };

  /**
   * Get a single pre-hire by ID
   */
  const getPreHireById = (id: string): PreHire | undefined => {
    return preHires.find((preHire) => preHire.id === id);
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: PreHireContextType = {
    preHires,
    editingPreHire,
    loading,
    error,
    createPreHire,
    updatePreHire,
    deletePreHire,
    refreshPreHires,
    startEdit,
    cancelEdit,
    getPreHireById,
  };

  return (
    <PreHireContext.Provider value={value}>{children}</PreHireContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook to access pre-hire context
 * Must be used within PreHireProvider
 */
export const usePreHires = (): PreHireContextType => {
  const context = useContext(PreHireContext);
  if (!context) {
    throw new Error('usePreHires must be used within PreHireProvider');
  }
  return context;
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your app with PreHireProvider:
 *
 * <PreHireProvider useMockData={false}>
 *   <App />
 * </PreHireProvider>
 *
 * Use in components:
 *
 * const { preHires, loading, error, createPreHire, updatePreHire, deletePreHire } = usePreHires();
 *
 * // Show loading state
 * if (loading) return <LoadingSpinner />;
 *
 * // Show error state
 * if (error) return <ErrorMessage message={error} />;
 *
 * // CRUD operations (now async)
 * await createPreHire({ candidateName: 'John Doe', role: 'Developer', ... });
 * await updatePreHire('pre-123', { status: 'accepted' });
 * await deletePreHire('pre-123');
 */
