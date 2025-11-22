// ============================================================================
// PAGINATION COMPONENT
// ============================================================================
// Modern pagination controls with first/last/prev/next navigation
// and configurable items per page

import React from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemCount?: boolean;
  showItemsPerPageSelector?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  showItemCount = true,
  showItemsPerPageSelector = true,
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFirst = () => {
    if (canGoPrevious) {
      onPageChange(1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLast = () => {
    if (canGoNext) {
      onPageChange(totalPages);
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left side: Item count */}
      {showItemCount && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-semibold">{startItem}</span> to{' '}
          <span className="font-semibold">{endItem}</span> of{' '}
          <span className="font-semibold">{totalItems}</span> items
        </div>
      )}

      {/* Right side: Controls */}
      <div className="flex items-center gap-3">
        {/* Items per page selector */}
        {showItemsPerPageSelector && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="items-per-page"
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1); // Reset to first page when changing items per page
              }}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page indicator */}
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Page <span className="font-semibold">{currentPage}</span> of{' '}
          <span className="font-semibold">{totalPages}</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFirst}
            disabled={!canGoPrevious}
            title="First page"
            className="!px-2"
          >
            <Icon name="chevron-left" className="w-4 h-4" />
            <Icon name="chevron-left" className="w-4 h-4 -ml-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            title="Previous page"
            className="!px-2"
          >
            <Icon name="chevron-left" className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
            title="Next page"
            className="!px-2"
          >
            <Icon name="chevron-right" className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLast}
            disabled={!canGoNext}
            title="Last page"
            className="!px-2"
          >
            <Icon name="chevron-right" className="w-4 h-4" />
            <Icon name="chevron-right" className="w-4 h-4 -ml-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const [currentPage, setCurrentPage] = useState(1);
 * const [itemsPerPage, setItemsPerPage] = useState(25);
 *
 * <Pagination
 *   currentPage={currentPage}
 *   totalItems={hardwareList.length}
 *   itemsPerPage={itemsPerPage}
 *   onPageChange={setCurrentPage}
 *   onItemsPerPageChange={setItemsPerPage}
 *   itemsPerPageOptions={[10, 25, 50, 100]}
 * />
 */
