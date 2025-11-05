/**
 * Momentum Department Data Service
 *
 * Fetches department, role, and organizational information for all active Momentum users
 * from a SQL database via Power Automate flow.
 *
 * This data is used to enrich meeting attendee information with accurate department data,
 * since Azure AD/Graph API department fields are inconsistent.
 *
 * Features:
 * - 24-hour localStorage caching to reduce API load
 * - Retry logic with exponential backoff (max 3 attempts)
 * - Circuit breaker pattern to prevent endpoint overload
 * - Request deduplication to prevent simultaneous calls
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

// Cache configuration
const CACHE_KEY = 'momentum_department_cache';
const CACHE_VERSION = 'v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Circuit breaker configuration
const CIRCUIT_BREAKER_KEY = 'momentum_circuit_breaker';
const CIRCUIT_BREAKER_THRESHOLD = 3; // Open circuit after 3 consecutive failures
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000; // Reset after 5 minutes

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
const REQUEST_TIMEOUT = 10000; // 10 seconds per attempt

// In-flight request tracking (prevents duplicate simultaneous requests)
let inflightRequest: Promise<Map<string, MomentumUserData> | null> | null = null;

interface CachedData {
  users: Array<[string, MomentumUserData]>; // Map entries as array for JSON serialization
  timestamp: number;
  version: string;
  recordCount: number;
}

interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

/**
 * Get circuit breaker state from localStorage
 */
