// ============================================================================
// VENUE CONTEXT
// ============================================================================
// Centralized state management for venues with CRUD operations
// Connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Venue } from '../types';
import { mockVenues } from '../utils/mockData';
import * as venueService from '../services/venueService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VenueContextType {
  // State
  venues: Venue[];
  editingVenue: Venue | null;
  viewingVenue: Venue | null;
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createVenue: (venue: Partial<Venue>) => Promise<void>;
  updateVenue: (id: string, updates: Partial<Venue>) => Promise<void>;
  deleteVenue: (id: string) => Promise<void>;
  refreshVenues: () => Promise<void>;

  // Editing
  startEdit: (venue: Venue) => void;
  cancelEdit: () => void;

  // Viewing
  startView: (venue: Venue) => void;
  cancelView: () => void;

  // Helpers
  getVenueById: (id: string) => Venue | undefined;
  searchVenues: (query: string) => Venue[];
  filterVenues: (filters: {
    city?: string[];
    country?: string[];
    category?: string[];
    status?: string[];
  }) => Venue[];
}

interface VenueProviderProps {
  children: ReactNode;
  useMockData?: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const VenueContext = createContext<VenueContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const VenueProvider: React.FC<VenueProviderProps> = ({
  children,
  useMockData = false
}) => {
  // State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [viewingVenue, setViewingVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all venues from API
   */
  const fetchVenues = async () => {
    if (useMockData) {
      setVenues(mockVenues);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await venueService.getAllVenues();
      setVenues(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch venues';
      console.error('[VenueContext] Error fetching venues:', errorMessage);
      setError(errorMessage);
      // Fallback to mock data on error
      setVenues(mockVenues);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    fetchVenues();
  }, [useMockData]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new venue
   */
  const createVenue = async (venueData: Partial<Venue>) => {
    if (useMockData) {
      // Mock creation
      const newVenue: Venue = {
        id: `ven-${Date.now()}`,
        name: venueData.name || '',
        fullAddress: venueData.fullAddress || '',
        formattedAddress: venueData.formattedAddress,
        country: venueData.country || '',
        city: venueData.city || '',
        state: venueData.state,
        stateCode: venueData.stateCode,
        postCode: venueData.postCode,
        address: venueData.address || '',
        number: venueData.number,
        latitude: venueData.latitude || 0,
        longitude: venueData.longitude || 0,
        geoJSONData: venueData.geoJSONData,
        category: venueData.category,
        platform: venueData.platform || 'Google Maps',
        poiScope: venueData.poiScope,
        entityType: venueData.entityType,
        subCategory: venueData.subCategory,
        tags: venueData.tags || [],
        url: venueData.url,
        status: venueData.status || 'active',
        eventsCount: 0,
        createdBy: 'current-user@momentumww.com',
        createdByName: 'Current User',
        createdOn: new Date(),
      };
      setVenues([...venues, newVenue]);
      return;
    }

    try {
      setLoading(true);
      const newVenue = await venueService.createVenue(venueData);
      setVenues([...venues, newVenue]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create venue';
      console.error('[VenueContext] Error creating venue:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing venue
   */
  const updateVenue = async (id: string, updates: Partial<Venue>) => {
    if (useMockData) {
      // Mock update
      setVenues(
        venues.map((v) =>
          v.id === id
            ? {
                ...v,
                ...updates,
                updatedBy: 'current-user@momentumww.com',
                updatedByName: 'Current User',
                updatedOn: new Date(),
              }
            : v
        )
      );
      return;
    }

    try {
      setLoading(true);
      const updatedVenue = await venueService.updateVenue(id, updates);
      setVenues(venues.map((v) => (v.id === id ? updatedVenue : v)));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update venue';
      console.error('[VenueContext] Error updating venue:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a venue
   */
  const deleteVenue = async (id: string) => {
    if (useMockData) {
      // Mock delete
      setVenues(venues.filter((v) => v.id !== id));
      return;
    }

    try {
      setLoading(true);
      await venueService.deleteVenue(id);
      setVenues(venues.filter((v) => v.id !== id));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete venue';
      console.error('[VenueContext] Error deleting venue:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh venues from API
   */
  const refreshVenues = async () => {
    await fetchVenues();
  };

  // ============================================================================
  // EDITING OPERATIONS
  // ============================================================================

  const startEdit = (venue: Venue) => {
    setEditingVenue(venue);
  };

  const cancelEdit = () => {
    setEditingVenue(null);
  };

  // ============================================================================
  // VIEWING OPERATIONS
  // ============================================================================

  const startView = (venue: Venue) => {
    setViewingVenue(venue);
  };

  const cancelView = () => {
    setViewingVenue(null);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get venue by ID
   */
  const getVenueById = (id: string): Venue | undefined => {
    return venues.find((v) => v.id === id);
  };

  /**
   * Search venues by name, address, or tags
   */
  const searchVenues = (query: string): Venue[] => {
    if (!query) return venues;

    const lowerQuery = query.toLowerCase();
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(lowerQuery) ||
        v.fullAddress.toLowerCase().includes(lowerQuery) ||
        v.city.toLowerCase().includes(lowerQuery) ||
        v.country.toLowerCase().includes(lowerQuery) ||
        v.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  };

  /**
   * Filter venues by criteria
   */
  const filterVenues = (filters: {
    city?: string[];
    country?: string[];
    category?: string[];
    status?: string[];
  }): Venue[] => {
    return venues.filter((venue) => {
      // City filter
      if (filters.city && filters.city.length > 0) {
        if (!filters.city.includes(venue.city)) return false;
      }

      // Country filter
      if (filters.country && filters.country.length > 0) {
        if (!filters.country.includes(venue.country)) return false;
      }

      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!venue.category || !filters.category.includes(venue.category)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(venue.status)) return false;
      }

      return true;
    });
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: VenueContextType = {
    // State
    venues,
    editingVenue,
    viewingVenue,
    loading,
    error,

    // CRUD Operations
    createVenue,
    updateVenue,
    deleteVenue,
    refreshVenues,

    // Editing
    startEdit,
    cancelEdit,

    // Viewing
    startView,
    cancelView,

    // Helpers
    getVenueById,
    searchVenues,
    filterVenues,
  };

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook to use Venue context
 */
export const useVenue = (): VenueContextType => {
  const context = useContext(VenueContext);
  if (context === undefined) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
};
