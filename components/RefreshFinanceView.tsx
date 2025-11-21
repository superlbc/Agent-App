// ============================================================================
// REFRESH FINANCE VIEW COMPONENT
// ============================================================================
// Phase 9: Hardware Refresh Calendar - Financial forecasting and budget planning

import React, { useMemo, useState } from 'react';
import { RefreshSchedule, HardwareType } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import {
  getSchedulesEligibleThisQuarter,
  getSchedulesEligibleThisYear,
  calculateTotalCost,
  groupSchedulesByType,
  getQuarter,
  getFiscalYear,
  formatCurrency,
  filterSchedulesByDateRange,
} from '../services/refreshService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RefreshFinanceViewProps {
  schedules: RefreshSchedule[];
  employeeDepartmentMap?: Record<string, string>; // employeeId -> department
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  className?: string;
}

interface QuarterData {
  quarter: number;
  year: number;
  schedules: RefreshSchedule[];
  totalCost: number;
}

interface HardwareTypeBreakdown {
  type: HardwareType;
  count: number;
  totalCost: number;
  percentage: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get quarters for next N years
 */
const getUpcomingQuarters = (count: number = 8): QuarterData[] => {
  const today = new Date();
  const currentYear = getFiscalYear(today);
  const currentQuarter = getQuarter(today);

  const quarters: QuarterData[] = [];
  let year = currentYear;
  let quarter = currentQuarter;

  for (let i = 0; i < count; i++) {
    quarters.push({ quarter, year, schedules: [], totalCost: 0 });

    quarter++;
    if (quarter > 4) {
      quarter = 1;
      year++;
    }
  }

  return quarters;
};

/**
 * Populate quarter data with schedules
 */
const populateQuarterData = (
  quarters: QuarterData[],
  schedules: RefreshSchedule[]
): QuarterData[] => {
  return quarters.map(q => {
    const quarterStartMonth = (q.quarter - 1) * 3;
    const quarterStart = new Date(q.year, quarterStartMonth, 1);
    const quarterEnd = new Date(q.year, quarterStartMonth + 3, 0, 23, 59, 59);

    const quarterSchedules = filterSchedulesByDateRange(schedules, quarterStart, quarterEnd);

    return {
      ...q,
      schedules: quarterSchedules,
      totalCost: calculateTotalCost(quarterSchedules),
    };
  });
};

/**
 * Get hardware type breakdown with percentages
 */
const getHardwareTypeBreakdown = (schedules: RefreshSchedule[]): HardwareTypeBreakdown[] => {
  const grouped = groupSchedulesByType(schedules);
  const totalCost = calculateTotalCost(schedules);

  const breakdown: HardwareTypeBreakdown[] = [];

  Object.entries(grouped).forEach(([type, scheduleList]) => {
    const typeCost = calculateTotalCost(scheduleList);
    breakdown.push({
      type: type as HardwareType,
      count: scheduleList.length,
      totalCost: typeCost,
      percentage: totalCost > 0 ? (typeCost / totalCost) * 100 : 0,
    });
  });

  return breakdown.sort((a, b) => b.totalCost - a.totalCost);
};

/**
 * Get color for hardware type
 */
const getHardwareTypeColor = (type: HardwareType): string => {
  const colors: Record<HardwareType, string> = {
    computer: 'bg-blue-500',
    monitor: 'bg-green-500',
    keyboard: 'bg-purple-500',
    mouse: 'bg-pink-500',
    dock: 'bg-indigo-500',
    headset: 'bg-yellow-500',
    accessory: 'bg-teal-500',
  };
  return colors[type] || 'bg-gray-500';
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RefreshFinanceView: React.FC<RefreshFinanceViewProps> = ({
  schedules,
  employeeDepartmentMap = {},
  onExportCSV,
  onExportPDF,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedYear, setSelectedYear] = useState<number>(getFiscalYear(new Date()));

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  const activeSchedules = useMemo(
    () => schedules.filter(s => s.status === 'active'),
    [schedules]
  );

  const thisQuarter = useMemo(() => getSchedulesEligibleThisQuarter(activeSchedules), [activeSchedules]);
  const thisYear = useMemo(() => getSchedulesEligibleThisYear(activeSchedules), [activeSchedules]);

  const upcomingQuarters = useMemo(() => {
    const quarters = getUpcomingQuarters(8);
    return populateQuarterData(quarters, activeSchedules);
  }, [activeSchedules]);

  const hardwareBreakdown = useMemo(
    () => getHardwareTypeBreakdown(activeSchedules),
    [activeSchedules]
  );

  const totalThisQuarter = useMemo(() => calculateTotalCost(thisQuarter), [thisQuarter]);
  const totalThisYear = useMemo(() => calculateTotalCost(thisYear), [thisYear]);
  const totalAll = useMemo(() => calculateTotalCost(activeSchedules), [activeSchedules]);

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  const handleExportCSV = () => {
    const rows = [
      ['Hardware Type', 'Model', 'Employee', 'Department', 'Eligibility Date', 'Estimated Cost'],
      ...activeSchedules.map(s => [
        s.hardwareType,
        s.hardwareModel,
        s.employeeName || '',
        s.employeeId ? employeeDepartmentMap[s.employeeId] || 'Unknown' : 'Unknown',
        new Date(s.refreshEligibilityDate).toLocaleDateString(),
        s.estimatedRefreshCost.toString(),
      ]),
    ];

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refresh-forecast-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onExportCSV?.();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`flex flex-col h-full overflow-auto ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Refresh Budget Forecast
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Financial planning and cost projections for hardware refreshes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Icon name="download" className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {onExportPDF && (
              <Button variant="outline" onClick={onExportPDF}>
                <Icon name="file-text" className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Icon name="calendar" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">This Quarter</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalThisQuarter)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {thisQuarter.length} assets eligible
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Icon name="trending-up" className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">This Year</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalThisYear)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {thisYear.length} assets eligible
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Icon name="briefcase" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Pipeline</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalAll)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeSchedules.length} assets scheduled
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quarterly Forecast Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            8-Quarter Forecast
          </h3>
          <div className="space-y-3">
            {upcomingQuarters.map((q, index) => {
              const maxCost = Math.max(...upcomingQuarters.map(quarter => quarter.totalCost));
              const widthPercentage = maxCost > 0 ? (q.totalCost / maxCost) * 100 : 0;
              const isCurrentQuarter = index === 0;

              return (
                <div key={`${q.year}-${q.quarter}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${isCurrentQuarter ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Q{q.quarter} {q.year}
                      {isCurrentQuarter && ' (Current)'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        {q.schedules.length} assets
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(q.totalCost)}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isCurrentQuarter ? 'bg-primary-500' : 'bg-blue-500'}`}
                      style={{ width: `${widthPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Hardware Type Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost by Hardware Type
          </h3>
          <div className="space-y-4">
            {hardwareBreakdown.map(item => (
              <div key={item.type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${getHardwareTypeColor(item.type)}`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-400">{item.count} units</span>
                    <span className="font-semibold text-gray-900 dark:text-white w-24 text-right">
                      {formatCurrency(item.totalCost)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getHardwareTypeColor(item.type)} transition-all duration-300`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pie Chart Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Total</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(totalAll)}</span>
            </div>
          </div>
        </Card>

        {/* Top 10 Most Expensive Refreshes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top 10 Most Expensive Refreshes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Hardware
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Eligibility Date
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Estimated Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeSchedules
                  .sort((a, b) => b.estimatedRefreshCost - a.estimatedRefreshCost)
                  .slice(0, 10)
                  .map(schedule => (
                    <tr
                      key={schedule.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {schedule.hardwareModel}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {schedule.hardwareType}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {schedule.employeeName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(schedule.refreshEligibilityDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(schedule.estimatedRefreshCost)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
