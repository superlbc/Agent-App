// ============================================================================
// PACKAGE VERSION SERVICE
// ============================================================================
// Manages package versioning to prevent retroactive changes to assignments
//
// **Key Concepts**:
// 1. Package = Template (can be modified)
// 2. PackageVersion = Immutable snapshot (never modified)
// 3. PackageAssignment = Links pre-hire/employee to specific version
//
// **Workflow**:
// - Create package → Create v1 automatically
// - Assign package → Create assignment with latest version
// - Update package → Create new version (v2, v3, etc.)
// - Old assignments remain unchanged (still point to old versions)
// ============================================================================

import {
  Package,
  PackageVersion,
  PackageAssignment,
  Hardware,
  Software,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePackageVersionOptions {
  packageId: string;
  hardware: Hardware[];
  software: Software[];
  isStandard: boolean;
  createdBy: string;
  notes?: string;
}

export interface CreatePackageAssignmentOptions {
  preHireId?: string;
  employeeId?: string;
  packageVersionId: string;
  assignedBy: string;
  notes?: string;
}

export interface VersionHistory {
  versionNumber: number;
  snapshotDate: Date;
  createdBy: string;
  notes?: string;
  hardwareCount: number;
  softwareCount: number;
  changes?: string[]; // List of changes from previous version
}

// ============================================================================
// IN-MEMORY STORAGE (For Development)
// ============================================================================
// TODO: Replace with database calls when backend is ready

let packageVersions: PackageVersion[] = [];
let packageAssignments: PackageAssignment[] = [];

// Initialize with mock data
export function initializeMockData(
  versions: PackageVersion[],
  assignments: PackageAssignment[]
) {
  packageVersions = [...versions];
  packageAssignments = [...assignments];
}

// ============================================================================
// PACKAGE VERSION OPERATIONS
// ============================================================================

/**
 * Create a new package version
 * Automatically increments version number based on existing versions
 *
 * @example
 * // Create initial version (v1) when package is created
 * const v1 = await createPackageVersion({
 *   packageId: 'pkg-xd-std-001',
 *   hardware: [macbookM3, dellMonitor],
 *   software: [adobeCC, figma],
 *   isStandard: true,
 *   createdBy: 'admin@momentumww.com',
 *   notes: 'Initial version'
 * });
 *
 * // Create updated version (v2) when package is modified
 * const v2 = await createPackageVersion({
 *   packageId: 'pkg-xd-std-001',
 *   hardware: [macbookM4, dellMonitor], // Changed M3 → M4
 *   software: [adobeCC, figma],
 *   isStandard: true,
 *   createdBy: 'admin@momentumww.com',
 *   notes: 'Updated MacBook Pro M3 → M4'
 * });
 */
export async function createPackageVersion(
  options: CreatePackageVersionOptions
): Promise<PackageVersion> {
  const { packageId, hardware, software, isStandard, createdBy, notes } = options;

  // Get next version number
  const existingVersions = packageVersions.filter(
    (v) => v.packageId === packageId
  );
  const nextVersionNumber = existingVersions.length + 1;

  // Generate ID
  const versionId = `pkgver-${packageId.replace('pkg-', '')}-v${nextVersionNumber}`;

  // Create new version
  const newVersion: PackageVersion = {
    id: versionId,
    packageId,
    versionNumber: nextVersionNumber,
    snapshotDate: new Date(),
    hardware: [...hardware], // Deep copy to prevent mutations
    software: [...software], // Deep copy to prevent mutations
    isStandard,
    createdBy,
    createdDate: new Date(),
    notes,
  };

  // Store in memory (TODO: Save to database)
  packageVersions.push(newVersion);

  console.log(
    `[PackageVersionService] Created version ${nextVersionNumber} for package ${packageId}`
  );

  return newVersion;
}

/**
 * Get the latest version of a package
 * Used when assigning packages to pre-hires (always assign latest)
 *
 * @example
 * const latestVersion = await getLatestPackageVersion('pkg-xd-std-001');
 * // Returns v3 if versions 1, 2, 3 exist
 */
export async function getLatestPackageVersion(
  packageId: string
): Promise<PackageVersion | null> {
  const versions = packageVersions.filter((v) => v.packageId === packageId);

  if (versions.length === 0) {
    return null;
  }

  // Sort by version number descending, get first
  const latest = versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];

  return latest;
}

