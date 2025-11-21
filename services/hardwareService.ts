/**
 * Hardware API Service
 *
 * Handles all HTTP requests for Hardware CRUD operations including bulk import
 */

import { Hardware } from '../types';

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
 * Get all hardware
 */
export async function getAllHardware(params?: {
  type?: string;
  status?: string;
  manufacturer?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Hardware[]; pagination: any }> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/hardware${queryString ? `?${queryString}` : ''}`;

  return apiCall(endpoint);
}

/**
 * Get a single hardware item by ID
 */
export async function getHardwareById(id: string): Promise<Hardware> {
  return apiCall(`/hardware/${id}`);
}

/**
 * Create a new hardware item
 */
export async function createHardware(
  hardware: Partial<Hardware>
): Promise<Hardware> {
  return apiCall(`/hardware`, {
    method: 'POST',
    body: JSON.stringify(hardware),
  });
}

/**
 * Bulk import hardware items from CSV
 */
export async function bulkImportHardware(
  items: Partial<Hardware>[]
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}> {
  return apiCall(`/hardware/bulk`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/**
 * Update an existing hardware item
 */
export async function updateHardware(
  id: string,
  updates: Partial<Hardware>
): Promise<Hardware> {
  return apiCall(`/hardware/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a hardware item
 */
export async function deleteHardware(id: string): Promise<void> {
  return apiCall(`/hardware/${id}`, {
    method: 'DELETE',
  });
}
