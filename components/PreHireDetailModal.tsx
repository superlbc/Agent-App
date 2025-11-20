// ============================================================================
// PRE-HIRE DETAIL MODAL COMPONENT
// ============================================================================
// Full-screen modal showing detailed pre-hire information with actions

import React from 'react';
import { PreHire } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { StatusBadge } from './ui/StatusBadge';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireDetailModalProps {
  preHire: PreHire;
  onEdit: (preHire: PreHire) => void;
  onDelete: (preHire: PreHire) => void;
  onClose: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
};

const getStatusInfo = (status: PreHire['status']) => {
  switch (status) {
    case 'candidate':
      return {
        label: 'Candidate',
        description: 'Interview stage',
        variant: 'default' as const,
      };
    case 'offered':
      return {
        label: 'Offered',
        description: 'Offer extended, awaiting acceptance',
        variant: 'info' as const,
      };
    case 'accepted':
      return {
        label: 'Accepted',
        description: 'Offer accepted, preparing for start',
        variant: 'success' as const,
      };
    case 'linked':
      return {
        label: 'Linked',
        description: 'Linked to employee record',
        variant: 'success' as const,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        description: 'Offer withdrawn or declined',
        variant: 'error' as const,
      };
    default:
      return {
        label: status,
        description: '',
        variant: 'default' as const,
      };
  }
};

