/**
 * MeetingCard - Individual meeting display component
 * Shows meeting summary with transcript availability badge
 */

import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Meeting } from '../../services/graphService';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  transcriptLikely: boolean;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onClick,
  transcriptLikely
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if meeting is in the future
  const now = new Date();
  const isFuture = meeting.start.getTime() > now.getTime();

  // Determine badge based on transcript likelihood
  const getBadge = () => {
    // Future meetings show "Upcoming" badge
    if (isFuture) {
      return {
        icon: 'clock',
        text: 'Upcoming',
        className: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
      };
    }

    if (transcriptLikely) {
      return {
        icon: 'check-circle',
        text: 'Transcript Available',
        className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      };
    }

    const minutesSince = (now.getTime() - meeting.end.getTime()) / 1000 / 60;

    if (minutesSince < 10 && minutesSince > 0) {
      return {
        icon: 'clock',
        text: 'Processing...',
        className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
      };
    }

    return {
      icon: 'x-circle',
      text: 'No Transcript',
      className: 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800'
    };
  };

  const badge = getBadge();

  return (
    <Card
      className={`p-4 transition-all duration-200 ${
        isFuture
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'
          : 'cursor-pointer hover:border-primary hover:shadow-md'
      }`}
      onClick={isFuture ? undefined : onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
            <Icon name="clock" className="w-4 h-4" />
            <span>{formatTime(meeting.start)} - {formatTime(meeting.end)}</span>
          </div>

          {/* Subject */}
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 truncate">
            {meeting.subject}
          </h3>

          {/* Organizer */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Icon name="user" className="w-4 h-4" />
            <span className="truncate">{meeting.organizer.name}</span>
            {meeting.isOrganizer && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                You
              </span>
            )}
          </div>

          {/* Attendees count */}
          {meeting.attendees.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
              <Icon name="users" className="w-3 h-3" />
              <span>{meeting.attendees.length} attendees</span>
            </div>
          )}
        </div>

        {/* Transcript Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${badge.className}`}>
          <Icon name={badge.icon} className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{badge.text}</span>
        </div>
      </div>
    </Card>
  );
};
