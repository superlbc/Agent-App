// ============================================================================
// REFRESH NOTIFICATIONS COMPONENT
// ============================================================================
// Phase 9: Hardware Refresh Calendar - Notification center for upcoming refreshes

import React, { useState, useMemo } from 'react';
import { RefreshSchedule } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import {
  generateRefreshNotifications,
  getDaysUntilRefresh,
  formatDate,
  formatCurrency,
} from '../services/refreshService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RefreshNotificationsProps {
  schedules: RefreshSchedule[];
  onSendNotification?: (schedule: RefreshSchedule) => void;
  onMarkAsNotified?: (scheduleId: string) => void;
  onScheduleClick?: (schedule: RefreshSchedule) => void;
  className?: string;
}

type FilterMode = 'all' | 'notified' | 'pending';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get urgency level based on days until refresh
 */
const getUrgencyLevel = (daysUntil: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (daysUntil <= 0) return 'critical';
  if (daysUntil <= 30) return 'high';
  if (daysUntil <= 60) return 'medium';
  return 'low';
};

/**
 * Get urgency color class
 */
const getUrgencyColorClass = (urgency: string): string => {
  const colorMap: Record<string, string> = {
    critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
    high: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    low: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  };
  return colorMap[urgency] || colorMap.low;
};

/**
 * Get urgency badge label
 */
const getUrgencyLabel = (daysUntil: number): string => {
  if (daysUntil <= 0) return 'OVERDUE';
  if (daysUntil <= 30) return 'URGENT';
  if (daysUntil <= 60) return 'SOON';
  return 'UPCOMING';
};

/**
 * Generate email content for notification
 */
