/**
 * Venue API Service
 *
 * Handles all HTTP requests for Venue CRUD operations
 */

import { Venue } from '../types';

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
 * Get all venues
 */
export async function getAllVenues(params?: {
  city?: string;
  country?: string;
  category?: string;
  status?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Venue[]; pagination: any }> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/venues${queryString ? `?${queryString}` : ''}`;

  return apiCall(endpoint);
}

/**
 * Get a single venue by ID
 */
export async function getVenueById(id: string): Promise<Venue> {
  return apiCall(`/venues/${id}`);
}

/**
 * Create a new venue
 */
export async function createVenue(
  venue: Partial<Venue>
): Promise<Venue> {
  return apiCall(`/venues`, {
    method: 'POST',
    body: JSON.stringify(venue),
  });
}

/**
 * Update an existing venue
 */
export async function updateVenue(
  id: string,
  updates: Partial<Venue>
): Promise<Venue> {
  return apiCall(`/venues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a venue
 */
export async function deleteVenue(id: string): Promise<void> {
  return apiCall(`/venues/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Geocode an address to get latitude/longitude
 * Uses Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
}> {
  // Mock implementation for now (requires Google Maps API key)
  // In production, this would call Google Geocoding API
  console.warn('[VenueService] Geocoding not yet implemented - returning mock data');

  return {
    latitude: 40.7128,
    longitude: -74.0060,
    formattedAddress: address,
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postCode: '10001',
  };
}
