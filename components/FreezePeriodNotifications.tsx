// ============================================================================
// FREEZE PERIOD NOTIFICATIONS COMPONENT
// ============================================================================
// Manage freeze period email notifications for password resets and terminations

import React, { useMemo, useState } from 'react';
import { PreHire } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ConfirmModal } from './ui/ConfirmModal';
import {
  generatePasswordResetEmail,
  openEmailClient,
  copyEmailToClipboard,
  isInFreezePeriod,
  DEFAULT_HELIX_EMAIL,
  FREEZE_PERIOD_DESCRIPTION,
  EmailTemplate,
} from '../utils/freezePeriodEmail';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FreezePeriodNotificationsProps {
  preHires: PreHire[];
  onEmailSent?: (preHire: PreHire) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FreezePeriodNotifications: React.FC<FreezePeriodNotificationsProps> = ({
  preHires,
  onEmailSent,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [showSendAllConfirm, setShowSendAllConfirm] = useState(false);

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  // Find pre-hires starting during freeze period (future dates only)
  const upcomingFreezeStarts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return preHires.filter(
      (ph) =>
        ph.status === 'accepted' &&
        isInFreezePeriod(ph.startDate) &&
        new Date(ph.startDate) >= today
    );
  }, [preHires]);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilStart = (startDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSendEmail = (preHire: PreHire) => {
    const emailTemplate = generatePasswordResetEmail(preHire, DEFAULT_HELIX_EMAIL);
    openEmailClient(emailTemplate);

    if (onEmailSent) {
      onEmailSent(preHire);
    }
  };

  const handleCopyEmail = async (preHire: PreHire) => {
    const emailTemplate = generatePasswordResetEmail(preHire, DEFAULT_HELIX_EMAIL);
    await copyEmailToClipboard(emailTemplate);

    // Could add toast notification here
    alert('Email template copied to clipboard!');
  };

  const handleSendAllEmails = () => {
    setShowSendAllConfirm(true);
  };

  const confirmSendAllEmails = () => {
    upcomingFreezeStarts.forEach((ph) => {
      const emailTemplate = generatePasswordResetEmail(ph, DEFAULT_HELIX_EMAIL);
      // In real implementation, this would queue emails or send via API
      console.log('Queued email for:', ph.candidateName, emailTemplate);
    });

    alert(`${upcomingFreezeStarts.length} email(s) queued for sending`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (upcomingFreezeStarts.length === 0) {
    return null; // Don't show if no upcoming freeze period starts
  }

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icon name="alert" className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Freeze Period Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {FREEZE_PERIOD_DESCRIPTION}
              </p>
            </div>
          </div>

          {upcomingFreezeStarts.length > 1 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendAllEmails}
              title="Send all password reset emails"
            >
              <Icon name="email" className="w-4 h-4 mr-2" />
              Send All ({upcomingFreezeStarts.length})
            </Button>
          )}
        </div>

        {/* Alert Banner */}
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <strong>{upcomingFreezeStarts.length}</strong> employee(s) starting during Workday freeze period.
            Password reset emails need to be sent to IT.
          </p>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          {upcomingFreezeStarts.map((preHire) => {
            const daysUntil = getDaysUntilStart(preHire.startDate);

            return (
              <div
                key={preHire.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Employee Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {preHire.candidateName}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      daysUntil === 0
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : daysUntil <= 3
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{preHire.role}</span>
                    <span>•</span>
                    <span>Starts {formatDate(preHire.startDate)}</span>
                    {preHire.email && (
                      <>
                        <span>•</span>
                        <span>{preHire.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyEmail(preHire)}
                    title="Copy email template to clipboard"
                  >
                    <Icon name="copy" className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSendEmail(preHire)}
                    title="Open email client with pre-filled template"
                  >
                    <Icon name="email" className="w-4 h-4 mr-1" />
                    Send Email
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                How it works
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• These employees have accounts pre-loaded in Workday with scrubbed passwords</li>
                <li>• Click "Send Email" to notify IT to reset password and enable MFA</li>
                <li>• Email is sent to Helix ticketing system for tracking</li>
                <li>• IT will send new credentials to the employee's email address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showSendAllConfirm}
        onClose={() => setShowSendAllConfirm(false)}
        onConfirm={confirmSendAllEmails}
        title="Send All Password Reset Emails?"
        message={`Are you sure you want to send password reset emails for ${upcomingFreezeStarts.length} employee(s)? This will create Helix tickets for each employee.`}
        confirmText="Send All Emails"
        variant="warning"
      />
    </Card>
  );
};
