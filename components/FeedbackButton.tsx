import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from './ui/Tooltip';
import { Icon } from './ui/Icon';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton: React.FC = () => {
  const { t } = useTranslation('feedback');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) - permanent position at bottom */}
      <Tooltip content={t('button.tooltip')}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-600/20"
          aria-label={t('button.label')}
        >
          <Icon name="chat-bubble" className="h-4 w-4" />
          <span className="text-sm font-medium">{t('button.label')}</span>
        </button>
      </Tooltip>

      {/* Feedback Modal */}
      {isModalOpen && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
