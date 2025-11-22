// ============================================================================
// FREEZE PERIOD ADMIN COMPONENT
// ============================================================================
// Administrative UI for creating and managing Workday freeze periods
// Allows HR team to define custom freeze periods throughout the year

import React, { useState, useMemo } from 'react';
import { FreezePeriod } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FreezePeriodAdminProps {
  freezePeriods: FreezePeriod[];
  currentUser: { name: string; email: string };
  onCreateFreezePeriod: (period: Omit<FreezePeriod, 'id' | 'createdDate' | 'lastModified'>) => void;
  onUpdateFreezePeriod: (period: FreezePeriod) => void;
  onDeleteFreezePeriod: (periodId: string) => void;
  onClose: () => void;
}

interface FreezePeriodFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoEmailEnabled: boolean;
  startDateSubject: string;
  startDateBody: string;
  endDateSubject: string;
  endDateBody: string;
  helixEmail: string;
  ccRecipients: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

const getDaysUntil = (date: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDefaultEmailTemplates = () => ({
  startDateSubject: 'Password Reset Required - {employeeName} Starting {startDate}',
  startDateBody:
`Dear Helix Team,

{employeeName} is starting work on {startDate}.

Please reset their password and MFA and send credentials to {employeeEmail}.

Thank you,
HR Team`,
  endDateSubject: 'Account Termination - {employeeName} End Date {endDate}',
  endDateBody:
`Dear Helix Team,

{employeeName} is no longer with the company as of {endDate}.

Please reset their password and disable MFA.

Thank you,
HR Team`,
});

// ============================================================================
// COMPONENT
// ============================================================================

export const FreezePeriodAdmin: React.FC<FreezePeriodAdminProps> = ({
  freezePeriods,
  currentUser,
  onCreateFreezePeriod,
  onUpdateFreezePeriod,
  onDeleteFreezePeriod,
  onClose,
}) => {
  // State
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPeriod, setEditingPeriod] = useState<FreezePeriod | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const defaultTemplates = getDefaultEmailTemplates();
  const [formData, setFormData] = useState<FreezePeriodFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    autoEmailEnabled: false,
    startDateSubject: defaultTemplates.startDateSubject,
    startDateBody: defaultTemplates.startDateBody,
    endDateSubject: defaultTemplates.endDateSubject,
    endDateBody: defaultTemplates.endDateBody,
    helixEmail: 'helix@momentumww.com',
    ccRecipients: 'camille@momentumww.com, payton@momentumww.com',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized calculations
  const activePeriods = useMemo(() => {
    return freezePeriods.filter((p) => p.isActive);
  }, [freezePeriods]);

  const upcomingPeriods = useMemo(() => {
    const today = new Date();
    return freezePeriods.filter((p) => p.startDate > today).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [freezePeriods]);

  const pastPeriods = useMemo(() => {
    const today = new Date();
    return freezePeriods.filter((p) => p.endDate < today).sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }, [freezePeriods]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      isActive: true,
      autoEmailEnabled: false,
      startDateSubject: defaultTemplates.startDateSubject,
      startDateBody: defaultTemplates.startDateBody,
      endDateSubject: defaultTemplates.endDateSubject,
      endDateBody: defaultTemplates.endDateBody,
      helixEmail: 'helix@momentumww.com',
      ccRecipients: 'camille@momentumww.com, payton@momentumww.com',
    });
    setErrors({});
    setView('create');
  };

  const handleStartEdit = (period: FreezePeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      description: period.description || '',
      startDate: period.startDate.toISOString().split('T')[0],
      endDate: period.endDate.toISOString().split('T')[0],
      isActive: period.isActive,
      autoEmailEnabled: period.autoEmailEnabled,
      startDateSubject: period.emailTemplate.startDateSubject,
      startDateBody: period.emailTemplate.startDateBody,
      endDateSubject: period.emailTemplate.endDateSubject,
      endDateBody: period.emailTemplate.endDateBody,
      helixEmail: period.helixEmail,
      ccRecipients: period.ccRecipients.join(', '),
    });
    setErrors({});
    setView('edit');
  };

  const handleCancelEdit = () => {
    setView('list');
    setEditingPeriod(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Freeze period name is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.helixEmail.trim()) {
      newErrors.helixEmail = 'Helix email address is required';
    }
    if (formData.autoEmailEnabled) {
      if (!formData.startDateSubject.trim()) {
        newErrors.startDateSubject = 'Start date email subject is required';
      }
      if (!formData.startDateBody.trim()) {
        newErrors.startDateBody = 'Start date email body is required';
      }
      if (!formData.endDateSubject.trim()) {
        newErrors.endDateSubject = 'End date email subject is required';
      }
      if (!formData.endDateBody.trim()) {
        newErrors.endDateBody = 'End date email body is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const ccRecipientsArray = formData.ccRecipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const periodData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      isActive: formData.isActive,
      autoEmailEnabled: formData.autoEmailEnabled,
      emailTemplate: {
        startDateSubject: formData.startDateSubject.trim(),
        startDateBody: formData.startDateBody.trim(),
        endDateSubject: formData.endDateSubject.trim(),
        endDateBody: formData.endDateBody.trim(),
      },
      helixEmail: formData.helixEmail.trim(),
      ccRecipients: ccRecipientsArray,
      createdBy: currentUser.name,
      modifiedBy: currentUser.name,
    };

    if (view === 'create') {
      onCreateFreezePeriod(periodData);
      setView('list');
    } else if (view === 'edit' && editingPeriod) {
      onUpdateFreezePeriod({
        ...editingPeriod,
        ...periodData,
        lastModified: new Date(),
      });
      setView('list');
      setEditingPeriod(null);
    }
  };

  const handleDelete = (periodId: string) => {
    onDeleteFreezePeriod(periodId);
    setShowDeleteConfirm(null);
  };

  const handleToggleActive = (period: FreezePeriod) => {
    onUpdateFreezePeriod({
      ...period,
      isActive: !period.isActive,
      lastModified: new Date(),
      modifiedBy: currentUser.name,
    });
  };

  // ============================================================================
  // RENDER - LIST VIEW
  // ============================================================================

  if (view === 'list') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="calendar" className="w-6 h-6" />
              Freeze Period Administration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Define and manage Workday freeze periods for automated onboarding handling
            </p>
          </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Active Periods</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activePeriods.length}</div>
              </Card>
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">Upcoming Periods</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{upcomingPeriods.length}</div>
              </Card>
              <Card className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">Past Periods</div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{pastPeriods.length}</div>
              </Card>
            </div>

            {/* Create Button */}
            <div className="mb-6">
              <Button variant="primary" onClick={handleStartCreate}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Create Freeze Period
              </Button>
            </div>

            {/* Active Periods */}
            {activePeriods.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Active Freeze Periods</h3>
                <div className="space-y-3">
                  {activePeriods.map((period) => {
                    const daysUntilStart = getDaysUntil(period.startDate);
                    const daysUntilEnd = getDaysUntil(period.endDate);
                    const isCurrentlyActive = isDateInRange(new Date(), period.startDate, period.endDate);

                    return (
                      <Card key={period.id} className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{period.name}</h4>
                              {isCurrentlyActive && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                                  IN PROGRESS
                                </span>
                              )}
                              {period.autoEmailEnabled && (
                                <Icon name="mail" className="w-4 h-4 text-blue-600 dark:text-blue-400" title="Auto-email enabled" />
                              )}
                            </div>
                            {period.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{period.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Start:</span>
                                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                  {formatDate(period.startDate)}
                                  {daysUntilStart > 0 && (
                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({daysUntilStart} days)</span>
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">End:</span>
                                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                  {formatDate(period.endDate)}
                                  {daysUntilEnd > 0 && (
                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({daysUntilEnd} days)</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleStartEdit(period)}>
                              <Icon name="edit" className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(period)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <Icon name="pause" className="w-4 h-4 mr-1" />
                              Deactivate
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Periods */}
            {upcomingPeriods.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Upcoming Freeze Periods</h3>
                <div className="space-y-3">
                  {upcomingPeriods.map((period) => {
                    const daysUntilStart = getDaysUntil(period.startDate);

                    return (
                      <Card key={period.id} className="p-4 border-l-4 border-green-500">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{period.name}</h4>
                              {!period.isActive && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-400 text-white rounded">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            {period.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{period.description}</p>
                            )}
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Starts in:</span>
                              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                {daysUntilStart} days ({formatDate(period.startDate)} - {formatDate(period.endDate)})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!period.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(period)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Icon name="check" className="w-4 h-4 mr-1" />
                                Activate
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleStartEdit(period)}>
                              <Icon name="edit" className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(period.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Delete Confirmation */}
                        {showDeleteConfirm === period.id && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-900 dark:text-red-200 mb-3">
                              Are you sure you want to delete this freeze period? This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleDelete(period.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Periods (Collapsed) */}
            {pastPeriods.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-3">
                  Past Freeze Periods ({pastPeriods.length})
                  <Icon name="chevron-down" className="w-4 h-4 inline ml-1 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="space-y-2 pl-4">
                  {pastPeriods.slice(0, 5).map((period) => (
                    <div key={period.id} className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{period.name}</span>
                      <span className="ml-2">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </span>
                    </div>
                  ))}
                  {pastPeriods.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400">
                      + {pastPeriods.length - 5} more
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Empty State */}
            {freezePeriods.length === 0 && (
              <div className="text-center py-12">
                <Icon name="calendar" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Freeze Periods Defined</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Create your first freeze period to manage Workday system freezes
                </p>
                <Button variant="primary" onClick={handleStartCreate}>
                  <Icon name="plus" className="w-4 h-4 mr-2" />
                  Create Freeze Period
                </Button>
              </div>
            )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - CREATE/EDIT FORM
  // ============================================================================

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icon name="calendar" className="w-6 h-6" />
                {view === 'create' ? 'Create Freeze Period' : 'Edit Freeze Period'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define date range and automated email settings for this freeze period
              </p>
            </div>
            <button
              onClick={handleCancelEdit}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Freeze Period Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Annual Year-End Freeze 2025"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="e.g., Workday is frozen for year-end processing and financial close"
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>}
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activate this freeze period immediately
                </label>
              </div>
            </div>

            {/* Email Configuration */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Automation</h3>
                <div className="flex items-center gap-3">
                  <input
                    id="autoEmailEnabled"
                    type="checkbox"
                    checked={formData.autoEmailEnabled}
                    onChange={(e) => setFormData({ ...formData, autoEmailEnabled: e.target.checked })}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="autoEmailEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable automatic emails for start/end dates
                  </label>
                </div>
              </div>

              {/* Helix Email */}
              <div>
                <label htmlFor="helixEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Helix Email Address *
                </label>
                <Input
                  id="helixEmail"
                  type="email"
                  value={formData.helixEmail}
                  onChange={(e) => setFormData({ ...formData, helixEmail: e.target.value })}
                  placeholder="helix@momentumww.com"
                  className={errors.helixEmail ? 'border-red-500' : ''}
                />
                {errors.helixEmail && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.helixEmail}</p>}
              </div>

              {/* CC Recipients */}
              <div>
                <label htmlFor="ccRecipients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CC Recipients (comma-separated)
                </label>
                <Input
                  id="ccRecipients"
                  value={formData.ccRecipients}
                  onChange={(e) => setFormData({ ...formData, ccRecipients: e.target.value })}
                  placeholder="camille@momentumww.com, payton@momentumww.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  HR team members who should be copied on automated emails
                </p>
              </div>

              {/* Email Templates */}
              {formData.autoEmailEnabled && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Email Templates</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use placeholders: {'{employeeName}'}, {'{employeeEmail}'}, {'{startDate}'}, {'{endDate}'}
                  </p>

                  {/* Start Date Template */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date Email (Password Reset)</h5>
                    <div>
                      <label htmlFor="startDateSubject" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Subject *
                      </label>
                      <Input
                        id="startDateSubject"
                        value={formData.startDateSubject}
                        onChange={(e) => setFormData({ ...formData, startDateSubject: e.target.value })}
                        placeholder="Password Reset Required - {employeeName} Starting {startDate}"
                        className={errors.startDateSubject ? 'border-red-500' : ''}
                      />
                      {errors.startDateSubject && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.startDateSubject}</p>}
                    </div>
                    <div>
                      <label htmlFor="startDateBody" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Body *
                      </label>
                      <textarea
                        id="startDateBody"
                        value={formData.startDateBody}
                        onChange={(e) => setFormData({ ...formData, startDateBody: e.target.value })}
                        rows={4}
                        className={`block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.startDateBody ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none font-mono text-xs`}
                      />
                      {errors.startDateBody && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.startDateBody}</p>}
                    </div>
                  </div>

                  {/* End Date Template */}
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date Email (Termination)</h5>
                    <div>
                      <label htmlFor="endDateSubject" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Subject *
                      </label>
                      <Input
                        id="endDateSubject"
                        value={formData.endDateSubject}
                        onChange={(e) => setFormData({ ...formData, endDateSubject: e.target.value })}
                        placeholder="Account Termination - {employeeName} End Date {endDate}"
                        className={errors.endDateSubject ? 'border-red-500' : ''}
                      />
                      {errors.endDateSubject && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.endDateSubject}</p>}
                    </div>
                    <div>
                      <label htmlFor="endDateBody" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Body *
                      </label>
                      <textarea
                        id="endDateBody"
                        value={formData.endDateBody}
                        onChange={(e) => setFormData({ ...formData, endDateBody: e.target.value })}
                        rows={4}
                        className={`block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.endDateBody ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none font-mono text-xs`}
                      />
                      {errors.endDateBody && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.endDateBody}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" type="button" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <Icon name={view === 'create' ? 'plus' : 'save'} className="w-4 h-4 mr-2" />
                {view === 'create' ? 'Create Freeze Period' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
