/**
 * EventDetailView - Event Detail Page Component
 *
 * Features:
 * - Header: Event name, status badge, dates, edit/delete buttons
 * - Info section: Campaign, Venue, City, Coordinates
 * - Map snippet: Small map showing venue location
 * - Team section: List of assigned people with roles
 * - QR codes section: Generated QR codes for this event
 * - Activity timeline: Recent changes
 */

import React, { useState } from 'react';
import type { Event, Campaign } from '../../types';
import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EventDetailViewProps {
  event: Event;
  campaign?: Campaign;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onClose?: () => void;
  className?: string;
}

const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  campaign,
  onEdit,
  onDelete,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'qrcodes'>('details');

  const handleEdit = () => {
    if (onEdit) onEdit(event);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${event.eventName}"?`)) {
      if (onDelete) onDelete(event);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'in-progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
        {/* Close button (if in modal) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon name="x-mark" className="w-6 h-6" />
          </button>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{event.eventName}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Icon name="calendar" className="w-4 h-4" />
                {formatDate(event.eventStartDate)}
              </span>
              {event.eventStartDate !== event.eventEndDate && (
                <>
                  <span>→</span>
                  <span>{formatDate(event.eventEndDate)}</span>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleEdit} leftIcon="pencil" size="sm">
            Edit Event
          </Button>
          <Button variant="secondary" onClick={handleDelete} leftIcon="trash" size="sm">
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 px-6">
          {[
            { key: 'details', label: 'Details', icon: 'information-circle' },
            { key: 'team', label: 'Team', icon: 'users' },
            { key: 'qrcodes', label: 'QR Codes', icon: 'qr-code' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Campaign Info */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="briefcase" className="w-5 h-5" />
                Campaign Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Campaign Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {campaign?.campaignName || 'Unknown Campaign'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{campaign?.client || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Event Type</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{campaign?.eventType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Region</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{campaign?.region || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Venue Info */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="location" className="w-5 h-5" />
                Venue & Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Venue</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{event.eventVenue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">City</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{event.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Country</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{event.country}</p>
                </div>
                {event.address && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{event.address}</p>
                  </div>
                )}
                {event.latitude && event.longitude && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Coordinates</p>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Lat: {event.latitude}, Lng: {event.longitude}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Icon name="globe" className="w-4 h-4" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Placeholder */}
              {event.latitude && event.longitude && (
                <div className="mt-4 h-48 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Icon name="location" className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Map will be displayed here</p>
                    <p className="text-xs">Google Maps integration pending</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Event Details */}
            {event.eventDetails && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Icon name="document-text" className="w-5 h-5" />
                  Event Details
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.eventDetails}</p>
              </Card>
            )}

            {/* Owner Info */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="user" className="w-5 h-5" />
                Event Owner
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {event.ownerName?.charAt(0).toUpperCase() || event.owner.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{event.ownerName || event.owner}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.owner}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div>
            {!event.peopleAssignments || event.peopleAssignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Icon name="users" className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                <p>No team members assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {event.peopleAssignments.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{member.userName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.userRole && (
                          <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
                            {member.userRole}
                          </span>
                        )}
                        {member.onSite && (
                          <span className="px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
                            On-site
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QR Codes Tab */}
        {activeTab === 'qrcodes' && (
          <div>
            {!event.qrCodes || event.qrCodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Icon name="qr-code" className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                <p>No QR codes generated yet</p>
                <Button variant="primary" className="mt-4" leftIcon="plus">
                  Generate QR Code
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {event.qrCodes.map((qr) => (
                  <Card key={qr.id} className="p-4 text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mb-3">
                      <Icon name="qr-code" className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scans: {qr.scanCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Generated: {qr.generatedOn ? new Date(qr.generatedOn).toLocaleDateString() : 'N/A'}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailView;
