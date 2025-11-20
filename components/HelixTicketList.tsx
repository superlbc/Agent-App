// ============================================================================
// HELIX TICKET LIST COMPONENT
// ============================================================================
// Main Helix ticket management dashboard with filtering, sorting, and statistics

import React, { useState, useMemo } from 'react';
import { HelixTicket } from '../types';
import { HelixTicketCard } from './HelixTicketCard';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HelixTicketListProps {
  tickets: HelixTicket[];
  statistics: {
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    freezePeriodTickets: number;
  };
  onView?: (ticket: HelixTicket) => void;
  onResolve?: (ticket: HelixTicket) => void;
  onClose?: (ticket: HelixTicket) => void;
  onViewApproval?: (approvalId: string) => void;
}

type StatusFilter = 'all' | 'open' | 'in-progress' | 'resolved' | 'closed';
type TypeFilter = 'all' | 'new-hire' | 'password-reset' | 'termination' | 'access-request' | 'equipment';
type SortField = 'createdDate' | 'employeeName' | 'type' | 'priority';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPONENT
// ============================================================================

export const HelixTicketList: React.FC<HelixTicketListProps> = ({
  tickets,
  statistics,
  onView,
  onResolve,
  onClose,
  onViewApproval,
}) => {
  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFreezePeriodOnly, setShowFreezePeriodOnly] = useState(false);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && ticket.type !== typeFilter) {
        return false;
      }

      // Freeze period filter
      if (showFreezePeriodOnly && !ticket.scheduledAction) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          ticket.employeeName.toLowerCase().includes(searchLower) ||
          ticket.requestedBy.toLowerCase().includes(searchLower) ||
          ticket.type.toLowerCase().includes(searchLower) ||
          ticket.id.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [tickets, statusFilter, typeFilter, showFreezePeriodOnly, searchQuery]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdDate':
          comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          break;
        case 'employeeName':
          comparison = a.employeeName.localeCompare(b.employeeName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTickets, sortField, sortDirection]);

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
                Open Tickets
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {statistics.openTickets}
              </p>
            </div>
            <Icon
              name="info"
              className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-75"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {statistics.inProgressTickets}
              </p>
            </div>
            <Icon
              name="refresh"
              className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-75"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resolved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {statistics.resolvedTickets}
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
                Freeze Period
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {statistics.freezePeriodTickets}
              </p>
            </div>
            <Icon
              name="snowflake"
              className="w-10 h-10 text-orange-600 dark:text-orange-400 opacity-75"
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
              { value: 'all' as const, label: 'All Tickets', count: tickets.length },
              { value: 'open' as const, label: 'Open', count: statistics.openTickets },
              { value: 'in-progress' as const, label: 'In Progress', count: statistics.inProgressTickets },
              { value: 'resolved' as const, label: 'Resolved', count: statistics.resolvedTickets },
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

          {/* Type Filter and Freeze Period Toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Type:
              </span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="new-hire">New Hire</option>
                <option value="password-reset">Password Reset</option>
                <option value="termination">Termination</option>
                <option value="access-request">Access Request</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <button
              onClick={() => setShowFreezePeriodOnly(!showFreezePeriodOnly)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  showFreezePeriodOnly
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon name="snowflake" className="w-4 h-4" />
              Freeze Period Only
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by employee, ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon="search"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Sort by:
              </span>
              <Button
                variant={sortField === 'createdDate' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('createdDate')}
              >
                Date
                {sortField === 'createdDate' && (
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
                variant={sortField === 'priority' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('priority')}
              >
                Priority
                {sortField === 'priority' && (
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
            Showing <strong>{sortedTickets.length}</strong> of{' '}
            <strong>{tickets.length}</strong> tickets
          </div>
        </div>
      </Card>

      {/* Ticket Cards Grid */}
      {sortedTickets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedTickets.map((ticket) => (
            <HelixTicketCard
              key={ticket.id}
              ticket={ticket}
              onView={onView}
              onResolve={onResolve}
              onClose={onClose}
              onViewApproval={onViewApproval}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <Icon
              name="search"
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tickets found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? `No tickets match "${searchQuery}"`
                : `No ${statusFilter === 'all' ? '' : statusFilter} tickets at this time`}
            </p>
            {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || showFreezePeriodOnly) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setShowFreezePeriodOnly(false);
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
 * const { tickets, statistics, resolveTicket, closeTicket, startViewTicket, getApprovalById, startViewApproval } = useApprovals();
 *
 * <HelixTicketList
 *   tickets={tickets}
 *   statistics={statistics}
 *   onView={(ticket) => startViewTicket(ticket)}
 *   onResolve={(ticket) => {
 *     resolveTicket(ticket.id);
 *     addToast('Ticket marked as resolved', 'success');
 *   }}
 *   onClose={(ticket) => {
 *     closeTicket(ticket.id);
 *     addToast('Ticket closed', 'success');
 *   }}
 *   onViewApproval={(approvalId) => {
 *     const approval = getApprovalById(approvalId);
 *     if (approval) startViewApproval(approval);
 *   }}
 * />
 */
