import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon';
import { telemetryService } from '../utils/telemetryService';

interface UserNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotes: string;
  onSave: (notes: string) => void;
}

export const UserNotesModal: React.FC<UserNotesModalProps> = ({
  isOpen,
  onClose,
  currentNotes,
  onSave
}) => {
  const { t } = useTranslation(['forms', 'common']);
  const [notes, setNotes] = useState(currentNotes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with currentNotes when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes(currentNotes);

      // Telemetry: Track modal opened
      telemetryService.trackEvent('userNotesOpened', {
        hasExistingNotes: currentNotes.length > 0,
        existingNotesLength: currentNotes.length
      });
    }
  }, [isOpen, currentNotes]);

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    const trimmedNotes = notes.trim();

    // Telemetry: Track notes saved
    telemetryService.trackEvent('userNotesSaved', {
      notesLength: trimmedNotes.length,
      wordCount: trimmedNotes ? trimmedNotes.split(/\s+/).filter(Boolean).length : 0,
      wasEmpty: trimmedNotes.length === 0,
      changed: trimmedNotes !== currentNotes.trim()
    });

    onSave(trimmedNotes);
    onClose();
  };

  const handleClear = () => {
    setNotes('');
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const processNotesFile = (file: File) => {
    const reader = new FileReader();

    if (file.type === 'text/plain') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setNotes(prev => prev ? `${prev}\n\n${text}` : text);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      // @ts-ignore - mammoth is loaded from CDN
      if (typeof window.mammoth === 'undefined') {
        console.error('Mammoth library not loaded');
        return;
      }

      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // @ts-ignore
        window.mammoth.extractRawText({ arrayBuffer })
          .then((result: { value: string; }) => {
            setNotes(prev => prev ? `${prev}\n\n${result.value}` : result.value);
          })
          .catch((err: Error) => {
            console.error('Failed to read DOCX file:', err);
          });
      };
      reader.onerror = () => {
        console.error('Failed to read file');
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('Unsupported file type');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processNotesFile(file);
    }
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const charCount = notes.length;
  const wordCount = notes ? notes.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-notes-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              id="user-notes-modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <Icon name="file-text" className="w-5 h-5" />
              {t('forms:userNotes.modalTitle', 'Add User Notes')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={t('common:actions.close', 'Close')}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t('forms:userNotes.modalDescription', 'Add your own notes or additional context that will be sent to the AI agent. You can type, paste, or upload a file.')}
          </p>

          {/* Textarea */}
          <div className="mb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('forms:userNotes.placeholder', 'Type or paste your notes here...')}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-vertical"
            />

            {/* File input (hidden) */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              title="Upload notes file"
            />

            {/* Character count and file upload button */}
            <div className="mt-1.5 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>
                {t('forms:helperText.characterCount', { count: charCount, words: wordCount })}
              </span>
              <button
                type="button"
                onClick={handleFileUpload}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                aria-label={t('forms:userNotes.uploadFile', 'Upload file')}
              >
                <Icon name="upload" className="w-3 h-3" />
                {t('forms:userNotes.uploadFile', 'Upload file')}
              </button>
            </div>
          </div>

          {/* Info note */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="info" className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {t('forms:userNotes.infoNote', 'These notes will be labeled as "User Provided Notes" when sent to the AI agent, helping distinguish them from the meeting transcript.')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClear}
              disabled={!notes.trim()}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common:actions.clear', 'Clear')}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                {t('common:actions.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('common:actions.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
