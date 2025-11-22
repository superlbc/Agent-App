// ============================================================================
// APPROVAL CONTEXT
// ============================================================================
// Centralized state management for approval requests and Helix tickets
// Now connected to backend API with loading states and error handling

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApprovalRequest, HelixTicket } from '../types';
import {
  mockApprovalRequests,
  mockHelixTickets,
  mockApprovalStatistics,
} from '../utils/mockData';
import * as approvalService from '../services/approvalService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApprovalContextType {
  // State
  approvals: ApprovalRequest[];
  tickets: HelixTicket[];
  statistics: typeof mockApprovalStatistics;
  viewingApproval: ApprovalRequest | null;
  viewingTicket: HelixTicket | null;
  loading: boolean;
  error: string | null;

  // Approval Operations
  createApproval: (approval: Partial<ApprovalRequest>) => Promise<void>;
  updateApproval: (id: string, updates: Partial<ApprovalRequest>) => Promise<void>;
  deleteApproval: (id: string) => Promise<void>;
  approveRequest: (id: string, helixTicketId?: string, notes?: string) => Promise<void>;
  rejectRequest: (id: string, reason: string, notes?: string) => Promise<void>;
  cancelRequest: (id: string, notes?: string) => Promise<void>;
  refreshApprovals: () => Promise<void>;

  // Ticket Operations (Mock - Helix integration external)
  createTicket: (ticket: Partial<HelixTicket>) => void;
  updateTicket: (id: string, updates: Partial<HelixTicket>) => void;
  deleteTicket: (id: string) => void;
  resolveTicket: (id: string) => void;
  closeTicket: (id: string) => void;

  // Viewing State
  startViewApproval: (approval: ApprovalRequest) => void;
  cancelViewApproval: () => void;
  startViewTicket: (ticket: HelixTicket) => void;
  cancelViewTicket: () => void;

  // Helpers
  getApprovalById: (id: string) => ApprovalRequest | undefined;
  getTicketById: (id: string) => HelixTicket | undefined;
  getApprovalsByStatus: (status: ApprovalRequest['status']) => ApprovalRequest[];
  getTicketsByStatus: (status: HelixTicket['status']) => HelixTicket[];
  getPendingApprovals: () => ApprovalRequest[];
  getOpenTickets: () => HelixTicket[];
  getFreezePeriodTickets: () => HelixTicket[];
}

