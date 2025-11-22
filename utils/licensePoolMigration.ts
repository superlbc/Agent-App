// ============================================================================
// LICENSE POOL MIGRATION UTILITY
// ============================================================================
// Converts legacy Software objects with seat tracking to LicensePool objects
// Phase 10: License Pool Separation

import { Software, LicensePool, LicenseAssignment } from '../types';

/**
 * Migrate a Software object to a LicensePool
 *
 * **When to use**: Converting legacy Software objects that have seatCount > 0
 * **Result**: New LicensePool object with all license tracking data
 *
 * @param software - Software object with deprecated license pool fields
 * @param createdBy - User who initiated the migration
 * @returns LicensePool object
 *
 * @example
 * ```typescript
 * const adobeCC: Software = {
 *   id: "sw-adobe-cc-001",
 *   name: "Adobe Creative Cloud",
 *   seatCount: 10,
 *   assignedSeats: 3,
 *   // ... other fields
 * };
 *
 * const pool = migrateToLicensePool(adobeCC, "admin@momentumww.com");
 * // Returns: { id: "pool-adobe-cc-001", softwareId: "sw-adobe-cc-001", totalSeats: 10, ... }
 * ```
 */
export function migrateToLicensePool(
  software: Software,
  createdBy: string = 'system'
): LicensePool {
  const now = new Date();

  // Update assignment references from licenseId to licensePoolId
  const migratedAssignments: LicenseAssignment[] = (software.assignments || []).map(assignment => ({
    ...assignment,
    licensePoolId: `pool-${software.id}`, // New FK to LicensePool
    licenseId: software.id, // Keep legacy FK for backward compatibility
  }));

  return {
    id: `pool-${software.id}`, // Generate pool ID from software ID
    softwareId: software.id,

    // Pool sizing
    totalSeats: software.seatCount || 0,
    assignedSeats: software.assignedSeats || 0,

    // License type
    licenseType: software.licenseType,

    // Lifecycle
    purchaseDate: software.purchaseDate,
    renewalDate: software.renewalDate,
    renewalFrequency: software.renewalFrequency,
    autoRenew: software.autoRenew || false,

    // Contacts
    vendorContact: software.vendorContact,
    internalContact: software.internalContact,

    // Tracking
    assignments: migratedAssignments,

    // Metadata
    createdBy,
    createdDate: now,
    lastModified: now,
  };
}

/**
 * Batch migrate multiple Software objects to LicensePools
 *
 * **When to use**: One-time migration of entire software catalog
 * **Filters**: Only migrates software with seatCount > 0 (active license pools)
 *
 * @param softwareList - Array of Software objects
 * @param createdBy - User who initiated the migration
 * @returns Array of LicensePool objects
 *
 * @example
 * ```typescript
 * const allSoftware: Software[] = [...];
 * const pools = batchMigrateToLicensePools(allSoftware, "admin@momentumww.com");
 * console.log(`Migrated ${pools.length} license pools`);
 * ```
 */
export function batchMigrateToLicensePools(
  softwareList: Software[],
  createdBy: string = 'system'
): LicensePool[] {
  // Only migrate software with seatCount > 0 (actual license pools)
  const softwareWithSeats = softwareList.filter(
    software => software.seatCount && software.seatCount > 0
  );

  console.log(`[LicensePoolMigration] Migrating ${softwareWithSeats.length} software items to license pools...`);

  const pools = softwareWithSeats.map(software => migrateToLicensePool(software, createdBy));

  console.log(`[LicensePoolMigration] ✅ Successfully migrated ${pools.length} license pools`);

  return pools;
}

/**
 * Clean Software object after migration
 * Removes deprecated license pool fields to prevent confusion
 *
 * **When to use**: After successfully creating LicensePool from Software
 * **Result**: Software object with only catalog fields (no license tracking)
 *
 * @param software - Software object to clean
 * @returns Cleaned Software object
 *
 * @example
 * ```typescript
 * const cleanedSoftware = cleanSoftwareAfterMigration(adobeCC);
 * // cleanedSoftware no longer has seatCount, assignedSeats, etc.
 * ```
 */
export function cleanSoftwareAfterMigration(software: Software): Software {
  const {
    // Remove deprecated fields
    seatCount,
    assignedSeats,
    assignments,
    renewalDate,
    renewalFrequency,
    purchaseDate,
    vendorContact,
    internalContact,
    autoRenew,
    ...cleanedSoftware
  } = software;

  return cleanedSoftware;
}

/**
 * Validate LicensePool data integrity
 * Ensures assignedSeats matches assignments.length
 *
 * @param pool - LicensePool to validate
 * @returns Validation result with errors
 */
export function validateLicensePool(pool: LicensePool): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check assignedSeats matches assignments length
  const actualAssignments = pool.assignments.filter(a => a.status === 'active').length;
  if (pool.assignedSeats !== actualAssignments) {
    errors.push(
      `Assigned seats mismatch: pool.assignedSeats=${pool.assignedSeats}, active assignments=${actualAssignments}`
    );
  }

  // Check for over-allocation
  if (pool.assignedSeats > pool.totalSeats) {
    errors.push(
      `Over-allocated: ${pool.assignedSeats} seats assigned, but only ${pool.totalSeats} total seats`
    );
  }

  // Check for negative values
  if (pool.totalSeats < 0 || pool.assignedSeats < 0) {
    errors.push('Seat counts cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate available seats for a license pool
 *
 * @param pool - LicensePool
 * @returns Number of available seats
 */
export function getAvailableSeats(pool: LicensePool): number {
  return Math.max(0, pool.totalSeats - pool.assignedSeats);
}

/**
 * Calculate utilization percentage for a license pool
 *
 * @param pool - LicensePool
 * @returns Utilization percentage (0-100+)
 */
export function getUtilization(pool: LicensePool): number {
  if (pool.totalSeats === 0) return 0;
  return (pool.assignedSeats / pool.totalSeats) * 100;
}

/**
 * Get utilization status for a license pool
 *
 * @param pool - LicensePool
 * @returns Status: 'ok' | 'warning' | 'critical' | 'over'
 */
export function getUtilizationStatus(pool: LicensePool): 'ok' | 'warning' | 'critical' | 'over' {
  const utilization = getUtilization(pool);
  if (utilization > 100) return 'over';
  if (utilization >= 90) return 'critical';
  if (utilization >= 75) return 'warning';
  return 'ok';
}
