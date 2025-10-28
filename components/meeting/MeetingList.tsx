/**
 * MeetingList - Display list of meetings for selected date
 * Handles meeting selection and shows transcript availability
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MeetingCard } from './MeetingCard';
import { Meeting } from '../../services/graphService';
import { Icon } from '../ui/Icon';

interface MeetingListProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  isTranscriptLikely: (meeting: Meeting) => boolean;
  isLoading?: boolean;
  loadingMeetingId?: string;
  expandedMeetingId?: string;
  onProcessMeeting?: (meeting: Meeting) => void;
}

export const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  onSelectMeeting,
  isTranscriptLikely,
  isLoading,
  loadingMeetingId,
  expandedMeetingId,
  onProcessMeeting
}) => {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Icon name="calendar" className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {t('meetings.noMeetings')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          {t('meetings.noMeetingsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('meetings.meetingsFound', { count: meetings.length })}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{t('meetings.legend.available')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>{t('meetings.legend.processing')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span>{t('meetings.legend.none')}</span>
          </div>
        </div>
      </div>

      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onClick={() => onSelectMeeting(meeting)}
          transcriptLikely={isTranscriptLikely(meeting)}
          isLoadingTranscript={loadingMeetingId === meeting.id}
          isExpanded={expandedMeetingId === meeting.id}
          onProcessMeeting={onProcessMeeting ? () => onProcessMeeting(meeting) : undefined}
        />
      ))}
    </div>
  );
};
