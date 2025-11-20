// ============================================================================
// HELIX TICKET DETAIL MODAL COMPONENT
// ============================================================================
// Full-screen modal showing detailed Helix ticket information

import React from 'react';
import { HelixTicket } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconName } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HelixTicketDetailModalProps {
  ticket: HelixTicket;
  onResolve: (ticket: HelixTicket) => void;
  onClose: (ticket: HelixTicket) => void;
  onViewApproval?: (approvalId: string) => void;
  onCloseModal: () => void;
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
      return 'New Hire Setup';
    case 'password-reset':
      return 'Password Reset';
    case 'termination':
      return 'Account Termination';
    case 'access-request':
      return 'Access Request';
    case 'equipment':
      return 'Equipment Provisioning';
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export const HelixTicketDetailModal: React.FC<HelixTicketDetailModalProps> = ({
  ticket,
  onResolve,
  onClose,
  onViewApproval,
  onCloseModal,
}) => {
  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  const typeLabel = getTypeLabel(ticket.type);
  const typeIcon = getTypeIcon(ticket.type);

  const isFreeze = ticket.scheduledAction && ticket.actionDate && isFreezePeriod(ticket.actionDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name={typeIcon} className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {ticket.employeeName}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {typeLabel}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ticket ID: {ticket.id}
                </p>
              </div>

              <Button variant="ghost" onClick={onCloseModal}>
                <Icon name="x" className="w-5 h-5" />
              </Button>
            </div>

            {/* Priority Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${priorityColor}`}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
              </span>

              {/* Freeze Period Badge */}
              {isFreeze && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm font-medium rounded">
                  <Icon name="snowflake" className="w-4 h-4" />
                  Freeze Period
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Ticket Information */}
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Ticket Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Requested By:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.requestedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created Date:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(ticket.createdDate)}
                    </p>
                  </div>
                  {ticket.assignedTo && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.assignedTo}
                      </p>
                    </div>
                  )}
                  {ticket.resolvedDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Resolved Date:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(ticket.resolvedDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Scheduled Action (Freeze Period) */}
                {ticket.scheduledAction && ticket.actionDate && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <Icon name="snowflake" className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                          Scheduled Action: {ticket.scheduledAction === 'activate' ? 'Activate Account' : 'Deactivate Account'}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                          Action Date: {formatDate(ticket.actionDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Description */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </Card>

            {/* Equipment Items */}
            {ticket.equipmentItems && ticket.equipmentItems.length > 0 && (
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Equipment/Software Items ({ticket.equipmentItems.length})
                  </h3>

                  <div className="space-y-3">
                    {ticket.equipmentItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              name={'model' in item ? 'monitor' : 'code'}
                              className="w-4 h-4 text-gray-500 dark:text-gray-400"
                            />
                            <p className="font-medium text-gray-900 dark:text-white">
                              {'model' in item ? item.model : item.name}
                            </p>
                          </div>
                          {'manufacturer' in item && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.manufacturer}
                            </p>
                          )}
                          {'vendor' in item && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.vendor}
                            </p>
                          )}
                        </div>
                        {item.cost && (
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ${item.cost.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Linked Approval */}
            {ticket.approvalRequestId && (
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Related Approval Request
                  </h3>
                  <button
                    onClick={() => onViewApproval?.(ticket.approvalRequestId!)}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <Icon name="external-link" className="w-4 h-4" />
                    View Approval Request: {ticket.approvalRequestId}
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {ticket.status === 'open' || ticket.status === 'in-progress' ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onCloseModal}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onResolve(ticket)}
                  className="flex-1"
                >
                  <Icon name="check" className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            ) : ticket.status === 'resolved' ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onClose(ticket)}
                  className="flex-1"
                >
                  <Icon name="x" className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={onCloseModal}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * <HelixTicketDetailModal
 *   ticket={viewingTicket}
 *   onResolve={(ticket) => {
 *     resolveTicket(ticket.id);
 *     addToast('Ticket marked as resolved', 'success');
 *     cancelViewTicket();
 *   }}
 *   onClose={(ticket) => {
 *     closeTicket(ticket.id);
 *     addToast('Ticket closed', 'success');
 *     cancelViewTicket();
 *   }}
 *   onViewApproval={(approvalId) => {
 *     const approval = getApprovalById(approvalId);
 *     if (approval) startViewApproval(approval);
 *   }}
 *   onCloseModal={cancelViewTicket}
 * />
 */
