// ============================================================================
// RECAP METRICS VIEW COMPONENT
// ============================================================================
// Analytics dashboard for recap data with stats, charts, and export functionality
// Features: Stats cards, charts (bar, line, pie), filterable table, CSV export

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { CompactStatsBar } from '../ui/CompactStatsBar';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RecapMetrics {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  clientName: string;
  programName: string;
  fieldManagerName: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  qrScans: number;
  surveysCollected: number;
  photosCount: number;
}

interface RecapMetricsViewProps {
  recaps: RecapMetrics[];
  clients: { id: string; name: string }[];
  programs: { id: string; name: string; clientId: string }[];
  onExportCSV?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecapMetricsView: React.FC<RecapMetricsViewProps> = ({
  recaps,
  clients,
  programs,
  onExportCSV,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [filters, setFilters] = useState({
    clientId: '',
    programId: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const [sortBy, setSortBy] = useState<'date' | 'scans' | 'surveys'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // COMPUTED METRICS
  // ============================================================================

  // Get last 30 days of recaps for charts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecaps = useMemo(
    () => recaps.filter((r) => new Date(r.eventDate) >= thirtyDaysAgo),
    [recaps]
  );

  // Total recaps this month
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const recapsThisMonth = recaps.filter(
    (r) => new Date(r.submittedAt) >= firstDayOfMonth
  );

  // Status breakdown
  const pendingCount = recaps.filter((r) => r.status === 'pending').length;
  const approvedCount = recaps.filter((r) => r.status === 'approved').length;
  const rejectedCount = recaps.filter((r) => r.status === 'rejected').length;

  // Average approval time (in hours)
  const approvedRecaps = recaps.filter(
    (r) => r.status === 'approved' && r.approvedAt
  );
  const avgApprovalTimeHours = approvedRecaps.length
    ? approvedRecaps.reduce((sum, r) => {
        const diffMs =
          new Date(r.approvedAt!).getTime() - new Date(r.submittedAt).getTime();
        return sum + diffMs / (1000 * 60 * 60);
      }, 0) / approvedRecaps.length
    : 0;

  // Recaps per client (last 30 days)
  const recapsPerClient = useMemo(() => {
    const counts: Record<string, number> = {};
    recentRecaps.forEach((r) => {
      counts[r.clientName] = (counts[r.clientName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([client, count]) => ({ client, count }))
      .sort((a, b) => b.count - a.count);
  }, [recentRecaps]);

  // QR scans over time (last 30 days, grouped by day)
  const qrScansOverTime = useMemo(() => {
    const scansByDate: Record<string, number> = {};
    recentRecaps.forEach((r) => {
      const dateKey = new Date(r.eventDate).toISOString().split('T')[0];
      scansByDate[dateKey] = (scansByDate[dateKey] || 0) + r.qrScans;
    });
    return Object.entries(scansByDate)
      .map(([date, scans]) => ({ date, scans }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [recentRecaps]);

  // ============================================================================
  // FILTERED & SORTED RECAPS
  // ============================================================================

  const filteredRecaps = useMemo(() => {
    let filtered = recaps.filter((recap) => {
      if (filters.clientId && recap.clientName !== clients.find((c) => c.id === filters.clientId)?.name) return false;
      if (filters.programId && recap.programName !== programs.find((p) => p.id === filters.programId)?.name) return false;
      if (filters.status && recap.status !== filters.status) return false;
      if (filters.startDate && new Date(recap.eventDate) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(recap.eventDate) > new Date(filters.endDate)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          recap.eventName.toLowerCase().includes(searchLower) ||
          recap.fieldManagerName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      } else if (sortBy === 'scans') {
        comparison = a.qrScans - b.qrScans;
      } else if (sortBy === 'surveys') {
        comparison = a.surveysCollected - b.surveysCollected;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered.slice(0, 20); // Show last 20
  }, [recaps, filters, sortBy, sortOrder, clients, programs]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExport = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    // Default CSV export logic
    const headers = [
      'Event Name',
      'Date',
      'Client',
      'Program',
      'Field Manager',
      'Status',
      'QR Scans',
      'Surveys',
      'Photos',
      'Submitted At',
    ];
    const rows = filteredRecaps.map((r) => [
      r.eventName,
      new Date(r.eventDate).toLocaleDateString(),
      r.clientName,
      r.programName,
      r.fieldManagerName,
      r.status,
      r.qrScans.toString(),
      r.surveysCollected.toString(),
      r.photosCount.toString(),
      new Date(r.submittedAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recap-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Icon name="file-text" className="w-8 h-8 text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {recapsThisMonth.length}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Recaps (This Month)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Icon name="clock" className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {pendingCount}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Icon name="check-circle" className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {approvedCount}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Icon name="x-circle" className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {rejectedCount}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Icon name="zap" className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {avgApprovalTimeHours.toFixed(1)}h
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Approval Time</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recaps per Client (Bar Chart) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Icon name="bar-chart" className="w-5 h-5 text-primary-600" />
            Recaps per Client (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {recapsPerClient.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                No data available
              </p>
            ) : (
              recapsPerClient.map(({ client, count }) => {
                const maxCount = recapsPerClient[0].count;
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={client}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{client}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* QR Scans Over Time (Line Chart) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Icon name="trending-up" className="w-5 h-5 text-primary-600" />
            QR Scans Over Time (Last 30 Days)
          </h3>
          <div className="h-48 flex items-end gap-1">
            {qrScansOverTime.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center w-full py-8">
                No data available
              </p>
            ) : (
              qrScansOverTime.map(({ date, scans }) => {
                const maxScans = Math.max(...qrScansOverTime.map((d) => d.scans));
                const height = (scans / maxScans) * 100;
                return (
                  <div
                    key={date}
                    className="flex-1 group relative"
                    title={`${new Date(date).toLocaleDateString()}: ${scans} scans`}
                  >
                    <div
                      className="bg-primary-600 hover:bg-primary-700 transition-colors rounded-t"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                      {new Date(date).toLocaleDateString()}: {scans}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Status Breakdown (Pie Chart) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Icon name="pie-chart" className="w-5 h-5 text-primary-600" />
            Recap Status Breakdown
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Approved (green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${(approvedCount / recaps.length) * 251.2} 251.2`}
                  strokeDashoffset="0"
                />
                {/* Pending (yellow) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray={`${(pendingCount / recaps.length) * 251.2} 251.2`}
                  strokeDashoffset={`-${(approvedCount / recaps.length) * 251.2}`}
                />
                {/* Rejected (red) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="20"
                  strokeDasharray={`${(rejectedCount / recaps.length) * 251.2} 251.2`}
                  strokeDashoffset={`-${((approvedCount + pendingCount) / recaps.length) * 251.2}`}
                />
              </svg>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded" />
                <span className="text-gray-700 dark:text-gray-300">Approved:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {approvedCount} ({((approvedCount / recaps.length) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-600 rounded" />
                <span className="text-gray-700 dark:text-gray-300">Pending:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {pendingCount} ({((pendingCount / recaps.length) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded" />
                <span className="text-gray-700 dark:text-gray-300">Rejected:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {rejectedCount} ({((rejectedCount / recaps.length) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* CompactStatsBar Demo */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Icon name="activity" className="w-5 h-5 text-primary-600" />
            Quick Stats
          </h3>
          <CompactStatsBar
            stats={[
              { label: 'Total QR Scans', value: recaps.reduce((sum, r) => sum + r.qrScans, 0) },
              {
                label: 'Total Surveys',
                value: recaps.reduce((sum, r) => sum + r.surveysCollected, 0),
              },
              {
                label: 'Total Photos',
                value: recaps.reduce((sum, r) => sum + r.photosCount, 0),
              },
              { label: 'Approval Rate', value: `${((approvedCount / recaps.length) * 100).toFixed(0)}%` },
            ]}
          />
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Icon name="table" className="w-5 h-5 text-primary-600" />
            Recent Recaps
          </h3>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Icon name="download" className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Select
            label="Client"
            id="clientFilter"
            value={filters.clientId}
            onChange={(e) =>
              setFilters({ ...filters, clientId: e.target.value, programId: '' })
            }
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>

          <Select
            label="Program"
            id="programFilter"
            value={filters.programId}
            onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
            disabled={!filters.clientId}
          >
            <option value="">All Programs</option>
            {programs
              .filter((p) => !filters.clientId || p.clientId === filters.clientId)
              .map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
          </Select>

          <Select
            label="Status"
            id="statusFilter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>

          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <Input
            label="End Date"
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />

          <Input
            label="Search"
            id="search"
            type="text"
            placeholder="Event or manager..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                  <button
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    Date
                    <Icon
                      name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
                      className="w-4 h-4"
                    />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                  Field Manager
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                  <button
                    onClick={() => {
                      setSortBy('scans');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-primary-600 ml-auto"
                  >
                    QR Scans
                    <Icon
                      name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
                      className="w-4 h-4"
                    />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                  <button
                    onClick={() => {
                      setSortBy('surveys');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-primary-600 ml-auto"
                  >
                    Surveys
                    <Icon
                      name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
                      className="w-4 h-4"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-500">
                    No recaps match the current filters
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((recap) => (
                  <tr
                    key={recap.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {recap.eventName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatDate(recap.eventDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {recap.clientName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {recap.fieldManagerName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${recap.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : ''}
                          ${recap.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
                          ${recap.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
                        `}
                      >
                        {recap.status === 'pending' && <Icon name="clock" className="w-3 h-3" />}
                        {recap.status === 'approved' && <Icon name="check-circle" className="w-3 h-3" />}
                        {recap.status === 'rejected' && <Icon name="x-circle" className="w-3 h-3" />}
                        {recap.status.charAt(0).toUpperCase() + recap.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">
                      {recap.qrScans}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">
                      {recap.surveysCollected}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