/**
 * Get all versions of a package (version history)
 * Used for audit trail and troubleshooting
 *
 * @example
 * const history = await getPackageVersionHistory('pkg-xd-std-001');
 * // Returns [v3, v2, v1] in descending order
 */
export async function getPackageVersionHistory(
  packageId: string
): Promise<VersionHistory[]> {
  const versions = packageVersions
    .filter((v) => v.packageId === packageId)
    .sort((a, b) => b.versionNumber - a.versionNumber); // Newest first

  return versions.map((v, index) => {
    const previousVersion = versions[index + 1]; // Next in array = older version

    return {
      versionNumber: v.versionNumber,
      snapshotDate: v.snapshotDate,
      createdBy: v.createdBy,
      notes: v.notes,
      hardwareCount: v.hardware.length,
      softwareCount: v.software.length,
      changes: previousVersion
        ? detectChanges(v, previousVersion)
        : ['Initial version'],
    };
  });
}

/**
 * Get a specific package version by ID
 *
 * @example
 * const version = await getPackageVersionById('pkgver-xd-std-001-v1');
 */
export async function getPackageVersionById(
  versionId: string
): Promise<PackageVersion | null> {
  return packageVersions.find((v) => v.id === versionId) || null;
}

// ============================================================================
// PACKAGE ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Create a package assignment (link pre-hire/employee to a version)
 * IMPORTANT: Always assign to a PackageVersion, never to a Package directly!
 *
 * @example
 * // Assign to pre-hire
 * const assignment = await createPackageAssignment({
 *   preHireId: 'pre-2025-001',
 *   packageVersionId: 'pkgver-xd-std-001-v1',
 *   assignedBy: 'camille@momentumww.com',
 *   notes: 'Standard XD Designer package'
 * });
 *
 * // Assign to employee (mid-employment change)
 * const employeeAssignment = await createPackageAssignment({
 *   employeeId: 'emp-001',
 *   packageVersionId: 'pkgver-dev-std-001-v2',
 *   assignedBy: 'it.admin@momentumww.com',
 *   notes: 'Department transfer - new role requires developer equipment'
 * });
 */
