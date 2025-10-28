/**
 * ParticipantsModal - Full-screen modal for viewing and managing meeting participants
 * Shows participant list with search, matching, and management capabilities
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { ParticipantsPanel } from './ParticipantsPanel';
import { Participant, GraphData } from '../../types';
import { ParsedContact } from '../../utils/emailListParser';
import { BatchAddResult, BatchAddProgress } from '../../hooks/useParticipantExtraction';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  participants: Participant[];
  isExtracting: boolean;
  onExtractAndMatch: (transcript: string) => Promise<void>;
  onAddParticipant: (graphData: GraphData) => void;
  onBatchAddParticipants?: (
    contacts: ParsedContact[],
    source: 'emailList' | 'csv',
    onProgress?: (progress: BatchAddProgress) => void
  ) => Promise<BatchAddResult>;
  onRemoveParticipant: (id: string) => void;
  onSearchAndMatch: (participantId: string, searchQuery: string) => Promise<GraphData[]>;
  onConfirmMatch: (participantId: string, graphData: GraphData) => void;
  onMarkAsExternal: (participantId: string, email: string) => void;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  transcript,
  participants,
  isExtracting,
  onExtractAndMatch,
  onAddParticipant,
  onBatchAddParticipants,
  onRemoveParticipant,
  onSearchAndMatch,
  onConfirmMatch,
  onMarkAsExternal
}) => {
  const { t } = useTranslation('common');

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
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedCount = participants.filter(p => p.matched).length;
  const totalCount = participants.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t('participants.title', 'Meeting Participants')}
              </h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {matchedCount} {t('participants.of', 'of')} {totalCount} {t('participants.matched', 'matched')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('actions.close', 'Close')}
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ParticipantsPanel
              transcript={transcript}
              participants={participants}
              isExtracting={isExtracting}
              onExtractAndMatch={onExtractAndMatch}
              onAddParticipant={onAddParticipant}
              onBatchAddParticipants={onBatchAddParticipants}
              onRemoveParticipant={onRemoveParticipant}
              onSearchAndMatch={onSearchAndMatch}
              onConfirmMatch={onConfirmMatch}
              onMarkAsExternal={onMarkAsExternal}
              initialCollapsed={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
