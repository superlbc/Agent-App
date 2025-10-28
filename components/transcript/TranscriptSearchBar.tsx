/**
 * TranscriptSearchBar - Search UI for transcript viewer
 * Provides search input, match counter, and navigation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

interface TranscriptSearchBarProps {
  query: string;
  onSearch: (query: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onClear: () => void;
}

export const TranscriptSearchBar: React.FC<TranscriptSearchBarProps> = ({
  query,
  onSearch,
  matchCount,
  currentMatchIndex,
  onNavigate,
  onClear
}) => {
  const { t } = useTranslation('common');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Enter = next match, Shift+Enter = previous match
      onNavigate(e.shiftKey ? 'prev' : 'next');
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className="mb-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="flex items-center gap-2">
        {/* Search Icon */}
        <Icon name="search" className="w-4 h-4 text-slate-400 flex-shrink-0" />

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('transcript.searchPlaceholder', 'Search in transcript...')}
          className="flex-1 text-sm bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
        />

        {/* Match Counter */}
        {matchCount > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {currentMatchIndex + 1} {t('transcript.of', 'of')} {matchCount}
          </span>
        )}

        {/* Navigation Buttons */}
        {matchCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('prev')}
              disabled={matchCount === 0}
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('transcript.previousMatch', 'Previous match')}
            >
              <Icon name="chevron-up" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              disabled={matchCount === 0}
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('transcript.nextMatch', 'Next match')}
            >
              <Icon name="chevron-down" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Clear Button */}
        {query && (
          <button
            onClick={onClear}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('transcript.clearSearch', 'Clear search')}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* No results message */}
      {query && matchCount === 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('transcript.noMatches', 'No matches found')}
        </p>
      )}
    </div>
  );
};
