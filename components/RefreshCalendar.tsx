// ============================================================================
// REFRESH CALENDAR COMPONENT
// ============================================================================
// Phase 9: Hardware Refresh Calendar - Calendar view for tracking hardware refresh schedules

import React, { useState, useMemo } from 'react';
import { RefreshSchedule, HardwareType } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import {
  getQuarter,
  getDaysUntilRefresh,
  getRefreshStatusColor,
  formatDate,
  formatCurrency,
  isEligibleForRefresh,
  isRefreshApproaching,
} from '../services/refreshService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ViewMode = 'month' | 'quarter' | 'year';

interface RefreshCalendarProps {
  schedules: RefreshSchedule[];
  onScheduleClick?: (schedule: RefreshSchedule) => void;
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  schedules: RefreshSchedule[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get days in month
 */
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month (0 = Sunday, 6 = Saturday)
 */
const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Generate calendar days for month view
 */
const generateMonthDays = (
  year: number,
  month: number,
  schedules: RefreshSchedule[]
): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);

  // Previous month days (to fill first week)
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      date,
      isCurrentMonth: false,
      schedules: getSchedulesForDate(schedules, date),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      schedules: getSchedulesForDate(schedules, date),
    });
  }

  // Next month days (to fill last week)
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      isCurrentMonth: false,
      schedules: getSchedulesForDate(schedules, date),
    });
  }

  return days;
};

/**
 * Get schedules for specific date
 */
const getSchedulesForDate = (schedules: RefreshSchedule[], date: Date): RefreshSchedule[] => {
  return schedules.filter(schedule => {
    const eligibilityDate = new Date(schedule.refreshEligibilityDate);
    return (
      eligibilityDate.getFullYear() === date.getFullYear() &&
      eligibilityDate.getMonth() === date.getMonth() &&
      eligibilityDate.getDate() === date.getDate()
    );
  });
};

/**
 * Get schedules for quarter
 */
const getSchedulesForQuarter = (
  schedules: RefreshSchedule[],
  year: number,
  quarter: number
): RefreshSchedule[] => {
  const quarterStartMonth = (quarter - 1) * 3;
  const quarterStart = new Date(year, quarterStartMonth, 1);
  const quarterEnd = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);

  return schedules.filter(schedule => {
    const eligibilityDate = new Date(schedule.refreshEligibilityDate);
    return eligibilityDate >= quarterStart && eligibilityDate <= quarterEnd;
  });
};

/**
 * Get schedules for year
 */
const getSchedulesForYear = (schedules: RefreshSchedule[], year: number): RefreshSchedule[] => {
  return schedules.filter(schedule => {
    const eligibilityDate = new Date(schedule.refreshEligibilityDate);
    return eligibilityDate.getFullYear() === year;
  });
};

/**
 * Get status color class
 */