const isInFreezePeriod = (date: Date): boolean => {
  const startDate = new Date(date);
  const month = startDate.getMonth() + 1; // 0-indexed
  const day = startDate.getDate();

  // Nov 1 - Jan 5
  return (month === 11) || (month === 12) || (month === 1 && day <= 5);
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PreHireDetailModal: React.FC<PreHireDetailModalProps> = ({
  preHire,
  onEdit,
  onDelete,
  onClose,
}) => {
  const statusInfo = getStatusInfo(preHire.status);
  const freezePeriod = isInFreezePeriod(preHire.startDate);

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
                    {preHire.candidateName}
                  </h2>
                  <StatusBadge status={preHire.status} label={statusInfo.label} />
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {preHire.role} • {preHire.department}
                </p>
                {preHire.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {preHire.email}
                  </p>
                )}
              </div>

              <Button variant="outline" onClick={onClose}>
                <Icon name="x" className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {statusInfo.description}
            </p>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Onboarding Timeline */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Onboarding Timeline
                </h3>

                <div className="relative">
                  {/* Timeline Container */}
                  <div className="flex items-start justify-between">
                    {/* Milestone 1: Pre-hire Created */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 flex items-center justify-center mb-2">
                        <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Created</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {formatDateTime(preHire.createdDate)}
                      </p>
                    </div>

                    {/* Connector Line 1 */}
                    <div className={`flex-1 h-0.5 mt-5 ${['offered', 'accepted', 'linked'].includes(preHire.status) ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />

                    {/* Milestone 2: Offer Extended */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        ['offered', 'accepted', 'linked'].includes(preHire.status)
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                        {['offered', 'accepted', 'linked'].includes(preHire.status) ? (
                          <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon name="document" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Offered</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {['offered', 'accepted', 'linked'].includes(preHire.status) ? 'Complete' : 'Pending'}
                      </p>
                    </div>

                    {/* Connector Line 2 */}
                    <div className={`flex-1 h-0.5 mt-5 ${['accepted', 'linked'].includes(preHire.status) ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />

                    {/* Milestone 3: Offer Accepted */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        ['accepted', 'linked'].includes(preHire.status)
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                        {['accepted', 'linked'].includes(preHire.status) ? (
                          <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon name="user" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Accepted</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {['accepted', 'linked'].includes(preHire.status) ? 'Complete' : 'Pending'}
                      </p>
                    </div>

                    {/* Connector Line 3 */}
                    <div className={`flex-1 h-0.5 mt-5 ${preHire.assignedPackage ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />

                    {/* Milestone 4: Package Assigned */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        preHire.assignedPackage
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                        {preHire.assignedPackage ? (
                          <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon name="package" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Package</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {preHire.assignedPackage ? 'Assigned' : 'Pending'}
                      </p>
                    </div>

                    {/* Connector Line 4 */}
                    <div className={`flex-1 h-0.5 mt-5 ${preHire.linkedEmployeeId ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />

                    {/* Milestone 5: Systems Linked */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        preHire.linkedEmployeeId
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                        {preHire.linkedEmployeeId ? (
                          <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon name="settings" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Systems</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {preHire.linkedEmployeeId ? 'Linked' : 'Pending'}
                      </p>
                    </div>

                    {/* Connector Line 5 */}
                    <div className={`flex-1 h-0.5 mt-5 ${new Date(preHire.startDate) <= new Date() ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />

                    {/* Milestone 6: Start Date */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        new Date(preHire.startDate) <= new Date()
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                      }`}>
                        {new Date(preHire.startDate) <= new Date() ? (
                          <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon name="calendar" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white text-center">Start Date</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {formatDate(preHire.startDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Basic Information */}
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Pre-hire Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pre-hire ID:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {preHire.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hiring Manager:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {preHire.hiringManager}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(preHire.startDate)}
                      </p>
                      {freezePeriod && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded">
                          <Icon name="alert" className="w-3 h-3" />
                          Freeze Period
                        </span>
                      )}
                    </div>
                  </div>
                  {preHire.linkedEmployeeId && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Linked Employee ID:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {preHire.linkedEmployeeId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Package Assignment */}
            {preHire.assignedPackage && (
              <Card>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assigned Package
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      preHire.assignedPackage.isStandard
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                    }`}>
                      <Icon name={preHire.assignedPackage.isStandard ? 'check' : 'alert'} className="w-3 h-3" />
                      {preHire.assignedPackage.isStandard ? 'Standard' : 'Exception'}
                    </span>
                  </div>

                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {preHire.assignedPackage.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preHire.assignedPackage.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hardware Items:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {preHire.assignedPackage.hardware.length} items
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Software & Licenses:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {preHire.assignedPackage.software.length + preHire.assignedPackage.licenses.length} items
                      </p>
                    </div>
                  </div>

                  {/* Hardware List */}
                  {preHire.assignedPackage.hardware.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hardware:</p>
                      <div className="space-y-1">
                        {preHire.assignedPackage.hardware.map((hw) => (
                          <div key={hw.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="monitor" className="w-4 h-4" />
                            <span>{hw.manufacturer} {hw.model}</span>
                            {hw.cost && <span className="text-xs text-gray-500">(${hw.cost.toFixed(2)})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Software List */}
                  {(preHire.assignedPackage.software.length > 0 || preHire.assignedPackage.licenses.length > 0) && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Software & Licenses:</p>
                      <div className="space-y-1">
                        {[...preHire.assignedPackage.software, ...preHire.assignedPackage.licenses].map((sw) => (
                          <div key={sw.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="package" className="w-4 h-4" />
                            <span>{sw.name}</span>
                            {sw.cost && sw.renewalFrequency && (
                              <span className="text-xs text-gray-500">
                                (${sw.cost.toFixed(2)}/{sw.renewalFrequency === 'monthly' ? 'mo' : 'yr'})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Package Customizations */}
            {preHire.customizations && (
              <Card>
                <div className="p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Package Customizations
                  </h3>

                  {preHire.customizations.reason && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {preHire.customizations.reason}
                      </p>
                    </div>
                  )}

                  {preHire.customizations.addedHardware && preHire.customizations.addedHardware.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        ✓ Added Hardware ({preHire.customizations.addedHardware.length}):
                      </p>
                      <div className="space-y-1 ml-4">
                        {preHire.customizations.addedHardware.map((hw) => (
                          <div key={hw.id} className="text-sm text-gray-600 dark:text-gray-400">
                            • {hw.manufacturer} {hw.model}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preHire.customizations.removedHardware && preHire.customizations.removedHardware.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                        ✗ Removed Hardware ({preHire.customizations.removedHardware.length}):
                      </p>
                      <div className="space-y-1 ml-4">
                        {preHire.customizations.removedHardware.map((hw) => (
                          <div key={hw.id} className="text-sm text-gray-600 dark:text-gray-400 line-through">
                            • {hw.manufacturer} {hw.model}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preHire.customizations.addedSoftware && preHire.customizations.addedSoftware.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        ✓ Added Software ({preHire.customizations.addedSoftware.length}):
                      </p>
                      <div className="space-y-1 ml-4">
                        {preHire.customizations.addedSoftware.map((sw) => (
                          <div key={sw.id} className="text-sm text-gray-600 dark:text-gray-400">
                            • {sw.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preHire.customizations.removedSoftware && preHire.customizations.removedSoftware.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                        ✗ Removed Software ({preHire.customizations.removedSoftware.length}):
                      </p>
                      <div className="space-y-1 ml-4">
                        {preHire.customizations.removedSoftware.map((sw) => (
                          <div key={sw.id} className="text-sm text-gray-600 dark:text-gray-400 line-through">
                            • {sw.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Record Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created By:</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {preHire.createdBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created Date:</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(preHire.createdDate)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Last Modified:</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(preHire.lastModified)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={onClose}>
                <Icon name="x" className="w-4 h-4 mr-2" />
                Close
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => onDelete(preHire)}>
                  <Icon name="trash" className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button variant="primary" onClick={() => onEdit(preHire)}>
                  <Icon name="edit" className="w-4 h-4 mr-2" />
                  Edit Pre-hire
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
