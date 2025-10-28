import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Participant } from '../../types';
import { ParticipantHoverCard } from './ParticipantHoverCard';
import { getPresenceColor } from '../../utils/presenceService';

interface ParticipantCardProps {
    participant: Participant;
    index: number;
    onSearch: (participantId: string) => void;
    onRemove: (participantId: string) => void;
    onMarkAsExternal?: (participantId: string, email: string) => void;
    isLoggedUser?: boolean;
}

const getInitials = (name?: string, email?: string): string => {
    if (name) {
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return '?';
};

const isValidEmail = (text: string): boolean => {
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailPattern.test(text);
};

// Teams logo is now available in Icon component as 'teams-filled'

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
    participant,
    index,
    onSearch,
    onRemove,
    onMarkAsExternal,
    isLoggedUser = false
}) => {
    const { t } = useTranslation(['common']);

    // Loading state while searching Graph API
    if (participant.isSearching) {
        return (
            <Card className="p-2 bg-slate-50 dark:bg-slate-800/50 relative">
                <div className="flex items-center gap-2">
                    {/* Number */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                        {index}
                    </div>
                    {/* Avatar placeholder */}
                    <div className="h-8 w-8 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    {/* Content placeholder */}
                    <div className="flex-1 min-w-0">
                        <div className="h-3 w-32 mb-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                </div>
            </Card>
        );
    }

    // Matched state - show full profile (internal or external)
    if (participant.matched && participant.displayName) {
        // Get presence color for indicator
        const presenceColor = participant.presence ? getPresenceColor(participant.presence.availability) : 'gray';
        const presenceColorClasses: Record<string, string> = {
            green: 'bg-green-500',
            red: 'bg-red-500',
            yellow: 'bg-yellow-500',
            gray: 'bg-gray-400'
        };

        return (
            <ParticipantHoverCard participant={participant}>
                <Card className={`p-2 hover:shadow-md transition-all ${
                    isLoggedUser
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-slate-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {/* Number */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isLoggedUser
                                ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                            {index}
                        </div>

                        {/* Profile photo or initials with presence indicator */}
                        <div className="relative flex-shrink-0">
                            {participant.photoUrl && !participant.isExternal ? (
                                <img
                                    src={participant.photoUrl}
                                    alt={participant.displayName}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                    participant.isExternal
                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
                                }`}>
                                    {getInitials(participant.displayName, participant.email)}
                                </div>
                            )}
                            {/* Presence indicator */}
                            {participant.presence && (
                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${presenceColorClasses[presenceColor]}`} />
                            )}
                        </div>

                        {/* Name and job title */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {participant.displayName}
                                </p>
                                {isLoggedUser && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                        You
                                    </span>
                                )}
                                {participant.isExternal && (
                                    <span className="flex-shrink-0 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                        External
                                    </span>
                                )}
                                {/* Attendance metadata badges */}
                                {participant.attendanceType && (
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        participant.attendanceType === 'required'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                        {participant.attendanceType === 'required' ? 'Required' : 'Optional'}
                                    </span>
                                )}
                                {participant.acceptanceStatus && (
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        participant.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                        participant.acceptanceStatus === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                        participant.acceptanceStatus === 'tentative' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                        {participant.acceptanceStatus === 'accepted' ? '✓ Accepted' :
                                         participant.acceptanceStatus === 'declined' ? '✗ Declined' :
                                         participant.acceptanceStatus === 'tentative' ? '? Tentative' : '— No Response'}
                                    </span>
                                )}
                                {/* Actual attendance status (from attendance report) */}
                                {participant.attended !== undefined && (
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        participant.attended
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                        {participant.attended ? '✓ Attended' : '✗ Did Not Attend'}
                                    </span>
                                )}
                                {/* Attendance duration (from attendance report) */}
                                {participant.attendanceDurationMinutes !== undefined && participant.attendanceDurationMinutes > 0 && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        ⏱ {participant.attendanceDurationMinutes} min
                                    </span>
                                )}
                                {/* Speaker status (from transcript analysis) */}
                                {participant.spokeInMeeting && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                        💬 Spoke{participant.speakerMentionCount ? ` (${participant.speakerMentionCount}×)` : ''}
                                    </span>
                                )}
                            </div>
                            {/* Show job title if available */}
                            {participant.jobTitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {participant.jobTitle}
                                </p>
                            )}
                            {/* For external users without job title, show email as identifier */}
                            {!participant.jobTitle && participant.isExternal && participant.email && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {participant.email}
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Email button */}
                            {participant.email && (
                                <a
                                    href={`mailto:${participant.email}`}
                                    className="flex items-center justify-center h-7 w-7 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Send email"
                                    title="Send email"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Icon name="email" className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </a>
                            )}

                            {/* Teams button */}
                            {participant.email && (
                                <a
                                    href={`https://teams.microsoft.com/l/chat/0/0?users=${participant.email}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center h-7 w-7 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Open in Teams"
                                    title="Open in Microsoft Teams"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Icon name="teams-filled" className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </a>
                            )}

                            {/* Re-match button - opens search modal directly */}
                            {!participant.isExternal && (
                                <button
                                    onClick={() => onSearch(participant.id)}
                                    className="flex items-center justify-center h-7 w-7 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Change match"
                                    title="Change match"
                                >
                                    <Icon name="refresh" className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </button>
                            )}

                            {/* Remove button */}
                            <button
                                onClick={() => onRemove(participant.id)}
                                className="flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                aria-label="Remove"
                                title="Remove participant"
                            >
                                <Icon name="close" className="h-4 w-4 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                            </button>
                        </div>
                    </div>
                </Card>
            </ParticipantHoverCard>
        );
    }

    // Unmatched state - show what was extracted with option to match
    const isEmail = isValidEmail(participant.extractedText);

    return (
        <Card className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
                {/* Number with warning indicator */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-900/30 flex items-center justify-center text-xs font-semibold text-amber-800 dark:text-amber-300">
                    {index}
                </div>

                {/* Initials for unmatched */}
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0">
                    {isEmail ? (
                        getInitials(undefined, participant.extractedText)
                    ) : (
                        <Icon name="help" className="h-4 w-4" />
                    )}
                </div>

                {/* Extracted text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {participant.extractedText}
                    </p>
                    {isEmail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('participants.external', { defaultValue: 'External contact' })}
                        </p>
                    )}
                    {participant.searchError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {participant.searchError}
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Match button */}
                    <button
                        onClick={() => {
                            if (isEmail && onMarkAsExternal) {
                                onMarkAsExternal(participant.id, participant.extractedText);
                            } else {
                                onSearch(participant.id);
                            }
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            isEmail
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title={isEmail ? t('participants.addExternal', { defaultValue: 'Add External' }) : t('participants.match', { defaultValue: 'Match' })}
                    >
                        {isEmail ? t('participants.addExternal', { defaultValue: 'Add' }) : t('participants.match', { defaultValue: 'Match' })}
                    </button>

                    {/* Remove button */}
                    <button
                        onClick={() => onRemove(participant.id)}
                        className="flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Remove"
                        title="Remove"
                    >
                        <Icon name="close" className="h-4 w-4 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                    </button>
                </div>
            </div>
        </Card>
    );
};
