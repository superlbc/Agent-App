/**
 * Department Lookup Utility
 *
 * Helper functions to enrich user/attendee data with Momentum department information.
 *
 * This utility provides a fallback hierarchy:
 * 1. Momentum database (most accurate, preferred)
 * 2. Azure AD Graph API department field (fallback)
 * 3. "Unknown" or undefined (if neither source has data)
 */

import { MomentumUserData } from '../services/departmentService';
import { GraphData } from '../types';

export interface EnrichedAttendeeData {
  email: string;
  name: string;
  department: string;
  departmentGroup?: string;
  role?: string;
  gradeGroup?: string;
  source: 'momentum' | 'graph' | 'unknown';
}

/**
 * Enrich a single attendee with department data
 *
 * Priority order:
 * 1. Momentum database DepartmentGroup (preferred field)
 * 2. Momentum database Department (fallback if DepartmentGroup is null)
 * 3. Graph API department (if Momentum data unavailable or null)
 * 4. "Unknown"
 *
 * @param email - Attendee's email address
 * @param name - Attendee's display name
 * @param graphDepartment - Department from Azure AD Graph API (optional)
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns Enriched attendee data with department info
 *
 * @example
 * const enrichedData = enrichAttendeeData(
 *   'user@momentum.com',
 *   'John Doe',
 *   'Technology', // from Graph API
 *   momentumDepartmentMap
 * );
 * // Prefers Momentum DepartmentGroup over Graph
 * // 'momentum' | 'graph' | 'unknown'
 */
export const enrichAttendeeData = (
  email: string,
  name: string,
  graphDepartment?: string,
  departmentMap?: Map<string, MomentumUserData> | null
): EnrichedAttendeeData => {
  // Try Momentum data first (most accurate)
  if (departmentMap && email) {
    const normalizedEmail = email.toLowerCase().trim();
    const momentumData = departmentMap.get(normalizedEmail);

    if (momentumData) {
      // Prioritize DepartmentGroup, fall back to Department, then Graph API, then Unknown
      const departmentValue =
        momentumData.departmentGroup ||
        momentumData.department ||
        graphDepartment ||
        'Unknown';

      return {
        email,
        name: momentumData.name || name, // Prefer Momentum name
        department: departmentValue,
        departmentGroup: momentumData.departmentGroup || undefined,
        role: momentumData.roleWithoutNumbers || undefined,
        gradeGroup: momentumData.gradeGroup || undefined,
        source: (momentumData.departmentGroup || momentumData.department) ? 'momentum' : 'graph',
      };
    }
  }

  // Fallback to Graph API department
  if (graphDepartment) {
    return {
      email,
      name,
      department: graphDepartment,
      source: 'graph',
    };
  }

  // No data available
  return {
    email,
    name,
    department: 'Unknown',
    source: 'unknown',
  };
};

/**
 * Enrich multiple attendees with department data
 *
 * @param attendees - Array of attendees to enrich
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns Array of enriched attendee data
 *
 * @example
 * const attendees = [
 *   { email: 'user1@momentum.com', name: 'User 1', graphDepartment: 'Tech' },
 *   { email: 'user2@momentum.com', name: 'User 2', graphDepartment: 'Design' },
 * ];
 * const enriched = enrichMultipleAttendees(attendees, momentumDepartmentMap);
 */
export const enrichMultipleAttendees = (
  attendees: Array<{ email: string; name: string; graphDepartment?: string }>,
  departmentMap?: Map<string, MomentumUserData> | null
): EnrichedAttendeeData[] => {
  return attendees.map(attendee =>
    enrichAttendeeData(attendee.email, attendee.name, attendee.graphDepartment, departmentMap)
  );
};

