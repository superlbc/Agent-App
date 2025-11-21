import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="animate-pulse">
      {/* Table Header */}
      <div className="grid gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700"
           style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`}>
              {colIndex === 0 ? (
                // First column: Name (wider)
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              ) : colIndex === columns - 1 ? (
                // Last column: Actions (smaller)
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                // Middle columns: Regular data
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
