// ============================================================================
// RECAP APPROVAL QUEUE COMPONENT
// ============================================================================
// Business Leader approval workflow with split layout
// Features: Filters, list view, detail pane, bulk approve, approve/reject

import React, { useState, useEffect } from 'react';
import { RecapCard } from './RecapCard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
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
  status: 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedAt?: Date;
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
  additionalComments?: string;
}

interface RecapApprovalQueueProps {
  recaps: EventRecap[];
  clients: { id: string; name: string }[];
  programs: { id: string; name: string; clientId: string }[];
  fieldManagers: { id: string; name: string }[];
  onApprove: (recapId: string) => Promise<void>;
  onReject: (recapId: string, reason: string) => Promise<void>;
  onBulkApprove: (recapIds: string[]) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecapApprovalQueue: React.FC<RecapApprovalQueueProps> = ({
  recaps,
  clients,
  programs,
  fieldManagers,
  onApprove,
  onReject,
  onBulkApprove,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedRecapId, setSelectedRecapId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    clientId: '',
    programId: '',
    fieldManagerId: '',
    startDate: '',
    endDate: '',
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const filteredRecaps = recaps.filter((recap) => {
    if (recap.status !== 'pending') return false;
    if (filters.clientId && recap.clientName !== clients.find((c) => c.id === filters.clientId)?.name) return false;
    if (filters.programId && recap.programName !== programs.find((p) => p.id === filters.programId)?.name) return false;
    if (filters.fieldManagerId && recap.fieldManagerName !== fieldManagers.find((fm) => fm.id === filters.fieldManagerId)?.name) return false;
    if (filters.startDate && new Date(recap.eventDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(recap.eventDate) > new Date(filters.endDate)) return false;
    return true;
  });

  const selectedRecap = filteredRecaps.find((r) => r.id === selectedRecapId);

  // Auto-select first recap when list changes
  useEffect(() => {
    if (filteredRecaps.length > 0 && !selectedRecapId) {
      setSelectedRecapId(filteredRecaps[0].id);
    }
  }, [filteredRecaps, selectedRecapId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectRecap = (id: string) => {
    setSelectedRecapId(id);
  };

  const handleCheckboxSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRecaps.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleApprove = async () => {
    if (!selectedRecapId) return;

    setIsProcessing(true);
    try {
      await onApprove(selectedRecapId);
      setToastMessage({ type: 'success', message: 'Recap approved successfully' });
      setSelectedRecapId(null);
      setShowApproveConfirm(false);
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to approve recap' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecapId || !rejectionReason.trim()) {
      setToastMessage({ type: 'error', message: 'Rejection reason is required' });
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(selectedRecapId, rejectionReason);
      setToastMessage({ type: 'success', message: 'Recap rejected. Field Manager notified.' });
      setSelectedRecapId(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to reject recap' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      await onBulkApprove(selectedIds);
      setToastMessage({
        type: 'success',
        message: `${selectedIds.length} recaps approved successfully`,
      });
      setSelectedIds([]);
      setShowBulkConfirm(false);
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to bulk approve recaps' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Filters */}
      <Card className="m-6 mb-0 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Client"
            id="clientFilter"
            value={filters.clientId}
            onChange={(e) => setFilters({ ...filters, clientId: e.target.value, programId: '' })}
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>

          <Select
            label="Program"
            id="programFilter"
            value={filters.programId}
            onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
            disabled={!filters.clientId}
          >
            <option value="">All Programs</option>
            {programs
              .filter((p) => !filters.clientId || p.clientId === filters.clientId)
              .map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
          </Select>

          <Select
            label="Field Manager"
            id="fieldManagerFilter"
            value={filters.fieldManagerId}
            onChange={(e) => setFilters({ ...filters, fieldManagerId: e.target.value })}
          >
            <option value="">All Field Managers</option>
            {fieldManagers.map((fm) => (
              <option key={fm.id} value={fm.id}>
                {fm.name}
              </option>
            ))}
          </Select>

          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <Input
            label="End Date"
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        {/* Results count + Select all */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredRecaps.length} pending recap{filteredRecaps.length !== 1 ? 's' : ''}
          </p>
          {filteredRecaps.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredRecaps.length && filteredRecaps.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Select all</span>
            </label>
          )}
        </div>
      </Card>

      {/* Split Layout */}
      <div className="flex-1 flex gap-6 m-6 mt-4 overflow-hidden">
        {/* Recap List (Left 40%) */}
        <div className="w-2/5 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredRecaps.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="inbox" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                  No pending recaps
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  All recaps have been processed or filtered out
                </p>
              </Card>
            ) : (
              filteredRecaps.map((recap) => (
                <RecapCard
                  key={recap.id}
                  recap={{
                    ...recap,
                    photosCount: recap.photos.length,
                  }}
                  showCheckbox={true}
                  isSelected={selectedIds.includes(recap.id)}
                  onSelect={handleCheckboxSelect}
                  onClick={handleSelectRecap}
                  isHighlighted={selectedRecapId === recap.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Recap Detail (Right 60%) */}
        <div className="flex-1 overflow-hidden">
          {selectedRecap ? (
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedRecap.eventName}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatDate(selectedRecap.eventDate)}</span>
                  <span>•</span>
                  <span>{selectedRecap.venueName}</span>
                  <span>•</span>
                  <span>Submitted by {selectedRecap.fieldManagerName}</span>
                </div>
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
                      <span className="text-gray-600 dark:text-gray-400">Indoor/Outdoor:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {selectedRecap.indoorOutdoor}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">QR Scans:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedRecap.qrScans}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Surveys:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedRecap.surveysCollected}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">
                      Footprint Description:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedRecap.footprintDescription}
                    </p>
                  </div>
                </div>

                {/* Client Metrics */}
                {Object.keys(selectedRecap.clientMetrics).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Icon name="trending-up" className="w-5 h-5 text-primary-600" />
                      Client Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedRecap.clientMetrics).map(([key, value]) => (
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

                {/* Feedback */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Icon name="message-square" className="w-5 h-5 text-primary-600" />
                    Event Feedback
                  </h3>
                  <div className="space-y-3 text-sm">
                    {selectedRecap.eventFeedback.baPerformance && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">
                          BA Performance:
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {selectedRecap.eventFeedback.baPerformance}
                        </p>
                      </div>
                    )}
                    {selectedRecap.eventFeedback.customerComments && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">
                          Customer Comments:
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {selectedRecap.eventFeedback.customerComments}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Would Return:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedRecap.eventFeedback.wouldReturn ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                {selectedRecap.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Icon name="camera" className="w-5 h-5 text-primary-600" />
                      Event Photos ({selectedRecap.photos.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedRecap.photos.map((photo) => (
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
                {selectedRecap.additionalComments && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Icon name="file-text" className="w-5 h-5 text-primary-600" />
                      Additional Comments
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedRecap.additionalComments}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <Button
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                >
                  <Icon name="x-circle" className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing}
                >
                  <Icon name="check-circle" className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <Icon name="inbox" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a recap to view details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {selectedIds.length} recap{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setSelectedIds([])} size="sm">
                Clear Selection
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowBulkConfirm(true)}
                disabled={isProcessing}
              >
                <Icon name="check-circle" className="w-4 h-4 mr-2" />
                Bulk Approve {selectedIds.length} Recap{selectedIds.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for photos */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

      {/* Bulk Approve Confirm Modal */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkApprove}
        title={`Approve ${selectedIds.length} Recaps?`}
        message={`Are you sure you want to approve ${selectedIds.length} recaps? This will sync all data to MOMO BI.`}
        confirmText={`Approve ${selectedIds.length} Recaps`}
        variant="info"
        confirmButtonVariant="primary"
        isLoading={isProcessing}
      />
    </div>
  );
};
