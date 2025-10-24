import React, { useState, useEffect } from 'react';
import { Participant } from '../../types';
import { Icon } from '../ui/Icon';
import { getPresenceColor, getPresenceText } from '../../utils/presenceService';

interface ParticipantHoverCardProps {
    participant: Participant;
    children: React.ReactNode;
}

export const ParticipantHoverCard: React.FC<ParticipantHoverCardProps> = ({ participant, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
    const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Don't show hover card for unmatched participants
    if (!participant.matched || !participant.displayName) {
        return <>{children}</>;
    }

    const presenceColor = participant.presence ? getPresenceColor(participant.presence.availability) : 'gray';
    const presenceText = participant.presence ? getPresenceText(participant.presence.availability, participant.presence.activity) : null;

    const presenceColorClasses: Record<string, string> = {
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        gray: 'bg-gray-400'
    };

    const handleMouseEnter = () => {
        // Clear any existing timer
        if (hoverTimer) {
            clearTimeout(hoverTimer);
        }

        // Calculate position
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCardPosition({
                top: rect.bottom + 8, // 8px below the card
                left: rect.left
            });
        }

        // Set a 1-second delay before showing
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);
        setHoverTimer(timer);
    };

    const handleMouseLeave = () => {
        // Clear the timer if mouse leaves before 1 second
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            setHoverTimer(null);
        }
        setIsVisible(false);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
            }
        };
    }, [hoverTimer]);

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>

            {/* Hover Card - rendered with fixed positioning outside scroll container */}
            {isVisible && cardPosition && (
                <div
                    className="fixed w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[9999] p-3"
                    style={{
                        top: `${cardPosition.top}px`,
                        left: `${cardPosition.left}px`
                    }}
                    role="tooltip"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Profile Photo or Initials */}
                    <div className="flex items-start gap-3 mb-3">
                        {participant.photoUrl && !participant.isExternal ? (
                            <img
                                src={participant.photoUrl}
                                alt={participant.displayName}
                                className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                participant.isExternal
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
                            }`}>
                                {getInitials(participant.displayName)}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-0.5">
                                {participant.displayName}
                            </h4>
                            {participant.jobTitle && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {participant.jobTitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Presence Status */}
                    {presenceText && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div className={`h-2 w-2 rounded-full ${presenceColorClasses[presenceColor]}`} />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                {presenceText}
                            </span>
                        </div>
                    )}

                    {/* Extended Information */}
                    <div className="space-y-2">
                        {participant.email && (
                            <div className="flex items-start gap-2">
                                <Icon name="email" className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 dark:text-slate-300 break-all">
                                    {participant.email}
                                </span>
                            </div>
                        )}

                        {participant.companyName && (
                            <div className="flex items-start gap-2">
                                <Icon name="building" className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                    {participant.companyName}
                                </span>
                            </div>
                        )}

                        {participant.department && (
                            <div className="flex items-start gap-2">
                                <Icon name="users" className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                    {participant.department}
                                </span>
                            </div>
                        )}

                        {participant.officeLocation && (
                            <div className="flex items-start gap-2">
                                <Icon name="location" className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                    {participant.officeLocation}
                                </span>
                            </div>
                        )}

                        {participant.isExternal && (
                            <div className="flex items-start gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <Icon name="external" className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                    External Participant
                                </span>
                            </div>
                        )}

                        {/* Attendance Information */}
                        {(participant.attendanceType || participant.acceptanceStatus) && (
                            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                                <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Meeting Attendance
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {participant.attendanceType && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            participant.attendanceType === 'required'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                            {participant.attendanceType === 'required' ? 'Required Attendee' : 'Optional Attendee'}
                                        </span>
                                    )}
                                    {participant.acceptanceStatus && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

function getInitials(name?: string): string {
    if (!name) return '?';

    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}
