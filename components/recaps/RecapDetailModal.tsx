// ============================================================================
// RECAP DETAIL MODAL COMPONENT
// ============================================================================
// Standalone modal for viewing recap details with approve/reject functionality
// Used when clicking recap from lists, dashboards, or event detail pages

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Textarea } from '../ui/Textarea';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Toast } from '../ui/Toast';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EventRecap {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  venueName: string;
  clientName: string;
  programName: string;
  fieldManagerName: string;
  submittedById: string;
  submittedAt: Date;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedAt?: Date;
  approvedByName?: string;
  rejectionReason?: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  footprintDescription: string;
  qrScans: number;
  surveysCollected: number;
  clientMetrics: Record<string, any>;
  eventFeedback: {
    baPerformance?: string;
    salesTeam?: string;
    customerComments?: string;
    trafficFlow?: string;
    attendeeDemographics?: string;
    wouldReturn: boolean;
  };
  photos: { id: string; url: string; filename: string }[];
  premiums?: { premiumType: string; quantityDistributed: number; quantityRemaining?: number }[];
  additionalComments?: string;
}

interface RecapDetailModalProps {
  recap: EventRecap;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (recapId: string) => Promise<void>;
  onReject?: (recapId: string, reason: string) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecapDetailModal: React.FC<RecapDetailModalProps> = ({
  recap,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleApprove = async () => {
    if (!onApprove) return;

    setIsProcessing(true);
    try {
      await onApprove(recap.id);
      setToastMessage({ type: 'success', message: 'Recap approved successfully' });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to approve recap' });
    } finally {
      setIsProcessing(false);
      setShowApproveConfirm(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectionReason.trim()) {
      setToastMessage({ type: 'error', message: 'Rejection reason is required' });
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(recap.id, rejectionReason);
      setToastMessage({ type: 'success', message: 'Recap rejected. Field Manager notified.' });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to reject recap' });
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDateShort = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Status badge configuration
  const statusConfig = {
    draft: { label: 'Draft', color: 'gray', icon: 'edit' },
    pending: { label: 'Pending', color: 'yellow', icon: 'clock' },
    approved: { label: 'Approved', color: 'green', icon: 'check-circle' },
    rejected: { label: 'Rejected', color: 'red', icon: 'x-circle' },
  };

  const status = statusConfig[recap.status];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col my-8" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {recap.eventName}
                </h2>
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                    ${status.color === 'gray' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
                    ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : ''}
                    ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
                    ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
                  `}
                >
                  <Icon name={status.icon as any} className="w-4 h-4" />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Icon name="calendar" className="w-4 h-4" />
                  {formatDateShort(recap.eventDate)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="map-pin" className="w-4 h-4" />
                  {recap.venueName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="user" className="w-4 h-4" />
                  {recap.fieldManagerName}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Submitted {formatDate(recap.submittedAt)}
              </div>

              {/* Approval/Rejection Info */}
              {recap.status === 'approved' && recap.approvedByName && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <Icon name="check-circle" className="w-4 h-4" />
                  Approved by {recap.approvedByName} on {formatDate(recap.approvedAt!)}
                </div>
              )}

              {recap.status === 'rejected' && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                    <Icon name="x-circle" className="w-4 h-4" />
                    Rejection Reason
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {recap.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Icon name="x" className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Icon name="info" className="w-5 h-5 text-primary-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Client:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {recap.clientName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Program:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {recap.programName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Indoor/Outdoor:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {recap.indoorOutdoor}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">QR Scans:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {recap.qrScans}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Surveys:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {recap.surveysCollected}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-600 dark:text-gray-400 block mb-1">
                  Footprint Description:
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                  {recap.footprintDescription}
                </p>
              </div>
            </div>

            {/* Client Metrics */}
            {Object.keys(recap.clientMetrics).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Icon name="trending-up" className="w-5 h-5 text-primary-600" />
                  Client Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(recap.clientMetrics).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premiums Distributed */}
            {recap.premiums && recap.premiums.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Icon name="gift" className="w-5 h-5 text-primary-600" />
                  Premiums Distributed
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Type</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Distributed</th>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recap.premiums.map((premium, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100 capitalize">
                            {premium.premiumType}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {premium.quantityDistributed}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {premium.quantityRemaining || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Icon name="message-square" className="w-5 h-5 text-primary-600" />
                Event Feedback
              </h3>
              <div className="space-y-3 text-sm">
                {recap.eventFeedback.baPerformance && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                      BA Performance:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                      {recap.eventFeedback.baPerformance}
                    </p>
                  </div>
                )}
                {recap.eventFeedback.salesTeam && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                      Sales Team:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                      {recap.eventFeedback.salesTeam}
                    </p>
                  </div>
                )}
                {recap.eventFeedback.customerComments && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                      Customer Comments:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                      {recap.eventFeedback.customerComments}
                    </p>
                  </div>
                )}
                {recap.eventFeedback.trafficFlow && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                      Traffic Flow:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                      {recap.eventFeedback.trafficFlow}
                    </p>
                  </div>
                )}
                {recap.eventFeedback.attendeeDemographics && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                      Attendee Demographics:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                      {recap.eventFeedback.attendeeDemographics}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Would Return:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {recap.eventFeedback.wouldReturn ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Photos */}
            {recap.photos.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Icon name="camera" className="w-5 h-5 text-primary-600" />
                  Event Photos ({recap.photos.length})
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {recap.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxPhoto(photo.url)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Additional Comments */}
            {recap.additionalComments && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Icon name="file-text" className="w-5 h-5 text-primary-600" />
                  Additional Comments
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                  {recap.additionalComments}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {recap.status === 'pending' && (onApprove || onReject) && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {onReject && (
                <Button
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                >
                  <Icon name="x-circle" className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
              {onApprove && (
                <Button
                  variant="primary"
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing}
                >
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}
            </div>
          )}

          {recap.status !== 'pending' && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Lightbox for photos */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <img
            src={lightboxPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setLightboxPhoto(null)}
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Reject Recap
            </h3>
            <Textarea
              label="Rejection Reason"
              id="rejectionReason"
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this recap is being rejected..."
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing}
              >
                {isProcessing ? 'Rejecting...' : 'Reject Recap'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Approve Confirm Modal */}
      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve Recap?"
        message="This will approve the recap and sync data to MOMO BI."
        confirmText="Approve"
        variant="info"
        confirmButtonVariant="primary"
        isLoading={isProcessing}
      />
    </>
  );
};
