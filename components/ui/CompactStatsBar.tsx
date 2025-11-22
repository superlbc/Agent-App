// ============================================================================
// COMPACT STATS BAR COMPONENT
// ============================================================================
// Reusable inline statistics bar with compact design
// Used across Software Catalog, License Pool Dashboard, and User License Assignments

import React from 'react';
import { Icon } from './Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompactStat {
  label: string;
  value: number | string;
  icon: string;
  color: string; // text-{color}-600 dark:text-{color}-400
  bgColor: string; // bg-{color}-50 dark:bg-{color}-900/30
  description: string;
}

interface CompactStatsBarProps {
  title: string;
  stats: CompactStat[];
  actionButton?: {
    label: string;
    icon: string;
    onClick: () => void;
  };
  headerIcon?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  title,
  stats,
  actionButton,
  headerIcon,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
      {/* Inline Header with Stats */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          {headerIcon && (
            <Icon name={headerIcon} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>

        {/* Center: Inline Stats */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative flex items-center gap-2 cursor-help"
              title={stat.description}
            >
              {/* Icon */}
              <div className={`${stat.bgColor} p-1.5 rounded`}>
                <Icon name={stat.icon} className={`w-4 h-4 ${stat.color}`} />
              </div>

              {/* Value & Label */}
              <div>
                <span className={`text-lg font-bold ${stat.color} leading-none`}>
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                  {stat.label}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                {stat.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <Icon name={actionButton.icon} className="w-4 h-4" />
            <span className="text-sm">{actionButton.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};
