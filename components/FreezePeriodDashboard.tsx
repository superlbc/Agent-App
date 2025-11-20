// ============================================================================
// FREEZE PERIOD DASHBOARD COMPONENT
// ============================================================================
// Monitor and manage employees affected by active freeze periods
// Generate bulk emails for password resets and account terminations

import React, { useState, useMemo } from 'react';
import { FreezePeriod, PreHire, Employee, FreezePeriodNotification } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import {
  isInAnyFreezePeriod,
  getActiveFreezePeriod,
  generateStartDateEmail,
  generateEndDateEmail,
  generateMailtoLink,
  copyEmailToClipboard,
} from '../utils/freezePeriodEmail';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FreezePeriodDashboardProps {
  freezePeriods: FreezePeriod[];
  preHires: PreHire[];
  employees: Employee[];
  notifications: FreezePeriodNotification[];
  onGenerateEmail: (notification: FreezePeriodNotification) => void;
  onGenerateBulkEmails: (notifications: FreezePeriodNotification[]) => void;
  onMarkEmailSent: (notificationId: string) => void;
  onClose: () => void;
}

type FilterStatus = 'all' | 'pending' | 'sent' | 'failed';
type FilterAction = 'all' | 'start' | 'end';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysUntil = (date: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusBadgeColor = (status: FreezePeriodNotification['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'sent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const FreezePeriodDashboard: React.FC<FreezePeriodDashboardProps> = ({
  freezePeriods,
  preHires,
  employees,
  notifications,
  onGenerateEmail,
  onGenerateBulkEmails,
  onMarkEmailSent,
  onClose,
}) => {
  // State
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterAction, setFilterAction] = useState<FilterAction>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  // Get active freeze periods
  const activePeriods = useMemo(() => {
    return freezePeriods.filter((p) => p.isActive);
  }, [freezePeriods]);

  // Get employees starting during freeze periods
  const employeesStartingInFreeze = useMemo(() => {
    return preHires.filter((ph) => {
      if (ph.status !== 'accepted') return false;
      return isInAnyFreezePeriod(ph.startDate, activePeriods);
    });
  }, [preHires, activePeriods]);

  // Get employees ending during freeze periods
  const employeesEndingInFreeze = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.endDate) return false;
      return isInAnyFreezePeriod(emp.endDate, activePeriods);
    });
  }, [employees, activePeriods]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((n) => n.status === filterStatus);
    }

    // Filter by action type
    if (filterAction !== 'all') {
      filtered = filtered.filter((n) => n.actionType === filterAction);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((n) => {
        return (
          n.employeeName.toLowerCase().includes(query) ||
          n.employeeEmail.toLowerCase().includes(query)
        );
      });
    }

    // Sort by action date (ascending)
    return filtered.sort((a, b) => a.actionDate.getTime() - b.actionDate.getTime());
  }, [notifications, filterStatus, filterAction, searchQuery]);

  // Pending notifications
  const pendingNotifications = useMemo(() => {
    return filteredNotifications.filter((n) => n.status === 'pending');
  }, [filteredNotifications]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const upcomingStart = employeesStartingInFreeze.filter((ph) => ph.startDate >= today).length;
    const upcomingEnd = employeesEndingInFreeze.filter((emp) => emp.endDate! >= today).length;
    const pending = notifications.filter((n) => n.status === 'pending').length;
    const sent = notifications.filter((n) => n.status === 'sent').length;
    const failed = notifications.filter((n) => n.status === 'failed').length;

    return {
      activePeriods: activePeriods.length,
      upcomingStarts: upcomingStart,
      upcomingEnds: upcomingEnd,
      pendingEmails: pending,
      sentEmails: sent,
      failedEmails: failed,
    };
  }, [activePeriods, employeesStartingInFreeze, employeesEndingInFreeze, notifications]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleSelection = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === pendingNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(pendingNotifications.map((n) => n.id)));
    }
  };

  const handleGenerateSingleEmail = async (notification: FreezePeriodNotification) => {
    const freezePeriod = getActiveFreezePeriod(notification.actionDate, activePeriods);
    if (!freezePeriod) {
      alert('No active freeze period found for this date');
      return;
    }

    if (notification.actionType === 'start') {
      const preHire = preHires.find((ph) => ph.id === notification.employeeId);
      if (!preHire) {
        alert('Pre-hire record not found');
        return;
      }
      const email = generateStartDateEmail(preHire, freezePeriod);
      const mailtoLink = generateMailtoLink(email);
      window.location.href = mailtoLink;
    } else {
      const employee = employees.find((emp) => emp.id === notification.employeeId);
      if (!employee) {
        alert('Employee record not found');
        return;
      }
      const email = generateEndDateEmail(employee, freezePeriod);
      const mailtoLink = generateMailtoLink(email);
      window.location.href = mailtoLink;
    }

    onMarkEmailSent(notification.id);
  };

  const handleGenerateBulkEmails = () => {
    const selected = pendingNotifications.filter((n) => selectedNotifications.has(n.id));
    if (selected.length === 0) {
      alert('No notifications selected');
      return;
    }
    onGenerateBulkEmails(selected);
  };

  const handleCopyEmail = async (notification: FreezePeriodNotification) => {
    const freezePeriod = getActiveFreezePeriod(notification.actionDate, activePeriods);
    if (!freezePeriod) {
      alert('No active freeze period found for this date');
      return;
    }

    if (notification.actionType === 'start') {
      const preHire = preHires.find((ph) => ph.id === notification.employeeId);
      if (!preHire) return;
      const email = generateStartDateEmail(preHire, freezePeriod);
      await copyEmailToClipboard(email);
      alert('Email copied to clipboard!');
    } else {
      const employee = employees.find((emp) => emp.id === notification.employeeId);
      if (!employee) return;
      const email = generateEndDateEmail(employee, freezePeriod);
      await copyEmailToClipboard(email);
      alert('Email copied to clipboard!');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icon name="calendar" className="w-6 h-6" />
                Freeze Period Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor employees affected by freeze periods and manage automated notifications
              </p>
            </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Active Periods</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activePeriods}</div>
            </Card>
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-900 dark:text-green-200 mb-1">Upcoming Starts</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.upcomingStarts}</div>
            </Card>
            <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="text-xs font-medium text-orange-900 dark:text-orange-200 mb-1">Upcoming Ends</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.upcomingEnds}</div>
            </Card>
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-xs font-medium text-yellow-900 dark:text-yellow-200 mb-1">Pending Emails</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingEmails}</div>
            </Card>
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-900 dark:text-green-200 mb-1">Sent Emails</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.sentEmails}</div>
            </Card>
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">Failed Emails</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failedEmails}</div>
            </Card>
          </div>

          {/* Active Freeze Periods */}
          {activePeriods.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Active Freeze Periods</h3>
              <div className="space-y-2">
                {activePeriods.map((period) => {
                  const daysUntilStart = getDaysUntil(period.startDate);
                  const daysUntilEnd = getDaysUntil(period.endDate);
                  const isCurrentlyActive = new Date() >= period.startDate && new Date() <= period.endDate;

                  return (
                    <Card
                      key={period.id}
                      className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => setExpandedPeriod(expandedPeriod === period.id ? null : period.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{period.name}</h4>
                            {isCurrentlyActive && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                                IN PROGRESS
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                            {daysUntilStart > 0 && <span className="ml-2">Starts in {daysUntilStart} days</span>}
                            {daysUntilEnd > 0 && daysUntilStart <= 0 && <span className="ml-2">Ends in {daysUntilEnd} days</span>}
                          </div>
                        </div>
                        <Icon
                          name="chevron-down"
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedPeriod === period.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded Details */}
                      {expandedPeriod === period.id && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Auto-email:</span>
                              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                {period.autoEmailEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Helix Email:</span>
                              <span className="ml-2 text-gray-900 dark:text-white font-medium">{period.helixEmail}</span>
                            </div>
                          </div>
                          {period.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{period.description}</p>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Filter */}
              <div>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value as FilterAction)}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="all">All Actions</option>
                  <option value="start">Start Dates Only</option>
                  <option value="end">End Dates Only</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {pendingNotifications.length > 0 && (
            <div className="mb-6 flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === pendingNotifications.length && pendingNotifications.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedNotifications.size} of {pendingNotifications.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateBulkEmails}
                  disabled={selectedNotifications.size === 0}
                >
                  <Icon name="mail" className="w-4 h-4 mr-2" />
                  Generate {selectedNotifications.size} Email{selectedNotifications.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scheduled Notifications ({filteredNotifications.length})
            </h3>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="calendar" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notifications Found</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery || filterStatus !== 'all' || filterAction !== 'all'
                    ? 'Try adjusting your filters'
                    : 'There are no scheduled notifications for active freeze periods'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const daysUntil = getDaysUntil(notification.actionDate);
                  const isOverdue = daysUntil < 0;
                  const isToday = daysUntil === 0;
                  const isSelected = selectedNotifications.has(notification.id);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-colors ${
                        isOverdue
                          ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isToday
                          ? 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-l-4 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        {notification.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelection(notification.id)}
                            className="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                          />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {notification.employeeName}
                                </h4>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadgeColor(notification.status)}`}>
                                  {notification.status.toUpperCase()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    notification.actionType === 'start'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                  }`}
                                >
                                  {notification.actionType === 'start' ? 'START' : 'END'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{formatDate(notification.actionDate)}</span>
                                {daysUntil >= 0 && <span className="ml-2">({daysUntil === 0 ? 'Today' : `in ${daysUntil} days`})</span>}
                                {daysUntil < 0 && <span className="ml-2 text-red-600 dark:text-red-400">(Overdue by {Math.abs(daysUntil)} days)</span>}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{notification.employeeEmail}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            {notification.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateSingleEmail(notification)}>
                                  <Icon name="mail" className="w-4 h-4 mr-1" />
                                  Send Email
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCopyEmail(notification)}>
                                  <Icon name="copy" className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </>
                            )}
                            {notification.status === 'sent' && notification.emailSentDate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Sent on {formatDate(notification.emailSentDate)}
                                {notification.emailSentBy && ` by ${notification.emailSentBy}`}
                              </span>
                            )}
                            {notification.status === 'failed' && notification.failureReason && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Failed: {notification.failureReason}
                              </span>
                            )}
                            {notification.helixTicketId && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Ticket: {notification.helixTicketId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
