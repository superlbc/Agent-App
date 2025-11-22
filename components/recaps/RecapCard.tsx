// ============================================================================
// RECAP CARD COMPONENT
// ============================================================================
// Card component for displaying recap summary in list views
// Features: Status badge, quick metrics, checkbox for bulk actions, click handler

import React from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { Icon } from '../ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RecapCardProps {
  recap: {
    id: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    fieldManagerName: string;
    submittedAt: Date;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    qrScans: number;
    surveysCollected: number;
    photosCount: number;
  };
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: (id: string) => void;
  showCheckbox?: boolean;
  isHighlighted?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecapCard: React.FC<RecapCardProps> = ({
  recap,
  isSelected = false,
  onSelect,
  onClick,
  showCheckbox = false,
  isHighlighted = false,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking checkbox
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    onClick?.(recap.id);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect?.(recap.id, e.target.checked);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return formatDate(date);
    }
  };

  // Status badge configuration
  const statusConfig = {
    draft: { label: 'Draft', color: 'gray', icon: 'edit' },
    pending: { label: 'Pending', color: 'yellow', icon: 'clock' },
    approved: { label: 'Approved', color: 'green', icon: 'check-circle' },
    rejected: { label: 'Rejected', color: 'red', icon: 'x-circle' },
  };

  const status = statusConfig[recap.status];

  return (
    <Card
      className={`
        relative cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600
        ${isHighlighted ? 'border-primary-500 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : ''}
        ${isSelected ? 'ring-2 ring-primary-500' : ''}
      `}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header: Checkbox + Event Name + Status */}
        <div className="flex items-start gap-3 mb-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
              {recap.eventName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(new Date(recap.eventDate))}
            </p>
          </div>

          <span
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${status.color === 'gray' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
              ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : ''}
              ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
              ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
            `}
          >
            <Icon name={status.icon as any} className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Field Manager + Submitted At */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <Icon name="user" className="w-4 h-4" />
          <span>{recap.fieldManagerName}</span>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span>{formatTimeAgo(recap.submittedAt)}</span>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <Icon name="qr-code" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">{recap.qrScans}</span>
            <span className="text-gray-500 dark:text-gray-400">scans</span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <Icon name="clipboard-list" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">{recap.surveysCollected}</span>
            <span className="text-gray-500 dark:text-gray-400">surveys</span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <Icon name="camera" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">{recap.photosCount}</span>
            <span className="text-gray-500 dark:text-gray-400">photos</span>
          </div>
        </div>

        {/* Click indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="chevron-right" className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Basic usage in a list:
 *
 * <RecapCard
 *   recap={recapData}
 *   onClick={(id) => setSelectedRecapId(id)}
 * />
 *
 *
 * With checkbox for bulk selection:
 *
 * <RecapCard
 *   recap={recapData}
 *   showCheckbox={true}
 *   isSelected={selectedIds.includes(recap.id)}
 *   onSelect={(id, checked) => handleSelect(id, checked)}
 *   onClick={(id) => setSelectedRecapId(id)}
 * />
 *
 *
 * Highlighted when selected in split view:
 *
 * <RecapCard
 *   recap={recapData}
 *   isHighlighted={selectedRecapId === recap.id}
 *   onClick={(id) => setSelectedRecapId(id)}
 * />
 */
