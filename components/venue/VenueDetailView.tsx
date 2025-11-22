// ============================================================================
// VENUE DETAIL VIEW
// ============================================================================
// Comprehensive venue detail page with map, events list, and usage statistics
// Displays venue information, location map, and event history

import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Venue } from '../../types';
import { useVenue } from '../../contexts/VenueContext';
import { useRole } from '../../contexts/RoleContext';

interface VenueDetailViewProps {
  venue: Venue;
  onClose?: () => void;
  onEdit?: () => void;
}

const VenueDetailView: React.FC<VenueDetailViewProps> = ({
  venue,
  onClose,
  onEdit,
}) => {
  const { deleteVenue, startEdit } = useVenue();
  const { hasPermission } = useRole();

  // Permission checks
  const canUpdate = hasPermission('VENUE_UPDATE');
  const canDelete = hasPermission('VENUE_DELETE');

  // State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      startEdit(venue);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteVenue(venue.id);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete venue:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ============================================================================
  // MAP URL GENERATION
  // ============================================================================

  // Generate Google Maps static map URL (for production, use actual API key)
  const getMapUrl = () => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${venue.latitude},${venue.longitude}`,
      zoom: '15',
      size: '600x300',
      markers: `color:red|${venue.latitude},${venue.longitude}`,
      key: 'MOCK_API_KEY', // Replace with actual API key in production
    });
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate Google Maps link URL (opens in new tab)
  const getMapsLinkUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
  };

  // ============================================================================
  // MOCK EVENT DATA (will be replaced with actual event linkage)
  // ============================================================================

  const mockEvents = [
    {
      id: 'evt-001',
      name: 'Super Bowl LVIII',
      date: new Date('2024-02-11'),
      client: 'NFL',
      status: 'completed',
    },
    {
      id: 'evt-002',
      name: 'Taylor Swift Concert',
      date: new Date('2024-05-20'),
      client: 'Live Nation',
      status: 'completed',
    },
    {
      id: 'evt-003',
      name: 'WrestleMania XL',
      date: new Date('2024-04-06'),
      client: 'WWE',
      status: 'completed',
    },
  ];

  // Usage statistics (mock - will be computed from actual events)
  const usageStats = {
    totalEvents: venue.eventsCount || 0,
    mostRecentEvent: mockEvents.length > 0 ? mockEvents[0] : null,
    mostCommonClient: 'NFL', // Mock
    averageEventsPerYear: venue.eventsCount ? Math.round((venue.eventsCount / 2) * 10) / 10 : 0, // Mock calculation
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {venue.name}
            </h1>
            <StatusBadge
              status={venue.status}
              statusMap={{
                active: { label: 'Active', color: 'green' },
                verified: { label: 'Verified', color: 'blue' },
                archived: { label: 'Archived', color: 'gray' },
              }}
            />
          </div>
          {venue.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Icon name="map-pin" size={16} className="mr-2" />
              {venue.category}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {canUpdate && (
            <Button variant="secondary" onClick={handleEdit} leftIcon="edit">
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              leftIcon="trash"
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" onClick={onClose} leftIcon="x">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Venue Information Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Venue Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Address
            </h3>
            <p className="text-gray-900 dark:text-white">{venue.fullAddress}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Location
            </h3>
            <p className="text-gray-900 dark:text-white">
              {venue.city}, {venue.state ? `${venue.state}, ` : ''}{venue.country}
            </p>
            {venue.postCode && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Postal Code: {venue.postCode}
              </p>
            )}
          </div>

          {/* Coordinates */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Coordinates
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white">
                {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
              </span>
              <a
                href={getMapsLinkUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                <Icon name="external-link" size={16} className="inline" /> View on Google Maps
              </a>
            </div>
          </div>

          {/* Website */}
          {venue.url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Website
              </h3>
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {venue.url}
                <Icon name="external-link" size={14} className="inline ml-1" />
              </a>
            </div>
          )}

          {/* Tags */}
          {venue.tags && venue.tags.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Map Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Location Map
        </h2>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Mock map - in production, use actual Google Maps API */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Icon name="map-pin" size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Map Preview (Google Maps Integration)
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Location: {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
              </p>
              <a
                href={getMapsLinkUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Icon name="external-link" size={16} className="mr-2" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <Icon name="info" size={14} className="inline mr-1" />
          Map integration requires Google Maps API key. Placeholder shown for development.
        </p>
      </Card>

      {/* Usage Statistics Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Usage Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {usageStats.totalEvents}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Events
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {usageStats.averageEventsPerYear}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Events / Year
            </div>
          </div>
          <div className="md:col-span-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Most Common Client
            </div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {usageStats.mostCommonClient}
            </div>
          </div>
        </div>
      </Card>

      {/* Events Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Events at This Venue
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {mockEvents.length} events
          </span>
        </div>
        {mockEvents.length > 0 ? (
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      <Icon name="calendar" size={14} className="inline mr-1" />
                      {event.date.toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      <Icon name="briefcase" size={14} className="inline mr-1" />
                      {event.client}
                    </span>
                  </div>
                </div>
                <StatusBadge
                  status={event.status}
                  statusMap={{
                    completed: { label: 'Completed', color: 'green' },
                    upcoming: { label: 'Upcoming', color: 'blue' },
                    cancelled: { label: 'Cancelled', color: 'gray' },
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon name="calendar" size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No events found at this venue.
            </p>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <Icon name="info" size={14} className="inline mr-1" />
          Event backlinks will be implemented when Event entity is created in Agent 5.
        </p>
      </Card>

      {/* Metadata Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created By:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{venue.createdByName}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created On:</span>
            <span className="ml-2 text-gray-900 dark:text-white">
              {new Date(venue.createdOn).toLocaleDateString()}
            </span>
          </div>
          {venue.updatedBy && (
            <>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last Updated By:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{venue.updatedByName}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {venue.updatedOn ? new Date(venue.updatedOn).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Venue ID:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-mono">{venue.id}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Platform:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{venue.platform || 'Google Maps'}</span>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Venue"
          message={`Are you sure you want to delete "${venue.name}"? This action cannot be undone. All event associations will be removed.`}
          confirmText="Delete Venue"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default VenueDetailView;
