import React from 'react';

interface StatsSkeletonProps {
  count?: number;
}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-6 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`stat-${index}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg animate-pulse flex-1"
        >
          {/* Icon skeleton */}
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>

          {/* Text content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
