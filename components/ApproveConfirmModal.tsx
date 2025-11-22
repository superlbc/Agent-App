// ============================================================================
// APPROVE CONFIRMATION MODAL COMPONENT
// ============================================================================
// Confirmation dialog for approving requests with optional notes

import React, { useState } from 'react';
import { ApprovalRequest } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Textarea } from './ui/Textarea';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApproveConfirmModalProps {
  approval: ApprovalRequest;
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ApproveConfirmModal: React.FC<ApproveConfirmModalProps> = ({
  approval,
  onConfirm,
  onCancel,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
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

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {approval.helixTicketId
                ? 'This approval will update the existing Helix ticket.'
                : 'A Helix ticket will be automatically created for IT provisioning.'}
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
              placeholder="Add any notes or special instructions for IT provisioning..."
              rows={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              These notes will be included in the Helix ticket.
            </p>
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
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * {approvingRequest && (
 *   <ApproveConfirmModal
 *     approval={approvingRequest}
 *     onConfirm={(notes) => {
 *       approveRequest(approvingRequest.id, notes);
 *       addToast('Request approved successfully', 'success');
 *       setApprovingRequest(null);
 *     }}
 *     onCancel={() => setApprovingRequest(null)}
 *   />
 * )}
 */
