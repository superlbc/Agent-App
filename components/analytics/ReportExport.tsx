// ============================================================================
// REPORT EXPORT COMPONENT
// ============================================================================
// Export reports to Excel, PDF, or CSV with preview and history tracking
//
// Features:
// - Report type selection (Event Summary, Recap Summary, QR Code, Premium Distribution)
// - Format selection (Excel .xlsx, PDF, CSV)
// - Date range and filters (client, program, status)
// - Preview table (first 20 rows)
// - Export functionality
// - Export history (last 20 exports with download links)

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Pagination } from '../ui/Pagination';

// ============================================================================
// TYPES
// ============================================================================

interface ExportRequest {
  reportType: 'event_summary' | 'recap_summary' | 'qr_code_report' | 'premium_distribution';
  format: 'xlsx' | 'pdf' | 'csv';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    clientIds?: string[];
    programIds?: string[];
    status?: string[];
  };
}

interface ExportHistory {
  id: string;
  reportType: string;
  format: string;
  dateRange: string;
  generatedAt: Date;
  generatedBy: string;
  downloadUrl: string;
}

interface ReportExportProps {
  clients: { id: string; name: string; code: string }[];
  programs: { id: string; name: string; clientId: string }[];
  exportHistory?: ExportHistory[];
  onExport?: (request: ExportRequest) => Promise<string>; // Returns download URL
}

// ============================================================================
// MOCK DATA GENERATOR (for preview)
// ============================================================================

const generateMockPreviewData = (reportType: string, rowCount: number = 20) => {
  const data: Record<string, any>[] = [];

  for (let i = 0; i < rowCount; i++) {
    if (reportType === 'event_summary') {
      data.push({
        eventName: `Event ${i + 1}`,
        client: 'Verizon',
        program: 'Hyperlocal',
        date: '2025-06-15',
        venue: 'Times Square',
        status: 'Confirmed',
      });
    } else if (reportType === 'recap_summary') {
      data.push({
        eventName: `Event ${i + 1}`,
        date: '2025-06-15',
        qrScans: Math.floor(Math.random() * 500),
        surveys: Math.floor(Math.random() * 300),
        premiums: Math.floor(Math.random() * 200),
        status: 'Approved',
      });
    } else if (reportType === 'qr_code_report') {
      data.push({
        qrCode: `QR-${i + 1}`,
        event: `Event ${i + 1}`,
        totalScans: Math.floor(Math.random() * 1000),
        uniqueScans: Math.floor(Math.random() * 800),
        conversionRate: `${(Math.random() * 100).toFixed(1)}%`,
      });
    } else if (reportType === 'premium_distribution') {
      data.push({
        event: `Event ${i + 1}`,
        premiumType: 'Popsocket',
        distributed: Math.floor(Math.random() * 200),
        remaining: Math.floor(Math.random() * 50),
        cost: `$${(Math.random() * 500).toFixed(2)}`,
      });
    }
  }

  return data;
};

// ============================================================================
// PREVIEW TABLE COMPONENT
// ============================================================================

interface PreviewTableProps {
  data: Record<string, any>[];
}

