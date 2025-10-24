import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { Button } from './Button';

interface TestAgentBannerProps {
  onOpenSettings: () => void;
}

export const TestAgentBanner: React.FC<TestAgentBannerProps> = ({ onOpenSettings }) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <Icon name="error" className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              {t('common:testAgent.title')}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              {t('common:testAgent.description')}
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenSettings}
          variant="secondary"
          size="sm"
          className="flex-shrink-0 text-xs"
        >
          {t('common:testAgent.resetButton')}
        </Button>
      </div>
    </div>
  );
};
