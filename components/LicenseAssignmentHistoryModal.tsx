// ============================================================================
// LICENSE ASSIGNMENT HISTORY MODAL COMPONENT
// ============================================================================
// Modal for viewing complete audit trail of a license assignment
// Shows all historical actions: assigned, renewed, revoked, expired

import React, { useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useLicense } from '../contexts/LicenseContext';
import type { LicenseAssignmentHistory, LicenseAssignment, Software, LicensePool } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicenseAssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LicenseAssignmentHistoryModal: React.FC<LicenseAssignmentHistoryModalProps> = ({
  isOpen,
  onClose,
  assignmentId,
}) => {
  const { getAssignmentHistory, licensePools, licenses } = useLicense();

  // Get assignment details
  const assignment = useMemo(() => {
    for (const pool of licensePools) {
      const found = pool.assignments.find((a) => a.id === assignmentId);
      if (found) {
        return { assignment: found, pool };
      }
    }
    return null;
  }, [licensePools, assignmentId]);

  // Get software details
  const software = useMemo(() => {
    if (!assignment) return null;
    return licenses.find((sw) => sw.id === assignment.pool.softwareId);
  }, [assignment, licenses]);

  // Get assignment history
  const history = useMemo(() => {
    const historyRecords = getAssignmentHistory(assignmentId);

    // Sort by date, most recent first
    return historyRecords.sort((a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }, [assignmentId, getAssignmentHistory]);

  // Get action icon
  const getActionIcon = (action: LicenseAssignmentHistory['action']): string => {
    switch (action) {
      case 'assigned':
        return 'user-check';
      case 'revoked':
        return 'x-circle';
      case 'expired':
        return 'clock';
      case 'renewed':
        return 'refresh-cw';
      default:
        return 'file';
    }
  };

  // Get action color
  const getActionColor = (action: LicenseAssignmentHistory['action']): string => {
    switch (action) {
      case 'assigned':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'revoked':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'expired':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'renewed':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Format date/time
  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Format action label
  const formatActionLabel = (action: LicenseAssignmentHistory['action']): string => {
    switch (action) {
      case 'assigned':
        return 'License Assigned';
      case 'revoked':
        return 'License Revoked';
      case 'expired':
        return 'License Expired';
      case 'renewed':
        return 'License Renewed';
      default:
        return action;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="clock" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assignment History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete audit trail of all actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assignment Details Card */}
          {assignment && software && (
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Employee</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {assignment.assignment.employeeName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {assignment.assignment.employeeEmail}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">License</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {software.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {software.vendor}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current Status</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        assignment.assignment.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : assignment.assignment.status === 'expired'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {assignment.assignment.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Assigned Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {formatDateTime(assignment.assignment.assignedDate)}
                  </p>
                </div>
              </div>

              {assignment.assignment.expirationDate && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Expiration Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {formatDateTime(assignment.assignment.expirationDate)}
                  </p>
                </div>
              )}

              {assignment.assignment.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {assignment.assignment.notes}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* History Timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="list" className="w-4 h-4" />
              Activity Timeline ({history.length} events)
            </h3>

            {history.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="clock" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No history records found for this assignment.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((record, index) => (
                  <Card key={record.id} className="p-4 relative">
                    {/* Timeline Line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -mb-3" />
                    )}

                    <div className="flex gap-4">
                      {/* Action Icon */}
                      <div className="flex-shrink-0 relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(
                            record.action
                          )}`}
                        >
                          <Icon name={getActionIcon(record.action)} className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Action Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatActionLabel(record.action)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              by {record.performedBy}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                            {formatDateTime(record.performedAt)}
                          </p>
                        </div>

                        {/* Status Change */}
                        {record.previousStatus && record.newStatus && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                record.previousStatus === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : record.previousStatus === 'expired'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {record.previousStatus}
                            </span>
                            <Icon name="arrow-right" className="w-3 h-3 text-gray-400" />
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                record.newStatus === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : record.newStatus === 'expired'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {record.newStatus}
                            </span>
                          </div>
                        )}

                        {/* Reason */}
                        {record.reason && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300">
                            <strong>Reason:</strong> {record.reason}
                          </div>
                        )}

                        {/* Notes */}
                        {record.notes && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300">
                            <strong>Notes:</strong> {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
