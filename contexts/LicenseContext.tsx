// ============================================================================
// LICENSE CONTEXT
// ============================================================================
// Centralized state management for software licenses and license pools
// Now connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  Software,
  LicenseAssignment,
  LicensePool,
  EmployeeLicenseSummary,
  LicenseAssignmentHistory,
  LicenseAssignmentFilters,
  Employee,
} from '../types';
import { mockSoftware } from '../utils/mockData';
import * as softwareService from '../services/softwareService';
import { batchMigrateToLicensePools } from '../utils/licensePoolMigration';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicenseContextValue {
  // State
  licenses: Software[];
  licensePools: LicensePool[]; // Phase 10: NEW - Separated license pool state
  loading: boolean;
  error: string | null;

  // License CRUD operations (Software Catalog)
  createLicense: (license: Partial<Software>) => Promise<Software>;
  updateLicense: (id: string, updates: Partial<Software>) => Promise<void>;
  deleteLicense: (id: string) => Promise<void>;
  getLicense: (id: string) => Software | undefined;
  refreshLicenses: () => Promise<void>;

  // License Pool CRUD operations (Phase 10: NEW)
  createLicensePool: (pool: Partial<LicensePool>) => Promise<LicensePool>;
  updateLicensePool: (id: string, updates: Partial<LicensePool>) => Promise<void>;
  deleteLicensePool: (id: string) => Promise<void>;
  getLicensePool: (id: string) => LicensePool | undefined;
  refreshLicensePools: () => Promise<void>;

  // Migration (Phase 10: NEW)
  migrateToLicensePools: () => void;

  // License pool operations (DEPRECATED - use LicensePool methods instead)
  /** @deprecated Use updateLicensePool to expand totalSeats */
  expandLicensePool: (licenseId: string, additionalSeats: number) => Promise<void>;

  // License assignment operations
  /** @deprecated Use assignLicenseToPool with licensePoolId instead */
  assignLicense: (licenseId: string, assignment: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status'>) => Promise<void>;
  assignLicenseToPool: (poolId: string, assignment: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status' | 'licensePoolId'>) => Promise<void>;

  /** @deprecated Use reclaimLicenseFromPool with licensePoolId instead */
  reclaimLicense: (licenseId: string, employeeIds?: string[], reclaimExpired?: boolean) => Promise<void>;
  reclaimLicenseFromPool: (poolId: string, employeeIds?: string[], reclaimExpired?: boolean) => Promise<void>;

  getAssignments: (licenseId: string) => LicenseAssignment[];
  getPoolAssignments: (poolId: string) => LicenseAssignment[];

  // Utility functions
  /** @deprecated Use getPoolAvailableSeats with licensePoolId instead */
  getAvailableSeats: (licenseId: string) => number;
  getPoolAvailableSeats: (poolId: string) => number;

  /** @deprecated Use getPoolUtilization with licensePoolId instead */
  getUtilization: (licenseId: string) => number;
  getPoolUtilization: (poolId: string) => number;

  /** @deprecated Use isPoolOverAllocated with licensePoolId instead */
  isOverAllocated: (licenseId: string) => boolean;
  isPoolOverAllocated: (poolId: string) => boolean;

  // Phase 2: NEW - User License Assignments methods
  getAllAssignments: () => LicenseAssignment[];
  getEmployeeAssignments: (employeeId: string) => LicenseAssignment[];
  getEmployeeLicenseSummaries: () => EmployeeLicenseSummary[];
  searchAssignments: (query: string) => LicenseAssignment[];
  filterAssignments: (filters: LicenseAssignmentFilters) => LicenseAssignment[];
  getAssignmentHistory: (assignmentId: string) => LicenseAssignmentHistory[];
}

interface LicenseProviderProps {
  children: ReactNode;
  initialLicenses?: Software[];
  useMockData?: boolean;
  employees?: Employee[]; // For enriching license summaries with employee data
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
  employees = [],
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [licenses, setLicenses] = useState<Software[]>(initialLicenses);
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]); // Phase 10: NEW
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
  // LICENSE POOL CRUD OPERATIONS (Phase 10: NEW)
  // ============================================================================

  const createLicensePool = useCallback(async (poolData: Partial<LicensePool>): Promise<LicensePool> => {
    const newPool: LicensePool = {
      id: poolData.id || `pool-${Date.now()}`,
      softwareId: poolData.softwareId || '',
      totalSeats: poolData.totalSeats || 0,
      assignedSeats: poolData.assignedSeats || 0,
      licenseType: poolData.licenseType || 'subscription',
      autoRenew: poolData.autoRenew !== undefined ? poolData.autoRenew : false,
      purchaseDate: poolData.purchaseDate,
      renewalDate: poolData.renewalDate,
      renewalFrequency: poolData.renewalFrequency,
      vendorContact: poolData.vendorContact,
      internalContact: poolData.internalContact,
      assignments: poolData.assignments || [],
      createdBy: poolData.createdBy || 'system',
      createdDate: poolData.createdDate || new Date(),
      lastModified: poolData.lastModified || new Date(),
    };

    setLicensePools((prev) => [...prev, newPool]);
    return newPool;
  }, []);

  const updateLicensePool = useCallback(async (id: string, updates: Partial<LicensePool>) => {
    setLicensePools((prev) =>
      prev.map((pool) =>
        pool.id === id ? { ...pool, ...updates, lastModified: new Date() } : pool
      )
    );
  }, []);

  const deleteLicensePool = useCallback(async (id: string) => {
    setLicensePools((prev) => prev.filter((pool) => pool.id !== id));
  }, []);

  const getLicensePool = useCallback(
    (id: string): LicensePool | undefined => {
      return licensePools.find((pool) => pool.id === id);
    },
    [licensePools]
  );

  const refreshLicensePools = useCallback(async () => {
    // TODO: Implement API call when backend is ready
    console.log('[LicenseContext] refreshLicensePools called');
  }, []);

  // ============================================================================
  // MIGRATION (Phase 10: NEW)
  // ============================================================================

  const migrateToLicensePools = useCallback(() => {
    console.log('[LicenseContext] Migrating Software to LicensePools...');
    const migrated = batchMigrateToLicensePools(licenses, 'system');
    setLicensePools(migrated);
    console.log(`[LicenseContext] ✅ Migrated ${migrated.length} license pools`);
  }, [licenses]);

  // ============================================================================
  // NEW LICENSE POOL ASSIGNMENT OPERATIONS (Phase 10)
  // ============================================================================

  const assignLicenseToPool = useCallback(
    async (
      poolId: string,
      assignmentData: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status' | 'licensePoolId'>
    ) => {
      setLicensePools((prev) =>
        prev.map((pool) => {
          if (pool.id === poolId) {
            const newAssignment: LicenseAssignment = {
              id: `assign-${Date.now()}`,
              licensePoolId: poolId,
              ...assignmentData,
              assignedDate: new Date(),
              status: 'active',
            };

            return {
              ...pool,
              assignedSeats: pool.assignedSeats + 1,
              assignments: [...pool.assignments, newAssignment],
              lastModified: new Date(),
            };
          }
          return pool;
        })
      );
    },
    []
  );

  const reclaimLicenseFromPool = useCallback(
    async (poolId: string, employeeIds?: string[], reclaimExpired?: boolean) => {
      setLicensePools((prev) =>
        prev.map((pool) => {
          if (pool.id === poolId) {
            let assignmentsToRevoke: LicenseAssignment[] = [];

            if (employeeIds && employeeIds.length > 0) {
              assignmentsToRevoke = pool.assignments.filter(
                (a) => a.status === 'active' && employeeIds.includes(a.employeeId)
              );
            } else if (reclaimExpired) {
              const now = new Date();
              assignmentsToRevoke = pool.assignments.filter(
                (a) => a.status === 'active' && a.expirationDate && new Date(a.expirationDate) < now
              );
            }

            const updatedAssignments = pool.assignments.map((a) =>
              assignmentsToRevoke.find((revoked) => revoked.id === a.id)
                ? { ...a, status: 'revoked' as const }
                : a
            );

            return {
              ...pool,
              assignedSeats: Math.max(0, pool.assignedSeats - assignmentsToRevoke.length),
              assignments: updatedAssignments,
              lastModified: new Date(),
            };
          }
          return pool;
        })
      );
    },
    []
  );

  const getPoolAssignments = useCallback(
    (poolId: string): LicenseAssignment[] => {
      const pool = licensePools.find((p) => p.id === poolId);
      return pool?.assignments.filter((a) => a.status === 'active') || [];
    },
    [licensePools]
  );

  // ============================================================================
  // NEW POOL UTILITY FUNCTIONS (Phase 10)
  // ============================================================================

  const getPoolAvailableSeats = useCallback(
    (poolId: string): number => {
      const pool = licensePools.find((p) => p.id === poolId);
      if (!pool) return 0;
      return pool.totalSeats - pool.assignedSeats;
    },
    [licensePools]
  );

  const getPoolUtilization = useCallback(
    (poolId: string): number => {
      const pool = licensePools.find((p) => p.id === poolId);
      if (!pool || pool.totalSeats === 0) return 0;
      return (pool.assignedSeats / pool.totalSeats) * 100;
    },
    [licensePools]
  );

  const isPoolOverAllocated = useCallback(
    (poolId: string): boolean => {
      return getPoolUtilization(poolId) > 100;
    },
    [getPoolUtilization]
  );

  // ============================================================================
  // USER LICENSE ASSIGNMENTS METHODS (Phase 2: NEW)
  // ============================================================================

  /**
   * Get all license assignments across all pools
   * Used for User License Assignments dashboard
   */
  const getAllAssignments = useCallback((): LicenseAssignment[] => {
    const allAssignments: LicenseAssignment[] = [];
    licensePools.forEach((pool) => {
      allAssignments.push(...pool.assignments);
    });
    return allAssignments;
  }, [licensePools]);

  /**
   * Get all license assignments for a specific employee
   * Shows complete license portfolio for one employee
   */
  const getEmployeeAssignments = useCallback(
    (employeeId: string): LicenseAssignment[] => {
      const allAssignments = getAllAssignments();
      return allAssignments.filter((a) => a.employeeId === employeeId);
    },
    [getAllAssignments]
  );

  /**
   * Get license summaries for all employees
   * Efficient for displaying license counts per employee
   */
  const getEmployeeLicenseSummaries = useCallback((): EmployeeLicenseSummary[] => {
    const allAssignments = getAllAssignments();
    const employeeMap = new Map<string, LicenseAssignment[]>();

    // Group assignments by employee
    allAssignments.forEach((assignment) => {
      const existing = employeeMap.get(assignment.employeeId) || [];
      employeeMap.set(assignment.employeeId, [...existing, assignment]);
    });

    // Convert to summary objects
    const summaries: EmployeeLicenseSummary[] = [];
    employeeMap.forEach((assignments, employeeId) => {
      const firstAssignment = assignments[0];
      const activeLicenses = assignments.filter((a) => a.status === 'active');
      const expiredLicenses = assignments.filter((a) => a.status === 'expired');
      const revokedLicenses = assignments.filter((a) => a.status === 'revoked');

      // Find employee data to enrich summary
      const employee = employees.find((emp) => emp.id === employeeId);

      // Build detailed license list
      const assignedLicenses = assignments.map((a) => {
        const pool = licensePools.find((p) => p.id === a.licensePoolId);
        const software = licenses.find((l) => l.id === pool?.softwareId);

        return {
          assignmentId: a.id,
          licensePoolId: a.licensePoolId,
          licenseName: software?.name || 'Unknown',
          poolName: `${software?.name || 'Unknown'} Pool`,
          vendor: software?.vendor || 'Unknown',
          assignedDate: a.assignedDate,
          assignedBy: a.assignedBy,
          expirationDate: a.expirationDate,
          status: a.status,
          notes: a.notes,
        };
      });

      summaries.push({
        employeeId,
        employeeName: employee?.name || firstAssignment.employeeName,
        employeeEmail: employee?.email || firstAssignment.employeeEmail,
        department: employee?.department || 'Unknown',
        role: employee?.role || 'Unknown',
        status: employee?.status || 'active',
        assignedLicenses,
        totalLicenses: assignments.length,
        activeLicenses: activeLicenses.length,
        expiredLicenses: expiredLicenses.length,
        revokedLicenses: revokedLicenses.length,
      });
    });

    return summaries;
  }, [getAllAssignments, licensePools, licenses, employees]);

  /**
   * Search assignments by employee name or email
   * Case-insensitive search
   */
  const searchAssignments = useCallback(
    (query: string): LicenseAssignment[] => {
      if (!query || query.trim() === '') {
        return getAllAssignments();
      }

      const lowerQuery = query.toLowerCase();
      const allAssignments = getAllAssignments();

      return allAssignments.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(lowerQuery) ||
          a.employeeEmail.toLowerCase().includes(lowerQuery)
      );
    },
    [getAllAssignments]
  );

  /**
   * Filter assignments by multiple criteria
   * Supports filtering by employee status, license status, pools, departments, roles, dates
   */
  const filterAssignments = useCallback(
    (filters: LicenseAssignmentFilters): LicenseAssignment[] => {
      let results = getAllAssignments();

      // Filter by license status
      if (filters.licenseStatus && filters.licenseStatus.length > 0) {
        results = results.filter((a) => filters.licenseStatus!.includes(a.status));
      }

      // Filter by license pool IDs
      if (filters.licensePoolIds && filters.licensePoolIds.length > 0) {
        results = results.filter((a) => filters.licensePoolIds!.includes(a.licensePoolId));
      }

      // Filter by assigned date range
      if (filters.assignedDateFrom) {
        results = results.filter((a) => new Date(a.assignedDate) >= filters.assignedDateFrom!);
      }
      if (filters.assignedDateTo) {
        results = results.filter((a) => new Date(a.assignedDate) <= filters.assignedDateTo!);
      }

      // Filter by expiration date range
      if (filters.expirationDateFrom) {
        results = results.filter(
          (a) => a.expirationDate && new Date(a.expirationDate) >= filters.expirationDateFrom!
        );
      }
      if (filters.expirationDateTo) {
        results = results.filter(
          (a) => a.expirationDate && new Date(a.expirationDate) <= filters.expirationDateTo!
        );
      }

      // Filter by search query (employee name or email)
      if (filters.searchQuery) {
        results = searchAssignments(filters.searchQuery);
      }

      // TODO: Filter by employee status, departments, roles when employee data is available

      return results;
    },
    [getAllAssignments, searchAssignments]
  );

  /**
   * Get assignment history for a specific assignment
   * Returns audit trail of all actions performed on an assignment
   * NOTE: Currently returns empty array - will be implemented when history tracking is added
   */
  const getAssignmentHistory = useCallback(
    (assignmentId: string): LicenseAssignmentHistory[] => {
      // TODO: Implement when LicenseAssignmentHistory storage is added
      // For now, return empty array
      console.log(`[LicenseContext] getAssignmentHistory called for ${assignmentId} - not yet implemented`);
      return [];
    },
    []
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: LicenseContextValue = {
    // State
    licenses,
    licensePools, // Phase 10: NEW
    loading,
    error,

    // Software Catalog CRUD
    createLicense,
    updateLicense,
    deleteLicense,
    getLicense,
    refreshLicenses,

    // License Pool CRUD (Phase 10: NEW)
    createLicensePool,
    updateLicensePool,
    deleteLicensePool,
    getLicensePool,
    refreshLicensePools,

    // Migration (Phase 10: NEW)
    migrateToLicensePools,

    // Legacy methods (deprecated but kept for backward compatibility)
    expandLicensePool,
    assignLicense,
    reclaimLicense,
    getAssignments,
    getAvailableSeats,
    getUtilization,
    isOverAllocated,

    // New pool-specific methods (Phase 10: NEW)
    assignLicenseToPool,
    reclaimLicenseFromPool,
    getPoolAssignments,
    getPoolAvailableSeats,
    getPoolUtilization,
    isPoolOverAllocated,

    // User License Assignments methods (Phase 2: NEW)
    getAllAssignments,
    getEmployeeAssignments,
    getEmployeeLicenseSummaries,
    searchAssignments,
    filterAssignments,
    getAssignmentHistory,
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
