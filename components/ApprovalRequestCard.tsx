// ============================================================================
// APPROVAL REQUEST CARD COMPONENT
// ============================================================================
// Displays an individual approval request with status and actions

import React from 'react';
import { ApprovalRequest } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconName } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApprovalRequestCardProps {
  approval: ApprovalRequest;
  onView?: (approval: ApprovalRequest) => void;
  onApprove?: (approval: ApprovalRequest) => void;
  onReject?: (approval: ApprovalRequest) => void;
  onViewTicket?: (ticketId: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusColor = (status: ApprovalRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getStatusIcon = (status: ApprovalRequest['status']): IconName => {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'approved':
      return 'check-circle';
    case 'rejected':
      return 'x-circle';
    case 'cancelled':
      return 'x';
    default:
      return 'info';
  }
};

const getRequestTypeLabel = (type: ApprovalRequest['requestType']): string => {
  switch (type) {
    case 'equipment':
      return 'Equipment Package';
    case 'software':
      return 'Software Request';
    case 'exception':
      return 'Exception Request';
    case 'mid-employment':
      return 'Mid-Employment Request';
    default:
      return 'Request';
  }
};

const getRequestTypeIcon = (type: ApprovalRequest['requestType']): IconName => {
  switch (type) {
    case 'equipment':
      return 'package';
    case 'software':
      return 'code';
    case 'exception':
      return 'alert';
    case 'mid-employment':
      return 'user';
    default:
      return 'info';
  }
};

const getPriorityColor = (automatedDecision: boolean) => {
  if (automatedDecision) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  approval,
  onView,
  onApprove,
  onReject,
  onViewTicket,
  compact = false,
  showActions = true,
}) => {
  const statusColor = getStatusColor(approval.status);
  const statusIcon = getStatusIcon(approval.status);
  const typeLabel = getRequestTypeLabel(approval.requestType);
  const typeIcon = getRequestTypeIcon(approval.requestType);
  const priorityColor = getPriorityColor(approval.automatedDecision);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className={`p-${compact ? '4' : '6'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={typeIcon} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {approval.employeeName}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {typeLabel}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              <Icon name={statusIcon} className="w-4 h-4" />
              {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          {/* Request Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Requested by:</span>
              <p className="text-gray-900 dark:text-white font-medium">{approval.requester}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Request Date:</span>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatDate(approval.requestDate)}
              </p>
            </div>
          </div>

          {/* Approval Type */}
          <div>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${priorityColor}`}>
              {approval.automatedDecision ? (
                <>
                  <Icon name="check" className="w-3 h-3" />
                  Auto-Approved
                </>
              ) : (
                <>
                  <Icon name="user" className="w-3 h-3" />
                  Requires Approval
                </>
              )}
            </span>
          </div>

          {/* Items Summary */}
          {!compact && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Items Requested:</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-900 dark:text-white">
                  <strong>{approval.items.length}</strong> {approval.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
          )}

          {/* Approver Info */}
          {approval.approver && approval.approver !== 'Pending' && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Approver:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{approval.approver}</p>
                </div>
                {approval.approvalDate && (
                  <div className="text-right">
                    <span className="text-gray-500 dark:text-gray-400">Approved:</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(approval.approvalDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {approval.status === 'rejected' && approval.rejectionReason && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-600 dark:text-red-400">{approval.rejectionReason}</p>
            </div>
          )}

          {/* Helix Ticket Link */}
          {approval.helixTicketId && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onViewTicket?.(approval.helixTicketId!)}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Icon name="external-link" className="w-4 h-4" />
                View Helix Ticket: {approval.helixTicketId}
              </button>
            </div>
          )}

          {/* Notes */}
          {approval.notes && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
              <p className="text-sm text-gray-900 dark:text-white">{approval.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(approval)}
                className="flex-1"
              >
                <Icon name="eye" className="w-4 h-4 mr-2" />
                View Details
              </Button>
            )}

            {approval.status === 'pending' && onApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove(approval)}
                className="flex-1"
              >
                <Icon name="check" className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}

            {approval.status === 'pending' && onReject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(approval)}
                className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Icon name="x" className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * <ApprovalRequestCard
 *   approval={approvalRequest}
 *   onView={(approval) => startViewApproval(approval)}
 *   onApprove={(approval) => handleApprove(approval)}
 *   onReject={(approval) => handleReject(approval)}
 *   onViewTicket={(ticketId) => handleViewTicket(ticketId)}
 * />
 *
 * // Compact mode
 * <ApprovalRequestCard
 *   approval={approvalRequest}
 *   compact={true}
 *   showActions={false}
 * />
 */
