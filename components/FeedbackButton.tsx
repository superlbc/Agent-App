import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from './ui/Tooltip';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton: React.FC = () => {
  const { t } = useTranslation('feedback');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <Tooltip content={t('button.tooltip')}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:hover:bg-primary-dark dark:shadow-primary/20"
          aria-label={t('button.label')}
        >
          <span className="text-xl" aria-hidden="true">💬</span>
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
