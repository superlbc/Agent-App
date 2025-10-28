/**
 * TranscriptSearchBar - Search UI for transcript viewer
 * Provides search input, match counter, and navigation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={matchCount === 0}
              className="p-1 h-7 w-7"
              aria-label={t('transcript.previousMatch', 'Previous match')}
            >
              <Icon name="chevron-up" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={matchCount === 0}
              className="p-1 h-7 w-7"
              aria-label={t('transcript.nextMatch', 'Next match')}
            >
              <Icon name="chevron-down" className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Clear Button */}
        {query && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="p-1 h-7 w-7"
            aria-label={t('transcript.clearSearch', 'Clear search')}
          >
            <Icon name="x" className="w-4 h-4" />
          </Button>
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
