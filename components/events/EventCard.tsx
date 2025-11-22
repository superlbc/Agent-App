import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface Event {
  id: string;
  masterProgramId: string;
  programName?: string;
  clientName?: string;
  eventName: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  venueName: string;
  city: string;
  state: string;
  status: 'planned' | 'tentative' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  businessLeaderName?: string;
  brandscopicSyncStatus?: 'pending' | 'synced' | 'failed';
}

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onView: (event: Event) => void;
  onSubmitRecap?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onView,
  onSubmitRecap
}) => {
  const getStatusColor = (status: Event['status']): string => {
    const colors = {
      planned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      tentative: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || colors.planned;
  };

  const getSyncStatusIcon = (syncStatus?: Event['brandscopicSyncStatus']) => {
    if (!syncStatus) return null;

    const icons = {
      pending: <Icon name="clock" className="w-4 h-4 text-yellow-500" />,
      synced: <Icon name="check-circle" className="w-4 h-4 text-green-500" />,
      failed: <Icon name="alert-circle" className="w-4 h-4 text-red-500" />
    };
    return icons[syncStatus];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    // Convert 24h time to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onView(event)}
    >
      {/* Header with status badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {event.eventName}
          </h3>
          {event.clientName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {event.clientName} • {event.programName}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
      </div>

      {/* Event Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Icon name="calendar" className="w-4 h-4 mr-2 text-gray-500" />
          <span>{formatDate(event.eventDate)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Icon name="clock" className="w-4 h-4 mr-2 text-gray-500" />
          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Icon name="location" className="w-4 h-4 mr-2 text-gray-500" />
          <span>{event.venueName}, {event.city}, {event.state}</span>
        </div>
        {event.businessLeaderName && (
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Icon name="user" className="w-4 h-4 mr-2 text-gray-500" />
            <span>{event.businessLeaderName}</span>
          </div>
        )}
      </div>

      {/* Sync Status */}
      {event.brandscopicSyncStatus && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-4">
          {getSyncStatusIcon(event.brandscopicSyncStatus)}
          <span className="ml-2">
            Brandscopic: {event.brandscopicSyncStatus}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(event)}
          className="flex-1"
        >
          <Icon name="edit" className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(event)}
          className="flex-1"
        >
          <Icon name="eye" className="w-4 h-4 mr-1" />
          View
        </Button>
        {onSubmitRecap && (event.status === 'active' || event.status === 'completed') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSubmitRecap(event)}
            className="flex-1"
          >
            <Icon name="clipboard-list" className="w-4 h-4 mr-1" />
            Recap
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(event)}
        >
          <Icon name="trash" className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
};
