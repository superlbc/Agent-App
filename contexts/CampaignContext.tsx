import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Program, Client } from '../types-uxp';
import { mockPrograms, mockClients } from '../utils/mockDataUXP';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Campaign filters for CampaignList
 * Note: "Campaign" = "Program" in UXP data model
 */
export interface CampaignFilters {
  clientId?: string;
  region?: string;
  eventType?: string;
  status?: Program['status'];
  search?: string;
}

/**
 * Extended Program type with client information (denormalized for UI)
 */
export interface CampaignWithClient extends Program {
  clientName?: string;
  eventCount?: number;
}

interface CampaignContextType {
  // State
  campaigns: CampaignWithClient[];
  clients: Client[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createCampaign: (campaign: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Program>;
  updateCampaign: (id: string, updates: Partial<Program>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaign: (id: string) => CampaignWithClient | undefined;

  // Utility Operations
  filterCampaigns: (filters: CampaignFilters) => CampaignWithClient[];
  searchCampaigns: (query: string) => CampaignWithClient[];
  getCampaignsByClient: (clientId: string) => CampaignWithClient[];
  refreshCampaigns: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Program[]>(mockPrograms as Program[]);
  const [clients] = useState<Client[]>(mockClients as Client[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Denormalize campaigns with client data for UI display
  const campaignsWithClient = useMemo<CampaignWithClient[]>(() => {
    return campaigns.map(campaign => {
      const client = clients.find(c => c.id === campaign.clientId);
      return {
        ...campaign,
        clientName: client?.name,
        eventCount: 0, // TODO: Calculate from events when EventContext is available
      };
    });
  }, [campaigns, clients]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(async (
    campaignData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Program> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const newCampaign: Program = {
        ...campaignData,
        id: `prog-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing campaign
   */
  const updateCampaign = useCallback(async (
    id: string,
    updates: Partial<Program>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setCampaigns(prev =>
        prev.map(campaign =>
          campaign.id === id
            ? { ...campaign, ...updates, updatedAt: new Date() }
            : campaign
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a campaign
   */
  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete campaign';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single campaign by ID
   */
  const getCampaign = useCallback((id: string): CampaignWithClient | undefined => {
    return campaignsWithClient.find(campaign => campaign.id === id);
  }, [campaignsWithClient]);

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Filter campaigns based on multiple criteria
   */
  const filterCampaigns = useCallback((filters: CampaignFilters): CampaignWithClient[] => {
    let filtered = [...campaignsWithClient];

    // Filter by client
    if (filters.clientId) {
      filtered = filtered.filter(c => c.clientId === filters.clientId);
    }

    // Filter by region
    if (filters.region) {
      filtered = filtered.filter(c => c.region === filters.region);
    }

    // Filter by event type
    if (filters.eventType) {
      filtered = filtered.filter(c => c.eventType === filters.eventType);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Filter by search query (name or code)
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [campaignsWithClient]);

  /**
   * Search campaigns by name or code
   */
  const searchCampaigns = useCallback((query: string): CampaignWithClient[] => {
    if (!query.trim()) {
      return campaignsWithClient;
    }

    const searchTerm = query.toLowerCase();
    return campaignsWithClient.filter(campaign =>
      campaign.name.toLowerCase().includes(searchTerm) ||
      campaign.code.toLowerCase().includes(searchTerm)
    );
  }, [campaignsWithClient]);

  /**
   * Get all campaigns for a specific client
   */
  const getCampaignsByClient = useCallback((clientId: string): CampaignWithClient[] => {
    return campaignsWithClient.filter(campaign => campaign.clientId === clientId);
  }, [campaignsWithClient]);

  /**
   * Refresh campaigns from API (simulated)
   */
  const refreshCampaigns = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, this would fetch from API
      // For now, just reset to mock data
      setCampaigns(mockPrograms as Program[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh campaigns';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: CampaignContextType = {
    campaigns: campaignsWithClient,
    clients,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaign,
    filterCampaigns,
    searchCampaigns,
    getCampaignsByClient,
    refreshCampaigns,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access Campaign context
 * @throws Error if used outside CampaignProvider
 */
export const useCampaigns = (): CampaignContextType => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaigns must be used within CampaignProvider');
  }
  return context;
};

// Export types for external use
export type { CampaignContextType, CampaignWithClient };
