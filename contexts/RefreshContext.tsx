import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { RefreshSchedule, RefreshCalendarStats } from '../types';
import {
  calculateRefreshStats,
  generateRefreshNotifications,
  sortSchedulesByEligibilityDate,
} from '../services/refreshService';

interface RefreshContextType {
  schedules: RefreshSchedule[];
  stats: RefreshCalendarStats | null;
  selectedSchedule: RefreshSchedule | null;
  setSchedules: (schedules: RefreshSchedule[]) => void;
  addSchedule: (schedule: RefreshSchedule) => void;
  updateSchedule: (scheduleId: string, updates: Partial<RefreshSchedule>) => void;
  deleteSchedule: (scheduleId: string) => void;
  selectSchedule: (schedule: RefreshSchedule | null) => void;
  refreshStats: () => void;
  getNotificationsDue: (monthsAdvance?: number) => RefreshSchedule[];
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
  initialSchedules?: RefreshSchedule[];
  employeeDepartmentMap?: Record<string, string>;
}

export function RefreshProvider({
  children,
  initialSchedules = [],
  employeeDepartmentMap = {},
}: RefreshProviderProps) {
  const [schedules, setSchedules] = useState<RefreshSchedule[]>(initialSchedules);
  const [stats, setStats] = useState<RefreshCalendarStats | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<RefreshSchedule | null>(null);

  // Calculate stats whenever schedules change
  const refreshStats = useCallback(() => {
    const newStats = calculateRefreshStats(schedules, employeeDepartmentMap);
    setStats(newStats);
  }, [schedules, employeeDepartmentMap]);

  // Add a new schedule
  const addSchedule = useCallback((schedule: RefreshSchedule) => {
    setSchedules(prev => {
      const updated = [...prev, schedule];
      return sortSchedulesByEligibilityDate(updated);
    });
  }, []);

  // Update an existing schedule
  const updateSchedule = useCallback(
    (scheduleId: string, updates: Partial<RefreshSchedule>) => {
      setSchedules(prev => {
        const updated = prev.map(s =>
          s.id === scheduleId
            ? { ...s, ...updates, lastModified: new Date() }
            : s
        );
        return sortSchedulesByEligibilityDate(updated);
      });

      // Update selected schedule if it's the one being updated
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule(prev =>
          prev ? { ...prev, ...updates, lastModified: new Date() } : null
        );
      }
    },
    [selectedSchedule]
  );

  // Delete a schedule
  const deleteSchedule = useCallback((scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));

    // Deselect if the deleted schedule was selected
    if (selectedSchedule?.id === scheduleId) {
      setSelectedSchedule(null);
    }
  }, [selectedSchedule]);

  // Select a schedule for viewing/editing
  const selectSchedule = useCallback((schedule: RefreshSchedule | null) => {
    setSelectedSchedule(schedule);
  }, []);

  // Get notifications due for upcoming refreshes
  const getNotificationsDue = useCallback(
    (monthsAdvance: number = 4): RefreshSchedule[] => {
      return generateRefreshNotifications(schedules, monthsAdvance);
    },
    [schedules]
  );

  const value: RefreshContextType = {
    schedules,
    stats,
    selectedSchedule,
    setSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    selectSchedule,
    refreshStats,
    getNotificationsDue,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh(): RefreshContextType {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
