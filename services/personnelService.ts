/**
 * Personnel Service
 *
 * Handles reading and searching employee data from vw_Personnel.csv
 * Used for linking pre-hire records to existing employee records
 */

export interface PersonnelRecord {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  departmentGroup: string;
  department: string;
  gradeGroup: string;
  grade: string;
  startDate: Date;
  status: 'Active' | 'Inactive' | 'Terminated';
  managerName: string;
  managerEmail: string;
}

export interface MatchResult {
  record: PersonnelRecord;
  confidence: number; // 0-100
  matchType: 'exact' | 'high' | 'medium' | 'low';
  matchReasons: string[];
}

// In-memory cache for personnel data
let personnelCache: PersonnelRecord[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Load personnel data from CSV file
 */
export async function loadPersonnelData(): Promise<PersonnelRecord[]> {
  // Check cache first
  if (personnelCache && cacheTimestamp) {
    const age = Date.now() - cacheTimestamp;
    if (age < CACHE_TTL) {
      console.log(`[PersonnelService] Using cached data (${Math.round(age / 1000 / 60)} minutes old)`);
      return personnelCache;
    }
  }

  try {
    console.log('[PersonnelService] Loading personnel data from CSV...');

    // In browser, fetch from public/database folder or API endpoint
    const response = await fetch('/database/vw_Personnel.csv');

    if (!response.ok) {
      throw new Error(`Failed to load personnel data: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('Personnel CSV file is empty or invalid');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const records: PersonnelRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`[PersonnelService] Skipping malformed row ${i}: ${lines[i]}`);
        continue;
      }

      const record: PersonnelRecord = {
        employeeId: values[0],
        firstName: values[1],
        lastName: values[2],
        fullName: values[3],
        email: values[4].toLowerCase(),
        departmentGroup: values[5],
        department: values[6],
        gradeGroup: values[7],
        grade: values[8],
        startDate: new Date(values[9]),
        status: values[10] as 'Active' | 'Inactive' | 'Terminated',
        managerName: values[11],
        managerEmail: values[12].toLowerCase(),
      };

      records.push(record);
    }

    // Update cache
    personnelCache = records;
    cacheTimestamp = Date.now();

    console.log(`[PersonnelService] ✅ Loaded ${records.length} personnel records`);
    return records;

  } catch (error) {
    console.error('[PersonnelService] Failed to load personnel data:', error);
    throw error;
  }
}

/**
 * Calculate match confidence score
 */
function calculateMatchScore(
  searchName: string,
  searchEmail: string | undefined,
  record: PersonnelRecord
): MatchResult {
  const matchReasons: string[] = [];
  let score = 0;

  // Email exact match (50 points)
  if (searchEmail && record.email === searchEmail.toLowerCase()) {
    score += 50;
    matchReasons.push('Email exact match');
  }

  // Full name exact match (50 points)
  if (searchName.toLowerCase() === record.fullName.toLowerCase()) {
    score += 50;
    matchReasons.push('Full name exact match');
  } else {
    // Partial name matches
    const searchParts = searchName.toLowerCase().split(/\s+/);
    const recordParts = record.fullName.toLowerCase().split(/\s+/);

    // First name match (20 points)
    if (searchParts[0] === recordParts[0]) {
      score += 20;
      matchReasons.push('First name match');
    } else if (searchParts[0] && recordParts[0] &&
               (searchParts[0].includes(recordParts[0]) || recordParts[0].includes(searchParts[0]))) {
      score += 10;
      matchReasons.push('First name partial match');
    }

    // Last name match (20 points)
    if (searchParts.length > 1 && recordParts.length > 1) {
      const searchLast = searchParts[searchParts.length - 1];
      const recordLast = recordParts[recordParts.length - 1];

      if (searchLast === recordLast) {
        score += 20;
        matchReasons.push('Last name match');
      } else if (searchLast.includes(recordLast) || recordLast.includes(searchLast)) {
        score += 10;
        matchReasons.push('Last name partial match');
      }
    }
  }

  // Determine match type
  let matchType: 'exact' | 'high' | 'medium' | 'low';
  if (score === 100) {
    matchType = 'exact';
  } else if (score >= 80) {
    matchType = 'high';
  } else if (score >= 50) {
    matchType = 'medium';
  } else {
    matchType = 'low';
  }

  return {
    record,
    confidence: score,
    matchType,
    matchReasons,
  };
}

/**
 * Search for employee by name and optional email
 */
export async function searchEmployees(
  searchName: string,
  searchEmail?: string
): Promise<MatchResult[]> {
  const records = await loadPersonnelData();

  // Calculate match scores for all records
  const results = records.map(record =>
    calculateMatchScore(searchName, searchEmail, record)
  );

  // Filter to only relevant matches (score > 0)
  const relevantResults = results.filter(r => r.confidence > 0);

  // Sort by confidence descending
  relevantResults.sort((a, b) => b.confidence - a.confidence);

  console.log(`[PersonnelService] Found ${relevantResults.length} matches for "${searchName}"${searchEmail ? ` (${searchEmail})` : ''}`);

  return relevantResults;
}

/**
 * Get employee by exact ID
 */
export async function getEmployeeById(employeeId: string): Promise<PersonnelRecord | null> {
  const records = await loadPersonnelData();
  return records.find(r => r.employeeId === employeeId) || null;
}

/**
 * Get all active employees
 */
export async function getActiveEmployees(): Promise<PersonnelRecord[]> {
  const records = await loadPersonnelData();
  return records.filter(r => r.status === 'Active');
}

/**
 * Clear cache (useful for testing or when CSV is updated)
 */
export function clearPersonnelCache(): void {
  personnelCache = null;
  cacheTimestamp = null;
  console.log('[PersonnelService] Cache cleared');
}
