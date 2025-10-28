/**
 * Text Highlighter Utility
 *
 * Highlights search matches within text for display in the UI.
 */

import React from 'react';

/**
 * Highlights all occurrences of a search query in text.
 *
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @param isCurrent - Whether this is the current/active match
 * @returns React nodes with highlighted matches
 */
export function highlightText(
  text: string,
  query: string,
  isCurrent: boolean = false
): React.ReactNode {
  if (!query || query.trim().length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let matchIndex = 0;

  let index = lowerText.indexOf(lowerQuery, lastIndex);

  while (index !== -1) {
    // Add text before the match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Add the highlighted match
    parts.push(
      <mark
        key={`match-${matchIndex}`}
        className={`rounded px-0.5 ${
          isCurrent
            ? 'bg-amber-400 dark:bg-amber-500 text-slate-900'
            : 'bg-yellow-200 dark:bg-yellow-600/50 text-slate-900 dark:text-white'
        }`}
      >
        {text.substring(index, index + query.length)}
      </mark>
    );

    lastIndex = index + query.length;
    matchIndex++;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Highlights a specific match in text.
 *
 * @param text - The text to highlight
 * @param charIndex - Start position of the match
 * @param length - Length of the match
 * @param isCurrent - Whether this is the current/active match
 * @returns React nodes with highlighted match
 */
export function highlightMatch(
  text: string,
  charIndex: number,
  length: number,
  isCurrent: boolean = false
): React.ReactNode {
  if (charIndex < 0 || charIndex >= text.length) {
    return text;
  }

  const before = text.substring(0, charIndex);
  const match = text.substring(charIndex, charIndex + length);
  const after = text.substring(charIndex + length);

  return (
    <>
      {before}
      <mark
        className={`rounded px-0.5 ${
          isCurrent
            ? 'bg-amber-400 dark:bg-amber-500 text-slate-900'
            : 'bg-yellow-200 dark:bg-yellow-600/50 text-slate-900 dark:text-white'
        }`}
      >
        {match}
      </mark>
      {after}
    </>
  );
}
