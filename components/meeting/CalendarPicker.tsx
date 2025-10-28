/**
 * CalendarPicker - Week view calendar for selecting dates
 * Shows the current week with ability to navigate forward/backward
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Meeting } from '../../services/meetingService';
import { telemetryService } from '../../utils/telemetryService';

interface CalendarPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  allMeetings?: Meeting[];
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
  allMeetings = []
}) => {
  const { t, i18n } = useTranslation('common');
  const [currentWeek, setCurrentWeek] = useState(() => getWeekStart(selectedDate));

  // Get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Convert Sunday (0) to 7 for calculation
    const dayIndex = day === 0 ? 7 : day;
    // Monday is index 1, so subtract (dayIndex - 1) to get to Monday
    const diff = d.getDate() - (dayIndex - 1);
    return new Date(d.setDate(diff));
  }

  // Get array of dates for current week
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(currentWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  // Helper to track date selection
  const handleDateSelect = (date: Date, source: 'click' | 'today-button') => {
    const meetingCount = getMeetingCount(date);

    // Telemetry: Track calendar date selected
    telemetryService.trackEvent('calendarDateSelected', {
      date: date.toISOString(),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      isToday: isToday(date),
      meetingCount: meetingCount,
      source: source
    });

    onSelectDate(date);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(getWeekStart(today));
    handleDateSelect(today, 'today-button');
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Count meetings for a specific date
  const getMeetingCount = (date: Date): number => {
    if (!allMeetings || allMeetings.length === 0) return 0;

    return allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.start);
      return meetingDate.toDateString() === date.toDateString();
    }).length;
  };

  const formatMonthYear = (): string => {
    // Use current i18n language for date formatting
    const locale = i18n.language || 'en-US';
    return currentWeek.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric'
    });
  };

  // Get relative time indicator
  const getRelativeWeek = (): string => {
    const today = new Date();
    const todayWeekStart = getWeekStart(today);

    // Calculate difference in weeks
    const diffMs = currentWeek.getTime() - todayWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));

    if (diffWeeks === 0) return t('meetings.thisWeek');
    if (diffWeeks === -1) return t('meetings.lastWeek');
    if (diffWeeks === 1) return t('meetings.nextWeek');
    if (diffWeeks < 0) return t('meetings.weeksAgo', { count: Math.abs(diffWeeks) });
    return t('meetings.inWeeks', { count: diffWeeks });
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white m-0 leading-none">
            {formatMonthYear()}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {getRelativeWeek()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-9 px-3"
          >
            {t('meetings.today')}
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="p-2 h-9 w-9"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="p-2 h-9 w-9"
            >
              <Icon name="chevron-right" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week view */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const selected = isSelected(date);
          const today = isToday(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateSelect(date, 'click')}
              className={`
                relative flex flex-col items-center justify-center p-2 rounded-lg aspect-square
                transition-all duration-200 cursor-pointer
                ${selected
                  ? 'bg-primary text-white shadow-md scale-105'
                  : today
                  ? 'border-2 border-primary text-primary bg-white dark:bg-slate-800 hover:scale-105 hover:shadow-lg'
                  : isWeekend
                  ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:border-primary hover:shadow-lg hover:scale-105'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg hover:scale-105 hover:bg-slate-50 dark:hover:bg-slate-700'
                }
              `}
            >
              {/* Day name */}
              <span className={`text-[10px] font-medium mb-0.5 ${
                selected
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {dayNames[index]}
              </span>

              {/* Date number */}
              <span className={`text-base font-bold ${
                selected
                  ? 'text-white'
                  : today
                  ? 'text-primary'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {date.getDate()}
              </span>

              {/* Meeting count */}
              {getMeetingCount(date) > 0 && (
                <span className={`text-[8px] mt-0.5 leading-tight font-medium ${
                  selected
                    ? 'text-white/80'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {getMeetingCount(date)}m
                </span>
              )}

              {/* Today indicator dot */}
              {today && !selected && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