const PreviewTable: React.FC<PreviewTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            {columns.map(column => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {columns.map(column => (
                <td
                  key={column}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReportExport: React.FC<ReportExportProps> = ({
  clients,
  programs,
  exportHistory = [],
  onExport,
}) => {
  // State
  const [exportRequest, setExportRequest] = useState<ExportRequest>({
    reportType: 'event_summary',
    format: 'xlsx',
    dateRange: {
      start: '',
      end: '',
    },
    filters: {
      clientIds: [],
      programIds: [],
      status: [],
    },
  });

  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination for export history
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return exportHistory.slice(start, start + itemsPerPage);
  }, [exportHistory, currentPage, itemsPerPage]);

  // Get available programs for selected clients
  const availablePrograms = programs.filter(
    program =>
      exportRequest.filters.clientIds?.length === 0 ||
      exportRequest.filters.clientIds?.includes(program.clientId)
  );

  // Handlers
  const handlePreview = () => {
    const mockData = generateMockPreviewData(exportRequest.reportType, 20);
    setPreviewData(mockData);
    setShowPreview(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (onExport) {
        const downloadUrl = await onExport(exportRequest);
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${exportRequest.reportType}_${exportRequest.format}_${Date.now()}.${exportRequest.format}`;
        link.click();
      } else {
        // Mock export
        console.log('Exporting report:', exportRequest);
        alert('Export functionality not implemented. See console for request data.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleClientFilter = (clientId: string) => {
    setExportRequest(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        clientIds: prev.filters.clientIds?.includes(clientId)
          ? prev.filters.clientIds.filter(id => id !== clientId)
          : [...(prev.filters.clientIds || []), clientId],
        programIds: [], // Clear programs when client filter changes
      },
    }));
  };

  const toggleProgramFilter = (programId: string) => {
    setExportRequest(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        programIds: prev.filters.programIds?.includes(programId)
          ? prev.filters.programIds.filter(id => id !== programId)
          : [...(prev.filters.programIds || []), programId],
      },
    }));
  };

  const toggleStatusFilter = (status: string) => {
    setExportRequest(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        status: prev.filters.status?.includes(status)
          ? prev.filters.status.filter(s => s !== status)
          : [...(prev.filters.status || []), status],
      },
    }));
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      event_summary: 'Event Summary',
      recap_summary: 'Recap Summary',
      qr_code_report: 'QR Code Report',
      premium_distribution: 'Premium Distribution Report',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getFormatIcon = (format: string) => {
    const icons = {
      xlsx: 'csv',
      pdf: 'pdf',
      csv: 'csv',
    };
    return icons[format as keyof typeof icons] || 'document';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Report Export
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Export event and recap data to Excel, PDF, or CSV
        </p>
      </div>

      {/* Export Configuration */}
      <Card>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Type */}
            <Select
              id="reportType"
              label="Report Type"
              required
              value={exportRequest.reportType}
              onChange={(e) =>
                setExportRequest({ ...exportRequest, reportType: e.target.value as ExportRequest['reportType'] })
              }
              options={[
                { value: 'event_summary', label: 'Event Summary' },
                { value: 'recap_summary', label: 'Recap Summary' },
                { value: 'qr_code_report', label: 'QR Code Report' },
                { value: 'premium_distribution', label: 'Premium Distribution Report' },
              ]}
            />

            {/* Format */}
            <Select
              id="format"
              label="Format"
              required
              value={exportRequest.format}
              onChange={(e) => setExportRequest({ ...exportRequest, format: e.target.value as ExportRequest['format'] })}
              options={[
                { value: 'xlsx', label: 'Excel (.xlsx)' },
                { value: 'pdf', label: 'PDF' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exportRequest.dateRange.start}
                onChange={(e) =>
                  setExportRequest({
                    ...exportRequest,
                    dateRange: { ...exportRequest.dateRange, start: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={exportRequest.dateRange.end}
                onChange={(e) =>
                  setExportRequest({
                    ...exportRequest,
                    dateRange: { ...exportRequest.dateRange, end: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Client {exportRequest.filters.clientIds && exportRequest.filters.clientIds.length > 0 && (
                <span className="text-primary-600 dark:text-primary-400">({exportRequest.filters.clientIds.length} selected)</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => toggleClientFilter(client.id)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    exportRequest.filters.clientIds?.includes(client.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {client.code}
                </button>
              ))}
            </div>
          </div>

          {/* Program Filter */}
          {availablePrograms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Program {exportRequest.filters.programIds && exportRequest.filters.programIds.length > 0 && (
                  <span className="text-primary-600 dark:text-primary-400">({exportRequest.filters.programIds.length} selected)</span>
                )}
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                {availablePrograms.map(program => (
                  <label
                    key={program.id}
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportRequest.filters.programIds?.includes(program.id)}
                      onChange={() => toggleProgramFilter(program.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {program.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter (for recap_summary only) */}
          {exportRequest.reportType === 'recap_summary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['Pending', 'Approved', 'Rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      exportRequest.filters.status?.includes(status)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handlePreview}>
              <Icon name="eye" className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="primary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Preview (First 20 Rows)
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <Icon name="close" className="w-4 h-4" />
              </Button>
            </div>
            <PreviewTable data={previewData} />
          </div>
        </Card>
      )}

      {/* Export History */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export History
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Format
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Generated At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Generated By
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No export history yet
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {getReportTypeLabel(item.reportType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Icon name={getFormatIcon(item.format) as any} className="w-4 h-4" />
                          <span className="uppercase">{item.format}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.dateRange}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.generatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.generatedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={item.downloadUrl}
                          download
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          <Icon name="download" className="w-4 h-4 inline" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {exportHistory.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalItems={exportHistory.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50]}
              />
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
 * const mockClients = [
 *   { id: 'vz', name: 'Verizon', code: 'VZ' },
 *   { id: 'amex', name: 'American Express', code: 'AMEX' },
 * ];
 *
 * const mockPrograms = [
 *   { id: 'prog1', name: 'Verizon Hyperlocal', clientId: 'vz' },
 * ];
 *
 * const mockHistory: ExportHistory[] = [
 *   {
 *     id: '1',
 *     reportType: 'event_summary',
 *     format: 'xlsx',
 *     dateRange: '2025-01-01 to 2025-06-30',
 *     generatedAt: new Date(),
 *     generatedBy: 'John Doe',
 *     downloadUrl: '/downloads/event_summary_12345.xlsx',
 *   },
 * ];
 *
 * <ReportExport
 *   clients={mockClients}
 *   programs={mockPrograms}
 *   exportHistory={mockHistory}
 *   onExport={async (request) => {
 *     const response = await fetch('/api/reports/export', {
 *       method: 'POST',
 *       body: JSON.stringify(request),
 *     });
 *     const data = await response.json();
 *     return data.downloadUrl;
 *   }}
 * />
 */
