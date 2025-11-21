/**
 * Refresh Service
 *
 * Handles hardware refresh schedule management including:
 * - Calculating refresh eligibility dates
 * - Generating refresh notifications
 * - Financial forecasting
 * - Refresh calendar views
 */

import { RefreshSchedule, RefreshCalendarStats, HardwareType, Hardware } from '../types';

/**
 * Calculate refresh eligibility date
 * @param assignedDate - Date hardware was assigned
 * @param refreshCycleYears - Refresh cycle in years (3 for computers, 2 for phones)
 */
export function calculateRefreshEligibilityDate(
  assignedDate: Date,
  refreshCycleYears: number
): Date {
  const eligibilityDate = new Date(assignedDate);
  eligibilityDate.setFullYear(eligibilityDate.getFullYear() + refreshCycleYears);
  return eligibilityDate;
}

/**
 * Get default refresh cycle for hardware type
 */
export function getDefaultRefreshCycle(hardwareType: HardwareType): number {
  const cycles: Record<HardwareType, number> = {
    computer: 3, // 3 years for computers
    monitor: 5, // 5 years for monitors
    keyboard: 5, // 5 years for keyboards
    mouse: 3, // 3 years for mice
    dock: 5, // 5 years for docks
    headset: 3, // 3 years for headsets
    accessory: 5, // 5 years for accessories
  };

  return cycles[hardwareType] || 3;
}

/**
 * Check if hardware is eligible for refresh
 */
export function isEligibleForRefresh(schedule: RefreshSchedule): boolean {
  const today = new Date();
  return schedule.refreshEligibilityDate <= today && schedule.status === 'active';
}

/**
 * Check if hardware refresh is approaching (within X months)
 */
export function isRefreshApproaching(
  schedule: RefreshSchedule,
  monthsAdvance: number = 4
): boolean {
  const today = new Date();
  const advanceDate = new Date(schedule.refreshEligibilityDate);
  advanceDate.setMonth(advanceDate.getMonth() - monthsAdvance);

  return today >= advanceDate && today < schedule.refreshEligibilityDate && schedule.status === 'active';
}

/**
 * Get quarter number (1-4) for a given date
 */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Get fiscal year for a given date
 */
export function getFiscalYear(date: Date): number {
  return date.getFullYear();
}

/**
 * Filter schedules by date range
 */
export function filterSchedulesByDateRange(
  schedules: RefreshSchedule[],
  startDate: Date,
  endDate: Date
): RefreshSchedule[] {
  return schedules.filter(
    schedule =>
      schedule.refreshEligibilityDate >= startDate &&
      schedule.refreshEligibilityDate <= endDate &&
      schedule.status === 'active'
  );
}

/**
 * Get schedules eligible this quarter
 */
export function getSchedulesEligibleThisQuarter(
  schedules: RefreshSchedule[]
): RefreshSchedule[] {
  const today = new Date();
  const currentQuarter = getQuarter(today);
  const currentYear = getFiscalYear(today);

  const quarterStartMonth = (currentQuarter - 1) * 3;
  const quarterStart = new Date(currentYear, quarterStartMonth, 1);
  const quarterEnd = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59);

  return filterSchedulesByDateRange(schedules, quarterStart, quarterEnd);
}

/**
 * Get schedules eligible this year
 */
export function getSchedulesEligibleThisYear(
  schedules: RefreshSchedule[]
): RefreshSchedule[] {
  const today = new Date();
  const currentYear = getFiscalYear(today);

  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  return filterSchedulesByDateRange(schedules, yearStart, yearEnd);
}

/**
 * Calculate total estimated cost for schedules
 */
export function calculateTotalCost(schedules: RefreshSchedule[]): number {
  return schedules.reduce((total, schedule) => total + schedule.estimatedRefreshCost, 0);
}

/**
 * Group schedules by hardware type
 */
export function groupSchedulesByType(
  schedules: RefreshSchedule[]
): Record<HardwareType, RefreshSchedule[]> {
  const grouped: Record<string, RefreshSchedule[]> = {};

  schedules.forEach(schedule => {
    if (!grouped[schedule.hardwareType]) {
      grouped[schedule.hardwareType] = [];
    }
    grouped[schedule.hardwareType].push(schedule);
  });

  return grouped as Record<HardwareType, RefreshSchedule[]>;
}

/**
 * Group schedules by employee department
 */
