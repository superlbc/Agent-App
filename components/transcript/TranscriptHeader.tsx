/**
 * TranscriptHeader - Display meeting context for imported transcripts
 * Shows meeting name, date, and readonly indicator
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';

interface TranscriptHeaderProps {
  meetingName?: string;
  meetingDate?: Date;
}

export const TranscriptHeader: React.FC<TranscriptHeaderProps> = ({
  meetingName,
  meetingDate
}) => {
  const { t } = useTranslation('common');

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon name="calendar" className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />

        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {t('transcript.importedFrom', 'Imported from:')}
        </span>

        {meetingName && (
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            {meetingName}
          </span>
        )}

        {meetingDate && (
          <>
            <span className="text-blue-400 dark:text-blue-600">•</span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {formatDate(meetingDate)}
            </span>
          </>
        )}

        <Tooltip content={t('transcript.readonlyTooltip', 'This transcript was imported from your calendar and cannot be edited. Switch to manual mode to edit.')}>
          <div className="flex items-center gap-1 ml-auto">
            <Icon name="lock" className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {t('transcript.readonly', 'Read-only')}
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
