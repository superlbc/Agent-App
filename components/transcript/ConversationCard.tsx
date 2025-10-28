/**
 * ConversationCard - Individual message card in conversation view
 * Shows speaker avatar, name, timestamp, and message with search highlighting
 */

import React, { useEffect, useRef } from 'react';
import { Participant } from '../../types';
import { highlightText } from '../../utils/textHighlighter';
import { Tooltip } from '../ui/Tooltip';

interface ConversationCardProps {
  speaker: string;
  timestamp: string;
  message: string;
  participant?: Participant;  // Matched participant data (for photo, email, etc.)
  searchQuery?: string;       // Search query for highlighting
  isCurrentMatch?: boolean;   // Is this card the current search match?
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  speaker,
  timestamp,
  message,
  participant,
  searchQuery,
  isCurrentMatch = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll to this card if it's the current match
  useEffect(() => {
    if (isCurrentMatch && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isCurrentMatch]);

  // Generate avatar color based on speaker name
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get speaker initials
  const getInitials = (name: string): string => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get display name (prefer participant displayName, fallback to cleaned speaker name)
  const getDisplayName = (): string => {
    if (participant?.displayName) {
      return participant.displayName;
    }

    // Clean speaker name: remove details in parentheses
    // "Bustos, Luis (LDN-MOM)" -> "Bustos, Luis"
    const cleanName = speaker.replace(/\s*\([^)]+\)\s*$/, '').trim();

    // Try to reverse "LastName, FirstName" to "FirstName LastName"
    if (cleanName.includes(',')) {
      const parts = cleanName.split(',').map(p => p.trim());
      if (parts.length === 2) {
        return `${parts[1]} ${parts[0]}`; // "Luis Bustos"
      }
    }

    return cleanName;
  };

  // Get job description (job title + department)
  const getJobDescription = (): string | null => {
    if (!participant) return null;

    if (participant.jobTitle && participant.department) {
      return `${participant.jobTitle} · ${participant.department}`;
    }
    if (participant.jobTitle) {
      return participant.jobTitle;
    }
    if (participant.department) {
      return participant.department;
    }

    return null;
  };

  // Create hover card content
  const getHoverCardContent = (): React.ReactNode => {
    if (!participant) return null;

    return (
      <div className="text-xs space-y-1">
        {participant.email && (
          <div>
            <span className="font-medium">Email:</span> {participant.email}
          </div>
        )}
        {participant.jobTitle && (
          <div>
            <span className="font-medium">Title:</span> {participant.jobTitle}
          </div>
        )}
        {participant.department && (
          <div>
            <span className="font-medium">Department:</span> {participant.department}
          </div>
        )}
        {participant.officeLocation && (
          <div>
            <span className="font-medium">Location:</span> {participant.officeLocation}
          </div>
        )}
        {participant.companyName && (
          <div>
            <span className="font-medium">Company:</span> {participant.companyName}
          </div>
        )}
      </div>
    );
  };

  // Render avatar (photo or initials)
  const renderAvatar = () => {
    const displayName = getDisplayName();

    if (participant?.photoUrl) {
      return (
        <img
          src={participant.photoUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
      );
    }

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(displayName)}`}
      >
        <span className="text-white font-semibold text-sm">
          {getInitials(displayName)}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`mb-3 rounded-lg transition-all ${
        isCurrentMatch
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 p-[14px]'
          : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent p-4'
      }`}
    >
      {/* Speaker Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {renderAvatar()}
          {/* Hidden fallback for failed image loads */}
          {participant?.photoUrl && (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(getDisplayName())}`}
              style={{ display: 'none' }}
            >
              <span className="text-white font-semibold text-sm">
                {getInitials(getDisplayName())}
              </span>
            </div>
          )}
        </div>

        {/* Speaker Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {participant && getHoverCardContent() ? (
              <Tooltip content={getHoverCardContent()}>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate cursor-help">
                    {getDisplayName()}
                  </h4>
                </div>
              </Tooltip>
            ) : (
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {getDisplayName()}
              </h4>
            )}
            {timestamp && (
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {timestamp}
              </span>
            )}
          </div>

          {/* Job Title / Department */}
          {getJobDescription() && (
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              <span className="truncate block">{getJobDescription()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="ml-13 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {searchQuery ? highlightText(message, searchQuery, isCurrentMatch) : message}
      </div>
    </div>
  );
};
