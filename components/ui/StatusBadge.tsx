// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================
// Reusable status indicator with color coding and icons
// Used for: pre-hire status, onboarding status, approval status

import React from 'react';
import { Icon } from './Icon';
import {
  PRE_HIRE_STATUS_CONFIG,
  ONBOARDING_STATUS_CONFIG,
  APPROVAL_STATUS_CONFIG,
} from '../../constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PreHireStatus = keyof typeof PRE_HIRE_STATUS_CONFIG;
type OnboardingStatus = keyof typeof ONBOARDING_STATUS_CONFIG;
type ApprovalStatus = keyof typeof APPROVAL_STATUS_CONFIG;

interface StatusBadgeProps {
  status: PreHireStatus | OnboardingStatus | ApprovalStatus;
  type: 'preHire' | 'onboarding' | 'approval';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const colorClasses = {
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-300 dark:border-yellow-600',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-300 dark:border-orange-600',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-600',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  },
};

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base',
    icon: 'w-5 h-5',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  size = 'md',
  showIcon = true,
  showTooltip = true,
  className = '',
}) => {
  // Get status configuration based on type
  const getStatusConfig = () => {
    switch (type) {
      case 'preHire':
        return PRE_HIRE_STATUS_CONFIG[status as PreHireStatus];
      case 'onboarding':
        return ONBOARDING_STATUS_CONFIG[status as OnboardingStatus];
      case 'approval':
        return APPROVAL_STATUS_CONFIG[status as ApprovalStatus];
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) {
    return null;
  }

  const { label, color, icon, description } = config;
  const colors = colorClasses[color as keyof typeof colorClasses];
  const sizes = sizeClasses[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizes.badge}
        ${colors.bg}
        ${colors.text}
        border ${colors.border}
        rounded-full
        font-medium
        transition-all
        ${showTooltip ? 'cursor-help' : ''}
        ${className}
      `}
      title={showTooltip ? description : undefined}
      aria-label={`${label}: ${description}`}
    >
      {showIcon && (
        <Icon
          name={icon as any}
          className={sizes.icon}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Pre-hire status badge:
 * <StatusBadge status="accepted" type="preHire" />
 * <StatusBadge status="offered" type="preHire" size="sm" />
 *
 * Onboarding status badge:
 * <StatusBadge status="systems-created" type="onboarding" />
 * <StatusBadge status="active" type="onboarding" size="lg" />
 *
 * Approval status badge:
 * <StatusBadge status="pending" type="approval" />
 * <StatusBadge status="approved" type="approval" showIcon={false} />
 */
