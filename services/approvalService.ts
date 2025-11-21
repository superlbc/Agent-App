/**
 * Approval API Service
 *
 * Handles all HTTP requests for Approval workflow operations
 */

import { ApprovalRequest } from '../types';

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
 * Get all approval requests
 */
export async function getAllApprovals(params?: {
  status?: string;
  requestType?: string;
  approver?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: ApprovalRequest[]; pagination: any }> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/approvals${queryString ? `?${queryString}` : ''}`;

  return apiCall(endpoint);
}

/**
 * Get a single approval request by ID
 */
export async function getApprovalById(id: string): Promise<ApprovalRequest> {
  return apiCall(`/approvals/${id}`);
}

/**
 * Create a new approval request
 */
export async function createApproval(
  approval: Partial<ApprovalRequest>
): Promise<ApprovalRequest> {
  return apiCall(`/approvals`, {
    method: 'POST',
    body: JSON.stringify(approval),
  });
}

/**
 * Approve an approval request
 */
export async function approveRequest(
  id: string,
  data: {
    helixTicketId?: string;
    notes?: string;
  }
): Promise<ApprovalRequest> {
  return apiCall(`/approvals/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Reject an approval request
 */
export async function rejectRequest(
  id: string,
  data: {
    rejectionReason: string;
    notes?: string;
  }
): Promise<ApprovalRequest> {
  return apiCall(`/approvals/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Cancel an approval request
 */
export async function cancelRequest(
  id: string,
  data?: {
    notes?: string;
  }
): Promise<ApprovalRequest> {
  return apiCall(`/approvals/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(data || {}),
  });
}
