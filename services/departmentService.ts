/**
 * Momentum Department Data Service
 *
 * Fetches department, role, and organizational information for all active Momentum users
 * from a SQL database via Power Automate flow.
 *
 * This data is used to enrich meeting attendee information with accurate department data,
 * since Azure AD/Graph API department fields are inconsistent.
 */

import { appConfig } from '../appConfig';

export interface MomentumUserData {
  emailAddress: string;
  name: string;
  departmentGroup: string | null;
  department: string | null;
  gradeGroup: string | null;
  roleWithoutNumbers: string | null;
}

export interface MomentumDepartmentResponse {
  success: boolean;
  timestamp?: string;
  recordCount?: number;
  users: MomentumUserData[];
}

/**
 * Fetches all active Momentum users' department data from Power Automate flow
 *
 * This is a "send and receive" operation (not fire-and-forget):
 * - Sends HTTP POST request to Power Automate
 * - Power Automate queries SQL database
 * - Returns array of ~1000 user records
 * - Converts to Map for O(1) lookup by email
 *
 * @returns Map of email -> user data, or null if fetch fails
 */
export const fetchMomentumDepartments = async (): Promise<Map<string, MomentumUserData> | null> => {
  const flowUrl = appConfig.momentumDepartmentFlowUrl;

  // Skip if flow URL not configured (placeholder still present)
  if (!flowUrl || flowUrl.startsWith("PASTE_YOUR_")) {
    console.warn('[DepartmentService] Momentum department flow URL not configured. Skipping fetch.');
    return null;
  }

  try {
    console.log('[DepartmentService] Fetching Momentum department data...');
    const startTime = performance.now();

    // Call Power Automate flow with 10 second timeout
    const response = await fetch(flowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAllDepartmentData',
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`[DepartmentService] Power Automate request failed with status ${response.status}`);
      return null;
    }

    const data: MomentumDepartmentResponse = await response.json();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (!data.success || !data.users || !Array.isArray(data.users)) {
      console.error('[DepartmentService] Invalid response format from Power Automate');
      return null;
    }

    // Convert array to Map for O(1) lookup by email (case-insensitive)
    // Transform Pascal Case field names from Power Automate to camelCase
    const departmentMap = new Map<string, MomentumUserData>();
    data.users.forEach((user: any) => {
      // Power Automate returns Pascal Case (EmailAddress, DepartmentGroup, etc.)
      // Transform to camelCase for consistency
      const emailAddress = user.EmailAddress || user.emailAddress;

      if (emailAddress) {
        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = emailAddress.toLowerCase().trim();

        // Transform Pascal Case to camelCase
        const transformedUser: MomentumUserData = {
          emailAddress: emailAddress,
          name: user.Name || user.name,
          departmentGroup: user.DepartmentGroup || user.departmentGroup || null,
          department: user.Department || user.department || null,
          gradeGroup: user.GradeGroup || user.gradeGroup || null,
          roleWithoutNumbers: user.RoleWithoutNumbers || user.roleWithoutNumbers || null,
        };

        departmentMap.set(normalizedEmail, transformedUser);
      }
    });

    console.log(
      `[DepartmentService] ✅ Successfully fetched ${departmentMap.size} Momentum users in ${duration}ms`,
      {
        recordCount: data.recordCount,
        timestamp: data.timestamp,
        duration: `${duration}ms`,
      }
    );

    return departmentMap;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.error('[DepartmentService] Power Automate request timed out after 10 seconds');
      } else {
        console.error('[DepartmentService] Failed to fetch Momentum department data:', error.message);
      }
    } else {
      console.error('[DepartmentService] Unknown error fetching Momentum department data:', error);
    }
    return null;
  }
};

/**
 * Lookup a single user's department data by email
 *
 * @param email - User's email address (case-insensitive)
 * @param departmentMap - Map returned from fetchMomentumDepartments()
 * @returns User data if found, null otherwise
 */
export const lookupDepartmentByEmail = (
  email: string,
  departmentMap: Map<string, MomentumUserData> | null
): MomentumUserData | null => {
  if (!departmentMap || !email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  return departmentMap.get(normalizedEmail) || null;
};

/**
 * Get summary statistics about the department data
 *
 * @param departmentMap - Map returned from fetchMomentumDepartments()
 * @returns Statistics object
 */
export const getDepartmentDataStats = (
  departmentMap: Map<string, MomentumUserData> | null
): {
  totalUsers: number;
  usersWithDepartment: number;
  usersWithDepartmentGroup: number;
  usersWithRole: number;
} => {
  if (!departmentMap) {
    return {
      totalUsers: 0,
      usersWithDepartment: 0,
      usersWithDepartmentGroup: 0,
      usersWithRole: 0,
    };
  }

  let usersWithDepartment = 0;
  let usersWithDepartmentGroup = 0;
  let usersWithRole = 0;

  departmentMap.forEach(user => {
    if (user.department) usersWithDepartment++;
    if (user.departmentGroup) usersWithDepartmentGroup++;
    if (user.roleWithoutNumbers) usersWithRole++;
  });

  return {
    totalUsers: departmentMap.size,
    usersWithDepartment,
    usersWithDepartmentGroup,
    usersWithRole,
  };
};
