// ============================================================================
// PRE-HIRE LIST COMPONENT
// ============================================================================
// Table view of all pre-hire records with filtering, sorting, and search

import React, { useState, useMemo } from 'react';
import { PreHire } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';
import { FreezePeriodAlert, isInFreezePeriod } from './ui/FreezePeriodBanner';
import { DEPARTMENTS, ROLES, PRE_HIRE_STATUSES } from '../constants';
import { TableSkeleton } from './ui/TableSkeleton';
import { ConfirmModal } from './ui/ConfirmModal';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireListProps {
  preHires: PreHire[];
  onEdit: (preHire: PreHire) => void;
  onDelete: (preHire: PreHire) => void;
  onView: (preHire: PreHire) => void;
  onAssignPackage: (preHire: PreHire) => void;
  onMerge?: (preHire: PreHire) => void;
  onCreate: () => void;
  className?: string;
  loading?: boolean;
}

type SortField = 'candidateName' | 'role' | 'department' | 'startDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  status: string;
  department: string;
  role: string;
  freezePeriodOnly: boolean;
  // Advanced filters
  startDateFrom: string;
  startDateTo: string;
  packageFilter: 'all' | 'has-package' | 'no-package';
  hiringManager: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreHireList: React.FC<PreHireListProps> = ({
  preHires,
  onEdit,
  onDelete,
  onView,
  onAssignPackage,
  onMerge,
  onCreate,
  className = '',
  loading = false,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    department: '',
    role: '',
    freezePeriodOnly: false,
    // Advanced filters
    startDateFrom: '',
    startDateTo: '',
    packageFilter: 'all',
    hiringManager: '',
  });

  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Advanced filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PreHire | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkStatusConfirm, setShowBulkStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PreHire['status'] | null>(null);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredAndSortedPreHires = useMemo(() => {
    let filtered = [...preHires];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (ph) =>
          ph.candidateName.toLowerCase().includes(searchLower) ||
          ph.email?.toLowerCase().includes(searchLower) ||
          ph.hiringManager.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((ph) => ph.status === filters.status);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((ph) => ph.department === filters.department);
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter((ph) => ph.role === filters.role);
    }

    // Freeze period filter
    if (filters.freezePeriodOnly) {
      filtered = filtered.filter((ph) => isInFreezePeriod(new Date(ph.startDate)));
    }

    // Advanced filters
    // Start date from filter
    if (filters.startDateFrom) {
      const fromDate = new Date(filters.startDateFrom);
      filtered = filtered.filter((ph) => new Date(ph.startDate) >= fromDate);
    }

    // Start date to filter
    if (filters.startDateTo) {
      const toDate = new Date(filters.startDateTo);
      filtered = filtered.filter((ph) => new Date(ph.startDate) <= toDate);
    }

    // Package filter
    if (filters.packageFilter === 'has-package') {
      filtered = filtered.filter((ph) => ph.assignedPackage !== undefined);
    } else if (filters.packageFilter === 'no-package') {
      filtered = filtered.filter((ph) => ph.assignedPackage === undefined);
    }

    // Hiring manager filter
    if (filters.hiringManager) {
      const managerLower = filters.hiringManager.toLowerCase();
      filtered = filtered.filter((ph) =>
        ph.hiringManager.toLowerCase().includes(managerLower)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'candidateName':
          aValue = a.candidateName.toLowerCase();
          bValue = b.candidateName.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'startDate':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [preHires, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPreHires.length / itemsPerPage);
  const paginatedPreHires = filteredAndSortedPreHires.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      department: '',
      role: '',
      freezePeriodOnly: false,
      startDateFrom: '',
      startDateTo: '',
      packageFilter: 'all',
      hiringManager: '',
    });
    setCurrentPage(1);
  };

  const handleDeleteClick = (preHire: PreHire) => {
    setItemToDelete(preHire);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedPreHires.length) {
      // Deselect all
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      // Select all on current page
      const allIds = new Set(paginatedPreHires.map((ph) => ph.id));
      setSelectedIds(allIds);
      setShowBulkActions(true);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    selectedIds.forEach((id) => {
      const preHire = preHires.find((ph) => ph.id === id);
      if (preHire) onDelete(preHire);
    });
    setSelectedIds(new Set());
    setShowBulkActions(false);
  };

  const handleBulkStatusUpdate = (status: PreHire['status']) => {
    setPendingStatus(status);
    setShowBulkStatusConfirm(true);
  };

  const confirmBulkStatusUpdate = () => {
    if (pendingStatus) {
      // Note: This requires adding an onUpdateStatus prop or using the onEdit callback
      // For now, we'll just show a message
      alert(`Bulk status update to "${pendingStatus}" is not yet implemented. Coming soon!`);
      setSelectedIds(new Set());
      setShowBulkActions(false);
      setPendingStatus(null);
    }
  };

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  const handleExportCSV = () => {
    // Determine what to export: selected items or all filtered items
    const dataToExport = selectedIds.size > 0
      ? filteredAndSortedPreHires.filter((ph) => selectedIds.has(ph.id))
      : filteredAndSortedPreHires;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV headers
    const headers = [
      'Candidate Name',
      'Email',
      'Role',
      'Department',
      'Start Date',
      'Hiring Manager',
      'Status',
      'Package Assigned',
      'In Freeze Period',
    ];

    // CSV rows
    const rows = dataToExport.map((preHire) => [
      preHire.candidateName,
      preHire.email || '',
      preHire.role,
      preHire.department,
      formatDate(preHire.startDate),
      preHire.hiringManager,
      preHire.status,
      preHire.assignedPackage ? preHire.assignedPackage.name : 'Not assigned',
      isInFreezePeriod(new Date(preHire.startDate)) ? 'Yes' : 'No',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `pre-hires-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Use browser print to generate PDF
    // Create a printable version of the table
    const dataToExport = selectedIds.size > 0
      ? filteredAndSortedPreHires.filter((ph) => selectedIds.has(ph.id))
      : filteredAndSortedPreHires;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a new window with printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export to PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pre-hire Records</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .meta {
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .freeze-period {
              color: #f59e0b;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Pre-hire Records</h1>
          <div class="meta">
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Records: ${dataToExport.length}</p>
            ${hasActiveFilters ? '<p>Filtered view</p>' : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Start Date</th>
                <th>Hiring Manager</th>
                <th>Status</th>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (preHire) => `
                <tr>
                  <td>${preHire.candidateName}</td>
                  <td>${preHire.email || '-'}</td>
                  <td>${preHire.role}</td>
                  <td>${preHire.department}</td>
                  <td${isInFreezePeriod(new Date(preHire.startDate)) ? ' class="freeze-period"' : ''}>${formatDate(preHire.startDate)}${isInFreezePeriod(new Date(preHire.startDate)) ? ' ⚠️' : ''}</td>
                  <td>${preHire.hiringManager}</td>
                  <td>${preHire.status}</td>
                  <td>${preHire.assignedPackage ? preHire.assignedPackage.name : '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.department ||
    filters.role ||
    filters.freezePeriodOnly ||
    filters.startDateFrom ||
    filters.startDateTo ||
    filters.packageFilter !== 'all' ||
    filters.hiringManager;

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show skeleton loader while loading
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="mb-6">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
        </div>
        <TableSkeleton rows={8} columns={7} />
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Pre-hire Records
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {filteredAndSortedPreHires.length} of {preHires.length} pre-hires
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <Icon name="download" className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            title="Export to PDF"
          >
            <Icon name="document" className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or hiring manager..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon="search"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <Icon name="x" className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            placeholder="All Statuses"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              ...PRE_HIRE_STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              })),
            ]}
          />

          <Select
            placeholder="All Departments"
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
            ]}
          />

          <Select
            placeholder="All Roles"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              ...ROLES.map((r) => ({ value: r, label: r })),
            ]}
          />

          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.freezePeriodOnly}
              onChange={(e) =>
                handleFilterChange('freezePeriodOnly', e.target.checked)
              }
              className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Freeze Period Only
            </span>
          </label>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <Icon
            name={showAdvancedFilters ? 'chevron-down' : 'chevron-right'}
            className="w-4 h-4"
          />
          Advanced Filters
        </button>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filters */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date From
                </label>
                <input
                  type="date"
                  value={filters.startDateFrom}
                  onChange={(e) =>
                    handleFilterChange('startDateFrom', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date To
                </label>
                <input
                  type="date"
                  value={filters.startDateTo}
                  onChange={(e) =>
                    handleFilterChange('startDateTo', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Package Filter */}
              <Select
                label="Package Assignment"
                value={filters.packageFilter}
                onChange={(e) =>
                  handleFilterChange(
                    'packageFilter',
                    e.target.value as 'all' | 'has-package' | 'no-package'
                  )
                }
                options={[
                  { value: 'all', label: 'All Pre-hires' },
                  { value: 'has-package', label: 'Has Package' },
                  { value: 'no-package', label: 'No Package' },
                ]}
              />

              {/* Hiring Manager Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hiring Manager
                </label>
                <Input
                  placeholder="Search hiring manager..."
                  value={filters.hiringManager}
                  onChange={(e) =>
                    handleFilterChange('hiringManager', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Icon name="trash" className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Update Status:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('candidate')}
                >
                  Candidate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('offered')}
                >
                  Offered
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('accepted')}
                >
                  Accepted
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds(new Set());
                setShowBulkActions(false);
              }}
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedPreHires.length && paginatedPreHires.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                  title="Select all on this page"
                />
              </th>
              <SortableHeader
                label="Candidate"
                field="candidateName"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Role"
                field="role"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Department"
                field="department"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Start Date"
                field="startDate"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Status"
                field="status"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedPreHires.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {hasActiveFilters ? (
                    <div>
                      <Icon
                        name="search"
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                      />
                      <p className="text-lg font-medium mb-1">No pre-hires found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div>
                      <Icon
                        name="users"
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                      />
                      <p className="text-lg font-medium mb-1">No pre-hires yet</p>
                      <p className="text-sm mb-4">
                        Create your first pre-hire record to get started
                      </p>
                      <Button variant="primary" onClick={onCreate}>
                        <Icon name="add" className="w-4 h-4 mr-2" />
                        Create Pre-hire
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedPreHires.map((preHire) => (
                <tr
                  key={preHire.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(preHire.id)}
                      onChange={() => handleSelectOne(preHire.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>

                  {/* Candidate Name */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {preHire.candidateName}
                      </div>
                      {preHire.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {preHire.email}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Manager: {preHire.hiringManager}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {preHire.role}
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {preHire.department}
                  </td>

                  {/* Start Date */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(preHire.startDate)}
                      </span>
                      {isInFreezePeriod(new Date(preHire.startDate)) && (
                        <FreezePeriodAlert
                          date={new Date(preHire.startDate)}
                          size="sm"
                        />
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={preHire.status}
                      type="preHire"
                      size="sm"
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(preHire)}
                        title="View details"
                        aria-label={`View details for ${preHire.candidateName}`}
                      >
                        <Icon name="eye" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAssignPackage(preHire)}
                        title="Assign equipment package"
                        aria-label={`Assign equipment package to ${preHire.candidateName}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Icon name="package" className="w-4 h-4" />
                      </Button>
                      {/* Link to Employee button - only show for accepted pre-hires */}
                      {onMerge && preHire.status === 'accepted' && !preHire.linkedEmployeeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMerge(preHire)}
                          title="Link to employee record"
                          aria-label={`Link ${preHire.candidateName} to employee record`}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          <Icon name="link" className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(preHire)}
                        title="Edit pre-hire"
                        aria-label={`Edit ${preHire.candidateName}`}
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(preHire)}
                        title="Delete pre-hire"
                        aria-label={`Delete ${preHire.candidateName}`}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedPreHires.length)}{' '}
            of {filteredAndSortedPreHires.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <Icon name="chevron-left" className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <Icon name="chevron-right" className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Pre-hire Record?"
        message={`Are you sure you want to delete the pre-hire record for ${itemToDelete?.candidateName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Records?"
        message={`Are you sure you want to delete ${selectedIds.size} pre-hire record(s)? This action cannot be undone.`}
        confirmText="Delete All"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showBulkStatusConfirm}
        onClose={() => {
          setShowBulkStatusConfirm(false);
          setPendingStatus(null);
        }}
        onConfirm={confirmBulkStatusUpdate}
        title="Update Status for Multiple Records?"
        message={`Are you sure you want to update ${selectedIds.size} pre-hire record(s) to status "${pendingStatus}"?`}
        confirmText="Update Status"
        variant="warning"
      />
    </Card>
  );
};

// ============================================================================
// SORTABLE HEADER COMPONENT
// ============================================================================

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentField,
  direction,
  onSort,
}) => {
  const isActive = currentField === field;

  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <Icon
            name="chevron-up"
            className={`w-3 h-3 -mb-1 ${
              isActive && direction === 'asc'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          />
          <Icon
            name="chevron-down"
            className={`w-3 h-3 ${
              isActive && direction === 'desc'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          />
        </div>
      </div>
    </th>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * <PreHireList
 *   preHires={mockPreHires}
 *   onEdit={(preHire) => console.log('Edit:', preHire)}
 *   onDelete={(preHire) => console.log('Delete:', preHire)}
 *   onView={(preHire) => console.log('View:', preHire)}
 *   onCreate={() => console.log('Create new')}
 * />
 */
