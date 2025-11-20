// ============================================================================
// HELIX TICKET CARD COMPONENT
// ============================================================================
// Displays an individual Helix ticket with status and actions

import React from 'react';
import { HelixTicket } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconName } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HelixTicketCardProps {
  ticket: HelixTicket;
  onView?: (ticket: HelixTicket) => void;
  onResolve?: (ticket: HelixTicket) => void;
  onClose?: (ticket: HelixTicket) => void;
  onViewApproval?: (approvalId: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusColor = (status: HelixTicket['status']) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getStatusIcon = (status: HelixTicket['status']): IconName => {
  switch (status) {
    case 'open':
      return 'info';
    case 'in-progress':
      return 'refresh';
    case 'resolved':
      return 'check-circle';
    case 'closed':
      return 'x-circle';
    default:
      return 'info';
  }
};

const getPriorityColor = (priority: HelixTicket['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getTypeLabel = (type: HelixTicket['type']): string => {
  switch (type) {
    case 'new-hire':
      return 'New Hire';
    case 'password-reset':
      return 'Password Reset';
    case 'termination':
      return 'Termination';
    case 'access-request':
      return 'Access Request';
    case 'equipment':
      return 'Equipment';
    default:
      return 'Ticket';
  }
};

const getTypeIcon = (type: HelixTicket['type']): IconName => {
  switch (type) {
    case 'new-hire':
      return 'user';
    case 'password-reset':
      return 'key';
    case 'termination':
      return 'x-circle';
    case 'access-request':
      return 'key';
    case 'equipment':
      return 'package';
    default:
      return 'info';
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

const isFreezePeriod = (date: Date): boolean => {
  const d = new Date(date);
  const month = d.getMonth();
  const day = d.getDate();

  // Nov (10) - Jan 5 (month 0, day 5)
  return (month === 10) || (month === 11) || (month === 0 && day <= 5);
};

// ============================================================================
// COMPONENT
// ============================================================================

export const HelixTicketCard: React.FC<HelixTicketCardProps> = ({
  ticket,
  onView,
  onResolve,
  onClose,
  onViewApproval,
  compact = false,
  showActions = true,
}) => {
  const statusColor = getStatusColor(ticket.status);
  const statusIcon = getStatusIcon(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  const typeLabel = getTypeLabel(ticket.type);
  const typeIcon = getTypeIcon(ticket.type);

  const isFreeze = ticket.scheduledAction && ticket.actionDate && isFreezePeriod(ticket.actionDate);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className={`p-${compact ? '4' : '6'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={typeIcon} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {ticket.employeeName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {typeLabel}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {ticket.id}
              </p>
            </div>
          </div>

          {/* Status and Priority Badges */}
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              <Icon name={statusIcon} className="w-4 h-4" />
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${priorityColor}`}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>
          </div>
        </div>

        {/* Freeze Period Alert */}
        {isFreeze && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="snowflake" className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                Freeze Period Ticket
              </p>
            </div>
            {ticket.scheduledAction && ticket.actionDate && (
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 ml-6">
                Scheduled: {ticket.scheduledAction === 'activate' ? 'Activate' : 'Deactivate'} on {formatDate(ticket.actionDate)}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {!compact && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-white">
              {ticket.description}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-3 mb-4">
          {/* Request Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Requested by:</span>
              <p className="text-gray-900 dark:text-white font-medium">{ticket.requestedBy}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatDate(ticket.createdDate)}
              </p>
            </div>
          </div>

          {/* Assigned To */}
          {ticket.assignedTo && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>
              <p className="text-gray-900 dark:text-white font-medium">{ticket.assignedTo}</p>
            </div>
          )}

          {/* Resolution Date */}
          {ticket.resolvedDate && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Resolved:</span>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatDate(ticket.resolvedDate)}
              </p>
            </div>
          )}

          {/* Equipment Items */}
          {!compact && ticket.equipmentItems && ticket.equipmentItems.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Equipment/Software ({ticket.equipmentItems.length} items):
              </p>
              <div className="flex flex-wrap gap-2">
                {ticket.equipmentItems.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {item.name || item.model}
                  </span>
                ))}
                {ticket.equipmentItems.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                    +{ticket.equipmentItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Approval Request Link */}
          {ticket.approvalRequestId && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onViewApproval?.(ticket.approvalRequestId!)}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Icon name="external-link" className="w-4 h-4" />
                View Related Approval: {ticket.approvalRequestId}
              </button>
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
                onClick={() => onView(ticket)}
                className="flex-1"
              >
                <Icon name="eye" className="w-4 h-4 mr-2" />
                View Details
              </Button>
            )}

            {ticket.status === 'open' && onResolve && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResolve(ticket)}
                className="flex-1"
              >
                <Icon name="check" className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            )}

            {ticket.status === 'in-progress' && onResolve && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResolve(ticket)}
                className="flex-1"
              >
                <Icon name="check" className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            )}

            {ticket.status === 'resolved' && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClose(ticket)}
                className="flex-1"
              >
                <Icon name="x" className="w-4 h-4 mr-2" />
                Close Ticket
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
 * <HelixTicketCard
 *   ticket={helixTicket}
 *   onView={(ticket) => startViewTicket(ticket)}
 *   onResolve={(ticket) => resolveTicket(ticket.id)}
 *   onClose={(ticket) => closeTicket(ticket.id)}
 *   onViewApproval={(approvalId) => {
 *     const approval = getApprovalById(approvalId);
 *     if (approval) startViewApproval(approval);
 *   }}
 * />
 *
 * // Compact mode
 * <HelixTicketCard
 *   ticket={helixTicket}
 *   compact={true}
 *   showActions={false}
 * />
 */