export async function createPackageAssignment(
  options: CreatePackageAssignmentOptions
): Promise<PackageAssignment> {
  const { preHireId, employeeId, packageVersionId, assignedBy, notes } = options;

  // Validation: Must have either preHireId OR employeeId (not both, not neither)
  if (!preHireId && !employeeId) {
    throw new Error('Must provide either preHireId or employeeId');
  }
  if (preHireId && employeeId) {
    throw new Error('Cannot provide both preHireId and employeeId');
  }

  // Validation: PackageVersion must exist
  const version = await getPackageVersionById(packageVersionId);
  if (!version) {
    throw new Error(`PackageVersion ${packageVersionId} not found`);
  }

  // Generate ID
  const assignmentId = `pkgasgn-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  // Create assignment
  const assignment: PackageAssignment = {
    id: assignmentId,
    preHireId,
    employeeId,
    packageVersionId,
    assignedDate: new Date(),
    assignedBy,
    notes,
  };

  // Store in memory (TODO: Save to database)
  packageAssignments.push(assignment);

  console.log(
    `[PackageVersionService] Created assignment ${assignmentId} for ${
      preHireId || employeeId
    }`
  );

  return assignment;
}

/**
 * Get package assignment for a pre-hire
 * Returns the assigned package version with full hardware/software details
 *
 * @example
 * const assignment = await getPreHirePackageAssignment('pre-2025-001');
 * if (assignment) {
 *   console.log('Hardware:', assignment.version.hardware);
 *   console.log('Software:', assignment.version.software);
 * }
 */
export async function getPreHirePackageAssignment(preHireId: string): Promise<{
  assignment: PackageAssignment;
  version: PackageVersion;
} | null> {
  const assignment = packageAssignments.find((a) => a.preHireId === preHireId);

  if (!assignment) {
    return null;
  }

  const version = await getPackageVersionById(assignment.packageVersionId);

  if (!version) {
    console.error(
      `[PackageVersionService] Version ${assignment.packageVersionId} not found for assignment ${assignment.id}`
    );
    return null;
  }

  return { assignment, version };
}

/**
 * Get package assignment for an employee
 *
 * @example
 * const assignment = await getEmployeePackageAssignment('emp-001');
 */
export async function getEmployeePackageAssignment(employeeId: string): Promise<{
  assignment: PackageAssignment;
  version: PackageVersion;
} | null> {
  const assignment = packageAssignments.find((a) => a.employeeId === employeeId);

  if (!assignment) {
    return null;
  }

  const version = await getPackageVersionById(assignment.packageVersionId);

  if (!version) {
    console.error(
      `[PackageVersionService] Version ${assignment.packageVersionId} not found for assignment ${assignment.id}`
    );
    return null;
  }

  return { assignment, version };
}

/**
 * Get all assignments for a specific package version
 * Useful for understanding impact of package changes
 *
 * @example
 * // Find out who will be affected if we deprecate v1
 * const v1Assignments = await getAssignmentsByVersion('pkgver-xd-std-001-v1');
 * console.log(`${v1Assignments.length} pre-hires/employees still using v1`);
 */
export async function getAssignmentsByVersion(
  packageVersionId: string
): Promise<PackageAssignment[]> {
  return packageAssignments.filter(
    (a) => a.packageVersionId === packageVersionId
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect changes between two package versions
 * Returns human-readable list of changes
 */
function detectChanges(
  newVersion: PackageVersion,
  oldVersion: PackageVersion
): string[] {
  const changes: string[] = [];

  // Hardware changes
  const oldHardwareIds = oldVersion.hardware.map((h) => h.id);
  const newHardwareIds = newVersion.hardware.map((h) => h.id);

  const addedHardware = newVersion.hardware.filter(
    (h) => !oldHardwareIds.includes(h.id)
  );
  const removedHardware = oldVersion.hardware.filter(
    (h) => !newHardwareIds.includes(h.id)
  );

  addedHardware.forEach((h) => {
    changes.push(`➕ Added hardware: ${h.model}`);
  });

  removedHardware.forEach((h) => {
    changes.push(`➖ Removed hardware: ${h.model}`);
  });

  // Software changes
  const oldSoftwareIds = oldVersion.software.map((s) => s.id);
  const newSoftwareIds = newVersion.software.map((s) => s.id);

  const addedSoftware = newVersion.software.filter(
    (s) => !oldSoftwareIds.includes(s.id)
  );
  const removedSoftware = oldVersion.software.filter(
    (s) => !newSoftwareIds.includes(s.id)
  );

  addedSoftware.forEach((s) => {
    changes.push(`➕ Added software: ${s.name}`);
  });

  removedSoftware.forEach((s) => {
    changes.push(`➖ Removed software: ${s.name}`);
  });

  // Approval requirement change
  if (newVersion.isStandard !== oldVersion.isStandard) {
    changes.push(
      `🔄 Approval requirement changed: ${
        newVersion.isStandard ? 'Auto-approve' : 'Requires SVP approval'
      }`
    );
  }

  return changes.length > 0 ? changes : ['No changes detected'];
}

/**
 * Calculate total cost of a package version
 * One-time costs (hardware) + monthly costs (software) × 12
 */
export function calculateVersionCost(version: PackageVersion): {
  hardwareCost: number;
  monthlySoftwareCost: number;
  annualSoftwareCost: number;
  totalFirstYearCost: number;
} {
  const hardwareCost = version.hardware.reduce(
    (sum, hw) => sum + (hw.cost || 0),
    0
  );

  const monthlySoftwareCost = version.software.reduce(
    (sum, sw) => sum + (sw.cost || 0),
    0
  );

  const annualSoftwareCost = monthlySoftwareCost * 12;
  const totalFirstYearCost = hardwareCost + annualSoftwareCost;

  return {
    hardwareCost,
    monthlySoftwareCost,
    annualSoftwareCost,
    totalFirstYearCost,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializeMockData,
  createPackageVersion,
  getLatestPackageVersion,
  getPackageVersionHistory,
  getPackageVersionById,
  createPackageAssignment,
  getPreHirePackageAssignment,
  getEmployeePackageAssignment,
  getAssignmentsByVersion,
  calculateVersionCost,
};
