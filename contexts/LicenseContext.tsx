// ============================================================================
// LICENSE CONTEXT
// ============================================================================
// Centralized state management for software licenses and license pools

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Software, LicenseAssignment } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicenseContextValue {
  // State
  licenses: Software[];

  // License CRUD operations
  createLicense: (license: Partial<Software>) => Software;
  updateLicense: (id: string, updates: Partial<Software>) => void;
  deleteLicense: (id: string) => void;
  getLicense: (id: string) => Software | undefined;

  // License pool operations
  expandLicensePool: (licenseId: string, additionalSeats: number) => void;

  // License assignment operations
  assignLicense: (licenseId: string, assignment: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status'>) => void;
  reclaimLicense: (licenseId: string, assignmentId: string) => void;
  getAssignments: (licenseId: string) => LicenseAssignment[];

  // Utility functions
  getAvailableSeats: (licenseId: string) => number;
  getUtilization: (licenseId: string) => number;
  isOverAllocated: (licenseId: string) => boolean;
}

interface LicenseProviderProps {
  children: ReactNode;
  initialLicenses?: Software[];
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
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [licenses, setLicenses] = useState<Software[]>(initialLicenses);

  // ============================================================================
  // LICENSE CRUD OPERATIONS
  // ============================================================================

  const createLicense = useCallback((licenseData: Partial<Software>): Software => {
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
  }, []);

  const updateLicense = useCallback((id: string, updates: Partial<Software>) => {
    setLicenses((prev) =>
      prev.map((license) =>
        license.id === id ? { ...license, ...updates } : license
      )
    );
  }, []);

  const deleteLicense = useCallback((id: string) => {
    setLicenses((prev) => prev.filter((license) => license.id !== id));
  }, []);

  const getLicense = useCallback(
    (id: string): Software | undefined => {
      return licenses.find((license) => license.id === id);
    },
    [licenses]
  );

  // ============================================================================
  // LICENSE POOL OPERATIONS
  // ============================================================================

  const expandLicensePool = useCallback((licenseId: string, additionalSeats: number) => {
    setLicenses((prev) =>
      prev.map((license) => {
        if (license.id === licenseId) {
          return {
            ...license,
            seatCount: (license.seatCount || 0) + additionalSeats,
          };
        }
        return license;
      })
    );
  }, []);

  // ============================================================================
  // LICENSE ASSIGNMENT OPERATIONS
  // ============================================================================

  const assignLicense = useCallback(
    (
      licenseId: string,
      assignmentData: Omit<LicenseAssignment, 'id' | 'assignedDate' | 'status'>
    ) => {
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
    },
    []
  );

  const reclaimLicense = useCallback((licenseId: string, assignmentId: string) => {
    setLicenses((prev) =>
      prev.map((license) => {
        if (license.id === licenseId) {
          const assignment = license.assignments?.find((a) => a.id === assignmentId);
          if (!assignment) return license;

          return {
            ...license,
            assignedSeats: Math.max(0, (license.assignedSeats || 0) - 1),
            assignments: license.assignments?.map((a) =>
              a.id === assignmentId ? { ...a, status: 'revoked' as const } : a
            ),
          };
        }
        return license;
      })
    );
  }, []);

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
    createLicense,
    updateLicense,
    deleteLicense,
    getLicense,
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
 * <LicenseProvider initialLicenses={mockSoftware}>
 *   <App />
 * </LicenseProvider>
 *
 * Then use in components:
 *
 * const { licenses, createLicense, expandLicensePool } = useLicense();
 *
 * // Create new license
 * createLicense({
 *   name: 'Adobe Creative Cloud',
 *   vendor: 'Adobe',
 *   cost: 59.99,
 *   seatCount: 10
 * });
 *
 * // Expand license pool
 * expandLicensePool('sw-adobe-001', 5);
 *
 * // Assign license
 * assignLicense('sw-adobe-001', {
 *   employeeId: 'emp-001',
 *   employeeName: 'John Doe',
 *   employeeEmail: 'john.doe@company.com',
 *   assignedBy: 'Admin'
 * });
 */
