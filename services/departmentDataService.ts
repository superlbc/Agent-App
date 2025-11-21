// ============================================================================
// DEPARTMENT DATA SERVICE
// ============================================================================
// Loads department and role data from DepartmentGroup.csv

import { ComboboxOption } from '../components/ui/Combobox';
import { DepartmentRoleData } from '../components/ui/HierarchicalRoleSelector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DepartmentGroupRow {
  DepartmentGroup: string;
  RoleWithoutNumbers: string;
  Department: string;
  Role: string;
  Grade: string;
  GradeGroup: string;
  Active: string;
  [key: string]: string; // Allow other CSV columns
}

// ============================================================================
// DATA LOADING
// ============================================================================

let departmentGroupsCache: ComboboxOption[] | null = null;
let rolesCache: ComboboxOption[] | null = null;

/**
 * Parse CSV text into rows (handles quoted fields with commas)
 */
function parseCSV(csvText: string): DepartmentGroupRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header (skip BOM if present)
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map((h) => h.trim());

  // Parse rows
  const rows: DepartmentGroupRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV parsing with quoted fields
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    // Create row object
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as DepartmentGroupRow);
  }

  return rows;
}

/**
 * Get unique, sorted department groups from CSV data
 */
export async function getDepartmentGroups(): Promise<ComboboxOption[]> {
  // Return cached data if available
  if (departmentGroupsCache) {
    return departmentGroupsCache;
  }

  try {
    // Fetch CSV file
    const response = await fetch('/SQL_sample_files/DepartmentGroup.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch DepartmentGroup.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Extract unique department groups
    const uniqueDepartments = new Set<string>();
    rows.forEach((row) => {
      if (row.DepartmentGroup && row.DepartmentGroup.trim()) {
        uniqueDepartments.add(row.DepartmentGroup.trim());
      }
    });

    // Convert to options array and sort
    const options: ComboboxOption[] = Array.from(uniqueDepartments)
      .sort()
      .map((dept) => ({
        value: dept,
        label: dept,
      }));

    // Cache the result
    departmentGroupsCache = options;
    console.log(`[DepartmentDataService] Loaded ${options.length} department groups`);

    return options;
  } catch (error) {
    console.error('[DepartmentDataService] Error loading department groups:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Get unique, sorted roles from CSV data
 */
export async function getRoles(): Promise<ComboboxOption[]> {
  // Return cached data if available
  if (rolesCache) {
    return rolesCache;
  }

  try {
    // Fetch CSV file
    const response = await fetch('/SQL_sample_files/DepartmentGroup.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch DepartmentGroup.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Extract unique roles
    const uniqueRoles = new Set<string>();
    rows.forEach((row) => {
      if (row.RoleWithoutNumbers && row.RoleWithoutNumbers.trim()) {
        uniqueRoles.add(row.RoleWithoutNumbers.trim());
      }
    });

    // Convert to options array and sort
    const options: ComboboxOption[] = Array.from(uniqueRoles)
      .sort()
      .map((role) => ({
        value: role,
        label: role,
      }));

    // Cache the result
    rolesCache = options;
    console.log(`[DepartmentDataService] Loaded ${options.length} roles`);

    return options;
  } catch (error) {
    console.error('[DepartmentDataService] Error loading roles:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Get hierarchical department/role data for HierarchicalRoleSelector
 */
export async function getHierarchicalData(): Promise<DepartmentRoleData[]> {
  try {
    // Fetch CSV file
    const response = await fetch('/SQL_sample_files/DepartmentGroup.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch DepartmentGroup.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Filter and map to hierarchical data
    const data: DepartmentRoleData[] = rows
      .filter((row) => {
        // Filter out non-billable departments and placeholder roles
        return (
          row.Active === '1' &&
          row.DepartmentGroup &&
          row.DepartmentGroup !== 'zNon-bill - Admin/Office Svcs' &&
          row.RoleWithoutNumbers &&
          !row.RoleWithoutNumbers.startsWith('z40')
        );
      })
      .map((row) => ({
        departmentGroup: row.DepartmentGroup.trim(),
        department: row.Department.trim(),
        role: row.RoleWithoutNumbers.trim(),
        gradeGroup: row.GradeGroup?.trim() || undefined,
        grade: row.Grade?.trim() || undefined,
      }));

    console.log(`[DepartmentDataService] Loaded ${data.length} active department/role combinations`);
    return data;
  } catch (error) {
    console.error('[DepartmentDataService] Error loading hierarchical data:', error);
    return [];
  }
}

/**
 * Clear the cache (useful for testing or reloading data)
 */
export function clearCache(): void {
  departmentGroupsCache = null;
  rolesCache = null;
  console.log('[DepartmentDataService] Cache cleared');
}