interface ApprovalProviderProps {
  children: ReactNode;
  useMockData?: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const ApprovalProvider: React.FC<ApprovalProviderProps> = ({
  children,
  useMockData = false
}) => {
  // State
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [tickets, setTickets] = useState<HelixTicket[]>(mockHelixTickets); // Helix is external
  const [viewingApproval, setViewingApproval] = useState<ApprovalRequest | null>(null);
  const [viewingTicket, setViewingTicket] = useState<HelixTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all approvals from API
   */
  const fetchApprovals = async () => {
    if (useMockData) {
      setApprovals(mockApprovalRequests);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await approvalService.getAllApprovals();
      setApprovals(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approvals';
      console.error('[ApprovalContext] Error fetching approvals:', errorMessage);
      setError(errorMessage);

      // Fallback to mock data
      console.warn('[ApprovalContext] Falling back to mock data');
      setApprovals(mockApprovalRequests);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh approvals (public method)
   */
  const refreshApprovals = async () => {
    await fetchApprovals();
  };

  // Fetch on mount
  useEffect(() => {
    fetchApprovals();
  }, []);

  // ============================================================================
  // APPROVAL OPERATIONS
  // ============================================================================

  /**
   * Create a new approval request
   */
  const createApproval = async (approvalData: Partial<ApprovalRequest>) => {
    if (useMockData) {
      const newApproval: ApprovalRequest = {
        id: approvalData.id || `apr-${Date.now()}`,
        employeeId: approvalData.employeeId || '',
        employeeName: approvalData.employeeName || '',
        requestType: approvalData.requestType || 'equipment',
        items: approvalData.items || [],
        packageId: approvalData.packageId,
        requester: approvalData.requester || 'Current User',
        requestDate: approvalData.requestDate || new Date(),
        approver: approvalData.approver || 'Pending',
        status: approvalData.status || 'pending',
        helixTicketId: approvalData.helixTicketId,
        automatedDecision: approvalData.automatedDecision ?? false,
        approvalDate: approvalData.approvalDate,
        rejectionReason: approvalData.rejectionReason,
        notes: approvalData.notes,
      };
      setApprovals((prev) => [newApproval, ...prev]);
      return;
    }

    try {
      setError(null);
      const newApproval = await approvalService.createApproval(approvalData);
      setApprovals((prev) => [newApproval, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create approval';
      console.error('[ApprovalContext] Error creating approval:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Update an existing approval request
   */
  const updateApproval = async (id: string, updates: Partial<ApprovalRequest>) => {
    if (useMockData) {
      setApprovals((prev) =>
        prev.map((approval) =>
          approval.id === id
            ? { ...approval, ...updates }
            : approval
        )
      );
      if (viewingApproval?.id === id) {
        setViewingApproval((prev) =>
          prev ? { ...prev, ...updates } : null
        );
      }
      return;
    }

    try {
      setError(null);
      // Note: Backend doesn't have generic update endpoint, only approve/reject/cancel
      // This is a placeholder - actual updates should use specific endpoints
      console.warn('[ApprovalContext] Generic update not supported by API, use approve/reject/cancel instead');

      setApprovals((prev) =>
        prev.map((approval) =>
          approval.id === id ? { ...approval, ...updates } : approval
        )
      );

      if (viewingApproval?.id === id) {
        setViewingApproval((prev) =>
          prev ? { ...prev, ...updates } : null
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update approval';
      console.error('[ApprovalContext] Error updating approval:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Delete an approval request
   */
  const deleteApproval = async (id: string) => {
    if (useMockData) {
      setApprovals((prev) => prev.filter((approval) => approval.id !== id));
      if (viewingApproval?.id === id) {
        setViewingApproval(null);
      }
      return;
    }

    try {
      setError(null);
      // Note: Backend doesn't have delete endpoint for approvals
      // Use cancel instead
      await approvalService.cancelRequest(id, { notes: 'Deleted by user' });

      setApprovals((prev) => prev.filter((approval) => approval.id !== id));

      if (viewingApproval?.id === id) {
        setViewingApproval(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete approval';
      console.error('[ApprovalContext] Error deleting approval:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Approve a request and optionally link Helix ticket
   */
  const approveRequest = async (id: string, helixTicketId?: string, notes?: string) => {
    if (useMockData) {
      const approval = approvals.find((a) => a.id === id);
      if (!approval) return;

      updateApproval(id, {
        status: 'approved',
        approvalDate: new Date(),
        helixTicketId,
        notes,
      });

      // Create Helix ticket if it doesn't exist
      if (!helixTicketId && !approval.helixTicketId) {
        const ticketId = `hx-${Date.now()}`;
        createTicket({
          id: ticketId,
          type: approval.requestType === 'equipment' ? 'equipment' : 'access-request',
          employeeId: approval.employeeId,
          employeeName: approval.employeeName,
          requestedBy: approval.requester,
          status: 'open',
          priority: 'medium',
          createdDate: new Date(),
          description: `Approved ${approval.requestType} request for ${approval.employeeName}`,
          equipmentItems: approval.items,
          approvalRequestId: approval.id,
        });
      }
      return;
    }

    try {
      setError(null);
      const updatedApproval = await approvalService.approveRequest(id, {
        helixTicketId,
        notes,
      });

      setApprovals((prev) =>
        prev.map((approval) => (approval.id === id ? updatedApproval : approval))
      );

      if (viewingApproval?.id === id) {
        setViewingApproval(updatedApproval);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve request';
      console.error('[ApprovalContext] Error approving request:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Reject a request
   */
  const rejectRequest = async (id: string, reason: string, notes?: string) => {
    if (useMockData) {
      updateApproval(id, {
        status: 'rejected',
        approvalDate: new Date(),
        rejectionReason: reason,
        notes,
      });
      return;
    }

    try {
      setError(null);
      const updatedApproval = await approvalService.rejectRequest(id, {
        rejectionReason: reason,
        notes,
      });

      setApprovals((prev) =>
        prev.map((approval) => (approval.id === id ? updatedApproval : approval))
      );

      if (viewingApproval?.id === id) {
        setViewingApproval(updatedApproval);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject request';
      console.error('[ApprovalContext] Error rejecting request:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Cancel a pending request
   */
  const cancelRequest = async (id: string, notes?: string) => {
    if (useMockData) {
      updateApproval(id, {
        status: 'cancelled',
        notes,
      });
      return;
    }

    try {
      setError(null);
      const updatedApproval = await approvalService.cancelRequest(id, { notes });

      setApprovals((prev) =>
        prev.map((approval) => (approval.id === id ? updatedApproval : approval))
      );

      if (viewingApproval?.id === id) {
        setViewingApproval(updatedApproval);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel request';
      console.error('[ApprovalContext] Error cancelling request:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // ============================================================================
  // TICKET OPERATIONS (Mock - Helix is external system)
  // ============================================================================

  /**
   * Create a new Helix ticket
   */
  const createTicket = (ticketData: Partial<HelixTicket>) => {
    const newTicket: HelixTicket = {
      id: ticketData.id || `hx-${Date.now()}`,
      type: ticketData.type || 'equipment',
      employeeId: ticketData.employeeId || '',
      employeeName: ticketData.employeeName || '',
      requestedBy: ticketData.requestedBy || 'Current User',
      status: ticketData.status || 'open',
      priority: ticketData.priority || 'medium',
      createdDate: ticketData.createdDate || new Date(),
      resolvedDate: ticketData.resolvedDate,
      assignedTo: ticketData.assignedTo,
      description: ticketData.description || '',
      scheduledAction: ticketData.scheduledAction,
      actionDate: ticketData.actionDate,
      equipmentItems: ticketData.equipmentItems,
      approvalRequestId: ticketData.approvalRequestId,
    };

    setTickets((prev) => [newTicket, ...prev]);
  };

  /**
   * Update an existing ticket
   */
  const updateTicket = (id: string, updates: Partial<HelixTicket>) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, ...updates }
          : ticket
      )
    );

    if (viewingTicket?.id === id) {
      setViewingTicket((prev) =>
        prev ? { ...prev, ...updates } : null
      );
    }
  };

  /**
   * Delete a ticket
   */
  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));

    if (viewingTicket?.id === id) {
      setViewingTicket(null);
    }
  };

  /**
   * Mark a ticket as resolved
   */
  const resolveTicket = (id: string) => {
    updateTicket(id, {
      status: 'resolved',
      resolvedDate: new Date(),
    });
  };

  /**
   * Mark a ticket as closed
   */
  const closeTicket = (id: string) => {
    updateTicket(id, {
      status: 'closed',
      resolvedDate: new Date(),
    });
  };

  // ============================================================================
  // VIEWING STATE MANAGEMENT
  // ============================================================================

  /**
   * Start viewing an approval
   */
  const startViewApproval = (approval: ApprovalRequest) => {
    setViewingApproval(approval);
  };

  /**
   * Cancel viewing approval
   */
  const cancelViewApproval = () => {
    setViewingApproval(null);
  };

  /**
   * Start viewing a ticket
   */
  const startViewTicket = (ticket: HelixTicket) => {
    setViewingTicket(ticket);
  };

  /**
   * Cancel viewing ticket
   */
  const cancelViewTicket = () => {
    setViewingTicket(null);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get a single approval by ID
   */
  const getApprovalById = (id: string): ApprovalRequest | undefined => {
    return approvals.find((approval) => approval.id === id);
  };

  /**
   * Get a single ticket by ID
   */
  const getTicketById = (id: string): HelixTicket | undefined => {
    return tickets.find((ticket) => ticket.id === id);
  };

  /**
   * Get approvals by status
   */
  const getApprovalsByStatus = (status: ApprovalRequest['status']): ApprovalRequest[] => {
    return approvals.filter((approval) => approval.status === status);
  };

  /**
   * Get tickets by status
   */
  const getTicketsByStatus = (status: HelixTicket['status']): HelixTicket[] => {
    return tickets.filter((ticket) => ticket.status === status);
  };

  /**
   * Get all pending approvals
   */
  const getPendingApprovals = (): ApprovalRequest[] => {
    return getApprovalsByStatus('pending');
  };

  /**
   * Get all open tickets
   */
  const getOpenTickets = (): HelixTicket[] => {
    return tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in-progress');
  };

  /**
   * Get freeze period tickets
   */
  const getFreezePeriodTickets = (): HelixTicket[] => {
    return tickets.filter((ticket) => ticket.scheduledAction !== undefined);
  };

  // ============================================================================
  // STATISTICS
  // ============================================================================

  // Recalculate statistics based on current state
  const statistics = {
    totalPending: getPendingApprovals().length,
    totalApproved: getApprovalsByStatus('approved').length,
    totalRejected: getApprovalsByStatus('rejected').length,
    approvedToday: mockApprovalStatistics.approvedToday,
    rejectedToday: mockApprovalStatistics.rejectedToday,
    averageApprovalTime: mockApprovalStatistics.averageApprovalTime,
    openTickets: getTicketsByStatus('open').length,
    inProgressTickets: getTicketsByStatus('in-progress').length,
    resolvedTickets: getTicketsByStatus('resolved').length,
    freezePeriodTickets: getFreezePeriodTickets().length,
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ApprovalContextType = {
    approvals,
    tickets,
    statistics,
    viewingApproval,
    viewingTicket,
    loading,
    error,
    createApproval,
    updateApproval,
    deleteApproval,
    approveRequest,
    rejectRequest,
    cancelRequest,
    refreshApprovals,
    createTicket,
    updateTicket,
    deleteTicket,
    resolveTicket,
    closeTicket,
    startViewApproval,
    cancelViewApproval,
    startViewTicket,
    cancelViewTicket,
    getApprovalById,
    getTicketById,
    getApprovalsByStatus,
    getTicketsByStatus,
    getPendingApprovals,
    getOpenTickets,
    getFreezePeriodTickets,
  };

  return (
    <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook to access approval context
 * Must be used within ApprovalProvider
 */
export const useApprovals = (): ApprovalContextType => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApprovals must be used within ApprovalProvider');
  }
  return context;
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your app with ApprovalProvider:
 *
 * <ApprovalProvider useMockData={false}>
 *   <App />
 * </ApprovalProvider>
 *
 * Use in components:
 *
 * const {
 *   approvals,
 *   tickets,
 *   statistics,
 *   loading,
 *   error,
 *   approveRequest,
 *   rejectRequest,
 *   cancelRequest,
 *   createTicket,
 *   startViewApproval,
 * } = useApprovals();
 *
 * // Show loading state
 * if (loading) return <LoadingSpinner />;
 *
 * // Show error state
 * if (error) return <ErrorMessage message={error} />;
 *
 * // Approve a request (now async)
 * await approveRequest('apr-123', 'hx-456', 'Approved for standard package');
 *
 * // Reject a request (now async)
 * await rejectRequest('apr-456', 'Budget constraints', 'Will review next quarter');
 *
 * // Cancel a request (now async)
 * await cancelRequest('apr-789', 'Employee withdrawn application');
 *
 * // Create a Helix ticket (still synchronous - external system)
 * createTicket({ type: 'password-reset', employeeId: 'emp-123', ... });
 */
