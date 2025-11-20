// ============================================================================
// PRE-HIRE CONTEXT
// ============================================================================
// Centralized state management for pre-hire records with CRUD operations

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PreHire } from '../types';
import { mockPreHires } from '../utils/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireContextType {
  preHires: PreHire[];
  editingPreHire: PreHire | null;
  createPreHire: (preHire: Partial<PreHire>) => void;
  updatePreHire: (id: string, updates: Partial<PreHire>) => void;
  deletePreHire: (id: string) => void;
  startEdit: (preHire: PreHire) => void;
  cancelEdit: () => void;
  getPreHireById: (id: string) => PreHire | undefined;
}

interface PreHireProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PreHireContext = createContext<PreHireContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const PreHireProvider: React.FC<PreHireProviderProps> = ({ children }) => {
  // State
  const [preHires, setPreHires] = useState<PreHire[]>(mockPreHires);
  const [editingPreHire, setEditingPreHire] = useState<PreHire | null>(null);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new pre-hire record
   */
  const createPreHire = (preHireData: Partial<PreHire>) => {
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
  };

  /**
   * Update an existing pre-hire record
   */
  const updatePreHire = (id: string, updates: Partial<PreHire>) => {
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

    // Clear editing state if the edited pre-hire was being edited
    if (editingPreHire?.id === id) {
      setEditingPreHire(null);
    }
  };

  /**
   * Delete a pre-hire record
   */
  const deletePreHire = (id: string) => {
    setPreHires((prev) => prev.filter((preHire) => preHire.id !== id));

    // Clear editing state if the deleted pre-hire was being edited
    if (editingPreHire?.id === id) {
      setEditingPreHire(null);
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
    createPreHire,
    updatePreHire,
    deletePreHire,
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
 * <PreHireProvider>
 *   <App />
 * </PreHireProvider>
 *
 * Use in components:
 *
 * const { preHires, createPreHire, updatePreHire, deletePreHire } = usePreHires();
 *
 * createPreHire({ candidateName: 'John Doe', role: 'Developer', ... });
 * updatePreHire('pre-123', { status: 'accepted' });
 * deletePreHire('pre-123');
 */
