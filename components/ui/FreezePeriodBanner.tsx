// ============================================================================
// FREEZE PERIOD BANNER COMPONENT
// ============================================================================
// Warning banner for Workday freeze period (Nov 1 - Jan 5)
// Displays when start/end dates fall within the freeze period

import React, { useState } from 'react';
import { Icon } from './Icon';
import { FREEZE_PERIOD_START, FREEZE_PERIOD_END } from '../../constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FreezePeriodBannerProps {
  date: Date;
  type?: 'start' | 'end';
  employeeName?: string;
  dismissible?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a date falls within the Workday freeze period
 * Freeze Period: November 1 - January 5
 */
export function isInFreezePeriod(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed: Nov=10, Dec=11, Jan=0
  const day = date.getDate();

  // November (month 10)
  if (month === 10) {
    return true;
  }

  // December (month 11)
  if (month === 11) {
    return true;
  }

  // January 1-5 (month 0)
  if (month === 0 && day <= 5) {
    return true;
  }

  return false;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FreezePeriodBanner: React.FC<FreezePeriodBannerProps> = ({
  date,
  type = 'start',
  employeeName,
  dismissible = false,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if not in freeze period or if dismissed
  if (!isInFreezePeriod(date) || isDismissed) {
    return null;
  }

  // Build message based on type
  const message =
    type === 'start'
      ? `This ${employeeName ? `${employeeName}'s ` : ''}start date falls within the Workday freeze period (Nov 1 - Jan 5).`
      : `This ${employeeName ? `${employeeName}'s ` : ''}end date falls within the Workday freeze period (Nov 1 - Jan 5).`;

  const actionRequired =
    type === 'start'
      ? 'The account will be pre-loaded with scrubbed credentials. An automated email will be sent to IT/Helix on the start date to reset password and MFA.'
      : 'An automated email will be sent to IT/Helix on the end date to disable the account.';

  return (
    <div
      className={`
        relative
        flex items-start gap-3
        p-4
        bg-orange-50 dark:bg-orange-900/20
        border border-orange-200 dark:border-orange-800
        rounded-lg
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Warning Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon
          name="alert-circle"
          className="w-5 h-5 text-orange-600 dark:text-orange-400"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
              Freeze Period: {formatDate(date)}
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
              {message}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              <strong>Action Required:</strong> {actionRequired}
            </p>
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="
                flex-shrink-0
                p-1
                text-orange-600 dark:text-orange-400
                hover:text-orange-800 dark:hover:text-orange-200
                hover:bg-orange-100 dark:hover:bg-orange-900/40
                rounded
                transition-colors
              "
              aria-label="Dismiss freeze period warning"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Learn More Link (optional) */}
        <div className="mt-2">
          <a
            href="#"
            className="
              text-xs font-medium
              text-orange-700 dark:text-orange-300
              hover:text-orange-900 dark:hover:text-orange-100
              underline
            "
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open help modal or documentation
              alert('Freeze Period Documentation: [To be implemented]');
            }}
          >
            Learn more about freeze period automation →
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CONVENIENCE COMPONENT - Freeze Period Alert Badge
// ============================================================================

interface FreezePeriodAlertProps {
  date: Date;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Small inline freeze period indicator (for use in forms, cards, etc.)
 */
export const FreezePeriodAlert: React.FC<FreezePeriodAlertProps> = ({
  date,
  size = 'sm',
  className = '',
}) => {
  if (!isInFreezePeriod(date)) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        bg-orange-100 dark:bg-orange-900/30
        text-orange-700 dark:text-orange-300
        border border-orange-300 dark:border-orange-600
        rounded-md
        font-medium
        ${className}
      `}
      title="This date falls within the Workday freeze period (Nov 1 - Jan 5)"
    >
      <Icon name="snowflake" className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Freeze Period</span>
    </span>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Full banner:
 * <FreezePeriodBanner
 *   date={new Date('2025-12-01')}
 *   type="start"
 *   employeeName="Jane Smith"
 *   dismissible={true}
 * />
 *
 * Inline alert badge:
 * <FreezePeriodAlert date={startDate} size="sm" />
 */
