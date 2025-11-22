import React, { useState, useMemo } from 'react';
import { CampaignWithClient } from '../../contexts/CampaignContext';
import { UXPEvent } from '../../types-uxp';
import { mockEvents } from '../../utils/mockDataUXP';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { ConfirmModal } from '../ui/ConfirmModal';

// ============================================================================
// TYPES
// ============================================================================

interface CampaignDetailViewProps {
  campaign: CampaignWithClient;
  onEdit: () => void;
  onDelete: () => void;
  onAddEvent?: () => void;
  onEventClick?: (event: UXPEvent) => void;
  onClose: () => void;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-300 dark:border-green-600',
    icon: 'check-circle',
  },
  inactive: {
    label: 'Inactive',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-300 dark:border-gray-600',
    icon: 'info',
  },
  archived: {
    label: 'Archived',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-300 dark:border-orange-600',
    icon: 'info',
  },
} as const;

const EVENT_STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  tentative: {
    label: 'Tentative',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-300',
  },
  confirmed: {
    label: 'Confirmed',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
  },
  active: {
    label: 'Active',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300',
  },
  cancelled: {
    label: 'Cancelled',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300',
  },
} as const;

// ============================================================================
// CAMPAIGN DETAIL VIEW COMPONENT
// ============================================================================

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaign,
  onEdit,
  onDelete,
  onAddEvent,
  onEventClick,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get events for this campaign (mock data for now)
  // TODO: Replace with actual event data from EventContext when available
  const campaignEvents = useMemo(() => {
    return mockEvents.filter(event => event.masterProgramId === campaign.id);
  }, [campaign.id]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: typeof campaign.status) => {
    const config = STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      bgClass: 'bg-gray-100 dark:bg-gray-800',
      textClass: 'text-gray-700 dark:text-gray-300',
      borderClass: 'border-gray-300 dark:border-gray-600',
      icon: 'help-circle' as const,
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        <Icon name={config.icon} className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const renderEventStatusBadge = (status: UXPEvent['status']) => {
    const config = EVENT_STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      bgClass: 'bg-gray-100 dark:bg-gray-800',
      textClass: 'text-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
        {config.label}
      </span>
    );
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mt-1"
            >
              <Icon name="chevron-left" className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {campaign.name}
                </h1>
                {renderStatusBadge(campaign.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Icon name="building" className="w-4 h-4" />
                  {campaign.clientName || 'Unknown Client'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="sparkles" className="w-4 h-4" />
                  {campaign.eventType}
                </span>
                {campaign.region && (
                  <span className="flex items-center gap-1.5">
                    <Icon name="globe" className="w-4 h-4" />
                    {campaign.region}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onEdit}>
              <Icon name="edit" className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <Icon name="trash" className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Campaign Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Campaign Information
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Campaign Code</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">{campaign.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">{renderStatusBadge(campaign.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{campaign.clientName || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Type</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{campaign.eventType}</dd>
              </div>
              {campaign.region && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{campaign.region}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {campaignEvents.length} {campaignEvents.length === 1 ? 'event' : 'events'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {campaign.createdAt.toLocaleDateString()} by {campaign.createdBy}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {campaign.updatedAt.toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Events List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Events ({campaignEvents.length})
              </h2>
              {onAddEvent && (
                <Button variant="primary" onClick={onAddEvent}>
                  <Icon name="add" className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              )}
            </div>

            {campaignEvents.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="calendar" className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No events yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first event to this campaign
                </p>
                {onAddEvent && (
                  <Button variant="primary" onClick={onAddEvent}>
                    <Icon name="add" className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Venue
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-700">
                    {campaignEvents.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event.eventName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {event.venueName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {event.city}, {event.state}
                        </td>
                        <td className="px-4 py-3">
                          {renderEventStatusBadge(event.status)}
                        </td>
                        <td className="px-4 py-3">
                          <Tooltip content="View Event">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Icon name="external-link" className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Activity Timeline
            </h2>
            <div className="space-y-4">
              {/* Recent Activity Items */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon name="check-circle" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                </div>
                <div className="flex-1 pb-6">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Campaign created
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {campaign.createdAt.toLocaleString()} by {campaign.createdBy}
                  </p>
                </div>
              </div>

              {campaignEvents.length > 0 && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Icon name="calendar" className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaignEvents.length} {campaignEvents.length === 1 ? 'event' : 'events'} added
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Latest: {new Date(campaignEvents[0].eventDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Campaign"
          message={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone and will affect all ${campaignEvents.length} associated events.`}
          confirmLabel="Delete Campaign"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