/**
 * Get preferred department value for a user
 *
 * Priority order (with null handling):
 * 1. Momentum DepartmentGroup (preferred)
 * 2. Momentum Department (if DepartmentGroup is null)
 * 3. Graph API department (if both Momentum fields are null)
 * 4. "Unknown"
 *
 * Use this when you need a single department string.
 *
 * @param email - User's email address
 * @param graphDepartment - Department from Azure AD Graph API (optional)
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns Department string
 *
 * @example
 * const dept = getPreferredDepartment('user@momentum.com', 'Tech', momentumMap);
 * // "Experience Production (XP)" from DepartmentGroup
 */
export const getPreferredDepartment = (
  email: string,
  graphDepartment?: string,
  departmentMap?: Map<string, MomentumUserData> | null
): string => {
  if (departmentMap && email) {
    const normalizedEmail = email.toLowerCase().trim();
    const momentumData = departmentMap.get(normalizedEmail);

    if (momentumData) {
      // Prioritize DepartmentGroup, then Department, then Graph API, then Unknown
      const result = (
        momentumData.departmentGroup ||
        momentumData.department ||
        graphDepartment ||
        'Unknown'
      );

      return result;
    }
  }

  const fallback = graphDepartment || 'Unknown';
  return fallback;
};

/**
 * Check if a user is in the Momentum database
 *
 * @param email - User's email address
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns True if user found in Momentum database
 *
 * @example
 * if (isMomentumUser('user@momentum.com', momentumMap)) {
 *   * }
 */
export const isMomentumUser = (
  email: string,
  departmentMap?: Map<string, MomentumUserData> | null
): boolean => {
  if (!departmentMap || !email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  return departmentMap.has(normalizedEmail);
};

/**
 * Filter attendees to only Momentum users
 *
 * @param emails - Array of email addresses
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns Array of Momentum user emails
 *
 * @example
 * const allAttendees = ['user1@momentum.com', 'external@client.com', 'user2@momentum.com'];
 * const momentumAttendees = filterMomentumUsers(allAttendees, momentumMap);
 * // ['user1@momentum.com', 'user2@momentum.com']
 */
export const filterMomentumUsers = (
  emails: string[],
  departmentMap?: Map<string, MomentumUserData> | null
): string[] => {
  if (!departmentMap) {
    return [];
  }

  return emails.filter(email => isMomentumUser(email, departmentMap));
};

/**
 * Get department statistics for a list of attendees
 *
 * @param emails - Array of email addresses
 * @param departmentMap - Map of Momentum department data (optional)
 * @returns Statistics about departments represented
 *
 * @example
 * const stats = getDepartmentStats(attendeeEmails, momentumMap);
 * // 10
 * // 7
 * // { 'Technology': 3, 'Design': 2, 'Operations': 2 }
 */
export const getDepartmentStats = (
  emails: string[],
  departmentMap?: Map<string, MomentumUserData> | null
): {
  totalAttendees: number;
  momentumAttendees: number;
  externalAttendees: number;
  departmentBreakdown: Record<string, number>;
  departmentGroupBreakdown: Record<string, number>;
} => {
  const stats = {
    totalAttendees: emails.length,
    momentumAttendees: 0,
    externalAttendees: 0,
    departmentBreakdown: {} as Record<string, number>,
    departmentGroupBreakdown: {} as Record<string, number>,
  };

  if (!departmentMap) {
    stats.externalAttendees = emails.length;
    return stats;
  }

  emails.forEach(email => {
    const normalizedEmail = email.toLowerCase().trim();
    const userData = departmentMap.get(normalizedEmail);

    if (userData) {
      stats.momentumAttendees++;

      // Count by department
      const dept = userData.department || 'Unknown';
      stats.departmentBreakdown[dept] = (stats.departmentBreakdown[dept] || 0) + 1;

      // Count by department group
      if (userData.departmentGroup) {
        const deptGroup = userData.departmentGroup;
        stats.departmentGroupBreakdown[deptGroup] = (stats.departmentGroupBreakdown[deptGroup] || 0) + 1;
      }
    } else {
      stats.externalAttendees++;
    }
  });

  return stats;
};
