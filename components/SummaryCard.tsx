import React, { useState } from 'react';
import { Icon } from './ui/Icon';

interface SummaryCardProps {
  bullets: string[];
  className?: string;
}

/**
 * Executive Summary card with collapsible gold/amber accent design.
 * Provides quick at-a-glance overview of meeting key points.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({ bullets, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bullets || bullets.length === 0) {
    return null; // Graceful degradation if no summary provided
  }

  return (
    <div
      className={`rounded-lg border-l-4 border-amber-500 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 ${className}`}
    >
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors text-left"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse executive summary" : "Expand executive summary"}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-500 text-lg" aria-hidden="true">
            ⚡️
          </span>
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
            Executive Summary
          </h3>
          <span className="text-xs text-amber-600 dark:text-amber-500 font-medium ml-2">
            {bullets.length} {bullets.length === 1 ? 'key point' : 'key points'}
          </span>
        </div>
        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          className="h-5 w-5 text-amber-600 dark:text-amber-500 transition-transform duration-200"
        />
      </button>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 animate-fadeIn">
          <ul className="space-y-2">
            {bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0 font-bold">
                  •
                </span>
                <span className="flex-1">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
