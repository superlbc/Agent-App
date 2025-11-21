// ============================================================================
// PRE-HIRE DASHBOARD COMPONENT
// ============================================================================
// Overview dashboard showing pre-hire statistics and key metrics

import React, { useMemo } from 'react';
import { Icon } from './ui/Icon';
import { PreHire } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireDashboardProps {
  preHires: PreHire[];
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

export const PreHireDashboard: React.FC<PreHireDashboardProps> = ({ preHires }) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = preHires.length;
    const byStatus = {
      candidate: preHires.filter((p) => p.status === 'candidate').length,
      offered: preHires.filter((p) => p.status === 'offered').length,
      accepted: preHires.filter((p) => p.status === 'accepted').length,
      linked: preHires.filter((p) => p.status === 'linked').length,
      cancelled: preHires.filter((p) => p.status === 'cancelled').length,
    };

    const withPackage = preHires.filter((p) => p.assignedPackage).length;
    const withoutPackage = total - withPackage;

    // Upcoming starts (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingStarts = preHires.filter((p) => {
      const startDate = new Date(p.startDate);
      return startDate >= now && startDate <= thirtyDaysFromNow && p.status !== 'cancelled';
    }).length;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = preHires.filter((p) => {
      const createdDate = new Date(p.createdDate);
      return createdDate >= sevenDaysAgo;
    }).length;

    return {
      total,
      byStatus,
      withPackage,
      withoutPackage,
      upcomingStarts,
      recentActivity,
    };
  }, [preHires]);

  // Define stat cards
  const statCards: StatCard[] = [
    {
      label: 'Total Pre-hires',
      value: stats.total,
      icon: 'users',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      description: 'All pre-hire candidates',
    },
    {
      label: 'Accepted',
      value: stats.byStatus.accepted,
      icon: 'check-circle',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      description: 'Offers accepted',
    },
    {
      label: 'Upcoming Starts',
      value: stats.upcomingStarts,
      icon: 'calendar',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      description: 'Starting in next 30 days',
    },
    {
      label: 'Packages Assigned',
      value: stats.withPackage,
      icon: 'package',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      description: 'Equipment packages ready',
    },
    {
      label: 'Linked to Employees',
      value: stats.byStatus.linked,
      icon: 'link',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
      description: 'Connected to employee records',
    },
    {
      label: 'Recent Activity',
      value: stats.recentActivity,
      icon: 'clock',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      description: 'Added in last 7 days',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pre-hire Management Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of pre-hire candidates and onboarding status
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {card.description}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <Icon name={card.icon} className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status Breakdown
        </h3>
        <div className="space-y-3">
          {[
            {
              status: 'Candidate',
              count: stats.byStatus.candidate,
              color: 'bg-gray-400',
              percentage: (stats.byStatus.candidate / stats.total) * 100 || 0,
            },
            {
              status: 'Offered',
              count: stats.byStatus.offered,
              color: 'bg-blue-500',
              percentage: (stats.byStatus.offered / stats.total) * 100 || 0,
            },
            {
              status: 'Accepted',
              count: stats.byStatus.accepted,
              color: 'bg-green-500',
              percentage: (stats.byStatus.accepted / stats.total) * 100 || 0,
            },
            {
              status: 'Linked',
              count: stats.byStatus.linked,
              color: 'bg-indigo-500',
              percentage: (stats.byStatus.linked / stats.total) * 100 || 0,
            },
            {
              status: 'Cancelled',
              count: stats.byStatus.cancelled,
              color: 'bg-red-500',
              percentage: (stats.byStatus.cancelled / stats.total) * 100 || 0,
            },
          ].map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.status}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {item.count} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Quick Actions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Common tasks for managing pre-hires
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Icon name="plus" className="w-4 h-4" />
            Add Pre-hire
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Icon name="package" className="w-4 h-4" />
            Assign Packages
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Icon name="link" className="w-4 h-4" />
            Link Employees
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Icon name="download" className="w-4 h-4" />
            Export Report
          </button>
        </div>
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
 * <PreHireDashboard preHires={mockPreHires} />
 */
