/**
 * Pre-Hire API Service
 *
 * Handles all HTTP requests for Pre-Hire CRUD operations
 */

import { PreHire } from '../types';

// Base URL for API calls
// In development: Vite proxy forwards /api/* to http://localhost:8080
// In production: Nginx proxies /api/* to backend service
const API_BASE_URL = '/api';

/**
 * Get authorization token from MSAL
 */
async function getAuthToken(): Promise<string> {
  // Get the MSAL instance from window (injected by AuthGuard)
  const msalInstance = (window as any).msalInstance;

  if (!msalInstance) {
    throw new Error('MSAL not initialized');
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('No authenticated user');
  }

  // Request access token
  const request = {
    scopes: ['User.Read'],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    // If silent acquisition fails, try interactive
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

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Get all pre-hire records
 */
export async function getAllPreHires(params?: {
  status?: string;
  department?: string;
  startDate_from?: string;
  startDate_to?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: PreHire[]; pagination: any }> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/pre-hires${queryString ? `?${queryString}` : ''}`;

  return apiCall(endpoint);
}

/**
 * Get a single pre-hire by ID
 */
export async function getPreHireById(id: string): Promise<PreHire> {
  return apiCall(`/pre-hires/${id}`);
}

/**
 * Create a new pre-hire record
 */
export async function createPreHire(
  preHire: Partial<PreHire>
): Promise<PreHire> {
  return apiCall(`/pre-hires`, {
    method: 'POST',
    body: JSON.stringify(preHire),
  });
}

/**
 * Update an existing pre-hire record
 */
export async function updatePreHire(
  id: string,
  updates: Partial<PreHire>
): Promise<PreHire> {
  return apiCall(`/pre-hires/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a pre-hire record
 */
export async function deletePreHire(id: string): Promise<void> {
  return apiCall(`/pre-hires/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Link pre-hire to employee
 */
export async function linkPreHireToEmployee(
  preHireId: string,
  employeeId: string,
  linkConfidence: 'auto' | 'manual' | 'verified'
): Promise<PreHire> {
  return updatePreHire(preHireId, {
    linkedEmployeeId: employeeId,
    status: 'linked' as any,
  });
}
