// ============================================================================
// COLLAPSIBLE NAVIGATION COMPONENT (WITH HIERARCHICAL GROUPING)
// ============================================================================
// Sidebar navigation with collapse/expand functionality and grouped items

import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type NavigationSection =
  | 'pre-hires'
  | 'hardware-inventory'
  | 'software-inventory'
  | 'license-pools'
  | 'manage-packages'
  | 'packages-hardware'
  | 'packages-software'
  | 'packages-licenses'
  | 'refresh-calendar'
  | 'refresh-finance'
  | 'refresh-notifications'
  | 'freeze-period-admin'
  | 'freeze-period-dashboard';

interface NavigationProps {
  currentSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  className?: string;
}

interface NavigationItem {
  id: NavigationSection;
  label: string;
  icon: string;
  description?: string;
  children?: NavigationItem[];
}

interface NavigationGroup {
  section: string;
  items: NavigationItem[];
}

// ============================================================================
// NAVIGATION STRUCTURE (HIERARCHICAL)
// ============================================================================

const NAVIGATION_STRUCTURE: NavigationGroup[] = [
  {
    section: 'CORE',
    items: [
      {
        id: 'pre-hires',
        label: 'Pre-hires & Onboarding',
        icon: 'users',
        description: 'Primary dashboard for candidate onboarding',
      },
    ],
  },
  {
    section: 'INVENTORY',
    items: [
      {
        id: 'hardware-inventory',
        label: 'Hardware Inventory',
        icon: 'box',
        description: 'Manage hardware items and inventory',
      },
      {
        id: 'software-inventory',
        label: 'Software Inventory',
        icon: 'disc',
        description: 'Manage software applications and tools',
      },
      {
        id: 'license-pools',
        label: 'License Pools',
        icon: 'key',
        description: 'Manage software license pools and assignments',
      },
    ],
  },
  {
    section: 'PACKAGES',
    items: [
      {
        id: 'manage-packages',
        label: 'Packages',
        icon: 'clipboard-list',
        description: 'Manage equipment packages',
        children: [
          {
            id: 'manage-packages',
            label: 'Manage Packages',
            icon: 'clipboard-list',
            description: 'View and manage all packages',
          },
          {
            id: 'packages-hardware',
            label: 'Hardware',
            icon: 'laptop',
            description: 'Hardware package templates',
          },
          {
            id: 'packages-software',
            label: 'Software',
            icon: 'disc',
            description: 'Software package templates',
          },
          {
            id: 'packages-licenses',
            label: 'Licenses',
            icon: 'ticket',
            description: 'License package templates',
          },
        ],
      },
    ],
  },
  {
    section: 'HARDWARE REFRESH',
    items: [
      {
        id: 'refresh-calendar',
        label: 'Hardware Refresh',
        icon: 'refresh-cw',
        description: 'Hardware refresh management',
        children: [
          {
            id: 'refresh-calendar',
            label: 'Calendar',
            icon: 'calendar',
            description: 'View hardware refresh schedule',
          },
          {
            id: 'refresh-finance',
            label: 'Budget Forecast',
            icon: 'dollar-sign',
            description: 'Financial planning and cost projections',
          },
          {
            id: 'refresh-notifications',
            label: 'Notifications',
            icon: 'bell',
            description: 'Manage upcoming refresh notifications',
          },
        ],
      },
    ],
  },
  {
    section: 'FREEZE PERIOD',
    items: [
      {
        id: 'freeze-period-admin',
        label: 'Freeze Period',
        icon: 'snowflake',
        description: 'Freeze period management',
        children: [
          {
            id: 'freeze-period-admin',
            label: 'Admin',
            icon: 'settings',
            description: 'Configure freeze period settings',
          },
          {
            id: 'freeze-period-dashboard',
            label: 'Dashboard',
            icon: 'bar-chart',
            description: 'Monitor freeze period notifications',
          },
        ],
      },
    ],
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface NavigationItemButtonProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  isChild?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick: () => void;
  onToggleExpand?: () => void;
}

const NavigationItemButton: React.FC<NavigationItemButtonProps> = ({
  item,
  isActive,
  isCollapsed,
  isChild = false,
  hasChildren = false,
  isExpanded = false,
  onClick,
  onToggleExpand,
}) => {
  const handleClick = () => {
    if (hasChildren && onToggleExpand) {
      onToggleExpand();
    } else {
      onClick();
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative
          ${isChild ? 'pl-10' : ''}
          ${
            isActive
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
        aria-current={isActive ? 'page' : undefined}
        title={isCollapsed ? item.label : item.description}
      >
        {/* Icon */}
        <Icon
          name={item.icon}
          className={`w-5 h-5 flex-shrink-0 ${
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        />

        {/* Label (hidden when collapsed) */}
        {!isCollapsed && (
          <span
            className={`flex-1 text-left text-sm font-medium truncate ${
              isActive
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {item.label}
          </span>
        )}

        {/* Expand/Collapse Arrow (only for parent items with children) */}
        {!isCollapsed && hasChildren && (
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            className="w-4 h-4 text-gray-400 dark:text-gray-500"
          />
        )}

        {/* Active Indicator */}
        {isActive && (
          <div className="w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-full absolute right-0 top-1/2 -translate-y-1/2" />
        )}
      </button>

      {/* Tooltip (only when collapsed) */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-4px] border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CollapsibleNavigation: React.FC<NavigationProps> = ({
  currentSection,
  onSectionChange,
  className = '',
}) => {
  // Collapse state (saved to localStorage)
  const [isCollapsed, setIsCollapsed] = useLocalStorage('navCollapsed', false);

  // Expanded groups state (which parent items are expanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    packages: false,
    'hardware-refresh': false,
    'freeze-period': false,
  });

  // Toggle collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Calculate width based on collapse state
  const navWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <nav
      className={`${navWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden ${className}`}
    >
      {/* Navigation Toggle Button */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-end">
        {/* Hamburger Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <Icon
            name={isCollapsed ? 'menu' : 'x'}
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
          />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-2">
        {NAVIGATION_STRUCTURE.map((group) => (
          <div key={group.section} className="mb-4">
            {/* Section Header (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.section}
              </div>
            )}

            {/* Section Items */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const groupKey = item.id;
                const isExpanded = expandedGroups[groupKey];
                const isActive = currentSection === item.id;
                const isChildActive = hasChildren && item.children?.some((child) => child.id === currentSection);

                return (
                  <li key={item.id}>
                    {/* Parent Item */}
                    <NavigationItemButton
                      item={item}
                      isActive={isActive || !!isChildActive}
                      isCollapsed={isCollapsed}
                      hasChildren={hasChildren}
                      isExpanded={isExpanded}
                      onClick={() => onSectionChange(item.id)}
                      onToggleExpand={() => toggleGroupExpansion(groupKey)}
                    />

                    {/* Child Items (only shown when expanded and not collapsed) */}
                    {!isCollapsed && hasChildren && isExpanded && (
                      <ul className="mt-1 space-y-1">
                        {item.children?.map((child) => (
                          <li key={child.id}>
                            <NavigationItemButton
                              item={child}
                              isActive={currentSection === child.id}
                              isCollapsed={false}
                              isChild={true}
                              onClick={() => onSectionChange(child.id)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Navigation Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            <p>Version 2.0.0</p>
            <p className="mt-1">Employee Onboarding System</p>
          </div>
        </div>
      )}
    </nav>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const [currentSection, setCurrentSection] = useState<NavigationSection>('pre-hires');
 *
 * <CollapsibleNavigation
 *   currentSection={currentSection}
 *   onSectionChange={setCurrentSection}
 * />
 */
