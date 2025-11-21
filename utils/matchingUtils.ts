// ============================================================================
// PACKAGE MATCHING UTILITIES
// ============================================================================
// Smart package matching based on Department Group + Role
//
// **Matching Algorithm**:
// 1. Find all packages where roleTargets contains matching departmentGroup + role
// 2. If multiple matches → Return all (user selects from list)
// 3. If one match → Return single match (auto-assign)
// 4. If no matches → Return empty array (manual selection from all packages)
//
// **Scoring System** (for ranking multiple matches):
// - Exact departmentGroup + role match: 100 points
// - Grade match (if provided): +50 points
// - GradeGroup match (if provided): +25 points
// - OS preference match (if provided): +10 points
//
// **Example**:
// User: { departmentGroup: "Creative Services", role: "XD Designer" }
// Matches: ["XD Designer Standard" (100), "XD Designer Premium" (100)]
// User selects: "Premium"
// ============================================================================

import { Package, RoleTarget } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface MatchCriteria {
  departmentGroup: string; // Required
  role: string; // Required
  gradeGroup?: string; // Optional
  grade?: string; // Optional
  osPreference?: 'Windows' | 'Mac' | 'Either'; // Optional
}

export interface PackageMatch {
  package: Package;
  score: number; // Matching score (higher = better match)
  matchReasons: string[]; // Human-readable reasons for the match
  isExactMatch: boolean; // True if all criteria match
}

