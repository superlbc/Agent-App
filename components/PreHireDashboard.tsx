// ============================================================================
// PRE-HIRE DASHBOARD COMPONENT (COMPACT VERSION)
// ============================================================================
// Compact dashboard showing pre-hire statistics in a single row

import React, { useMemo } from 'react';
import { Icon } from './ui/Icon';
import { PreHire } from '../types';
import { StatsSkeleton } from './ui/StatsSkeleton';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireDashboardProps {
  preHires: PreHire[];
  onCreate?: () => void;
  loading?: boolean;
}

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreHireDashboard: React.FC<PreHireDashboardProps> = ({
  preHires,
  onCreate,
  loading = false
}) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = preHires.length;
    const accepted = preHires.filter((p) => p.status === 'accepted').length;
    const withPackage = preHires.filter((p) => p.assignedPackage).length;

    // Upcoming starts (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingStarts = preHires.filter((p) => {
      const startDate = new Date(p.startDate);
      return startDate >= now && startDate <= thirtyDaysFromNow && p.status !== 'cancelled';
    }).length;

    return {
      total,
      accepted,
      withPackage,
      upcomingStarts,
    };
  }, [preHires]);

  // Define compact stat cards (4 stats + 1 action)
  const statCards: StatCard[] = [
    {
      label: 'Total',
      value: stats.total,
      icon: 'users',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      description: 'All pre-hire candidates',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: 'check-circle',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      description: 'Offers accepted',
    },
    {
      label: 'Starting Soon',
      value: stats.upcomingStarts,
      icon: 'calendar',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      description: 'Starting in next 30 days',
    },
    {
      label: 'Packages',
      value: stats.withPackage,
      icon: 'package',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      description: 'Equipment packages assigned',
    },
  ];

  // Show skeleton loader while loading
  if (loading) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <StatsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
      {/* Inline Header with Stats */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pre-hire Records
        </h2>

        {/* Center: Inline Stats */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group relative flex items-center gap-2 cursor-help"
              title={card.description}
            >
              {/* Icon */}
              <div className={`${card.bgColor} p-1.5 rounded`}>
                <Icon name={card.icon} className={`w-4 h-4 ${card.color}`} />
              </div>

              {/* Value & Label */}
              <div>
                <span className={`text-lg font-bold ${card.color} leading-none`}>
                  {card.value}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                  {card.label}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                {card.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Create Button */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span className="text-sm">Create</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * import { PreHireDashboard } from './components/PreHireDashboard';
 * import { mockPreHires } from './utils/mockData';
 *
 * <PreHireDashboard
 *   preHires={mockPreHires}
 *   onCreate={() => console.log('Create pre-hire')}
 * />
 */
