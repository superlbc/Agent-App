// ============================================================================
// FLOATING ACTION BUTTON (FAB) COMPONENT
// ============================================================================
// Reusable floating action button for quick actions

import React from 'react';
import { Icon } from './Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FABProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  badge?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
  badge,
  className = '',
}) => {
  const isPrimary = variant === 'primary';
  const size = isPrimary ? 'w-14 h-14' : 'w-12 h-12';

  const baseStyles = `
    ${size}
    rounded-full
    shadow-lg hover:shadow-xl
    transition-all duration-200
    flex items-center justify-center
    relative
    group
  `;

  const variantStyles = isPrimary
    ? 'bg-primary-600 hover:bg-primary-700 text-white'
    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      aria-label={label}
      title={label}
    >
      {/* Icon */}
      <Icon name={icon} className={`${isPrimary ? 'w-6 h-6' : 'w-5 h-5'}`} />

      {/* Badge (for counts) */}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
          {badge > 99 ? '99+' : badge}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </button>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * // Primary FAB
 * <FloatingActionButton
 *   icon="plus"
 *   label="Create Pre-hire"
 *   onClick={() => console.log('Create clicked')}
 *   variant="primary"
 * />
 *
 * // Secondary FAB with badge
 * <FloatingActionButton
 *   icon="check-circle"
 *   label="Approvals"
 *   onClick={() => console.log('Approvals clicked')}
 *   variant="secondary"
 *   badge={3}
 * />
 */