export function groupSchedulesByDepartment(
  schedules: RefreshSchedule[],
  employeeDepartmentMap: Record<string, string> // employeeId -> department
): Record<string, RefreshSchedule[]> {
  const grouped: Record<string, RefreshSchedule[]> = {};

  schedules.forEach(schedule => {
    if (schedule.employeeId) {
      const department = employeeDepartmentMap[schedule.employeeId] || 'Unknown';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(schedule);
    }
  });

  return grouped;
}

/**
 * Calculate refresh calendar statistics
 */
export function calculateRefreshStats(
  schedules: RefreshSchedule[],
  employeeDepartmentMap: Record<string, string> = {}
): RefreshCalendarStats {
  const activeSchedules = schedules.filter(s => s.status === 'active');
  const thisQuarter = getSchedulesEligibleThisQuarter(activeSchedules);
  const thisYear = getSchedulesEligibleThisYear(activeSchedules);
  const pendingRefresh = schedules.filter(s => s.status === 'refresh-pending');

  const byTypeGrouped = groupSchedulesByType(activeSchedules);
  const byType: Record<HardwareType, number> = {} as Record<HardwareType, number>;
  Object.keys(byTypeGrouped).forEach(type => {
    byType[type as HardwareType] = byTypeGrouped[type as HardwareType].length;
  });

  const byDeptGrouped = groupSchedulesByDepartment(activeSchedules, employeeDepartmentMap);
  const byDepartment: Record<string, number> = {};
  Object.keys(byDeptGrouped).forEach(dept => {
    byDepartment[dept] = byDeptGrouped[dept].length;
  });

  return {
    totalActiveAssets: activeSchedules.length,
    eligibleThisQuarter: thisQuarter.length,
    eligibleThisYear: thisYear.length,
    refreshPendingCount: pendingRefresh.length,
    estimatedCostThisQuarter: calculateTotalCost(thisQuarter),
    estimatedCostThisYear: calculateTotalCost(thisYear),
    byHardwareType: byType,
    byDepartment: byDepartment,
  };
}

/**
 * Generate refresh notifications for upcoming eligible hardware
 * @param schedules - All refresh schedules
 * @param monthsAdvance - How many months in advance to notify (default: 4)
 * @returns Array of schedules that need notifications
 */
export function generateRefreshNotifications(
  schedules: RefreshSchedule[],
  monthsAdvance: number = 4
): RefreshSchedule[] {
  return schedules.filter(
    schedule =>
      isRefreshApproaching(schedule, monthsAdvance) &&
      !schedule.notificationSent
  );
}

/**
 * Sort schedules by refresh eligibility date (earliest first)
 */
export function sortSchedulesByEligibilityDate(
  schedules: RefreshSchedule[]
): RefreshSchedule[] {
  return [...schedules].sort(
    (a, b) => a.refreshEligibilityDate.getTime() - b.refreshEligibilityDate.getTime()
  );
}

/**
 * Create a refresh schedule for newly assigned hardware
 */
export function createRefreshSchedule(
  hardware: Hardware,
  employeeId: string,
  employeeName: string,
  employeeEmail: string,
  assignedDate: Date,
  createdBy: string
): RefreshSchedule {
  const refreshCycleYears = getDefaultRefreshCycle(hardware.type);
  const refreshEligibilityDate = calculateRefreshEligibilityDate(assignedDate, refreshCycleYears);

  return {
    id: `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    hardwareId: hardware.id,
    hardwareType: hardware.type,
    hardwareModel: hardware.model,
    employeeId,
    employeeName,
    employeeEmail,
    assignedDate,
    refreshCycleYears,
    refreshEligibilityDate,
    estimatedRefreshCost: hardware.cost || 0,
    status: 'active',
    notificationSent: false,
    createdBy,
    createdDate: new Date(),
    lastModified: new Date(),
  };
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get days until refresh eligibility
 */
export function getDaysUntilRefresh(schedule: RefreshSchedule): number {
  const today = new Date();
  const diffTime = schedule.refreshEligibilityDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get status badge color for refresh schedule
 */
export function getRefreshStatusColor(schedule: RefreshSchedule): string {
  if (schedule.status === 'refreshed') return 'green';
  if (schedule.status === 'refresh-pending') return 'blue';
  if (schedule.status === 'retired') return 'gray';

  // Active - check if eligible or approaching
  if (isEligibleForRefresh(schedule)) return 'red';
  if (isRefreshApproaching(schedule, 4)) return 'yellow';
  return 'green';
}
