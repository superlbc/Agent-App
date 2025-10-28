/**
 * TranscriptViewer - Main component for viewing imported transcripts
 * Features:
 * - Card-based conversation layout
 * - Profile photos and speaker info
 * - Search with highlighting
 * - Readonly mode
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Participant } from '../../types';
import { parseVTTToConversation, findTextMatches, hasSpeakerInfo, ConversationBlock, Match } from '../../utils/transcriptParser';
import { TranscriptHeader } from './TranscriptHeader';
import { TranscriptSearchBar } from './TranscriptSearchBar';
import { ConversationCard } from './ConversationCard';
import { ReadonlyIndicator } from './ReadonlyIndicator';
import { Icon } from '../ui/Icon';
import { normalizeSpeakerName } from '../../utils/vttSpeakerExtraction';

interface TranscriptViewerProps {
  transcript: string;           // VTT format transcript
  participants: Participant[];  // For matching speakers & profile photos
  meetingName?: string;         // Display context
  meetingDate?: Date;           // Display context
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  participants,
  meetingName,
  meetingDate
}) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Parse transcript into conversation blocks
  const conversationBlocks = useMemo(() => {
    return parseVTTToConversation(transcript);
  }, [transcript]);

  // Check if transcript has speaker information
  const hasValidSpeakerInfo = useMemo(() => {
    return hasSpeakerInfo(transcript);
  }, [transcript]);

  // Find all search matches
  const matches = useMemo(() => {
    if (!searchQuery) return [];
    return findTextMatches(conversationBlocks, searchQuery);
  }, [conversationBlocks, searchQuery]);

  // Reset match index when search query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);


  // Find participant match for a speaker
  const findParticipant = (speakerName: string): Participant | undefined => {
    if (!participants || participants.length === 0) {
      return undefined;
    }

    // Remove location/office in parentheses: "Bustos, Luis (LDN-MOM)" -> "Bustos, Luis"
    const cleanSpeakerName = speakerName.replace(/\s*\([^)]+\)\s*$/, '').trim();
    const normalizedSpeaker = normalizeSpeakerName(cleanSpeakerName);

    // Try direct match - clean participant displayName too!
    let match = participants.find(p => {
      if (!p.displayName) return false;
      // Clean participant displayName before comparing
      const cleanParticipantName = p.displayName.replace(/\s*\([^)]+\)\s*$/, '').trim();
      return normalizeSpeakerName(cleanParticipantName) === normalizedSpeaker;
    });

    // If no match and name has comma, try reversed: "Bustos, Luis" -> "Luis Bustos"
    if (!match && cleanSpeakerName.includes(',')) {
      const parts = cleanSpeakerName.split(',').map(p => p.trim());
      if (parts.length === 2) {
        const reversedName = `${parts[1]} ${parts[0]}`;
        const normalizedReversed = normalizeSpeakerName(reversedName);

        match = participants.find(p => {
          if (!p.displayName) return false;
          // Clean participant displayName before comparing
          const cleanParticipantName = p.displayName.replace(/\s*\([^)]+\)\s*$/, '').trim();
          return normalizeSpeakerName(cleanParticipantName) === normalizedReversed;
        });
      }
    }

    return match;
  };

  // Navigate to previous/next match
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (matches.length === 0) return;

    if (direction === 'next') {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    } else {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  };

  // Get current match block index for highlighting
  const currentMatchBlockIndex = matches.length > 0 ? matches[currentMatchIndex].blockIndex : -1;

  // If no transcript content
  if (!transcript || transcript.trim().length === 0) {
    return (
      <div className="p-8 text-center">
        <Icon name="file-text" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('transcript.noContent', 'No transcript content available')}
        </p>
      </div>
    );
  }

  // If transcript has no speaker information
  if (!hasValidSpeakerInfo) {
    return (
      <div className="space-y-4">
        <TranscriptHeader meetingName={meetingName} meetingDate={meetingDate} />

        {/* Warning message */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="alert-circle" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {t('transcript.noSpeakerInfo', 'No Speaker Information')}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('transcript.noSpeakerInfoDescription', 'This transcript does not contain speaker information. Showing as plain text.')}
              </p>
            </div>
          </div>
        </div>

        {/* Plain text display */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg max-h-96 overflow-y-auto">
          <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
            {transcript}
          </pre>
        </div>

        <ReadonlyIndicator />
      </div>
    );
  }

  // Normal conversation card view
  return (
    <div className="space-y-4">
      {/* Header */}
      <TranscriptHeader meetingName={meetingName} meetingDate={meetingDate} />

      {/* Search Bar */}
      <TranscriptSearchBar
        query={searchQuery}
        onSearch={setSearchQuery}
        matchCount={matches.length}
        currentMatchIndex={currentMatchIndex}
        onNavigate={handleNavigate}
        onClear={handleClearSearch}
      />

      {/* Conversation Cards */}
      <div className="space-y-0 max-h-96 overflow-y-auto p-1">
        {conversationBlocks.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="message-square" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('transcript.noMessages', 'No conversation messages found')}
            </p>
          </div>
        ) : (
          conversationBlocks.map((block, index) => (
            <ConversationCard
              key={`block-${index}`}
              speaker={block.speaker}
              timestamp={block.timestamp}
              message={block.message}
              participant={findParticipant(block.speaker)}
              searchQuery={searchQuery}
              isCurrentMatch={index === currentMatchBlockIndex}
            />
          ))
        )}
      </div>

      {/* Readonly Indicator */}
      <ReadonlyIndicator />
    </div>
  );
};
