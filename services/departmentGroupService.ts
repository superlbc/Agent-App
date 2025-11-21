// ============================================================================
// DEPARTMENT GROUP SERVICE
// ============================================================================
// Reads and parses DepartmentGroup.csv for role-based package assignment
//
// **Purpose**: Provides department group and role data for package matching
//
// **Data Source**: DepartmentGroup.csv (located in project root or data directory)
//
// **CSV Structure**:
// DepartmentGroup, Department, Role, GradeGroup, Grade
// "Global Technology", "Production: Global Technology", "Developer", "Individual Contributor", "Senior"
// "Creative Services", "Creative", "XD Designer", "Individual Contributor", "Lead"
//
// **Use Cases**:
// - Package matching: Find packages that match user's department + role
// - Dropdown population: Show available department groups and roles
// - Validation: Ensure user selections are valid combinations
// ============================================================================

import { RoleTarget } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface DepartmentGroupData {
  departmentGroup: string; // e.g., "Global Technology"
  department: string; // e.g., "Production: Global Technology"
  role: string; // e.g., "Developer"
  gradeGroup?: string; // e.g., "Individual Contributor", "Management"
  grade?: string; // e.g., "Senior", "Lead", "Principal"
}

export interface DepartmentGroupLookup {
  departmentGroups: string[]; // Unique list of department groups
  departments: string[]; // Unique list of departments
  roles: string[]; // Unique list of roles
  gradeGroups: string[]; // Unique list of grade groups
  grades: string[]; // Unique list of grades
  data: DepartmentGroupData[]; // Full dataset
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

let departmentGroupCache: DepartmentGroupLookup | null = null;

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Parse CSV content into DepartmentGroupData array
 * Handles quoted fields, commas within quotes, and empty fields
 */
function parseCSV(csvContent: string): DepartmentGroupData[] {
  const lines = csvContent.trim().split('\n');

  // Skip header row
  const dataLines = lines.slice(1);

  const data: DepartmentGroupData[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue; // Skip empty lines

    // Simple CSV parsing (handles quoted fields)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim()); // Add last field

    // Map to DepartmentGroupData
    if (fields.length >= 3) {
      data.push({
        departmentGroup: fields[0] || '',
        department: fields[1] || '',
        role: fields[2] || '',
        gradeGroup: fields[3] || undefined,
        grade: fields[4] || undefined,
      });
    }
  }

  return data;
}

/**
 * Build lookup structure from data array
 * Extracts unique values for each field
 */
function buildLookup(data: DepartmentGroupData[]): DepartmentGroupLookup {
  const departmentGroups = new Set<string>();
  const departments = new Set<string>();
  const roles = new Set<string>();
  const gradeGroups = new Set<string>();
  const grades = new Set<string>();

  data.forEach((item) => {
    if (item.departmentGroup) departmentGroups.add(item.departmentGroup);
    if (item.department) departments.add(item.department);
    if (item.role) roles.add(item.role);
    if (item.gradeGroup) gradeGroups.add(item.gradeGroup);
    if (item.grade) grades.add(item.grade);
  });

  return {
    departmentGroups: Array.from(departmentGroups).sort(),
    departments: Array.from(departments).sort(),
    roles: Array.from(roles).sort(),
    gradeGroups: Array.from(gradeGroups).sort(),
    grades: Array.from(grades).sort(),
    data,
  };
}

// ============================================================================
// FILE READING
// ============================================================================

/**
 * Load DepartmentGroup.csv from filesystem
 * In browser: Uses fetch API (file must be in public directory)
 * In Node: Uses fs module
 *
 * @param filePath - Path to CSV file (default: '/DepartmentGroup.csv')
 */
export async function loadDepartmentGroupData(
  filePath: string = '/DepartmentGroup.csv'
): Promise<DepartmentGroupLookup> {
  // Check cache first
  if (departmentGroupCache) {
    console.log('[DepartmentGroupService] Using cached data');
    return departmentGroupCache;
  }

  console.log(`[DepartmentGroupService] Loading data from ${filePath}...`);

  try {
    // Browser environment - use fetch
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvContent = await response.text();
    const data = parseCSV(csvContent);
    const lookup = buildLookup(data);

    // Cache the result
    departmentGroupCache = lookup;

    console.log(
      `[DepartmentGroupService] ✅ Loaded ${data.length} records:`,
      `${lookup.departmentGroups.length} department groups,`,
      `${lookup.roles.length} roles`
    );

    return lookup;
  } catch (error) {
    console.error('[DepartmentGroupService] ❌ Failed to load data:', error);

    // Return empty lookup on error
    return {
      departmentGroups: [],
      departments: [],
      roles: [],
      gradeGroups: [],
      grades: [],
      data: [],
    };
  }
}

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get all unique department groups
 *
 * @example
 * const groups = await getDepartmentGroups();
 * // Returns: ["Creative Services", "Global Technology", "IP & CT", ...]
 */
export async function getDepartmentGroups(): Promise<string[]> {
  const lookup = await loadDepartmentGroupData();
  return lookup.departmentGroups;
}

/**
 * Get all unique roles
 *
 * @example
 * const roles = await getRoles();
 * // Returns: ["Developer", "Project Manager", "XD Designer", ...]
 */
export async function getRoles(): Promise<string[]> {
  const lookup = await loadDepartmentGroupData();
  return lookup.roles;
}

/**
 * Get roles for a specific department group
 *
 * @example
 * const roles = await getRolesForDepartmentGroup("Global Technology");
 * // Returns: ["Developer", "Senior Developer", "Tech Lead", ...]
 */
export async function getRolesForDepartmentGroup(
  departmentGroup: string
): Promise<string[]> {
  const lookup = await loadDepartmentGroupData();

  const roles = lookup.data
    .filter((item) => item.departmentGroup === departmentGroup)
    .map((item) => item.role)
    .filter((role, index, self) => self.indexOf(role) === index) // Unique
    .sort();

  return roles;
}

/**
 * Get department groups for a specific role
 *
 * @example
 * const deptGroups = await getDepartmentGroupsForRole("Developer");
 * // Returns: ["Global Technology", "IP & CT"]
 */
export async function getDepartmentGroupsForRole(
  role: string
): Promise<string[]> {
  const lookup = await loadDepartmentGroupData();

  const departmentGroups = lookup.data
    .filter((item) => item.role === role)
    .map((item) => item.departmentGroup)
    .filter((dg, index, self) => self.indexOf(dg) === index) // Unique
    .sort();

  return departmentGroups;
}

/**
 * Check if a department group + role combination exists
 *
 * @example
 * const exists = await isValidCombination("Global Technology", "Developer");
 * // Returns: true
 */
export async function isValidCombination(
  departmentGroup: string,
  role: string
): Promise<boolean> {
  const lookup = await loadDepartmentGroupData();

  return lookup.data.some(
    (item) =>
      item.departmentGroup === departmentGroup && item.role === role
  );
}

/**
 * Get full data for a department group + role combination
 *
 * @example
 * const data = await getCombinationData("Global Technology", "Developer");
 * // Returns: [{ departmentGroup: "...", role: "...", gradeGroup: "...", ... }]
 */
export async function getCombinationData(
  departmentGroup: string,
  role: string
): Promise<DepartmentGroupData[]> {
  const lookup = await loadDepartmentGroupData();

  return lookup.data.filter(
    (item) =>
      item.departmentGroup === departmentGroup && item.role === role
  );
}

/**
 * Search for department groups and roles matching a query
 * Case-insensitive partial matching
 *
 * @example
 * const results = await searchDepartmentGroupData("tech");
 * // Returns matches for "Global Technology", "Tech Lead", etc.
 */
export async function searchDepartmentGroupData(
  query: string
): Promise<DepartmentGroupData[]> {
  const lookup = await loadDepartmentGroupData();
  const lowerQuery = query.toLowerCase();

  return lookup.data.filter(
    (item) =>
      item.departmentGroup.toLowerCase().includes(lowerQuery) ||
      item.role.toLowerCase().includes(lowerQuery) ||
      item.department?.toLowerCase().includes(lowerQuery) ||
      item.gradeGroup?.toLowerCase().includes(lowerQuery) ||
      item.grade?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// MOCK DATA (For Development Without CSV File)
// ============================================================================

/**
 * Initialize service with mock data (for development/testing)
 * Call this if DepartmentGroup.csv is not available
 *
 * @example
 * // In development environment
 * initializeMockDepartmentGroupData();
 */
export function initializeMockDepartmentGroupData(): void {
  const mockData: DepartmentGroupData[] = [
    // Global Technology
    {
      departmentGroup: 'Global Technology',
      department: 'Production: Global Technology',
      role: 'Developer',
      gradeGroup: 'Individual Contributor',
      grade: 'Senior',
    },
    {
      departmentGroup: 'Global Technology',
      department: 'Production: Global Technology',
      role: 'Senior Developer',
      gradeGroup: 'Individual Contributor',
      grade: 'Lead',
    },
    {
      departmentGroup: 'Global Technology',
      department: 'Production: Global Technology',
      role: 'Tech Lead',
      gradeGroup: 'Management',
      grade: 'Lead',
    },

    // Creative Services
    {
      departmentGroup: 'Creative Services',
      department: 'Creative',
      role: 'XD Designer',
      gradeGroup: 'Individual Contributor',
      grade: undefined,
    },
    {
      departmentGroup: 'Creative Services',
      department: 'Creative',
      role: 'Senior XD Designer',
      gradeGroup: 'Individual Contributor',
      grade: 'Senior',
    },
    {
      departmentGroup: 'Creative Services',
      department: 'Creative',
      role: 'Lead XD Designer',
      gradeGroup: 'Individual Contributor',
      grade: 'Lead',
    },
    {
      departmentGroup: 'Creative Services',
      department: 'IPTC',
      role: 'Motion Designer',
      gradeGroup: 'Individual Contributor',
      grade: undefined,
    },

    // IP & CT
    {
      departmentGroup: 'IP & CT',
      department: 'IP & CT',
      role: 'Project Manager',
      gradeGroup: 'Individual Contributor',
      grade: undefined,
    },
    {
      departmentGroup: 'IP & CT',
      department: 'IP & CT',
      role: 'Senior Project Manager',
      gradeGroup: 'Individual Contributor',
      grade: 'Senior',
    },
    {
      departmentGroup: 'IP & CT',
      department: 'IP & CT',
      role: 'Program Manager',
      gradeGroup: 'Management',
      grade: undefined,
    },

    // STR (Strategy)
    {
      departmentGroup: 'STR',
      department: 'Strategy',
      role: 'Business Analyst',
      gradeGroup: 'Individual Contributor',
      grade: undefined,
    },
    {
      departmentGroup: 'STR',
      department: 'Strategy',
      role: 'Senior Business Analyst',
      gradeGroup: 'Individual Contributor',
      grade: 'Senior',
    },
  ];

  departmentGroupCache = buildLookup(mockData);

  console.log(
    `[DepartmentGroupService] ✅ Initialized with mock data (${mockData.length} records)`
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  loadDepartmentGroupData,
  getDepartmentGroups,
  getRoles,
  getRolesForDepartmentGroup,
  getDepartmentGroupsForRole,
  isValidCombination,
  getCombinationData,
  searchDepartmentGroupData,
  initializeMockDepartmentGroupData,
};
