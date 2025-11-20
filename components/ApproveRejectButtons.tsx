// ============================================================================
// APPROVE/REJECT BUTTONS COMPONENT
// ============================================================================
// Action buttons with confirmation modals for approval workflow

import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApproveRejectButtonsProps {
  approval: ApprovalRequest;
  onApprove: (approval: ApprovalRequest, notes?: string) => void;
  onReject: (approval: ApprovalRequest, reason: string) => void;
  disabled?: boolean;
}

type ConfirmationMode = 'none' | 'approve' | 'reject';

// ============================================================================
// COMPONENT
// ============================================================================

export const ApproveRejectButtons: React.FC<ApproveRejectButtonsProps> = ({
  approval,
  onApprove,
  onReject,
  disabled = false,
}) => {
  const [mode, setMode] = useState<ConfirmationMode>('none');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleApproveClick = () => {
    setMode('approve');
    setNotes('');
  };

  const handleRejectClick = () => {
    setMode('reject');
    setRejectionReason('');
  };

  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    try {
      onApprove(approval, notes || undefined);
      setMode('none');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      return; // Rejection reason is required
    }

    setIsSubmitting(true);
    try {
      onReject(approval, rejectionReason);
      setMode('none');
      setRejectionReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMode('none');
    setNotes('');
    setRejectionReason('');
  };

  // ============================================================================
  // RENDER ACTION BUTTONS
  // ============================================================================

  if (approval.status !== 'pending') {
    return null; // Only show actions for pending approvals
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={handleApproveClick}
          disabled={disabled}
          className="flex-1"
        >
          <Icon name="check" className="w-4 h-4 mr-2" />
          Approve
        </Button>

        <Button
          variant="ghost"
          onClick={handleRejectClick}
          disabled={disabled}
          className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Icon name="x" className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>

      {/* Approve Confirmation Modal */}
      {mode === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Icon name="check-circle" className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Approve Request
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Confirm approval for {approval.employeeName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Request Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Employee:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.employeeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Type:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.requestType}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Requester:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.requester}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Items:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.items.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  A Helix ticket will be automatically created for IT provisioning.
                </p>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Approval Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or special instructions..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmApprove}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="w-4 h-4 mr-2" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {mode === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Icon name="x-circle" className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reject Request
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provide a reason for rejecting this request
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Request Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Employee:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.employeeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Type:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.requestType}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Requester:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.requester}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Items:</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {approval.items.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <Icon name="alert" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  This action cannot be undone. The requester will be notified of the rejection.
                </p>
              </div>

              {/* Rejection Reason Input (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                  className={rejectionReason.trim() ? '' : 'border-red-300 dark:border-red-700'}
                />
                {!rejectionReason.trim() && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    A rejection reason is required
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <Icon name="x" className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * <ApproveRejectButtons
 *   approval={approvalRequest}
 *   onApprove={(approval, notes) => {
 *     approveRequest(approval.id, notes);
 *     addToast('Request approved successfully', 'success');
 *   }}
 *   onReject={(approval, reason) => {
 *     rejectRequest(approval.id, reason);
 *     addToast('Request rejected', 'error');
 *   }}
 * />
 */
