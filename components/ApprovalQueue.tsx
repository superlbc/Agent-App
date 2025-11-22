// ============================================================================
// APPROVAL QUEUE COMPONENT
// ============================================================================
// Main approval management dashboard with filtering, sorting, and statistics

import React, { useState, useMemo } from 'react';
import { ApprovalRequest } from '../types';
import { ApprovalRequestCard } from './ApprovalRequestCard';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApprovalQueueProps {
  approvals: ApprovalRequest[];
  statistics: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    approvedToday: number;
    rejectedToday: number;
    averageApprovalTime: number;
  };
  onView?: (approval: ApprovalRequest) => void;
  onApprove?: (approval: ApprovalRequest, notes?: string) => void;
  onReject?: (approval: ApprovalRequest, reason: string) => void;
  onViewTicket?: (ticketId: string) => void;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type SortField = 'requestDate' | 'employeeName' | 'requestType';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPONENT
// ============================================================================

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  statistics,
  onView,
  onApprove,
  onReject,
  onViewTicket,
}) => {
  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('requestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      // Status filter
      if (statusFilter !== 'all' && approval.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          approval.employeeName.toLowerCase().includes(searchLower) ||
          approval.requester.toLowerCase().includes(searchLower) ||
          approval.requestType.toLowerCase().includes(searchLower) ||
          approval.id.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [approvals, statusFilter, searchQuery]);

  const sortedApprovals = useMemo(() => {
    return [...filteredApprovals].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'requestDate':
          comparison = new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
          break;
        case 'employeeName':
          comparison = a.employeeName.localeCompare(b.employeeName);
          break;
        case 'requestType':
          comparison = a.requestType.localeCompare(b.requestType);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredApprovals, sortField, sortDirection]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {statistics.totalPending}
              </p>
            </div>
            <Icon
              name="clock"
              className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-75"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {statistics.totalApproved}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                +{statistics.approvedToday} today
              </p>
            </div>
            <Icon
              name="check-circle"
              className="w-10 h-10 text-green-600 dark:text-green-400 opacity-75"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rejected
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {statistics.totalRejected}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                +{statistics.rejectedToday} today
              </p>
            </div>
            <Icon
              name="x-circle"
              className="w-10 h-10 text-red-600 dark:text-red-400 opacity-75"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Approval Time
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {statistics.averageApprovalTime}h
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                hours
              </p>
            </div>
            <Icon
              name="clock"
              className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-75"
            />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { value: 'all' as const, label: 'All Requests', count: approvals.length },
              { value: 'pending' as const, label: 'Pending', count: statistics.totalPending },
              { value: 'approved' as const, label: 'Approved', count: statistics.totalApproved },
              { value: 'rejected' as const, label: 'Rejected', count: statistics.totalRejected },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    statusFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {filter.label}
                <span className="ml-2 opacity-75">({filter.count})</span>
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by employee, requester, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon="search"
                aria-label="Search approvals"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Sort by:
              </span>
              <Button
                variant={sortField === 'requestDate' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('requestDate')}
              >
                Date
                {sortField === 'requestDate' && (
                  <Icon
                    name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    className="w-4 h-4 ml-1"
                  />
                )}
              </Button>
              <Button
                variant={sortField === 'employeeName' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('employeeName')}
              >
                Name
                {sortField === 'employeeName' && (
                  <Icon
                    name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    className="w-4 h-4 ml-1"
                  />
                )}
              </Button>
              <Button
                variant={sortField === 'requestType' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('requestType')}
              >
                Type
                {sortField === 'requestType' && (
                  <Icon
                    name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    className="w-4 h-4 ml-1"
                  />
                )}
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <strong>{sortedApprovals.length}</strong> of{' '}
            <strong>{approvals.length}</strong> requests
          </div>
        </div>
      </Card>

      {/* Approval Cards Grid */}
      {sortedApprovals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedApprovals.map((approval) => (
            <ApprovalRequestCard
              key={approval.id}
              approval={approval}
              onView={onView}
              onApprove={onApprove}
              onReject={onReject}
              onViewTicket={onViewTicket}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center" role="status">
            <Icon
              name="search"
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No approvals found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? `No approvals match "${searchQuery}"`
                : `No ${statusFilter === 'all' ? '' : statusFilter} approvals at this time`}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * const { approvals, statistics, approveRequest, rejectRequest, startViewApproval } = useApprovals();
 *
 * <ApprovalQueue
 *   approvals={approvals}
 *   statistics={statistics}
 *   onView={(approval) => startViewApproval(approval)}
 *   onApprove={(approval, notes) => {
 *     approveRequest(approval.id, notes);
 *     addToast('Request approved successfully', 'success');
 *   }}
 *   onReject={(approval, reason) => {
 *     rejectRequest(approval.id, reason);
 *     addToast('Request rejected', 'error');
 *   }}
 *   onViewTicket={(ticketId) => {
 *     const ticket = getTicketById(ticketId);
 *     if (ticket) startViewTicket(ticket);
 *   }}
 * />
 */
