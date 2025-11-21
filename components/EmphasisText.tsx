import React from 'react';

interface EmphasisMarker {
  type: 'person' | 'date' | 'status' | 'task' | 'department' | 'monetary' | 'deadline' | 'risk' | 'general';
  value: string;
}

interface EmphasisTextProps {
  text: string;
  emphasis?: EmphasisMarker[];
  className?: string;
  showEmphasis?: boolean; // Whether to show emphasis styling (true by default)
}

/**
 * Renders text with semantic emphasis highlighting based on value-based markers.
 *
 * This component searches for emphasis values in the text and applies appropriate
 * styling based on the emphasis type. It handles overlaps, multiple occurrences,
 * and gracefully skips markers where the value is not found.
 */
export const EmphasisText: React.FC<EmphasisTextProps> = ({ text, emphasis = [], className = '', showEmphasis = true }) => {
  // If showEmphasis is false or no emphasis markers, render plain text
  if (!showEmphasis || !emphasis || emphasis.length === 0 || !text) {
    return <span className={className}>{text}</span>;
  }

  // Build a list of all emphasis positions by searching for each value in the text
  interface Position {
    start: number;
    end: number;
    type: EmphasisMarker['type'];
    value: string;
  }

  const positions: Position[] = [];

  emphasis.forEach((marker) => {
    if (!marker.value || typeof marker.value !== 'string') {
      console.warn('[EmphasisText] Invalid marker value:', marker);
      return;
    }

    // Find the first occurrence of this value in the text
    const index = text.indexOf(marker.value);

    if (index === -1) {
      console.warn(`[EmphasisText] Value "${marker.value}" not found in text: "${text.substring(0, 50)}..."`);
      return;
    }

    // Check for overlaps with existing positions
    const newStart = index;
    const newEnd = index + marker.value.length;
    const hasOverlap = positions.some(pos =>
      (newStart >= pos.start && newStart < pos.end) ||
      (newEnd > pos.start && newEnd <= pos.end) ||
      (newStart <= pos.start && newEnd >= pos.end)
    );

    if (hasOverlap) {
      console.warn(`[EmphasisText] Skipping overlapping emphasis for "${marker.value}"`);
      return;
    }

    positions.push({
      start: newStart,
      end: newEnd,
      type: marker.type,
      value: marker.value,
    });
  });

  // Sort positions by start index
  positions.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  positions.forEach((pos, idx) => {
    // Add plain text before this emphasis
    if (pos.start > lastIndex) {
      segments.push(
        <span key={`plain-${idx}`}>
          {text.substring(lastIndex, pos.start)}
        </span>
      );
    }

    // Add emphasized text
    segments.push(
      <EmphasisSpan key={`emphasis-${idx}`} type={pos.type} text={pos.value} />
    );

    lastIndex = pos.end;
  });

  // Add remaining plain text
  if (lastIndex < text.length) {
    segments.push(
      <span key="plain-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  // Add emphasis-container class to prevent parent dimming in focus mode
  const containerClass = emphasis.length > 0 ? 'emphasis-container' : '';
  return <span className={`${className} ${containerClass}`.trim()}>{segments}</span>;
};

/**
 * Renders a single emphasized span with type-specific styling
 * Enhanced for dark mode visibility with backgrounds and border accents
 */
const EmphasisSpan: React.FC<{ type: EmphasisMarker['type']; text: string }> = ({ type, text }) => {
  const baseClasses = 'transition-all duration-150 px-0.5 py-0.5 rounded emphasis-marker';

  switch (type) {
    case 'person':
      return (
        <span className={`${baseClasses} font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30`}>
          {text}
        </span>
      );

    case 'date':
      return (
        <span className={`${baseClasses} font-semibold text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30`}>
          {text}
        </span>
      );

    case 'deadline':
      return (
        <span className={`${baseClasses} font-bold text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30`}>
          {text}
        </span>
      );

    case 'status':
      // Determine color based on status keywords
      const isPositive = /approved|completed|done|green|success|finished/i.test(text);
      const isNegative = /blocked|failed|red|critical|delayed|overdue|rejected|canceled/i.test(text);
      const isWarning = /pending|amber|in.progress|review|tentative/i.test(text);

      if (isPositive) {
        return (
          <span className={`${baseClasses} font-semibold text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/30`}>
            {text}
          </span>
        );
      } else if (isNegative) {
        return (
          <span className={`${baseClasses} font-semibold text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30`}>
            {text}
          </span>
        );
      } else if (isWarning) {
        return (
          <span className={`${baseClasses} font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30`}>
            {text}
          </span>
        );
      }
      // Default status styling
      return (
        <span className={`${baseClasses} font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30`}>
          {text}
        </span>
      );

    case 'task':
      return (
        <span className={`${baseClasses} font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700/40`}>
          {text}
        </span>
      );

    case 'department':
      return (
        <span className={`${baseClasses} font-semibold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30`}>
          {text}
        </span>
      );

    case 'monetary':
      return (
        <span className={`${baseClasses} font-bold text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/30`}>
          {text}
        </span>
      );

    case 'risk':
      return (
        <span className={`${baseClasses} font-bold text-red-900 dark:text-red-200 bg-red-100 dark:bg-red-900/40`}>
          {text}
        </span>
      );

    case 'general':
      return (
        <span className={`${baseClasses} font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30`}>
          {text}
        </span>
      );

    default:
      return <span>{text}</span>;
  }
};