const getStatusColorClass = (schedule: RefreshSchedule): string => {
  const color = getRefreshStatusColor(schedule);
  const colorMap: Record<string, string> = {
    red: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
    gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700',
  };
  return colorMap[color] || colorMap.gray;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RefreshCalendar: React.FC<RefreshCalendarProps> = ({
  schedules,
  onScheduleClick,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterHardwareType, setFilterHardwareType] = useState<HardwareType[]>([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentQuarter = getQuarter(currentDate);

  // ============================================================================
  // FILTERED SCHEDULES
  // ============================================================================

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    if (filterStatus.length > 0) {
      filtered = filtered.filter(s => filterStatus.includes(s.status));
    }

    if (filterHardwareType.length > 0) {
      filtered = filtered.filter(s => filterHardwareType.includes(s.hardwareType));
    }

    return filtered;
  }, [schedules, filterStatus, filterHardwareType]);

  // ============================================================================
  // CALENDAR DATA
  // ============================================================================

  const monthDays = useMemo(() => {
    if (viewMode === 'month') {
      return generateMonthDays(currentYear, currentMonth, filteredSchedules);
    }
    return [];
  }, [viewMode, currentYear, currentMonth, filteredSchedules]);

  const quarterSchedules = useMemo(() => {
    if (viewMode === 'quarter') {
      return getSchedulesForQuarter(filteredSchedules, currentYear, currentQuarter);
    }
    return [];
  }, [viewMode, currentYear, currentQuarter, filteredSchedules]);

  const yearSchedules = useMemo(() => {
    if (viewMode === 'year') {
      return getSchedulesForYear(filteredSchedules, currentYear);
    }
    return [];
  }, [viewMode, currentYear, filteredSchedules]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (viewMode === 'quarter') {
      setCurrentDate(new Date(currentYear, currentMonth - 3, 1));
    } else {
      setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (viewMode === 'quarter') {
      setCurrentDate(new Date(currentYear, currentMonth + 3, 1));
    } else {
      setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMonthView = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 overflow-auto">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[100px] p-2 border rounded-lg
                ${
                  day.isCurrentMonth
                    ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                }
                ${
                  day.date.toDateString() === new Date().toDateString()
                    ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                    : ''
                }
              `}
            >
              {/* Date Number */}
              <div
                className={`
                  text-sm font-medium mb-1
                  ${
                    day.isCurrentMonth
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-600'
                  }
                `}
              >
                {day.date.getDate()}
              </div>

              {/* Schedules */}
              <div className="space-y-1">
                {day.schedules.slice(0, 3).map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => onScheduleClick?.(schedule)}
                    className={`
                      w-full text-left text-xs px-2 py-1 rounded border
                      ${getStatusColorClass(schedule)}
                      hover:opacity-80 transition-opacity
                    `}
                    title={`${schedule.hardwareModel} - ${schedule.employeeName}`}
                  >
                    <div className="truncate font-medium">{schedule.hardwareModel}</div>
                    <div className="truncate text-[10px]">{schedule.employeeName}</div>
                  </button>
                ))}
                {day.schedules.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    +{day.schedules.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuarterView = () => {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {quarterSchedules.length > 0 ? (
            quarterSchedules.map(schedule => (
              <button
                key={schedule.id}
                onClick={() => onScheduleClick?.(schedule)}
                className={`
                  w-full text-left p-4 rounded-lg border-2
                  ${getStatusColorClass(schedule)}
                  hover:shadow-md transition-shadow
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Date */}
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-bold">
                      {new Date(schedule.refreshEligibilityDate).getDate()}
                    </div>
                    <div className="text-xs">
                      {new Date(schedule.refreshEligibilityDate).toLocaleDateString('en-US', {
                        month: 'short',
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">{schedule.hardwareModel}</div>
                    <div className="text-xs mb-2">
                      {schedule.employeeName} • {schedule.hardwareType}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>{getDaysUntilRefresh(schedule)} days</span>
                      <span>{formatCurrency(schedule.estimatedRefreshCost)}</span>
                      <span className="capitalize">{schedule.status.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <Icon name="chevron-right" className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No refresh schedules for Q{currentQuarter} {currentYear}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const quarters = [1, 2, 3, 4];

    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quarters.map(q => {
            const qSchedules = getSchedulesForQuarter(filteredSchedules, currentYear, q);
            return (
              <div
                key={q}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Q{q} {currentYear}
                </h3>
                {qSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {qSchedules.slice(0, 5).map(schedule => (
                      <button
                        key={schedule.id}
                        onClick={() => onScheduleClick?.(schedule)}
                        className={`
                          w-full text-left p-3 rounded border
                          ${getStatusColorClass(schedule)}
                          hover:opacity-80 transition-opacity
                        `}
                      >
                        <div className="text-sm font-medium truncate">{schedule.hardwareModel}</div>
                        <div className="text-xs truncate">{schedule.employeeName}</div>
                        <div className="text-xs mt-1">
                          {formatDate(schedule.refreshEligibilityDate)} •{' '}
                          {formatCurrency(schedule.estimatedRefreshCost)}
                        </div>
                      </button>
                    ))}
                    {qSchedules.length > 5 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        +{qSchedules.length - 5} more schedules
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No schedules
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Title & Navigation */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'month' &&
              currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'quarter' && `Q${currentQuarter} ${currentYear}`}
            {viewMode === 'year' && currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToPrevious} className="!p-2">
              <Icon name="chevron-left" className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={goToToday} className="!px-3 !py-1">
              Today
            </Button>
            <Button variant="outline" onClick={goToNext} className="!p-2">
              <Icon name="chevron-right" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'outline'}
            onClick={() => setViewMode('month')}
            className="!px-3 !py-1"
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'quarter' ? 'primary' : 'outline'}
            onClick={() => setViewMode('quarter')}
            className="!px-3 !py-1"
          >
            Quarter
          </Button>
          <Button
            variant={viewMode === 'year' ? 'primary' : 'outline'}
            onClick={() => setViewMode('year')}
            className="!px-3 !py-1"
          >
            Year
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Overdue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Approaching (4 months)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Active/Refreshed</span>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'quarter' && renderQuarterView()}
      {viewMode === 'year' && renderYearView()}
    </div>
  );
};
