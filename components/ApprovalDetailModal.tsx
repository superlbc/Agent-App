// ============================================================================
// APPROVAL DETAIL MODAL COMPONENT
// ============================================================================
// Full-screen modal showing detailed approval information with actions

import React from 'react';
import { ApprovalRequest } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApprovalDetailModalProps {
  approval: ApprovalRequest;
  onApprove: (approval: ApprovalRequest) => void;
  onReject: (approval: ApprovalRequest) => void;
  onViewTicket?: (ticketId: string) => void;
  onClose: () => void;
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

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  approval,
  onApprove,
  onReject,
  onViewTicket,
  onClose,
}) => {
  const statusColor = getStatusColor(approval.status);
  const typeLabel = getRequestTypeLabel(approval.requestType);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {approval.employeeName}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                  </span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {typeLabel}
                </p>
              </div>

              <Button variant="outline" onClick={onClose}>
                <Icon name="x" className="w-5 h-5" />
              </Button>
            </div>

            {/* Approval Type Badge */}
            <div className="flex items-center gap-2">
              {approval.automatedDecision ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded">
                  <Icon name="check" className="w-4 h-4" />
                  Auto-Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm font-medium rounded">
                  <Icon name="user" className="w-4 h-4" />
                  Requires Manual Approval
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Request Information */}
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Request Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {approval.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Request ID:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {approval.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Requested By:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {approval.requester}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Request Date:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(approval.requestDate)}
                    </p>
                  </div>
                  {approval.approver && approval.approver !== 'Pending' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Approver:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {approval.approver}
                        </p>
                      </div>
                      {approval.approvalDate && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Approval Date:</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(approval.approvalDate)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Package Information */}
                {approval.packageId && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Package ID:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {approval.packageId}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Items Requested */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Items Requested ({approval.items.length})
                </h3>

                <div className="space-y-3">
                  {approval.items.map((item, index) => (
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
                        {'specifications' in item && item.specifications && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(item.specifications).map(([key, value]) => (
                              value && (
                                <span
                                  key={key}
                                  className="text-xs text-gray-500 dark:text-gray-400"
                                >
                                  {key}: {value}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                      {item.cost && (
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${item.cost.toFixed(2)}
                          </p>
                          {'renewalFrequency' in item && item.renewalFrequency && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              /{item.renewalFrequency === 'monthly' ? 'mo' : 'yr'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Rejection Reason */}
            {approval.status === 'rejected' && approval.rejectionReason && (
              <Card className="border-red-200 dark:border-red-800">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="x-circle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                      Rejection Reason
                    </h3>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-400">
                    {approval.rejectionReason}
                  </p>
                </div>
              </Card>
            )}

            {/* Notes */}
            {approval.notes && (
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {approval.notes}
                  </p>
                </div>
              </Card>
            )}

            {/* Helix Ticket Link */}
            {approval.helixTicketId && (
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    IT Provisioning
                  </h3>
                  <button
                    onClick={() => onViewTicket?.(approval.helixTicketId!)}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <Icon name="external-link" className="w-4 h-4" />
                    View Helix Ticket: {approval.helixTicketId}
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {approval.status === 'pending' ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onReject(approval)}
                  className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Icon name="x" className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onApprove(approval)}
                  className="flex-1"
                >
                  <Icon name="check" className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
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
 * <ApprovalDetailModal
 *   approval={viewingApproval}
 *   onApprove={(approval) => {
 *     setApprovingRequest(approval);
 *   }}
 *   onReject={(approval) => {
 *     setRejectingRequest(approval);
 *   }}
 *   onViewTicket={(ticketId) => {
 *     const ticket = getTicketById(ticketId);
 *     if (ticket) startViewTicket(ticket);
 *   }}
 *   onClose={cancelViewApproval}
 * />
 */
