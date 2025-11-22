// ============================================================================
// LICENSE CONTEXT
// ============================================================================
// Centralized state management for software licenses and license pools
// Now connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Software, LicenseAssignment } from '../types';
import { mockSoftware } from '../utils/mockData';
import * as softwareService from '../services/softwareService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicenseContextValue {
  // State
  licenses: Software[];
  loading: boolean;
  error: string | null;

  // License CRUD operations
  createLicense: (license: Partial<Software>) => Promise<Software>;
  updateLicense: (id: string, updates: Partial<Software>) => Promise<void>;
  deleteLicense: (id: string) => Promise<void>;
  getLicense: (id: string) => Software | undefined;
  refreshLicenses: () => Promise<void>;

  // License pool operations
  expandLicensePool: (licenseId: string, additionalSeats: number) => Promise<void>;

  // License assignment operations
  assignLicense: (licenseId: string, assignment: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status'>) => Promise<void>;
  reclaimLicense: (licenseId: string, employeeIds?: string[], reclaimExpired?: boolean) => Promise<void>;
  getAssignments: (licenseId: string) => LicenseAssignment[];

  // Utility functions
  getAvailableSeats: (licenseId: string) => number;
  getUtilization: (licenseId: string) => number;
  isOverAllocated: (licenseId: string) => boolean;
}

