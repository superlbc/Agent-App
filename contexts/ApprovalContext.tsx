// ============================================================================
// APPROVAL CONTEXT
// ============================================================================
// Centralized state management for approval requests and Helix tickets

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ApprovalRequest, HelixTicket } from '../types';
import {
  mockApprovalRequests,
  mockHelixTickets,
  mockApprovalStatistics,
} from '../utils/mockData';

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

  // Approval Operations
  createApproval: (approval: Partial<ApprovalRequest>) => void;
  updateApproval: (id: string, updates: Partial<ApprovalRequest>) => void;
  deleteApproval: (id: string) => void;
  approveRequest: (id: string, notes?: string) => void;
  rejectRequest: (id: string, reason: string) => void;

  // Ticket Operations
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
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const ApprovalProvider: React.FC<ApprovalProviderProps> = ({ children }) => {
  // State
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(mockApprovalRequests);
  const [tickets, setTickets] = useState<HelixTicket[]>(mockHelixTickets);
  const [viewingApproval, setViewingApproval] = useState<ApprovalRequest | null>(null);
  const [viewingTicket, setViewingTicket] = useState<HelixTicket | null>(null);

  // ============================================================================
  // APPROVAL OPERATIONS
  // ============================================================================

  /**
   * Create a new approval request
   */
  const createApproval = (approvalData: Partial<ApprovalRequest>) => {
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
  };

  /**
   * Update an existing approval request
   */
  const updateApproval = (id: string, updates: Partial<ApprovalRequest>) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === id
          ? { ...approval, ...updates }
          : approval
      )
    );

    // Update viewing state if the updated approval was being viewed
    if (viewingApproval?.id === id) {
      setViewingApproval((prev) =>
        prev ? { ...prev, ...updates } : null
      );
    }
  };

  /**
   * Delete an approval request
   */
  const deleteApproval = (id: string) => {
    setApprovals((prev) => prev.filter((approval) => approval.id !== id));

    // Clear viewing state if the deleted approval was being viewed
    if (viewingApproval?.id === id) {
      setViewingApproval(null);
    }
  };

  /**
   * Approve a request and create Helix ticket if needed
   */
  const approveRequest = (id: string, notes?: string) => {
    const approval = approvals.find((a) => a.id === id);
    if (!approval) return;

    // Update approval status
    updateApproval(id, {
      status: 'approved',
      approvalDate: new Date(),
      notes,
    });

    // Create Helix ticket if it doesn't exist
    if (!approval.helixTicketId) {
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

      // Link ticket to approval
      updateApproval(id, { helixTicketId: ticketId });
    }
  };

  /**
   * Reject a request
   */
  const rejectRequest = (id: string, reason: string) => {
    updateApproval(id, {
      status: 'rejected',
      approvalDate: new Date(),
      rejectionReason: reason,
    });
  };

  // ============================================================================
  // TICKET OPERATIONS
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

    // Update viewing state if the updated ticket was being viewed
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

    // Clear viewing state if the deleted ticket was being viewed
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
    createApproval,
    updateApproval,
    deleteApproval,
    approveRequest,
    rejectRequest,
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
 * <ApprovalProvider>
 *   <App />
 * </ApprovalProvider>
 *
 * Use in components:
 *
 * const {
 *   approvals,
 *   tickets,
 *   statistics,
 *   approveRequest,
 *   rejectRequest,
 *   createTicket,
 *   startViewApproval,
 * } = useApprovals();
 *
 * // Approve a request
 * approveRequest('apr-123', 'Approved for standard package');
 *
 * // Reject a request
 * rejectRequest('apr-456', 'Budget constraints');
 *
 * // Create a Helix ticket
 * createTicket({ type: 'password-reset', employeeId: 'emp-123', ... });
 *
 * // View approval details
 * startViewApproval(selectedApproval);
 */
