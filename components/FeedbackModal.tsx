import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { feedbackService, FeedbackType, FeedbackPriority } from '../utils/feedbackService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icon } from './ui/Icon';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'form' | 'submitting' | 'success';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('feedback');
  const [isDarkMode] = useLocalStorage('darkMode', false);

  // Form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // UI state
  const [modalState, setModalState] = useState<ModalState>('form');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (modalState === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modalState, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModalState('form');
      setTitle('');
      setDescription('');
      setFeedbackType('bug');
      setPriority('medium');
      setErrors({});
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = t('validation.titleRequired');
    } else if (title.trim().length < 5) {
      newErrors.title = t('validation.titleTooShort', { min: 5 });
    }

    if (!description.trim()) {
      newErrors.description = t('validation.descriptionRequired');
    } else if (description.trim().length < 10) {
      newErrors.description = t('validation.descriptionTooShort', { min: 10 });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setModalState('submitting');

    try {
      await feedbackService.submitFeedback(
        feedbackType,
        priority,
        title.trim(),
        description.trim(),
        isDarkMode
      );
      setModalState('success');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Fire-and-forget: even if it fails, we show success to avoid blocking the user
      setModalState('success');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalState === 'form') {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalState === 'form') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, modalState]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        {/* Form State */}
        {modalState === 'form' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2
                id="feedback-modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <span>💬</span>
                {t('modal.title')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={t('form.cancel')}
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Intro */}
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {t('modal.intro')}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.type.label')}
                </label>
                <select
                  id="feedback-type"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="bug">{t('form.type.icons.bug')} {t('form.type.options.bug')}</option>
                  <option value="feature">{t('form.type.icons.feature')} {t('form.type.options.feature')}</option>
                  <option value="comment">{t('form.type.icons.comment')} {t('form.type.options.comment')}</option>
                  <option value="performance">{t('form.type.icons.performance')} {t('form.type.options.performance')}</option>
                  <option value="documentation">{t('form.type.icons.documentation')} {t('form.type.options.documentation')}</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="feedback-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.priority.label')} <span className="text-gray-500 dark:text-gray-400">{t('form.priority.optional')}</span>
                </label>
                <select
                  id="feedback-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="critical">{t('form.priority.icons.critical')} {t('form.priority.options.critical')}</option>
                  <option value="high">{t('form.priority.icons.high')} {t('form.priority.options.high')}</option>
                  <option value="medium">{t('form.priority.icons.medium')} {t('form.priority.options.medium')}</option>
                  <option value="low">{t('form.priority.icons.low')} {t('form.priority.options.low')}</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="feedback-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.title.label')} <span className="text-red-500">{t('form.title.required')}</span>
                </label>
                <input
                  type="text"
                  id="feedback-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('form.title.placeholder')}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary transition-colors ${
                    errors.title
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                  }`}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="mt-1 text-sm text-red-500">
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="feedback-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.description.label')} <span className="text-red-500">{t('form.description.required')}</span>
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('form.description.placeholder')}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary transition-colors resize-vertical ${
                    errors.description
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                  }`}
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                />
                {errors.description && (
                  <p id="description-error" className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Info note */}
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Browser and device info will be automatically included to help us diagnose issues.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {t('form.submit')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Submitting State */}
        {modalState === 'submitting' && (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {t('states.submitting')}
            </p>
          </div>
        )}

        {/* Success State */}
        {modalState === 'success' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Icon name="check" className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('states.success.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              {t('states.success.message')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t('states.success.description', { type: t(`feedbackTypes.${feedbackType}`) })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