interface LicenseProviderProps {
  children: ReactNode;
  initialLicenses?: Software[];
  useMockData?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const LicenseProvider: React.FC<LicenseProviderProps> = ({
  children,
  initialLicenses = [],
  useMockData = false,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [licenses, setLicenses] = useState<Software[]>(initialLicenses);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all licenses from API
   */
  const fetchLicenses = async () => {
    if (useMockData) {
      setLicenses(mockSoftware);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await softwareService.getAllSoftware();
      setLicenses(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch licenses';
      console.error('[LicenseContext] Error fetching licenses:', errorMessage);
      setError(errorMessage);

      // Fallback to mock data
      console.warn('[LicenseContext] Falling back to mock data');
      setLicenses(mockSoftware);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Public refresh method
   */
  const refreshLicenses = async () => {
    await fetchLicenses();
  };

  // Fetch on mount
  useEffect(() => {
    fetchLicenses();
  }, []);

  // ============================================================================
  // LICENSE CRUD OPERATIONS
  // ============================================================================

  const createLicense = useCallback(async (licenseData: Partial<Software>): Promise<Software> => {
    if (useMockData) {
      const newLicense: Software = {
        id: licenseData.id || `sw-${Date.now()}`,
        name: licenseData.name || '',
        vendor: licenseData.vendor || '',
        licenseType: licenseData.licenseType || 'subscription',
        requiresApproval: licenseData.requiresApproval || false,
        approver: licenseData.approver || 'Auto',
        cost: licenseData.cost || 0,
        costFrequency: licenseData.costFrequency,
        renewalFrequency: licenseData.renewalFrequency,
        seatCount: licenseData.seatCount || 0,
        assignedSeats: 0,
        description: licenseData.description,
        assignments: [],
        vendorContact: licenseData.vendorContact,
        internalContact: licenseData.internalContact,
        autoRenew: licenseData.autoRenew,
        renewalDate: licenseData.renewalDate,
        purchaseDate: licenseData.purchaseDate,
      };

      setLicenses((prev) => [...prev, newLicense]);
      return newLicense;
    }

    try {
      setError(null);
      const newLicense = await softwareService.createSoftware(licenseData);
      setLicenses((prev) => [...prev, newLicense]);
      return newLicense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create license';
      console.error('[LicenseContext] Error creating license:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [useMockData]);

  const updateLicense = useCallback(async (id: string, updates: Partial<Software>) => {
    if (useMockData) {
      setLicenses((prev) =>
        prev.map((license) =>
          license.id === id ? { ...license, ...updates } : license
        )
      );
      return;
    }

    try {
      setError(null);
      const updatedLicense = await softwareService.updateSoftware(id, updates);

      setLicenses((prev) =>
        prev.map((license) => (license.id === id ? updatedLicense : license))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update license';
      console.error('[LicenseContext] Error updating license:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [useMockData]);

  const deleteLicense = useCallback(async (id: string) => {
    if (useMockData) {
      setLicenses((prev) => prev.filter((license) => license.id !== id));
      return;
    }

    try {
      setError(null);
      await softwareService.deleteSoftware(id);

      setLicenses((prev) => prev.filter((license) => license.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete license';
      console.error('[LicenseContext] Error deleting license:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [useMockData]);

  const getLicense = useCallback(
    (id: string): Software | undefined => {
      return licenses.find((license) => license.id === id);
    },
    [licenses]
  );

  // ============================================================================
  // LICENSE POOL OPERATIONS
  // ============================================================================

  const expandLicensePool = useCallback(async (licenseId: string, additionalSeats: number) => {
    const license = licenses.find((l) => l.id === licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    const newSeatCount = (license.seatCount || 0) + additionalSeats;

    if (useMockData) {
      setLicenses((prev) =>
        prev.map((l) => {
          if (l.id === licenseId) {
            return {
              ...l,
              seatCount: newSeatCount,
            };
          }
          return l;
        })
      );
      return;
    }

    try {
      setError(null);
      await updateLicense(licenseId, { seatCount: newSeatCount });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to expand license pool';
      console.error('[LicenseContext] Error expanding license pool:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [licenses, useMockData, updateLicense]);

  // ============================================================================
  // LICENSE ASSIGNMENT OPERATIONS
  // ============================================================================

  const assignLicense = useCallback(
    async (
      licenseId: string,
      assignmentData: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status'>
    ) => {
      if (useMockData) {
        setLicenses((prev) =>
          prev.map((license) => {
            if (license.id === licenseId) {
              const newAssignment: LicenseAssignment = {
                id: `assign-${Date.now()}`,
                licenseId,
                ...assignmentData,
                assignedDate: new Date(),
                status: 'active',
              };

              return {
                ...license,
                assignedSeats: (license.assignedSeats || 0) + 1,
                assignments: [...(license.assignments || []), newAssignment],
              };
            }
            return license;
          })
        );
        return;
      }

      try {
        setError(null);
        const response = await softwareService.assignLicense(licenseId, {
          employeeId: assignmentData.employeeId,
          employeeName: assignmentData.employeeName,
          employeeEmail: assignmentData.employeeEmail,
          expirationDate: assignmentData.expirationDate?.toISOString(),
          notes: assignmentData.notes,
        });

        setLicenses((prev) =>
          prev.map((license) =>
            license.id === licenseId ? response.updatedSoftware : license
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to assign license';
        console.error('[LicenseContext] Error assigning license:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [useMockData]
  );

  const reclaimLicense = useCallback(
    async (licenseId: string, employeeIds?: string[], reclaimExpired?: boolean) => {
      if (useMockData) {
        setLicenses((prev) =>
          prev.map((license) => {
            if (license.id === licenseId) {
              let assignmentsToRevoke: LicenseAssignment[] = [];

              if (employeeIds && employeeIds.length > 0) {
                assignmentsToRevoke = license.assignments?.filter(
                  (a) => a.status === 'active' && employeeIds.includes(a.employeeId)
                ) || [];
              } else if (reclaimExpired) {
                const now = new Date();
                assignmentsToRevoke = license.assignments?.filter(
                  (a) => a.status === 'active' && a.expirationDate && new Date(a.expirationDate) < now
                ) || [];
              }

              const updatedAssignments = license.assignments?.map((a) =>
                assignmentsToRevoke.find((revoked) => revoked.id === a.id)
                  ? { ...a, status: 'revoked' as const }
                  : a
              );

              return {
                ...license,
                assignedSeats: Math.max(0, (license.assignedSeats || 0) - assignmentsToRevoke.length),
                assignments: updatedAssignments,
              };
            }
            return license;
          })
        );
        return;
      }

      try {
        setError(null);
        const response = await softwareService.reclaimLicenses(licenseId, {
          employeeIds,
          reclaimExpired,
        });

        setLicenses((prev) =>
          prev.map((license) =>
            license.id === licenseId ? response.updatedSoftware : license
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reclaim license';
        console.error('[LicenseContext] Error reclaiming license:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [useMockData]
  );

  const getAssignments = useCallback(
    (licenseId: string): LicenseAssignment[] => {
      const license = licenses.find((l) => l.id === licenseId);
      return license?.assignments?.filter((a) => a.status === 'active') || [];
    },
    [licenses]
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getAvailableSeats = useCallback(
    (licenseId: string): number => {
      const license = licenses.find((l) => l.id === licenseId);
      if (!license || !license.seatCount) return 0;
      return license.seatCount - (license.assignedSeats || 0);
    },
    [licenses]
  );

  const getUtilization = useCallback(
    (licenseId: string): number => {
      const license = licenses.find((l) => l.id === licenseId);
      if (!license || !license.seatCount) return 0;
      return ((license.assignedSeats || 0) / license.seatCount) * 100;
    },
    [licenses]
  );

  const isOverAllocated = useCallback(
    (licenseId: string): boolean => {
      return getUtilization(licenseId) > 100;
    },
    [getUtilization]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: LicenseContextValue = {
    licenses,
    loading,
    error,
    createLicense,
    updateLicense,
    deleteLicense,
    getLicense,
    refreshLicenses,
    expandLicensePool,
    assignLicense,
    reclaimLicense,
    getAssignments,
    getAvailableSeats,
    getUtilization,
    isOverAllocated,
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useLicense = (): LicenseContextValue => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your app with LicenseProvider:
 *
 * <LicenseProvider useMockData={false}>
 *   <App />
 * </LicenseProvider>
 *
 * Use in components:
 *
 * const {
 *   licenses,
 *   loading,
 *   error,
 *   createLicense,
 *   expandLicensePool,
 *   assignLicense,
 * } = useLicense();
 *
 * // Show loading state
 * if (loading) return <LoadingSpinner />;
 *
 * // Show error state
 * if (error) return <ErrorMessage message={error} />;
 *
 * // CRUD operations (now async)
 * await createLicense({
 *   name: 'Adobe Creative Cloud',
 *   vendor: 'Adobe',
 *   cost: 59.99,
 *   seatCount: 10
 * });
 *
 * // Expand license pool
 * await expandLicensePool('sw-adobe-001', 5);
 *
 * // Assign license
 * await assignLicense('sw-adobe-001', {
 *   employeeId: 'emp-001',
 *   employeeName: 'John Doe',
 *   employeeEmail: 'john.doe@company.com',
 *   assignedBy: 'Admin'
 * });
 *
 * // Reclaim licenses
 * await reclaimLicense('sw-adobe-001', ['emp-001']); // Specific employees
 * await reclaimLicense('sw-adobe-001', undefined, true); // Reclaim expired
 */
