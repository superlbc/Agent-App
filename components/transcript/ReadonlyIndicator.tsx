/**
 * ReadonlyIndicator - Small badge indicating readonly status
 * Appears at bottom of transcript viewer
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';

export const ReadonlyIndicator: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
      <Tooltip content={t('transcript.readonlyExplanation', 'This transcript was imported from your calendar meeting and cannot be edited directly. To edit the transcript, use the "Switch to Manual Edit Mode" button above.')}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-help">
          <Icon name="lock" className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('transcript.importedMeeting', 'Imported Meeting')}
          </span>
        </div>
      </Tooltip>
    </div>
  );
};