const generateEmailContent = (schedule: RefreshSchedule): { subject: string; body: string } => {
  const daysUntil = getDaysUntilRefresh(schedule);
  const subject = `Hardware Refresh: ${schedule.hardwareModel} - ${schedule.employeeName}`;

  const body = `Hi ${schedule.employeeName},

This is a reminder that your ${schedule.hardwareModel} is eligible for refresh in ${daysUntil} days (${formatDate(schedule.refreshEligibilityDate)}).

Hardware Details:
- Type: ${schedule.hardwareType}
- Model: ${schedule.hardwareModel}
- Assigned Date: ${formatDate(schedule.assignedDate)}
- Refresh Cycle: ${schedule.refreshCycleYears} years
- Eligibility Date: ${formatDate(schedule.refreshEligibilityDate)}
- Estimated Cost: ${formatCurrency(schedule.estimatedRefreshCost)}

To request a refresh, please contact IT or submit a ticket through Helix.

If you have any questions, please reach out to the IT department.

Thank you,
IT Department`;

  return { subject, body };
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RefreshNotifications: React.FC<RefreshNotificationsProps> = ({
  schedules,
  onSendNotification,
  onMarkAsNotified,
  onScheduleClick,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [filterMode, setFilterMode] = useState<FilterMode>('pending');
  const [advanceMonths, setAdvanceMonths] = useState(4);
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  const notificationsDue = useMemo(
    () => generateRefreshNotifications(schedules, advanceMonths),
    [schedules, advanceMonths]
  );

  const filteredSchedules = useMemo(() => {
    if (filterMode === 'all') {
      return notificationsDue;
    } else if (filterMode === 'notified') {
      return notificationsDue.filter(s => s.notificationSent);
    } else {
      return notificationsDue.filter(s => !s.notificationSent);
    }
  }, [notificationsDue, filterMode]);

  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      const daysA = getDaysUntilRefresh(a);
      const daysB = getDaysUntilRefresh(b);
      return daysA - daysB; // Sort by urgency (soonest first)
    });
  }, [filteredSchedules]);

  const pendingCount = useMemo(
    () => notificationsDue.filter(s => !s.notificationSent).length,
    [notificationsDue]
  );

  const notifiedCount = useMemo(
    () => notificationsDue.filter(s => s.notificationSent).length,
    [notificationsDue]
  );

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const toggleSelection = (scheduleId: string) => {
    const newSelection = new Set(selectedSchedules);
    if (newSelection.has(scheduleId)) {
      newSelection.delete(scheduleId);
    } else {
      newSelection.add(scheduleId);
    }
    setSelectedSchedules(newSelection);
  };

  const selectAll = () => {
    const allIds = sortedSchedules.map(s => s.id);
    setSelectedSchedules(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedSchedules(new Set());
  };

  // ============================================================================
  // NOTIFICATION ACTIONS
  // ============================================================================

  const handleSendNotification = (schedule: RefreshSchedule) => {
    const { subject, body } = generateEmailContent(schedule);
    const mailtoLink = `mailto:${schedule.employeeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    onSendNotification?.(schedule);
  };

  const handleSendBulk = () => {
    const selected = sortedSchedules.filter(s => selectedSchedules.has(s.id));
    selected.forEach(schedule => {
      handleSendNotification(schedule);
    });
    deselectAll();
  };

  const handleMarkAsNotified = (scheduleId: string) => {
    onMarkAsNotified?.(scheduleId);
  };

  const handleMarkBulkAsNotified = () => {
    selectedSchedules.forEach(scheduleId => {
      onMarkAsNotified?.(scheduleId);
    });
    deselectAll();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Refresh Notifications
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upcoming hardware refreshes requiring notification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Advance notice:</label>
            <select
              value={advanceMonths}
              onChange={(e) => setAdvanceMonths(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value={3}>3 months</option>
              <option value={4}>4 months</option>
              <option value={6}>6 months</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Due</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {notificationsDue.length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {pendingCount}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Notified</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {notifiedCount}
            </div>
          </Card>
        </div>
      </div>

      {/* Filter & Bulk Actions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={filterMode === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterMode('all')}
              className="!px-3 !py-1"
            >
              All ({notificationsDue.length})
            </Button>
            <Button
              variant={filterMode === 'pending' ? 'primary' : 'outline'}
              onClick={() => setFilterMode('pending')}
              className="!px-3 !py-1"
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filterMode === 'notified' ? 'primary' : 'outline'}
              onClick={() => setFilterMode('notified')}
              className="!px-3 !py-1"
            >
              Notified ({notifiedCount})
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedSchedules.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedSchedules.size} selected
              </span>
              <Button variant="outline" onClick={handleSendBulk} className="!px-3 !py-1">
                <Icon name="mail" className="w-4 h-4 mr-1" />
                Send Bulk
              </Button>
              <Button variant="outline" onClick={handleMarkBulkAsNotified} className="!px-3 !py-1">
                <Icon name="check" className="w-4 h-4 mr-1" />
                Mark Notified
              </Button>
              <Button variant="outline" onClick={deselectAll} className="!px-3 !py-1">
                Clear
              </Button>
            </div>
          )}

          {/* Select All */}
          {selectedSchedules.size === 0 && sortedSchedules.length > 0 && (
            <Button variant="outline" onClick={selectAll} className="!px-3 !py-1">
              Select All
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-auto p-4">
        {sortedSchedules.length > 0 ? (
          <div className="space-y-3">
            {sortedSchedules.map(schedule => {
              const daysUntil = getDaysUntilRefresh(schedule);
              const urgency = getUrgencyLevel(daysUntil);
              const urgencyLabel = getUrgencyLabel(daysUntil);
              const isSelected = selectedSchedules.has(schedule.id);

              return (
                <Card
                  key={schedule.id}
                  className={`p-4 border-2 ${getUrgencyColorClass(urgency)} ${
                    isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(schedule.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-current/10">
                              {urgencyLabel}
                            </span>
                            {schedule.notificationSent && (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Icon name="check" className="w-3 h-3 inline mr-1" />
                                Notified
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-semibold truncate">
                            {schedule.hardwareModel}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.employeeName} • {schedule.employeeEmail}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold">
                            {daysUntil > 0 ? daysUntil : '0'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            days {daysUntil > 0 ? 'until' : 'overdue'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span>Eligibility: {formatDate(schedule.refreshEligibilityDate)}</span>
                        <span>Cost: {formatCurrency(schedule.estimatedRefreshCost)}</span>
                        <span className="capitalize">{schedule.hardwareType}</span>
                      </div>

                      {schedule.notificationSentDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Notified on {formatDate(schedule.notificationSentDate)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!schedule.notificationSent ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleSendNotification(schedule)}
                            className="!px-3 !py-1 text-xs"
                          >
                            <Icon name="mail" className="w-3 h-3 mr-1" />
                            Send Email
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleMarkAsNotified(schedule.id)}
                            className="!px-3 !py-1 text-xs"
                          >
                            Mark Sent
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleSendNotification(schedule)}
                          className="!px-3 !py-1 text-xs"
                        >
                          <Icon name="mail" className="w-3 h-3 mr-1" />
                          Resend
                        </Button>
                      )}
                      {onScheduleClick && (
                        <Button
                          variant="ghost"
                          onClick={() => onScheduleClick(schedule)}
                          className="!px-3 !py-1 text-xs"
                        >
                          <Icon name="eye" className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-12">
            <Icon name="bell-off" className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No notifications due</p>
            <p className="text-sm mt-1">
              {filterMode === 'pending'
                ? 'All upcoming refreshes have been notified'
                : filterMode === 'notified'
                ? 'No notifications have been sent yet'
                : 'No refresh schedules are approaching within the advance notice period'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
