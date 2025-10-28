import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Participant, GraphData } from '../../types';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantSearchModal } from './ParticipantSearchModal';
import { TranscriptPopulatePromptModal } from './TranscriptPopulatePromptModal';
import { PresencePermissionBanner } from './PresencePermissionBanner';
import { useDebounce } from '../../hooks/useDebounce';
import { ParsedContact } from '../../utils/emailListParser';
import { BatchAddResult, BatchAddProgress } from '../../hooks/useParticipantExtraction';
import { AuthContext } from '../../contexts/AuthContext';
import { isParticipantExtractionDisabled, setParticipantExtractionDisabled } from '../../utils/resetUserData';

interface ParticipantsPanelProps {
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
    initialCollapsed?: boolean;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
    transcript,
    participants,
    isExtracting,
    onExtractAndMatch,
    onAddParticipant,
    onBatchAddParticipants,
    onRemoveParticipant,
    onSearchAndMatch,
    onConfirmMatch,
    onMarkAsExternal,
    initialCollapsed = true
}) => {
    const { t } = useTranslation(['common']);
    const authContext = useContext(AuthContext);
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchModalParticipantId, setSearchModalParticipantId] = useState<string | null>(null);
    const [searchModalInitialQuery, setSearchModalInitialQuery] = useState('');
    const [showAutoExtractDialog, setShowAutoExtractDialog] = useState(false);
    const [pendingTranscript, setPendingTranscript] = useState<string>('');
    const debouncedTranscript = useDebounce(transcript, 1000);

    // Get logged user email
    const loggedUserEmail = authContext?.user?.username?.toLowerCase();

    // Sort participants: logged user first, then others
    const sortedParticipants = useMemo(() => {
        if (!loggedUserEmail) return participants;

        return [...participants].sort((a, b) => {
            const aIsLoggedUser = a.email?.toLowerCase() === loggedUserEmail;
            const bIsLoggedUser = b.email?.toLowerCase() === loggedUserEmail;

            if (aIsLoggedUser && !bIsLoggedUser) return -1;
            if (!aIsLoggedUser && bIsLoggedUser) return 1;
            return 0;
        });
    }, [participants, loggedUserEmail]);

    // Show auto-extract confirmation dialog when transcript changes
    // Only if there are no manually added participants (from CSV/search)
    useEffect(() => {
        // Check both debounced and current transcript to prevent stale debounced values from triggering
        if (debouncedTranscript && debouncedTranscript.trim().length > 0 && transcript && transcript.trim().length > 0) {
            // Check if user has disabled participant extraction prompts
            if (isParticipantExtractionDisabled()) {
                // Auto-extract without prompting - BUT only if no manual/meeting participants exist
                const hasManualOrMeetingParticipants = participants.some(p =>
                    p.source === 'csv' || p.source === 'emailList' || p.source === 'manual' || p.source === 'meeting'
                );
                const hasTranscriptParticipants = participants.some(p => p.source === 'transcript');

                // Do NOT extract if participants came from meeting selection or were manually added
                if (!hasManualOrMeetingParticipants && !hasTranscriptParticipants) {
                    onExtractAndMatch(debouncedTranscript);
                }
                return;
            }

            // Check if participants were manually added (have source field)
            // 'meeting' source means participants were added from calendar meeting selection
            const hasManualParticipants = participants.some(p =>
                p.source === 'csv' || p.source === 'emailList' || p.source === 'manual' || p.source === 'meeting'
            );

            // Check if any transcript-based participants already exist
            const hasTranscriptParticipants = participants.some(p => p.source === 'transcript');

            // Only show dialog if no manual participants and no existing transcript participants
            if (!hasManualParticipants && !hasTranscriptParticipants) {
                setPendingTranscript(debouncedTranscript);
                setShowAutoExtractDialog(true);
            }
        } else if (!transcript || transcript.trim().length === 0) {
            // Close dialog if transcript is cleared
            setShowAutoExtractDialog(false);
            setPendingTranscript('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // Note: participants is intentionally NOT in deps to avoid infinite loop
        // We only want to extract when the transcript changes, not when participants update
    }, [debouncedTranscript, transcript, onExtractAndMatch]);

    // Count matched and unmatched participants
    const matchedCount = sortedParticipants.filter(p => p.matched).length;
    const unmatchedCount = sortedParticipants.filter(p => !p.matched && !p.isSearching).length;
    const totalCount = sortedParticipants.length;

    // Check if any internal matched participants are missing presence data
    const hasParticipantsWithoutPresence = participants.some(
        p => p.matched && !p.isExternal && p.graphId && !p.presence
    );

    const handleSearchParticipant = (participantId: string) => {
        const participant = participants.find(p => p.id === participantId);
        if (participant) {
            setSearchModalParticipantId(participantId);
            // Use display name if matched (for re-match), otherwise use extracted text
            setSearchModalInitialQuery(participant.matched && participant.displayName ? participant.displayName : participant.extractedText);
            setIsSearchModalOpen(true);
        }
    };

    const handleSearchModalSelect = (graphData: GraphData) => {
        if (searchModalParticipantId) {
            onConfirmMatch(searchModalParticipantId, graphData);
        }
        setSearchModalParticipantId(null);
        setSearchModalInitialQuery('');
    };

    const handleAddManually = () => {
        setSearchModalParticipantId(null);
        setSearchModalInitialQuery('');
        setIsSearchModalOpen(true);
    };

    const handleSearchModalClose = () => {
        setIsSearchModalOpen(false);
        setSearchModalParticipantId(null);
        setSearchModalInitialQuery('');
    };

    const handleAutoExtractConfirm = () => {
        setShowAutoExtractDialog(false);
        if (pendingTranscript) {
            onExtractAndMatch(pendingTranscript);
        }
        setPendingTranscript('');
    };

    const handleAutoExtractDecline = () => {
        setShowAutoExtractDialog(false);
        setPendingTranscript('');
    };

    const handleDoNotAskAgain = (checked: boolean) => {
        setParticipantExtractionDisabled(checked);
    };

    return (
        <>
            <Card className="p-2.5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center gap-1.5 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1 -ml-1"
                    >
                        <Icon
                            name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                            className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0"
                        />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t('participants.title', { defaultValue: 'Meeting Participants' })}
                        </h3>
                        {totalCount > 0 && (
                            <div className="flex items-center gap-1 ml-1">
                                <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 text-xs font-semibold text-white bg-primary rounded-full">
                                    {totalCount}
                                </span>
                                {unmatchedCount > 0 && (
                                    <span
                                        className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800/50 rounded-full"
                                        title={t('participants.unmatchedCount', {
                                            defaultValue: '{{count}} unmatched',
                                            count: unmatchedCount
                                        })}
                                    >
                                        !
                                    </span>
                                )}
                            </div>
                        )}
                        {isCollapsed && totalCount > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                {matchedCount > 0
                                    ? t('participants.matchedCount', {
                                        defaultValue: '{{matched}} of {{total}} matched',
                                        matched: matchedCount,
                                        total: totalCount
                                    })
                                    : t('participants.extractedCount', {
                                        defaultValue: '{{total}} extracted',
                                        total: totalCount
                                    })}
                            </span>
                        )}
                    </button>

                    {/* Add manually button */}
                    {!isCollapsed && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddManually}
                            className="ml-2 flex-shrink-0"
                        >
                            <Icon name="add" className="h-3.5 w-3.5 mr-1" />
                            {t('participants.addManually', { defaultValue: 'Add' })}
                        </Button>
                    )}
                </div>

                {/* Expanded content */}
                {!isCollapsed && (
                    <div className="mt-4 space-y-3">
                        {/* Presence permission banner */}
                        <PresencePermissionBanner hasParticipantsWithoutPresence={hasParticipantsWithoutPresence} />

                        {isExtracting ? (
                            // Extraction in progress
                            <div className="text-center py-6">
                                <Icon name="loader" className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {t('participants.extracting', { defaultValue: 'Extracting participants...' })}
                                </p>
                            </div>
                        ) : totalCount === 0 ? (
                            // Empty state
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                <Icon name="users" className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {t('participants.emptyState', { defaultValue: 'Paste transcript to identify participants' })}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    {t('participants.emptyStateHint', { defaultValue: 'Or click "Add" to manually add participants' })}
                                </p>
                            </div>
                        ) : (
                            // Participant list
                            <>
                                {matchedCount > 0 && unmatchedCount > 0 && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {t('participants.matchedCount', {
                                            defaultValue: '{{matched}} of {{total}} matched',
                                            matched: matchedCount,
                                            total: totalCount
                                        })}
                                    </p>
                                )}
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                                    {sortedParticipants.map((participant, idx) => {
                                        const isLoggedUser = !!(loggedUserEmail && participant.email?.toLowerCase() === loggedUserEmail);
                                        return (
                                            <ParticipantCard
                                                key={participant.id}
                                                participant={participant}
                                                index={idx + 1}
                                                onSearch={handleSearchParticipant}
                                                onRemove={onRemoveParticipant}
                                                onMarkAsExternal={onMarkAsExternal}
                                                isLoggedUser={isLoggedUser}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Card>

            {/* Search Modal */}
            <ParticipantSearchModal
                isOpen={isSearchModalOpen}
                onClose={handleSearchModalClose}
                onSelect={(graphData) => {
                    if (searchModalParticipantId) {
                        handleSearchModalSelect(graphData);
                    } else {
                        // Manual add
                        onAddParticipant(graphData);
                    }
                    handleSearchModalClose();
                }}
                onBatchAdd={onBatchAddParticipants}
                initialQuery={searchModalInitialQuery}
            />

            {/* Auto-Extract Confirmation Dialog */}
            <TranscriptPopulatePromptModal
                isOpen={showAutoExtractDialog}
                participantCount={participants.length}
                onYes={handleAutoExtractConfirm}
                onNo={handleAutoExtractDecline}
                onDoNotAskAgain={handleDoNotAskAgain}
            />
        </>
    );
};