const getCircuitBreakerState = (): CircuitBreakerState => {
  try {
    const stored = localStorage.getItem(CIRCUIT_BREAKER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[DepartmentService] Failed to read circuit breaker state');
  }

  return {
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isOpen: false,
  };
};

/**
 * Save circuit breaker state to localStorage
 */
const saveCircuitBreakerState = (state: CircuitBreakerState): void => {
  try {
    localStorage.setItem(CIRCUIT_BREAKER_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[DepartmentService] Failed to save circuit breaker state');
  }
};

/**
 * Check if circuit breaker is open
 */
const isCircuitBreakerOpen = (): boolean => {
  const state = getCircuitBreakerState();

  if (!state.isOpen) {
    return false;
  }

  // Check if circuit breaker should be reset (5 minutes have passed)
  const now = Date.now();
  if (now - state.lastFailureTime >= CIRCUIT_BREAKER_RESET_TIME) {
    console.log('[DepartmentService] Circuit breaker reset after timeout');
    saveCircuitBreakerState({
      consecutiveFailures: 0,
      lastFailureTime: 0,
      isOpen: false,
    });
    return false;
  }

  return true;
};

/**
 * Record a failure in the circuit breaker
 */
const recordFailure = (): void => {
  const state = getCircuitBreakerState();
  const newFailures = state.consecutiveFailures + 1;
  const now = Date.now();

  const newState: CircuitBreakerState = {
    consecutiveFailures: newFailures,
    lastFailureTime: now,
    isOpen: newFailures >= CIRCUIT_BREAKER_THRESHOLD,
  };

  if (newState.isOpen && !state.isOpen) {
    console.warn(
      `[DepartmentService] 🚨 Circuit breaker OPENED after ${newFailures} consecutive failures. ` +
      `Will retry in ${CIRCUIT_BREAKER_RESET_TIME / 1000 / 60} minutes.`
    );
  }

  saveCircuitBreakerState(newState);
};

/**
 * Reset circuit breaker on success
 */
const resetCircuitBreaker = (): void => {
  saveCircuitBreakerState({
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isOpen: false,
  });
};

/**
 * Get cached department data from localStorage
 */
const getCachedData = (): Map<string, MomentumUserData> | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed: CachedData = JSON.parse(cached);

    // Check version
    if (parsed.version !== CACHE_VERSION) {
      console.log('[DepartmentService] Cache version mismatch, invalidating cache');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check expiration
    const now = Date.now();
    const age = now - parsed.timestamp;
    if (age > CACHE_TTL) {
      const hoursOld = Math.round(age / 1000 / 60 / 60);
      console.log(`[DepartmentService] Cache expired (${hoursOld}h old), fetching fresh data`);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Convert array back to Map
    const departmentMap = new Map<string, MomentumUserData>(parsed.users);

    const ageMinutes = Math.round(age / 1000 / 60);
    console.log(
      `[DepartmentService] ✅ Using cached data (${ageMinutes}m old, ${departmentMap.size} users)`
    );

    return departmentMap;
  } catch (error) {
    console.warn('[DepartmentService] Failed to read cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/**
 * Save department data to localStorage cache
 */
const saveCachedData = (departmentMap: Map<string, MomentumUserData>): void => {
  try {
    const cacheData: CachedData = {
      users: Array.from(departmentMap.entries()),
      timestamp: Date.now(),
      version: CACHE_VERSION,
      recordCount: departmentMap.size,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[DepartmentService] Cached ${departmentMap.size} users for 24 hours`);
  } catch (error) {
    console.warn('[DepartmentService] Failed to save cache (may be storage quota):', error);
  }
};

/**
 * Make a single API request attempt with timeout
 */
const makeSingleRequest = async (flowUrl: string): Promise<MomentumDepartmentResponse> => {
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Make API request with retry logic and exponential backoff
 */
const makeRequestWithRetry = async (flowUrl: string): Promise<MomentumDepartmentResponse> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const isRetry = attempt > 0;
      if (isRetry) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`[DepartmentService] Retry ${attempt}/${MAX_RETRIES - 1} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const data = await makeSingleRequest(flowUrl);

      if (isRetry) {
        console.log(`[DepartmentService] ✅ Retry ${attempt} succeeded`);
      }

      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      const errorType = lastError.name === 'TimeoutError' || lastError.name === 'AbortError'
        ? 'Timeout'
        : lastError.message;

      console.error(
        `[DepartmentService] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errorType}`
      );

      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes('HTTP 4')) {
        console.error('[DepartmentService] Client error detected, skipping retries');
        break;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

/**
 * Convert API response to Map
 */
const convertResponseToMap = (data: MomentumDepartmentResponse): Map<string, MomentumUserData> => {
  const departmentMap = new Map<string, MomentumUserData>();

  data.users.forEach((user: any) => {
    const emailAddress = user.EmailAddress || user.emailAddress;

    if (emailAddress) {
      const normalizedEmail = emailAddress.toLowerCase().trim();

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

  return departmentMap;
};

/**
 * Fetches all active Momentum users' department data from Power Automate flow
 *
 * This is a "send and receive" operation (not fire-and-forget):
 * - Sends HTTP POST request to Power Automate
 * - Power Automate queries SQL database
 * - Returns array of ~1000 user records
 * - Converts to Map for O(1) lookup by email
 *
 * Features:
 * - Checks 24-hour cache first
 * - Deduplicates simultaneous requests
 * - Retries failed requests with exponential backoff
 * - Circuit breaker prevents endpoint overload
 *
 * @returns Map of email -> user data, or null if fetch fails
 */
export const fetchMomentumDepartments = async (): Promise<Map<string, MomentumUserData> | null> => {
  const flowUrl = appConfig.momentumDepartmentFlowUrl;

  // Skip if flow URL not configured
  if (!flowUrl || flowUrl.startsWith("PASTE_YOUR_")) {
    console.warn('[DepartmentService] Momentum department flow URL not configured. Skipping fetch.');
    return null;
  }

  // STEP 1: Check if request already in flight (deduplication)
  if (inflightRequest) {
    console.log('[DepartmentService] Request already in flight, returning existing promise');
    return inflightRequest;
  }

  // STEP 2: Check circuit breaker
  if (isCircuitBreakerOpen()) {
    const state = getCircuitBreakerState();
    const minutesUntilReset = Math.ceil((CIRCUIT_BREAKER_RESET_TIME - (Date.now() - state.lastFailureTime)) / 1000 / 60);
    console.error(
      `[DepartmentService] 🚨 Circuit breaker is OPEN (${state.consecutiveFailures} failures). ` +
      `Retry in ${minutesUntilReset} minute(s).`
    );
    return null;
  }

  // STEP 3: Check cache
  const cachedData = getCachedData();
  if (cachedData) {
    return cachedData;
  }

  // STEP 4: Make API request with retry and error handling
  const requestPromise = (async () => {
    try {
      console.log('[DepartmentService] Fetching fresh department data from Power Automate...');
      const startTime = performance.now();

      const data = await makeRequestWithRetry(flowUrl);

      if (!data.success || !data.users || !Array.isArray(data.users)) {
        throw new Error('Invalid response format from Power Automate');
      }

      const departmentMap = convertResponseToMap(data);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(
        `[DepartmentService] ✅ Successfully fetched ${departmentMap.size} Momentum users in ${duration}ms`,
        {
          recordCount: data.recordCount,
          timestamp: data.timestamp,
          duration: `${duration}ms`,
        }
      );

      // Save to cache and reset circuit breaker on success
      saveCachedData(departmentMap);
      resetCircuitBreaker();

      return departmentMap;

    } catch (error) {
      // Record failure in circuit breaker
      recordFailure();

      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.error('[DepartmentService] All retry attempts timed out');
        } else {
          console.error('[DepartmentService] Failed after all retries:', error.message);
        }
      } else {
        console.error('[DepartmentService] Unknown error after all retries:', error);
      }

      return null;
    } finally {
      // Clear in-flight request tracker
      inflightRequest = null;
    }
  })();

  // Store in-flight request for deduplication
  inflightRequest = requestPromise;

  return requestPromise;
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
