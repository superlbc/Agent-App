// ============================================================================
// PACKAGE CONTEXT
// ============================================================================
// Centralized state management for equipment packages with CRUD operations

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Package, Hardware, Software } from '../types';
import {
  mockPackages,
  mockHardware,
  mockSoftware,
} from '../utils/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageContextType {
  // State
  packages: Package[];
  hardware: Hardware[];
  software: Software[];
  editingPackage: Package | null;
  viewingPackage: Package | null;

  // CRUD Operations
  createPackage: (pkg: Partial<Package>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  duplicatePackage: (id: string) => void;

  // Editing
  startEdit: (pkg: Package) => void;
  cancelEdit: () => void;

  // Viewing
  startView: (pkg: Package) => void;
  cancelView: () => void;

  // Helpers
  getPackageById: (id: string) => Package | undefined;
}

interface PackageProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PackageContext = createContext<PackageContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const PackageProvider: React.FC<PackageProviderProps> = ({ children }) => {
  // State
  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [hardware] = useState<Hardware[]>(mockHardware);
  const [software] = useState<Software[]>(mockSoftware);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new equipment package
   */
  const createPackage = (packageData: Partial<Package>) => {
    const newPackage: Package = {
      id: packageData.id || `pkg-${Date.now()}`,
      name: packageData.name || '',
      description: packageData.description || '',
      roleTarget: packageData.roleTarget || [],
      departmentTarget: packageData.departmentTarget || [],
      hardware: packageData.hardware || [],
      software: packageData.software || [],
      licenses: packageData.licenses || [],
      isStandard: packageData.isStandard ?? true,
      createdBy: packageData.createdBy || 'Current User',
      createdDate: packageData.createdDate || new Date(),
      lastModified: new Date(),
    };

    setPackages((prev) => [newPackage, ...prev]);
  };

  /**
   * Update an existing package
   */
  const updatePackage = (id: string, updates: Partial<Package>) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              ...updates,
              lastModified: new Date(),
            }
          : pkg
      )
    );

    // Clear editing state if the edited package was being edited
    if (editingPackage?.id === id) {
      setEditingPackage(null);
    }

    // Update viewing state if the updated package was being viewed
    if (viewingPackage?.id === id) {
      setViewingPackage((prev) =>
        prev ? { ...prev, ...updates, lastModified: new Date() } : null
      );
    }
  };

  /**
   * Delete a package
   */
  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));

    // Clear editing state if the deleted package was being edited
    if (editingPackage?.id === id) {
      setEditingPackage(null);
    }

    // Clear viewing state if the deleted package was being viewed
    if (viewingPackage?.id === id) {
      setViewingPackage(null);
    }
  };

  /**
   * Duplicate an existing package
   */
  const duplicatePackage = (id: string) => {
    const original = packages.find((pkg) => pkg.id === id);
    if (!original) return;

    const duplicated: Package = {
      ...original,
      id: `pkg-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdBy: 'Current User',
      createdDate: new Date(),
      lastModified: new Date(),
    };

    setPackages((prev) => [duplicated, ...prev]);
  };

  // ============================================================================
  // EDITING STATE MANAGEMENT
  // ============================================================================

  /**
   * Start editing a package
   */
  const startEdit = (pkg: Package) => {
    setEditingPackage(pkg);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingPackage(null);
  };

  // ============================================================================
  // VIEWING STATE MANAGEMENT
  // ============================================================================

  /**
   * Start viewing a package
   */
  const startView = (pkg: Package) => {
    setViewingPackage(pkg);
  };

  /**
   * Cancel viewing
   */
  const cancelView = () => {
    setViewingPackage(null);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get a single package by ID
   */
  const getPackageById = (id: string): Package | undefined => {
    return packages.find((pkg) => pkg.id === id);
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: PackageContextType = {
    packages,
    hardware,
    software,
    editingPackage,
    viewingPackage,
    createPackage,
    updatePackage,
    deletePackage,
    duplicatePackage,
    startEdit,
    cancelEdit,
    startView,
    cancelView,
    getPackageById,
  };

  return (
    <PackageContext.Provider value={value}>{children}</PackageContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook to access package context
 * Must be used within PackageProvider
 */
export const usePackages = (): PackageContextType => {
  const context = useContext(PackageContext);
  if (!context) {
    throw new Error('usePackages must be used within PackageProvider');
  }
  return context;
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your app with PackageProvider:
 *
 * <PackageProvider>
 *   <App />
 * </PackageProvider>
 *
 * Use in components:
 *
 * const {
 *   packages,
 *   hardware,
 *   software,
 *   createPackage,
 *   updatePackage,
 *   deletePackage,
 *   duplicatePackage,
 *   startEdit,
 *   startView,
 * } = usePackages();
 *
 * // Create new package
 * createPackage({ name: 'New Package', ... });
 *
 * // Update existing package
 * updatePackage('pkg-123', { name: 'Updated Name' });
 *
 * // Delete package
 * deletePackage('pkg-123');
 *
 * // Duplicate package
 * duplicatePackage('pkg-123');
 *
 * // Start editing
 * startEdit(selectedPackage);
 *
 * // Start viewing
 * startView(selectedPackage);
 */
