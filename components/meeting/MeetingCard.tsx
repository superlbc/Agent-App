/**
 * MeetingCard - Individual meeting display component
 * Shows meeting summary with transcript availability badge
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Meeting } from '../../services/graphService';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  transcriptLikely: boolean;
  isLoadingTranscript?: boolean;
  isExpanded?: boolean;
  onProcessMeeting?: () => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onClick,
  transcriptLikely,
  isLoadingTranscript = false,
  isExpanded = false,
  onProcessMeeting
}) => {
  const { t } = useTranslation('common');

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

  // Determine badge based on actual transcript status (checked via API)
  const getBadge = () => {
    // Future meetings show "Upcoming" badge
    if (isFuture) {
      return {
        icon: 'clock',
        text: t('meetings.upcoming', 'Upcoming'),
        className: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
      };
    }

    // Use actual transcript status if available (checked via API)
    if (meeting.transcriptStatus) {
      switch (meeting.transcriptStatus) {
        case 'checking':
          return {
            icon: 'loader',
            text: t('meetings.transcriptChecking'),
            className: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
          };
        case 'available':
          return {
            icon: 'check-circle',
            text: t('meetings.transcriptAvailable'),
            className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
          };
        case 'unavailable':
          return {
            icon: 'x-circle',
            text: t('meetings.transcriptUnavailable'),
            className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
          };
        case 'unknown':
          return {
            icon: 'help-circle',
            text: t('meetings.transcriptUnknown'),
            className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
          };
      }
    }

    // Fallback to time-based heuristic if transcript status hasn't been checked yet
    // (This shows while waiting for debounce or during initial load)
    if (transcriptLikely) {
      return {
        icon: 'help-circle',
        text: t('meetings.transcriptLikely', 'May Have Transcript'),
        className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
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
      icon: 'help-circle',
      text: 'Unknown',
      className: 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800'
    };
  };

  const badge = getBadge();

  return (
    <Card
      className={`p-4 transition-all duration-200 relative ${
        isLoadingTranscript
          ? 'cursor-wait opacity-75 animate-pulse border-primary'
          : isFuture
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'
          : 'cursor-pointer hover:border-primary hover:shadow-lg hover:scale-[1.02] hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:ring-2 hover:ring-primary/20'
      }`}
      onClick={isFuture || isLoadingTranscript ? undefined : onClick}
    >
      {isLoadingTranscript && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Icon name="loader" className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('meetings.loadingTranscript', 'Fetching transcript...')}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
            <Icon name="clock" className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="font-medium">{formatTime(meeting.start)} - {formatTime(meeting.end)}</span>
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
              <span>{t('meetings.attendees', { count: meeting.attendees.length })}</span>
            </div>
          )}
        </div>

        {/* Transcript Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${badge.className}`}>
          <Icon name={badge.icon} className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{badge.text}</span>
        </div>
      </div>

      {/* Expanded View - Attendees and Process Button */}
      {isExpanded && !isLoadingTranscript && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top duration-300">
          {/* Attendees Section */}
          {meeting.attendees.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Icon name="users" className="w-4 h-4" />
                {t('meetings.attendeesList', 'Attendees')} ({meeting.attendees.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {meeting.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {attendee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {attendee.name}
                      </p>
                      {attendee.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {attendee.email}
                        </p>
                      )}
                    </div>
                    {(() => {
                      // Check if this attendee is the organizer
                      const isOrganizer = attendee.type === 'organizer' ||
                                          attendee.response === 'organizer' ||
                                          attendee.email.toLowerCase() === meeting.organizer.email.toLowerCase();

                      if (isOrganizer) {
                        return (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            {t('meetings.organizer', 'Organizer')}
                          </span>
                        );
                      }

                      // Otherwise show response status
                      if (attendee.response && attendee.response !== 'organizer' && attendee.response !== 'notResponded') {
                        return (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            attendee.response === 'accepted'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : attendee.response === 'declined'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {attendee.response}
                          </span>
                        );
                      }

                      return null;
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Meeting Button */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick(); // Collapse the card
              }}
              className="flex-shrink-0"
            >
              <Icon name="chevron-up" className="w-4 h-4 mr-1" />
              {t('meetings.collapse', 'Collapse')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                if (onProcessMeeting) {
                  onProcessMeeting();
                }
              }}
              className="flex-1"
              disabled={isFuture}
            >
              <Icon name="sparkles" className="w-4 h-4 mr-2" />
              {t('meetings.processMeeting', 'Process This Meeting')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
