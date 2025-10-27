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

import React, { useState, useEffect } from 'react';
import { CalendarPicker } from './CalendarPicker';
import { MeetingList } from './MeetingList';
import { MeetingService, Meeting, MeetingWithTranscript } from '../../services/meetingService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface MeetingSelectionPanelProps {
  onMeetingSelected: (data: MeetingWithTranscript) => void;
  onError: (error: string) => void;
}

export const MeetingSelectionPanel: React.FC<MeetingSelectionPanelProps> = ({
  onMeetingSelected,
  onError
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [meetingService] = useState(() => new MeetingService());
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithTranscript | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch meetings when date changes
  useEffect(() => {
    loadMeetingsForDate(selectedDate);
  }, [selectedDate]);

  // Preload calendar on mount
  useEffect(() => {
    preloadCalendar();
  }, []);

  const preloadCalendar = async () => {
    try {
      await meetingService.preloadCalendar();
    } catch (error) {
      console.error('Failed to preload calendar:', error);
      // Non-critical error - don't show to user
    }
  };

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
    } catch (error) {
      console.error('Failed to load meetings:', error);
      onError('Unable to load meetings. Please try again.');
      setMeetings([]);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleSelectMeeting = async (meeting: Meeting) => {
    console.log('[MeetingSelection] Meeting clicked:', { id: meeting.id, subject: meeting.subject });

    if (!meeting.id) {
      console.error('[MeetingSelection] Meeting ID is undefined!', meeting);
      onError('Invalid meeting data. Please try refreshing the page.');
      return;
    }

    setIsLoadingTranscript(true);
    try {
      // Fetch full meeting details + transcript
      const meetingWithTranscript = await meetingService.getMeetingWithTranscript(
        meeting.id
      );

      // Store selected meeting and collapse the view
      setSelectedMeeting(meetingWithTranscript);
      setIsCollapsed(true);

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
    }
  };

  const handleChangeSelection = () => {
    setIsCollapsed(false);
    setSelectedMeeting(null);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setMeetings([]); // Clear previous meetings
  };

  const isTranscriptLikely = (meeting: Meeting): boolean => {
    return meetingService.isTranscriptLikely(meeting);
  };

  // Show collapsed view if meeting is selected
  if (isCollapsed && selectedMeeting) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Icon name="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Meeting Selected
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
            Change
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="calendar" className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Select Meeting from Calendar
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Choose a date to see your Teams meetings. Select a meeting to auto-fetch details and transcript.
          </p>
        </div>
      </div>

      {/* Calendar Picker */}
      <Card className="p-4">
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={handleDateChange}
          allMeetings={allMeetings}
        />
      </Card>

      {/* Meetings List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Meetings on {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <div className="flex items-center gap-2">
            {meetings.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMeetingsForDate(selectedDate)}
              disabled={isLoadingCalendar}
              className="h-7 px-2"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <MeetingList
          meetings={meetings}
          onSelectMeeting={handleSelectMeeting}
          isTranscriptLikely={isTranscriptLikely}
          isLoading={isLoadingCalendar}
        />
      </div>

      {/* Info message */}
      {!isLoadingCalendar && meetings.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Icon name="info" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Transcripts are usually available 5-10 minutes after a meeting ends.
            You can only access transcripts for meetings you organized (due to tenant security settings).
            For other meetings, use the manual paste option.
          </p>
        </div>
      )}
    </div>
  );
};
