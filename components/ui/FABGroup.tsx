// ============================================================================
// FAB GROUP COMPONENT
// ============================================================================
// Container for multiple floating action buttons with expand/collapse

import React, { useState, useEffect, useRef } from 'react';
import { FloatingActionButton, FABProps } from './FloatingActionButton';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FABGroupProps {
  primaryFAB: FABProps;
  secondaryFABs: FABProps[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FABGroup: React.FC<FABGroupProps> = ({
  primaryFAB,
  secondaryFABs,
  position = 'bottom-right',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // Toggle expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isExpanded]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);

  // Position styles
  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Handle primary FAB click
  const handlePrimaryClick = () => {
    if (secondaryFABs.length > 0) {
      toggleExpansion();
    } else {
      primaryFAB.onClick();
    }
  };

  return (
    <div
      ref={groupRef}
      className={`fixed ${positionStyles[position]} z-50 flex flex-col items-end gap-3 ${className}`}
    >
      {/* Secondary FABs (shown when expanded) */}
      {secondaryFABs.length > 0 && (
        <div
          className={`
            flex flex-col items-end gap-3
            transition-all duration-300 ease-in-out
            ${
              isExpanded
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
            }
          `}
        >
          {secondaryFABs.map((fab, index) => (
            <div
              key={index}
              className="transition-all duration-200"
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              }}
            >
              <FloatingActionButton
                {...fab}
                onClick={() => {
                  fab.onClick();
                  setIsExpanded(false);
                }}
                variant="secondary"
              />
            </div>
          ))}
        </div>
      )}

      {/* Primary FAB (always visible) */}
      <div
        className={`
          transition-transform duration-300 ease-in-out
          ${isExpanded && secondaryFABs.length > 0 ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <FloatingActionButton
          {...primaryFAB}
          onClick={handlePrimaryClick}
          variant="primary"
        />
      </div>

      {/* Backdrop (when expanded, for mobile) */}
      {isExpanded && secondaryFABs.length > 0 && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm -z-10 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <FABGroup
 *   primaryFAB={{
 *     icon: 'plus',
 *     label: 'Create Pre-hire',
 *     onClick: () => console.log('Create'),
 *   }}
 *   secondaryFABs={[
 *     {
 *       icon: 'box',
 *       label: 'Manage Packages',
 *       onClick: () => console.log('Packages'),
 *     },
 *     {
 *       icon: 'check-circle',
 *       label: 'Approvals',
 *       onClick: () => console.log('Approvals'),
 *       badge: 3,
 *     },
 *     {
 *       icon: 'ticket',
 *       label: 'Helix Tickets',
 *       onClick: () => console.log('Tickets'),
 *       badge: 5,
 *     },
 *   ]}
 *   position="bottom-right"
 * />
 */
