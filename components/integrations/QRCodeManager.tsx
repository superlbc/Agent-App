// ============================================================================
// QR CODE MANAGER COMPONENT
// ============================================================================
// QR code creation, library management, and event association

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Select } from '../ui/Select';
import { ConfirmModal } from '../ui/ConfirmModal';

// TypeScript Interfaces
export interface QRCode {
  id: string;
  qrTigerId: string;
  name: string;
  url: string;
  qrCodeImageUrl: string;
  status: 'active' | 'inactive';
  scansCount: number;
}

export interface EventQRAssociation {
  id: string;
  qrCodeId: string;
  eventId: string;
  isActive: boolean;
  scansCount: number;
}

export interface QRCodeManagerProps {
  qrCodes: QRCode[];
  events: Array<{ value: string; label: string }>;
  associations: EventQRAssociation[];
  onCreateQRCode: (name: string, url: string, status: 'active' | 'inactive') => Promise<QRCode>;
  onEditQRCode: (qrCode: QRCode) => Promise<void>;
  onDeleteQRCode: (qrCodeId: string) => Promise<void>;
  onAssociateQRCode: (qrCodeId: string, eventId: string) => Promise<void>;
  onRemoveAssociation: (associationId: string) => Promise<void>;
  onToggleAssociationActive: (associationId: string, isActive: boolean) => Promise<void>;
}

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  qrCodes,
  events,
  associations,
  onCreateQRCode,
  onEditQRCode,
  onDeleteQRCode,
  onAssociateQRCode,
  onRemoveAssociation,
  onToggleAssociationActive,
}) => {
  // State for QR Code Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrName, setQrName] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrStatus, setQrStatus] = useState<'active' | 'inactive'>('active');
  const [creating, setCreating] = useState(false);
  const [createdQRCode, setCreatedQRCode] = useState<QRCode | null>(null);

  // State for Association
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedQRCode, setSelectedQRCode] = useState('');

  // State for Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [qrToDelete, setQrToDelete] = useState<string | null>(null);

  // State for Remove Association Confirmation
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [associationToRemove, setAssociationToRemove] = useState<string | null>(null);

  // URL validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle QR Code Creation
  const handleCreateQRCode = async () => {
    if (!qrName || !qrUrl) {
      alert('Please fill in all required fields');
      return;
    }

    if (!isValidUrl(qrUrl)) {
      alert('Please enter a valid URL');
      return;
    }

    setCreating(true);
    try {
      const newQRCode = await onCreateQRCode(qrName, qrUrl, qrStatus);
      setCreatedQRCode(newQRCode);
      // Reset form
      setQrName('');
      setQrUrl('');
      setQrStatus('active');
    } catch (error) {
      console.error('Failed to create QR code:', error);
      alert('Failed to create QR code');
    } finally {
      setCreating(false);
    }
  };

  // Handle QR Code Delete
  const handleDelete = async () => {
    if (!qrToDelete) return;
    try {
      await onDeleteQRCode(qrToDelete);
      setQrToDelete(null);
    } catch (error) {
      console.error('Failed to delete QR code:', error);
      alert('Failed to delete QR code');
    }
  };

  // Handle Association
  const handleAssociate = async () => {
    if (!selectedQRCode || !selectedEvent) {
      alert('Please select both a QR code and an event');
      return;
    }

    // Validate: Only one event per QR code can be active
    const activeAssociations = associations.filter(
      (assoc) => assoc.qrCodeId === selectedQRCode && assoc.isActive
    );

    if (activeAssociations.length > 0) {
      alert('This QR code already has an active event association. Please deactivate it first.');
      return;
    }

    try {
      await onAssociateQRCode(selectedQRCode, selectedEvent);
      setSelectedQRCode('');
      setSelectedEvent('');
    } catch (error) {
      console.error('Failed to associate QR code:', error);
      alert('Failed to associate QR code with event');
    }
  };

  // Handle Remove Association
  const handleRemoveAssociation = async () => {
    if (!associationToRemove) return;
    try {
      await onRemoveAssociation(associationToRemove);
      setAssociationToRemove(null);
    } catch (error) {
      console.error('Failed to remove association:', error);
      alert('Failed to remove association');
    }
  };

  // Get QR code by ID
  const getQRCodeById = (id: string) => qrCodes.find((qr) => qr.id === id);

  // Get event label by ID
  const getEventLabel = (eventId: string) => events.find((e) => e.value === eventId)?.label || eventId;

  // Active QR codes only
  const activeQRCodes = qrCodes.filter((qr) => qr.status === 'active');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR Code Library (Left 50%) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            QR Code Library
          </h3>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Icon name="add" className="w-4 h-4 mr-2" />
            New QR Code
          </Button>
        </div>

        {/* QR Code List (Table) */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scans
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {qrCodes.map((qr) => (
                <tr key={qr.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <img
                      src={qr.qrCodeImageUrl}
                      alt={qr.name}
                      className="w-12 h-12 rounded"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {qr.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {qr.url}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        qr.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {qr.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {qr.scansCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          /* Open edit modal */
                        }}
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQrToDelete(qr.id);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {qrCodes.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No QR codes yet. Create one to get started.
            </div>
          )}
        </div>
      </Card>

      {/* Event Association (Right 50%) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Event Association
        </h3>

        {/* Association Form */}
        <div className="space-y-4 mb-6">
          <Select
            label="Select Event"
            id="event-select"
            options={events}
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          />

          <Select
            label="Select QR Code"
            id="qr-select"
            options={activeQRCodes.map((qr) => ({ value: qr.id, label: qr.name }))}
            value={selectedQRCode}
            onChange={(e) => setSelectedQRCode(e.target.value)}
          />

          <Button variant="primary" onClick={handleAssociate} disabled={!selectedEvent || !selectedQRCode}>
            <Icon name="link" className="w-4 h-4 mr-2" />
            Associate
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: Only one event per QR code can be active at a time.
          </p>
        </div>

        {/* Current Associations */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Current Associations
          </h4>

          {associations.length > 0 ? (
            <div className="space-y-3">
              {associations.map((assoc) => {
                const qrCode = getQRCodeById(assoc.qrCodeId);
                return (
                  <div
                    key={assoc.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {qrCode?.name || 'Unknown QR Code'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Event: {getEventLabel(assoc.eventId)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Scans: {assoc.scansCount.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAssociationToRemove(assoc.id);
                          setShowRemoveConfirm(true);
                        }}
                      >
                        <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>

                    {/* Active toggle */}
                    <ToggleSwitch
                      label="Active"
                      id={`active-${assoc.id}`}
                      checked={assoc.isActive}
                      onChange={(checked) => onToggleAssociationActive(assoc.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No associations yet.
            </div>
          )}
        </div>
      </Card>

      {/* QR Code Create Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => !createdQRCode && setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {createdQRCode ? 'QR Code Created!' : 'Create QR Code'}
              </h3>

              {createdQRCode ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={createdQRCode.qrCodeImageUrl}
                      alt={createdQRCode.name}
                      className="w-48 h-48 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {createdQRCode.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {createdQRCode.url}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setCreatedQRCode(null);
                      setShowCreateModal(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    label="QR Code Name"
                    id="qr-name"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    placeholder="e.g., Verizon Survey QR"
                    required
                  />

                  <Input
                    label="Destination URL"
                    id="qr-url"
                    type="url"
                    value={qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    placeholder="https://example.com/survey"
                    required
                  />

                  <ToggleSwitch
                    label="Active"
                    id="qr-status"
                    checked={qrStatus === 'active'}
                    onChange={(checked) => setQrStatus(checked ? 'active' : 'inactive')}
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleCreateQRCode}
                      disabled={creating || !qrName || !qrUrl}
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Delete QR Code Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete QR Code?"
        message="Are you sure you want to delete this QR code? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Remove Association Confirmation */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveAssociation}
        title="Remove Association?"
        message="Are you sure you want to remove this QR code association?"
        confirmText="Remove"
        variant="warning"
      />
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <QRCodeManager
 *   qrCodes={[
 *     {
 *       id: '1',
 *       qrTigerId: 'qt-12345',
 *       name: 'Verizon Survey QR',
 *       url: 'https://survey.example.com',
 *       qrCodeImageUrl: 'https://cdn.qrtiger.com/qt-12345.png',
 *       status: 'active',
 *       scansCount: 150,
 *     },
 *   ]}
 *   events={[
 *     { value: 'event-1', label: 'Verizon 5G Activation - Nov 15' },
 *   ]}
 *   associations={[
 *     {
 *       id: 'assoc-1',
 *       qrCodeId: '1',
 *       eventId: 'event-1',
 *       isActive: true,
 *       scansCount: 150,
 *     },
 *   ]}
 *   onCreateQRCode={async (name, url, status) => {
 *     const response = await fetch('/api/integrations/qrtiger/qrcodes', {
 *       method: 'POST',
 *       body: JSON.stringify({ name, url, status }),
 *     });
 *     return response.json();
 *   }}
 *   onEditQRCode={async (qrCode) => {}}
 *   onDeleteQRCode={async (qrCodeId) => {}}
 *   onAssociateQRCode={async (qrCodeId, eventId) => {}}
 *   onRemoveAssociation={async (associationId) => {}}
 *   onToggleAssociationActive={async (associationId, isActive) => {}}
 * />
 */
