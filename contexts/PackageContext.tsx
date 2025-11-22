// ============================================================================
// PACKAGE CONTEXT
// ============================================================================
// Centralized state management for equipment packages with CRUD operations
// Now connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Package, Hardware, Software } from '../types';
import {
  mockPackages,
  mockHardware,
  mockSoftware,
} from '../utils/mockData';
import * as packageService from '../services/packageService';
import * as hardwareService from '../services/hardwareService';
import * as softwareService from '../services/softwareService';

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
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createPackage: (pkg: Partial<Package>) => Promise<void>;
  updatePackage: (id: string, updates: Partial<Package>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  duplicatePackage: (id: string) => Promise<void>;
  refreshPackages: () => Promise<void>;
  refreshHardware: () => Promise<void>;
  refreshSoftware: () => Promise<void>;

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
  useMockData?: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PackageContext = createContext<PackageContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const PackageProvider: React.FC<PackageProviderProps> = ({
  children,
  useMockData = false
}) => {
  // State
  const [packages, setPackages] = useState<Package[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all packages from API
   */
  const fetchPackages = async () => {
    if (useMockData) {
      setPackages(mockPackages);
      return;
    }

    try {
      const response = await packageService.getAllPackages();
      setPackages(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch packages';
      console.error('[PackageContext] Error fetching packages:', errorMessage);
      setError(errorMessage);
      // Fallback to mock data
      setPackages(mockPackages);
    }
  };

  /**
   * Fetch all hardware from API
   */
  const fetchHardware = async () => {
    if (useMockData) {
      setHardware(mockHardware);
      return;
    }

    try {
      const response = await hardwareService.getAllHardware();
      setHardware(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hardware';
      console.error('[PackageContext] Error fetching hardware:', errorMessage);
      // Fallback to mock data
      setHardware(mockHardware);
    }
  };

  /**
   * Fetch all software from API
   */
  const fetchSoftware = async () => {
    if (useMockData) {
      setSoftware(mockSoftware);
      return;
    }

    try {
      const response = await softwareService.getAllSoftware();
      setSoftware(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch software';
      console.error('[PackageContext] Error fetching software:', errorMessage);
      // Fallback to mock data
      setSoftware(mockSoftware);
    }
  };

  /**
   * Fetch all data (packages, hardware, software)
   */
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    await Promise.all([
      fetchPackages(),
      fetchHardware(),
      fetchSoftware(),
    ]);

    setLoading(false);
  };

  /**
   * Public refresh methods
   */
  const refreshPackages = async () => {
    await fetchPackages();
  };

  const refreshHardware = async () => {
    await fetchHardware();
  };

  const refreshSoftware = async () => {
    await fetchSoftware();
  };

  // Fetch on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new equipment package
   */
  const createPackage = async (packageData: Partial<Package>) => {
    if (useMockData) {
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
      return;
    }

    try {
      setError(null);
      const newPackage = await packageService.createPackage(packageData);
      setPackages((prev) => [newPackage, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create package';
      console.error('[PackageContext] Error creating package:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Update an existing package
   */
  const updatePackage = async (id: string, updates: Partial<Package>) => {
    if (useMockData) {
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
      if (editingPackage?.id === id) setEditingPackage(null);
      if (viewingPackage?.id === id) {
        setViewingPackage((prev) =>
          prev ? { ...prev, ...updates, lastModified: new Date() } : null
        );
      }
      return;
    }

    try {
      setError(null);
      const updatedPackage = await packageService.updatePackage(id, updates);

      setPackages((prev) =>
        prev.map((pkg) => (pkg.id === id ? updatedPackage : pkg))
      );

      // Clear editing state if the edited package was being edited
      if (editingPackage?.id === id) {
        setEditingPackage(null);
      }

      // Update viewing state if the updated package was being viewed
      if (viewingPackage?.id === id) {
        setViewingPackage(updatedPackage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update package';
      console.error('[PackageContext] Error updating package:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Delete a package
   */
  const deletePackage = async (id: string) => {
    if (useMockData) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      if (editingPackage?.id === id) setEditingPackage(null);
      if (viewingPackage?.id === id) setViewingPackage(null);
      return;
    }

    try {
      setError(null);
      await packageService.deletePackage(id);

      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));

      // Clear editing state if the deleted package was being edited
      if (editingPackage?.id === id) {
        setEditingPackage(null);
      }

      // Clear viewing state if the deleted package was being viewed
      if (viewingPackage?.id === id) {
        setViewingPackage(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete package';
      console.error('[PackageContext] Error deleting package:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Duplicate an existing package
   */
  const duplicatePackage = async (id: string) => {
    const original = packages.find((pkg) => pkg.id === id);
    if (!original) return;

    const duplicated: Partial<Package> = {
      name: `${original.name} (Copy)`,
      description: original.description,
      roleTarget: original.roleTarget,
      departmentTarget: original.departmentTarget,
      hardware: original.hardware,
      software: original.software,
      licenses: original.licenses,
      isStandard: original.isStandard,
    };

    await createPackage(duplicated);
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
    loading,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    duplicatePackage,
    refreshPackages,
    refreshHardware,
    refreshSoftware,
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
 * <PackageProvider useMockData={false}>
 *   <App />
 * </PackageProvider>
 *
 * Use in components:
 *
 * const {
 *   packages,
 *   hardware,
 *   software,
 *   loading,
 *   error,
 *   createPackage,
 *   updatePackage,
 *   deletePackage,
 *   duplicatePackage,
 *   startEdit,
 *   startView,
 * } = usePackages();
 *
 * // Show loading state
 * if (loading) return <LoadingSpinner />;
 *
 * // Show error state
 * if (error) return <ErrorMessage message={error} />;
 *
 * // CRUD operations (now async)
 * await createPackage({ name: 'New Package', ... });
 * await updatePackage('pkg-123', { name: 'Updated Name' });
 * await deletePackage('pkg-123');
 * await duplicatePackage('pkg-123');
 */
