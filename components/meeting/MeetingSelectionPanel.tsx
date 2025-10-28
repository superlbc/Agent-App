/**
 * MeetingSelectionPanel - Main panel for selecting meetings from calendar
 * Orchestrates CalendarPicker, MeetingList, and transcript fetching
 *
 * Flow:
 * 1. User selects date from calendar
 * 2. Panel fetches meetings for that date
 * 3. User clicks on a meeting
 * 4. Panel fetches meeting details + transcript
 * 5. Callback fires to auto-populate parent form
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPicker } from './CalendarPicker';
import { MeetingList } from './MeetingList';
import { MeetingService, Meeting, MeetingWithTranscript } from '../../services/meetingService';
import { GraphService } from '../../services/graphService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface MeetingSelectionPanelProps {
  onMeetingSelected: (data: MeetingWithTranscript) => void;
  onError: (error: string) => void;
  selectedMeetingTranscript?: string;
  selectedMeetingParticipants?: Array<{ name: string; email: string; role?: string }>;
  onViewTranscript?: () => void;
  onViewParticipants?: () => void;
}

export const MeetingSelectionPanel: React.FC<MeetingSelectionPanelProps> = ({
  onMeetingSelected,
  onError,
  selectedMeetingTranscript,
  selectedMeetingParticipants,
  onViewTranscript,
  onViewParticipants
}) => {
  const { t } = useTranslation('common');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [loadingMeetingId, setLoadingMeetingId] = useState<string | undefined>(undefined);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | undefined>(undefined);
  const [isCheckingTranscripts, setIsCheckingTranscripts] = useState(false);
  const [meetingService] = useState(() => new MeetingService());
  const [graphService] = useState(() => GraphService.getInstance());
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithTranscript | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasUserClickedDate, setHasUserClickedDate] = useState(false); // Track if user actively clicked a date

  // Ref for debouncing transcript checks
  const transcriptCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch meetings when date changes - only if user has clicked a date
  useEffect(() => {
    if (hasUserClickedDate) {
      loadMeetingsForDate(selectedDate);
    }
  }, [selectedDate, hasUserClickedDate]);

  // Preload calendar on mount - load meetings for calendar counts immediately
  useEffect(() => {
    loadMeetingsForCalendar();
  }, []);

  /**
   * Load meetings for calendar display (counts on dates)
   * This runs on mount to show meeting counts immediately
   */
  const loadMeetingsForCalendar = async () => {
    try {
      const today = new Date();
      const rangeStart = new Date(today);
      rangeStart.setDate(rangeStart.getDate() - 28); // 4 weeks back
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(today);
      rangeEnd.setDate(rangeEnd.getDate() + 28); // 4 weeks forward
      rangeEnd.setHours(23, 59, 59, 999);

      const allCalendarMeetings = await meetingService.getCalendarMeetings(
        rangeStart,
        rangeEnd
      );

      // Store all meetings for calendar counts
      setAllMeetings(allCalendarMeetings);
      console.log(`[MeetingSelection] Preloaded ${allCalendarMeetings.length} meetings for calendar display`);
    } catch (error) {
      console.error('Failed to preload calendar meetings:', error);
      // Don't show error to user - this is a background operation
    }
  };


  /**
   * Checks transcript availability for an array of meetings
   * Updates meeting.transcriptStatus for each meeting
   * Runs in parallel for performance
   *
   * IMPORTANT: For recurring meetings, filters transcripts by meeting date
   * to ensure we only show "available" if a transcript exists for THIS specific occurrence
   */
  const checkTranscriptAvailability = useCallback(async (meetingsToCheck: Meeting[]) => {
    if (!meetingsToCheck || meetingsToCheck.length === 0) {
      return;
    }

    // Filter to only online meetings (transcripts only available for Teams meetings)
    const onlineMeetings = meetingsToCheck.filter(m => m.hasOnlineMeeting && (m.onlineMeetingId || m.joinUrl));

    if (onlineMeetings.length === 0) {
      console.log('[TranscriptCheck] No online meetings to check');
      return;
    }

    console.log('[TranscriptCheck] ============================================');
    console.log(`[TranscriptCheck] Checking transcript availability for ${onlineMeetings.length} meetings`);
    console.log('[TranscriptCheck] ============================================');

    setIsCheckingTranscripts(true);

    // Set all meetings to 'checking' status initially
    setMeetings(prev => prev.map(meeting => {
      const isOnline = onlineMeetings.find(m => m.id === meeting.id);
      return isOnline ? { ...meeting, transcriptStatus: 'checking' as const } : meeting;
    }));

    // Check each meeting in parallel
    const checkPromises = onlineMeetings.map(async (meeting) => {
      try {
        console.log(`[TranscriptCheck]   Checking: ${meeting.subject} (${meeting.start.toISOString()})`);

        // Call listTranscripts API (lightweight - only returns metadata, not content)
        const transcripts = await graphService.listTranscripts(
          meeting.onlineMeetingId || '',
          meeting.joinUrl
        );

        if (!transcripts || transcripts.length === 0) {
          console.log(`[TranscriptCheck]   ❌ ${meeting.subject}: No transcripts found`);
          return {
            meetingId: meeting.id,
            transcriptStatus: 'unavailable' as const,
            transcriptCount: 0
          };
        }

        console.log(`[TranscriptCheck]   📋 ${meeting.subject}: Found ${transcripts.length} total transcript(s)`);

        // For recurring meetings, show "available" if ANY transcript exists in the series
        // Users can browse all iterations via tabs - no need to filter by date here
        if (transcripts.length > 1) {
          console.log(`[TranscriptCheck]   🔄 Recurring meeting detected - ${transcripts.length} iterations available`);
          transcripts.forEach((t, i) => {
            console.log(`[TranscriptCheck]      Iteration ${i + 1}: ${new Date(t.createdDateTime).toLocaleDateString()}`);
          });
        }

        // Check if ANY transcript exists within reasonable time of the selected date
        // (to determine badge status - we still want to show "unavailable" if no transcript for THIS instance)
        const meetingStart = new Date(meeting.start);
        const searchWindowStart = new Date(meetingStart);
        searchWindowStart.setHours(searchWindowStart.getHours() - 1);

        const searchWindowEnd = new Date(meetingStart);
        searchWindowEnd.setHours(searchWindowEnd.getHours() + 24);

        const hasTranscriptForThisInstance = transcripts.some(t => {
          const transcriptDate = new Date(t.createdDateTime);
          return transcriptDate >= searchWindowStart && transcriptDate <= searchWindowEnd;
        });

        console.log(`[TranscriptCheck]   ${hasTranscriptForThisInstance ? '✅' : '❌'} ${meeting.subject}: ${hasTranscriptForThisInstance ? 'HAS' : 'NO'} transcript for ${meetingStart.toLocaleDateString()}`);

        return {
          meetingId: meeting.id,
          transcriptStatus: hasTranscriptForThisInstance ? ('available' as const) : ('unavailable' as const),
          transcriptCount: transcripts.length, // Total count across all iterations
          transcripts: transcripts // Store ALL transcripts for multi-iteration viewer
        };
      } catch (error) {
        console.error(`[TranscriptCheck]   ❌ Error checking ${meeting.subject}:`, error);
        // On error, mark as unknown (could be permission issue, meeting not found, etc.)
        return {
          meetingId: meeting.id,
          transcriptStatus: 'unknown' as const,
          transcriptCount: 0
        };
      }
    });

    // Wait for all checks to complete
    const results = await Promise.all(checkPromises);

    console.log('[TranscriptCheck] ============================================');
    console.log(`[TranscriptCheck] ✅ Transcript check complete`);
    const available = results.filter(r => r.transcriptStatus === 'available').length;
    const unavailable = results.filter(r => r.transcriptStatus === 'unavailable').length;
    console.log(`[TranscriptCheck]   Available: ${available}/${onlineMeetings.length}`);
    console.log(`[TranscriptCheck]   Unavailable: ${unavailable}/${onlineMeetings.length}`);
    console.log('[TranscriptCheck] ============================================');

    // Update meetings with transcript status and metadata
    setMeetings(prev => prev.map(meeting => {
      const result = results.find(r => r.meetingId === meeting.id);
      return result
        ? {
            ...meeting,
            transcriptStatus: result.transcriptStatus,
            transcriptCount: result.transcriptCount,
            transcripts: result.transcripts // Store transcript metadata for multi-iteration viewer
          }
        : meeting;
    }));

    setIsCheckingTranscripts(false);
  }, [graphService]);

  const loadMeetingsForDate = async (date: Date) => {
    setIsLoadingCalendar(true);
    try {
      // Load a wide range of meetings for calendar counts (4 weeks back, 4 weeks forward)
      // This ensures meeting counts show even when navigating to future/past weeks
      const rangeStart = new Date(date);
      rangeStart.setDate(rangeStart.getDate() - 28); // 4 weeks back
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(date);
      rangeEnd.setDate(rangeEnd.getDate() + 28); // 4 weeks forward
      rangeEnd.setHours(23, 59, 59, 999);

      const allCalendarMeetings = await meetingService.getCalendarMeetings(
        rangeStart,
        rangeEnd
      );

      // Store all meetings for calendar counts
      setAllMeetings(allCalendarMeetings);

      console.log(`[MeetingSelection] Loaded ${allCalendarMeetings.length} meetings for date range`);
      if (allCalendarMeetings.length > 0) {
        console.log(`[MeetingSelection] First meeting: ${allCalendarMeetings[0].subject} at ${allCalendarMeetings[0].start}`);
        console.log(`[MeetingSelection] Last meeting: ${allCalendarMeetings[allCalendarMeetings.length - 1].subject} at ${allCalendarMeetings[allCalendarMeetings.length - 1].start}`);
      }

      // Filter to only meetings for the selected day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`[MeetingSelection] Filtering for selected day: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      const dayMeetings = allCalendarMeetings.filter(meeting => {
        const meetingTime = new Date(meeting.start);
        return meetingTime >= startOfDay && meetingTime <= endOfDay;
      });

      console.log(`[MeetingSelection] Found ${dayMeetings.length} meetings for selected day`);
      setMeetings(dayMeetings);

      // Check transcript availability for meetings on this day
      // Use debouncing to avoid spamming API during rapid navigation
      if (transcriptCheckTimeoutRef.current) {
        clearTimeout(transcriptCheckTimeoutRef.current);
        console.log('[MeetingSelection] Cancelled previous transcript check (debouncing)');
      }

      // Debounce: wait 500ms before checking transcripts
      // If user navigates to another day within 500ms, this will be cancelled
      transcriptCheckTimeoutRef.current = setTimeout(() => {
        console.log('[MeetingSelection] Debounce delay complete, starting transcript check...');
        checkTranscriptAvailability(dayMeetings);
      }, 500);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      onError('Unable to load meetings. Please try again.');
      setMeetings([]);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Handle expand/collapse of meeting card
  const handleToggleExpand = (meeting: Meeting) => {
    console.log('[MeetingSelection] Toggle expand for meeting:', { id: meeting.id, subject: meeting.subject });

    // Toggle: if already expanded, collapse it; otherwise expand it
    if (expandedMeetingId === meeting.id) {
      setExpandedMeetingId(undefined);
    } else {
      setExpandedMeetingId(meeting.id);
    }
  };

  // Handle processing the meeting (fetch transcript)
  const handleProcessMeeting = async (meeting: Meeting) => {
    console.log('[MeetingSelection] Processing meeting:', { id: meeting.id, subject: meeting.subject });

    if (!meeting.id) {
      console.error('[MeetingSelection] Meeting ID is undefined!', meeting);
      onError('Invalid meeting data. Please try refreshing the page.');
      return;
    }

    setIsLoadingTranscript(true);
    setLoadingMeetingId(meeting.id);
    try {
      // Fetch full meeting details + transcript
      const meetingWithTranscript = await meetingService.getMeetingWithTranscript(
        meeting.id
      );

      // Store selected meeting and keep it expanded to show action buttons
      setSelectedMeeting(meetingWithTranscript);
      // Keep the card expanded to show View Transcript/Participants buttons
      // setExpandedMeetingId remains as the selected meeting to show the buttons

      // Notify parent component
      onMeetingSelected(meetingWithTranscript);

      // Show success feedback
      if (meetingWithTranscript.transcript?.content) {
        // Success feedback handled by parent
      } else {
        // Explain why transcript might not be available
        const isOrganizer = meetingWithTranscript.isOrganizer;
        const errorMsg = isOrganizer
          ? 'Transcript not found. It may still be processing (takes 5-10 minutes after meeting ends) or recording was not enabled.'
          : 'Transcript not available. Transcripts are typically only accessible to the meeting organizer. You can still paste the transcript manually.';
        onError(errorMsg);
      }
    } catch (error) {
      console.error('Failed to fetch meeting details:', error);
      onError('Unable to load meeting details. Please try again.');
    } finally {
      setIsLoadingTranscript(false);
      setLoadingMeetingId(undefined);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setMeetings([]); // Clear previous meetings
    setExpandedMeetingId(undefined); // Collapse any expanded meeting
    setSelectedMeeting(null); // Clear selection to show new meetings
    setIsCollapsed(false); // Expand panel to show meetings for new date
    setHasUserClickedDate(true); // User has actively clicked a date
  };

  const isTranscriptLikely = (meeting: Meeting): boolean => {
    return meetingService.isTranscriptLikely(meeting);
  };

  // Check if the given date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Function to change meeting selection
  // Keep the selected meeting visible but show the meeting list again
  const handleChangeSelection = () => {
    setIsCollapsed(false);
    // Don't clear selectedMeeting - keep it so it shows with green styling
    setExpandedMeetingId(undefined);
  };

  // Show collapsed view if meeting is selected
  if (isCollapsed && selectedMeeting) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <Icon name="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                {t('meetings.meetingSelected', 'Meeting Selected')}
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {selectedMeeting.subject}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {selectedMeeting.start.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} • {selectedMeeting.start.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangeSelection}
            className="flex-shrink-0"
          >
            <Icon name="refresh" className="w-4 h-4 mr-1.5" />
            {t('meetings.changeMeeting', 'Change Meeting')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Picker */}
      <Card className="p-4">
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={handleDateChange}
          allMeetings={allMeetings}
        />
      </Card>

      {/* Meetings List - Only show after user has clicked a date */}
      {hasUserClickedDate && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {selectedMeeting ? (
                  t('meetings.selectedMeeting', 'Selected Meeting')
                ) : (
                  <>
                    {t('meetings.title')} {selectedDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </>
                )}
              </h3>
              {!selectedMeeting && (
                <div className="flex items-center gap-2">
                  {meetings.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('meetings.meetingCount', { count: meetings.length })}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasUserClickedDate(true);
                      loadMeetingsForDate(selectedDate);
                    }}
                    disabled={isLoadingCalendar}
                    className="h-7 px-2"
                  >
                    <Icon name="refresh" className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <MeetingList
              meetings={meetings}
              onSelectMeeting={handleToggleExpand}
              isTranscriptLikely={isTranscriptLikely}
              isLoading={isLoadingCalendar}
              loadingMeetingId={loadingMeetingId}
              expandedMeetingId={expandedMeetingId}
              onProcessMeeting={handleProcessMeeting}
              selectedMeetingId={selectedMeeting?.id}
              selectedMeetingTranscript={selectedMeetingTranscript}
              selectedMeetingParticipants={selectedMeetingParticipants}
              onViewTranscript={onViewTranscript}
              onViewParticipants={onViewParticipants}
              onChangeSelection={handleChangeSelection}
            />
          </div>

          {/* Info message - only show for today's meetings */}
          {!isLoadingCalendar && meetings.length > 0 && isToday(selectedDate) && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Icon name="info" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('meetings.note')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
