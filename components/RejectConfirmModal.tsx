// ============================================================================
// REJECT CONFIRMATION MODAL COMPONENT
// ============================================================================
// Confirmation dialog for rejecting requests with mandatory reason

import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Textarea } from './ui/Textarea';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RejectConfirmModalProps {
  approval: ApprovalRequest;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RejectConfirmModal: React.FC<RejectConfirmModalProps> = ({
  approval,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return; // Rejection reason is required
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
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
        <div className="p-5 space-y-4">
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
              This action cannot be undone. The requester will be notified of the rejection with the reason you provide.
            </p>
          </div>

          {/* Rejection Reason Input (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this request is being rejected (e.g., 'Budget constraints', 'Not aligned with company policy', etc.)..."
              rows={4}
              className={!isValid && reason.length > 0 ? 'border-red-300 dark:border-red-700' : ''}
            />
            {!isValid && reason.length === 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                A rejection reason is required
              </p>
            )}
            {reason.trim().length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reason.trim().length} characters
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubmitting || !isValid}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
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
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * {rejectingRequest && (
 *   <RejectConfirmModal
 *     approval={rejectingRequest}
 *     onConfirm={(reason) => {
 *       rejectRequest(rejectingRequest.id, reason);
 *       addToast('Request rejected', 'error');
 *       setRejectingRequest(null);
 *     }}
 *     onCancel={() => setRejectingRequest(null)}
 *   />
 * )}
 */
