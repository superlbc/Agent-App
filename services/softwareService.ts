/**
 * Software/License API Service
 *
 * Handles all HTTP requests for Software CRUD operations and license management
 */

import { Software } from '../types';

// Base URL for API calls
const API_BASE_URL = '/api';

/**
 * Get authorization token from MSAL
 */
async function getAuthToken(): Promise<string> {
  const msalInstance = (window as any).msalInstance;

  if (!msalInstance) {
    throw new Error('MSAL not initialized');
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('No authenticated user');
  }

  const request = {
    scopes: ['User.Read'],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    const response = await msalInstance.acquireTokenPopup(request);
    return response.accessToken;
  }
}

/**
 * Helper function to make authenticated API calls
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'unknown_error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(error.message || error.error_description || 'API request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Get all software
 */
export async function getAllSoftware(params?: {
  vendor?: string;
  licenseType?: string;
  utilizationLevel?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Software[]; pagination: any }> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/software${queryString ? `?${queryString}` : ''}`;

  return apiCall(endpoint);
}

/**
 * Get a single software item by ID
 */
export async function getSoftwareById(id: string): Promise<Software> {
  return apiCall(`/software/${id}`);
}

/**
 * Create a new software/license
 */
export async function createSoftware(
  software: Partial<Software>
): Promise<Software> {
  return apiCall(`/software`, {
    method: 'POST',
    body: JSON.stringify(software),
  });
}

/**
 * Update an existing software/license
 */
export async function updateSoftware(
  id: string,
  updates: Partial<Software>
): Promise<Software> {
  return apiCall(`/software/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a software/license
 */
export async function deleteSoftware(id: string): Promise<void> {
  return apiCall(`/software/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Assign a license to an employee
 */
export async function assignLicense(
  softwareId: string,
  assignment: {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    expirationDate?: string;
    notes?: string;
  }
): Promise<{
  assignment: any;
  updatedSoftware: Software;
}> {
  return apiCall(`/software/${softwareId}/assign`, {
    method: 'POST',
    body: JSON.stringify(assignment),
  });
}

/**
 * Reclaim licenses from employees or expired assignments
 */
export async function reclaimLicenses(
  softwareId: string,
  params: {
    employeeIds?: string[];
    reclaimExpired?: boolean;
  }
): Promise<{
  message: string;
  reclaimed: number;
  assignments: any[];
  updatedSoftware: Software;
}> {
  return apiCall(`/software/${softwareId}/reclaim`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
