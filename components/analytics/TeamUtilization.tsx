// ============================================================================
// TEAM UTILIZATION COMPONENT
// ============================================================================
// Shows team member workload, assignments per person, availability
//
// Features:
// - Department and role filters
// - Date range filter
// - Top contributors table with workload indicators
// - Assignments by role chart
// - Availability summary
// - CSV export

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import type { PeopleAssignment, Event } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface TeamUtilizationProps {
  assignments: PeopleAssignment[];
  events: Event[];
  selectedDepartment?: string;
  selectedRole?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: () => void;
}

interface TeamMetrics {
  topContributors: {
    name: string;
    email: string;
    count: number;
    roles: string[];
    onSiteCount: number;
    workload: 'high' | 'normal' | 'low';
  }[];
  roleData: { role: string; count: number }[];
  totalAssigned: number;
  fullyBooked: number;
  available: number;
  notAssigned: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregateTeamUtilization(
  assignments: PeopleAssignment[],
  events: Event[]
): TeamMetrics {
  // Group assignments by person
  const assignmentsByPerson = assignments.reduce((acc, assignment) => {
    const userId = assignment.userId;
    if (!acc[userId]) {
      acc[userId] = {
        name: assignment.userName,
        email: assignment.userEmail,
        department: assignment.userDepartment,
        assignments: [],
      };
    }
    acc[userId].assignments.push(assignment);
    return acc;
  }, {} as Record<string, any>);

  const topContributors = Object.values(assignmentsByPerson)
    .map(person => ({
      name: person.name,
      email: person.email,
      count: person.assignments.length,
      roles: [...new Set(person.assignments.map((a: any) => a.userRole || 'Unassigned'))],
      onSiteCount: person.assignments.filter((a: any) => a.onSite).length,
      workload:
        person.assignments.length > 10
          ? ('high' as const)
          : person.assignments.length < 3
          ? ('low' as const)
          : ('normal' as const),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group assignments by role
  const assignmentsByRole = assignments.reduce((acc, assignment) => {
    const role = assignment.userRole || 'Unassigned';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.entries(assignmentsByRole)
    .map(([role, count]) => ({
      role,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalAssigned = Object.keys(assignmentsByPerson).length;
  const fullyBooked = topContributors.filter(p => p.workload === 'high').length;
  const available = topContributors.filter(p => p.workload === 'low').length;
  const notAssigned = 0; // Would need user list to calculate

  return {
    topContributors,
    roleData,
    totalAssigned,
    fullyBooked,
    available,
    notAssigned,
  };
}

function exportTeamUtilizationToCSV(
  metrics: TeamMetrics,
  dateRange?: { start: Date; end: Date }
) {
  const csvRows: string[] = [];

  // Header
  csvRows.push('Team Utilization Report');
  if (dateRange) {
    csvRows.push(
      `Date Range: ${format(dateRange.start, 'yyyy-MM-dd')} to ${format(dateRange.end, 'yyyy-MM-dd')}`
    );
  }
  csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  csvRows.push('');

  // Summary
  csvRows.push('Summary');
  csvRows.push(`Total Team Members Assigned,${metrics.totalAssigned}`);
  csvRows.push(`Fully Booked (>10 assignments),${metrics.fullyBooked}`);
  csvRows.push(`Available (<3 assignments),${metrics.available}`);
  csvRows.push('');

  // Top Contributors
  csvRows.push('Top Contributors');
  csvRows.push('Name,Email,Assignments,On-Site,Roles,Workload');
  metrics.topContributors.forEach(item => {
    csvRows.push(
      `"${item.name}","${item.email}",${item.count},${item.onSiteCount},"${item.roles.join('; ')}",${item.workload}`
    );
  });
  csvRows.push('');

  // Assignments by Role
  csvRows.push('Assignments by Role');
  csvRows.push('Role,Assignments');
  metrics.roleData.forEach(item => {
    csvRows.push(`"${item.role}",${item.count}`);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `team-utilization-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TeamUtilization: React.FC<TeamUtilizationProps> = ({
  assignments,
  events,
  selectedDepartment,
  selectedRole,
  dateRange,
  onExport,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>(
    selectedDepartment || 'all'
  );
  const [roleFilter, setRoleFilter] = useState<string>(selectedRole || 'all');

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(a => a.userDepartment === departmentFilter);
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(a => a.userRole === roleFilter);
    }

    // Filter by date range (via event dates)
    if (dateRange) {
      const eventIds = events
        .filter(e => {
          const eventDate = new Date(e.eventStartDate);
          return eventDate >= dateRange.start && eventDate <= dateRange.end;
        })
        .map(e => e.id);
      filtered = filtered.filter(a => eventIds.includes(a.eventId));
    }

    return filtered;
  }, [assignments, departmentFilter, roleFilter, dateRange, events]);

  const metrics = useMemo(() => {
    return aggregateTeamUtilization(filteredAssignments, events);
  }, [filteredAssignments, events]);

  const handleExport = () => {
    exportTeamUtilizationToCSV(metrics, dateRange);
    if (onExport) {
      onExport();
    }
  };

  // Get unique departments and roles
  const departments = useMemo(() => {
    const uniqueDepts = new Set(
      assignments.map(a => a.userDepartment).filter(Boolean)
    );
    return Array.from(uniqueDepts).sort();
  }, [assignments]);

  const roles = useMemo(() => {
    const uniqueRoles = new Set(assignments.map(a => a.userRole).filter(Boolean));
    return Array.from(uniqueRoles).sort();
  }, [assignments]);

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (assignments.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Icon name="users" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Assignments Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assign team members to events to see utilization metrics.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Team Utilization
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Workload distribution, assignments, and availability
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Icon name="download" className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </p>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Team Members
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {metrics.totalAssigned}
              </p>
            </div>
            <Icon name="users" className="w-10 h-10 text-blue-400 dark:text-blue-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Fully Booked
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                {metrics.fullyBooked}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                &gt;10 assignments
              </p>
            </div>
            <Icon name="alert" className="w-10 h-10 text-red-400 dark:text-red-600" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Available
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {metrics.available}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                &lt;3 assignments
              </p>
            </div>
            <Icon name="check" className="w-10 h-10 text-green-400 dark:text-green-600" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments by Role - Bar Chart */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Assignments by Role
            </h3>
            {metrics.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.roleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="role"
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(31, 41, 55, 0.95)',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#6B7280' }} />
                  <Bar dataKey="count" fill="#8B5CF6" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Icon name="bar-chart" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No role data to display
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Workload Distribution - Pie Chart */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Workload Distribution
            </h3>
            {metrics.topContributors.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'High (&gt;10)', value: metrics.fullyBooked },
                      {
                        name: 'Normal (3-10)',
                        value:
                          metrics.totalAssigned - metrics.fullyBooked - metrics.available,
                      },
                      { name: 'Low (&lt;3)', value: metrics.available },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(31, 41, 55, 0.95)',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Icon name="chart" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No workload data to display
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top Contributors
          </h3>
          {metrics.topContributors.length > 0 ? (
            <div className="space-y-3">
              {metrics.topContributors.map((item, index) => (
                <div
                  key={item.email}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {item.roles.join(', ')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {item.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">assignments</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {item.onSiteCount} on-site
                    </p>
                  </div>
                  <div>
                    {item.workload === 'high' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        <Icon name="alert" className="w-3 h-3 mr-1" />
                        High
                      </span>
                    )}
                    {item.workload === 'normal' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        <Icon name="check" className="w-3 h-3 mr-1" />
                        Normal
                      </span>
                    )}
                    {item.workload === 'low' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        <Icon name="alert" className="w-3 h-3 mr-1" />
                        Low
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="users" className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No contributors to display
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <TeamUtilization
 *   assignments={assignments}
 *   events={events}
 *   selectedDepartment="Creative"
 *   selectedRole="Field Manager"
 *   dateRange={{ start: new Date('2025-01-01'), end: new Date('2025-12-31') }}
 *   onExport={() => console.log('Exporting...')}
 * />
 */
