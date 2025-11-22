// ============================================================================
// NAVIGATION COMPONENT
// ============================================================================
// Sidebar navigation for switching between major application sections

import React from 'react';
import { Icon } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type NavigationSection =
  | 'pre-hires'
  | 'packages'
  | 'approvals'
  | 'hardware-inventory'
  | 'software-catalog'
  | 'license-pools'
  | 'user-license-assignments'
  | 'refresh-calendar'
  | 'refresh-budget'
  | 'refresh-notifications'
  | 'freeze-period-admin'
  | 'freeze-period-dashboard'
  | 'role-management';

interface NavigationProps {
  currentSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavigationItem {
  id: NavigationSection;
  label: string;
  icon: string;
  description: string;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

// ============================================================================
// NAVIGATION ITEMS CONFIGURATION
// ============================================================================

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: 'PRE-HIRES & PACKAGES',
    items: [
      {
        id: 'pre-hires',
        label: 'Pre-hires',
        icon: 'users',
        description: 'Candidate tracking and onboarding',
      },
      {
        id: 'packages',
        label: 'Packages',
        icon: 'package',
        description: 'Equipment package management',
      },
      {
        id: 'approvals',
        label: 'Approvals',
        icon: 'check-circle',
        description: 'Approval queue and workflow',
      },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      {
        id: 'hardware-inventory',
        label: 'Hardware Inventory',
        icon: 'monitor',
        description: 'Computers, monitors, accessories',
      },
      {
        id: 'software-catalog',
        label: 'Software Catalog',
        icon: 'grid',
        description: 'All software and applications',
      },
      {
        id: 'license-pools',
        label: 'License Pools',
        icon: 'key',
        description: 'License inventory and utilization',
      },
      {
        id: 'user-license-assignments',
        label: 'User License Assignments',
        icon: 'user-check',
        description: 'Manage employee license assignments',
      },
    ],
  },
  {
    label: 'HARDWARE REFRESH',
    items: [
      {
        id: 'refresh-calendar',
        label: 'Refresh Calendar',
        icon: 'calendar',
        description: 'Hardware refresh schedule',
      },
      {
        id: 'refresh-budget',
        label: 'Budget Forecast',
        icon: 'trending-up',
        description: 'Financial planning and costs',
      },
      {
        id: 'refresh-notifications',
        label: 'Notifications',
        icon: 'bell',
        description: 'Upcoming refresh alerts',
      },
    ],
  },
  {
    label: 'FREEZE PERIOD ADMIN',
    items: [
      {
        id: 'freeze-period-admin',
        label: 'Freeze Period Admin',
        icon: 'settings',
        description: 'Configure freeze periods',
      },
      {
        id: 'freeze-period-dashboard',
        label: 'Freeze Period Dashboard',
        icon: 'inbox',
        description: 'Monitor freeze notifications',
      },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const Navigation: React.FC<NavigationProps> = ({
  currentSection,
  onSectionChange,
  className = '',
  isMobileOpen = false,
  onMobileClose,
}) => {
  const handleSectionChange = (section: NavigationSection) => {
    onSectionChange(section);
    // Close mobile menu after selecting a section
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar/Drawer */}
      <nav
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
      {/* Navigation Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Employee Onboarding
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Pre-hire to Active Employee
        </p>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-6">
          {NAVIGATION_GROUPS.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Group Header */}
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {group.label}
                </h3>
              </div>

              {/* Group Items */}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSectionChange(item.id)}
                        className={`
                          w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                          ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {/* Icon */}
                        <Icon
                          name={item.icon}
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />

                        {/* Label and Description */}
                        <div className="flex-1 text-left">
                          <div
                            className={`text-sm font-medium ${
                              isActive
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="w-1 h-full bg-primary-600 dark:bg-primary-400 rounded-full absolute right-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          <p>Version 2.0.0</p>
          <p className="mt-1">Employee Onboarding System</p>
        </div>
      </div>
    </nav>
    </>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const [currentSection, setCurrentSection] = useState<NavigationSection>('pre-hires');
 *
 * <Navigation
 *   currentSection={currentSection}
 *   onSectionChange={setCurrentSection}
 * />
 */