export interface MatchResult {
  matches: PackageMatch[];
  matchType: 'none' | 'single' | 'multiple';
  autoAssign: boolean; // True if only one match (can auto-assign)
  recommendation?: PackageMatch; // Best match (highest score)
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Find packages matching the given criteria
 *
 * @example
 * const result = matchPackages(
 *   allPackages,
 *   {
 *     departmentGroup: "Creative Services",
 *     role: "XD Designer",
 *     osPreference: "Mac"
 *   }
 * );
 *
 * if (result.autoAssign) {
 *   // Auto-assign the single match
 *   assignPackage(result.matches[0].package);
 * } else if (result.matchType === 'multiple') {
 *   // Show user selection UI
 *   showPackageSelectionModal(result.matches);
 * } else {
 *   // No matches - show all packages
 *   showAllPackagesModal(allPackages);
 * }
 */
export function matchPackages(
  packages: Package[],
  criteria: MatchCriteria
): MatchResult {
  const matches: PackageMatch[] = [];

  // Score each package
  for (const pkg of packages) {
    const match = scorePackageMatch(pkg, criteria);

    if (match.score > 0) {
      matches.push(match);
    }
  }

  // Sort by score descending (best match first)
  matches.sort((a, b) => b.score - a.score);

  // Determine match type
  const matchType =
    matches.length === 0
      ? 'none'
      : matches.length === 1
      ? 'single'
      : 'multiple';

  // Auto-assign only if exactly one match
  const autoAssign = matchType === 'single';

  // Recommendation is the highest-scored match
  const recommendation = matches.length > 0 ? matches[0] : undefined;

  return {
    matches,
    matchType,
    autoAssign,
    recommendation,
  };
}

/**
 * Score a single package against matching criteria
 * Returns match with score and reasons
 */
function scorePackageMatch(
  pkg: Package,
  criteria: MatchCriteria
): PackageMatch {
  let score = 0;
  const matchReasons: string[] = [];
  let departmentGroupMatch = false;
  let roleMatch = false;

  // Check if package has roleTargets (new format)
  if (!pkg.roleTargets || pkg.roleTargets.length === 0) {
    // Fallback to legacy roleTarget/departmentTarget arrays
    return scorePackageMatchLegacy(pkg, criteria);
  }

  // Find matching roleTarget in package
  for (const target of pkg.roleTargets) {
    let targetScore = 0;
    const targetReasons: string[] = [];

    // REQUIRED: Department Group match
    if (
      target.departmentGroup.toLowerCase() ===
      criteria.departmentGroup.toLowerCase()
    ) {
      targetScore += 100;
      targetReasons.push(
        `Department Group: ${criteria.departmentGroup}`
      );
      departmentGroupMatch = true;
    }

    // REQUIRED: Role match
    if (
      target.role.toLowerCase() === criteria.role.toLowerCase()
    ) {
      targetScore += 100;
      targetReasons.push(`Role: ${criteria.role}`);
      roleMatch = true;
    }

    // OPTIONAL: Grade match (bonus points)
    if (criteria.grade && target.grade) {
      if (
        target.grade.toLowerCase() === criteria.grade.toLowerCase()
      ) {
        targetScore += 50;
        targetReasons.push(`Grade: ${criteria.grade}`);
      }
    }

    // OPTIONAL: Grade Group match (bonus points)
    if (criteria.gradeGroup && target.gradeGroup) {
      if (
        target.gradeGroup.toLowerCase() ===
        criteria.gradeGroup.toLowerCase()
      ) {
        targetScore += 25;
        targetReasons.push(`Grade Group: ${criteria.gradeGroup}`);
      }
    }

    // Keep best matching target for this package
    if (targetScore > score) {
      score = targetScore;
      matchReasons.length = 0; // Clear previous reasons
      matchReasons.push(...targetReasons);
    }
  }

  // OPTIONAL: OS Preference match (bonus points)
  if (criteria.osPreference && pkg.osPreference) {
    if (
      pkg.osPreference === criteria.osPreference ||
      pkg.osPreference === 'Either'
    ) {
      score += 10;
      matchReasons.push(`OS Preference: ${criteria.osPreference}`);
    }
  }

  // Only consider it a match if BOTH department group AND role match
  const isExactMatch = departmentGroupMatch && roleMatch;

  if (!isExactMatch) {
    score = 0; // Reset score if required fields don't match
    matchReasons.length = 0;
  }

  return {
    package: pkg,
    score,
    matchReasons,
    isExactMatch,
  };
}

/**
 * Legacy scoring for packages using old roleTarget/departmentTarget arrays
 * Provides backward compatibility
 */
function scorePackageMatchLegacy(
  pkg: Package,
  criteria: MatchCriteria
): PackageMatch {
  let score = 0;
  const matchReasons: string[] = [];

  // Check department target (legacy)
  if (pkg.departmentTarget) {
    const deptMatch = pkg.departmentTarget.some(
      (dept) =>
        dept.toLowerCase() === criteria.departmentGroup.toLowerCase()
    );

    if (deptMatch) {
      score += 100;
      matchReasons.push(
        `Department: ${criteria.departmentGroup} (legacy)`
      );
    }
  }

  // Check role target (legacy)
  if (pkg.roleTarget) {
    const roleMatch = pkg.roleTarget.some(
      (role) => role.toLowerCase() === criteria.role.toLowerCase()
    );

    if (roleMatch) {
      score += 100;
      matchReasons.push(`Role: ${criteria.role} (legacy)`);
    }
  }

  // OS Preference (if available)
  if (criteria.osPreference && pkg.osPreference) {
    if (
      pkg.osPreference === criteria.osPreference ||
      pkg.osPreference === 'Either'
    ) {
      score += 10;
      matchReasons.push(`OS Preference: ${criteria.osPreference}`);
    }
  }

  const isExactMatch = matchReasons.length >= 2; // Dept + Role

  if (!isExactMatch) {
    score = 0;
    matchReasons.length = 0;
  }

  return {
    package: pkg,
    score,
    matchReasons,
    isExactMatch,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user-friendly match summary
 *
 * @example
 * const summary = getMatchSummary(matchResult);
 * // Returns: "Found 2 matching packages for XD Designer in Creative Services"
 */
export function getMatchSummary(result: MatchResult): string {
  if (result.matchType === 'none') {
    return 'No matching packages found. Please select from all available packages.';
  }

  if (result.matchType === 'single') {
    const match = result.matches[0];
    return `Found 1 matching package: ${match.package.name}`;
  }

  // Multiple matches
  const packageNames = result.matches
    .map((m) => m.package.name)
    .join(', ');
  return `Found ${result.matches.length} matching packages: ${packageNames}`;
}

/**
 * Filter packages by OS preference
 * Useful for narrowing down matches
 *
 * @example
 * const macPackages = filterByOS(allPackages, "Mac");
 */
export function filterByOS(
  packages: Package[],
  osPreference: 'Windows' | 'Mac' | 'Either'
): Package[] {
  return packages.filter(
    (pkg) =>
      pkg.osPreference === osPreference ||
      pkg.osPreference === 'Either' ||
      !pkg.osPreference
  );
}

/**
 * Group packages by department group
 * Useful for organizing package selection UI
 *
 * @example
 * const grouped = groupPackagesByDepartment(allPackages);
 * // Returns: { "Creative Services": [...], "Global Technology": [...] }
 */
export function groupPackagesByDepartment(
  packages: Package[]
): Record<string, Package[]> {
  const grouped: Record<string, Package[]> = {};

  for (const pkg of packages) {
    // Use new roleTargets format
    if (pkg.roleTargets && pkg.roleTargets.length > 0) {
      for (const target of pkg.roleTargets) {
        const deptGroup = target.departmentGroup;

        if (!grouped[deptGroup]) {
          grouped[deptGroup] = [];
        }

        // Add package if not already in this group
        if (!grouped[deptGroup].includes(pkg)) {
          grouped[deptGroup].push(pkg);
        }
      }
    }
    // Fallback to legacy format
    else if (pkg.departmentTarget && pkg.departmentTarget.length > 0) {
      for (const dept of pkg.departmentTarget) {
        if (!grouped[dept]) {
          grouped[dept] = [];
        }

        if (!grouped[dept].includes(pkg)) {
          grouped[dept].push(pkg);
        }
      }
    }
  }

  return grouped;
}

/**
 * Get all department groups from packages
 *
 * @example
 * const deptGroups = getDepartmentGroupsFromPackages(allPackages);
 * // Returns: ["Creative Services", "Global Technology", "IP & CT"]
 */
export function getDepartmentGroupsFromPackages(
  packages: Package[]
): string[] {
  const deptGroups = new Set<string>();

  for (const pkg of packages) {
    if (pkg.roleTargets) {
      pkg.roleTargets.forEach((target) =>
        deptGroups.add(target.departmentGroup)
      );
    } else if (pkg.departmentTarget) {
      pkg.departmentTarget.forEach((dept) => deptGroups.add(dept));
    }
  }

  return Array.from(deptGroups).sort();
}

/**
 * Get all roles from packages
 *
 * @example
 * const roles = getRolesFromPackages(allPackages);
 * // Returns: ["Developer", "Project Manager", "XD Designer"]
 */
export function getRolesFromPackages(packages: Package[]): string[] {
  const roles = new Set<string>();

  for (const pkg of packages) {
    if (pkg.roleTargets) {
      pkg.roleTargets.forEach((target) => roles.add(target.role));
    } else if (pkg.roleTarget) {
      pkg.roleTarget.forEach((role) => roles.add(role));
    }
  }

  return Array.from(roles).sort();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  matchPackages,
  getMatchSummary,
  filterByOS,
  groupPackagesByDepartment,
  getDepartmentGroupsFromPackages,
  getRolesFromPackages,
};
