/**
 * EventMap - Map View Component
 *
 * Features:
 * - Google Maps showing all event venues
 * - Markers clustered by proximity
 * - Click marker → event detail popup
 * - Filter by: Date range, Campaign, Status
 * - Zoom to fit all markers
 * - Legend showing campaign colors
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useEvents } from '../../contexts/EventContext';
import type { Event, Campaign, EventMapMarker } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Icon } from '../ui/Icon';

// Google Maps API Key (to be configured via environment variable)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const HAS_VALID_API_KEY = GOOGLE_MAPS_API_KEY && !GOOGLE_MAPS_API_KEY.includes('XXX') && GOOGLE_MAPS_API_KEY.length > 20;

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 39.8283, // Center of USA
  lng: -98.5795,
};

interface EventMapProps {
  campaigns?: Campaign[];
  onEventClick?: (event: Event) => void;
  className?: string;
}

const EventMap: React.FC<EventMapProps> = ({ campaigns = [], onEventClick, className = '' }) => {
  const { filteredEvents, setFilters, filters } = useEvents();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<EventMapMarker | null>(null);

  // Transform events into map markers
  const markers = useMemo((): EventMapMarker[] => {
    return filteredEvents
      .filter((event) => event.latitude !== undefined && event.longitude !== undefined)
      .map((event) => {
        const campaign = campaigns.find((c) => c.id === event.campaignId);
        const color = campaign ? getCampaignColor(campaign.client) : '#3B82F6';

        return {
          id: event.id,
          position: {
            lat: event.latitude!,
            lng: event.longitude!,
          },
          title: event.eventName,
          event,
          campaign: campaign || ({ id: event.campaignId, client: 'Unknown' } as Campaign),
          color,
        };
      });
  }, [filteredEvents, campaigns]);

  // Unique campaigns for filter
  const uniqueCampaigns = useMemo(() => {
    const campaignMap = new Map<string, Campaign>();
    filteredEvents.forEach((event) => {
      const campaign = campaigns.find((c) => c.id === event.campaignId);
      if (campaign && !campaignMap.has(campaign.id)) {
        campaignMap.set(campaign.id, campaign);
      }
    });
    return Array.from(campaignMap.values());
  }, [filteredEvents, campaigns]);

  // Fit bounds to show all markers
  const fitBounds = useCallback(() => {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend(new google.maps.LatLng(marker.position.lat, marker.position.lng));
    });

    map.fitBounds(bounds);
  }, [map, markers]);

  // Auto-fit bounds when markers change
  useEffect(() => {
    if (map && markers.length > 0) {
      fitBounds();
    }
  }, [markers, map, fitBounds]);

  // Handle marker click
  const handleMarkerClick = (marker: EventMapMarker) => {
    setSelectedMarker(marker);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  // Handle "View Details" button click
  const handleViewDetails = (event: Event) => {
    if (onEventClick) {
      onEventClick(event);
    }
    setSelectedMarker(null);
  };

  // Filter handlers
  const handleCampaignFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ campaigns: undefined });
    } else {
      setFilters({ campaigns: [value] });
    }
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ statuses: undefined });
    } else {
      setFilters({ statuses: [value as Event['status']] });
    }
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateFrom: value ? new Date(value) : undefined });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateTo: value ? new Date(value) : undefined });
  };

  // Custom marker icon based on campaign color
  const getMarkerIcon = (color: string) => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  });

  // If no valid API key, show placeholder
  if (!HAS_VALID_API_KEY) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}>
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon name="location" className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Google Maps API Key Required
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To display the event map, please configure your Google Maps API key in the environment variables.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-2">
                Add to <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.local</code>:
              </p>
              <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Get an API key from: <a href="https://console.cloud.google.com/apis" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Google Cloud Console</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Left: Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Icon name="location" className="w-4 h-4" />
          <span>
            Showing <strong className="text-gray-900 dark:text-gray-100">{markers.length}</strong> events on map
          </span>
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range */}
          <input
            type="date"
            onChange={handleDateFromChange}
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="From"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            onChange={handleDateToChange}
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="To"
          />

          {/* Campaign filter */}
          <select
            onChange={handleCampaignFilter}
            value={filters.campaigns?.[0] || 'all'}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Campaigns</option>
            {uniqueCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.campaignName}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            onChange={handleStatusFilter}
            value={filters.statuses?.[0] || 'all'}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Fit bounds button */}
          <button
            onClick={fitBounds}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
            title="Zoom to fit all events"
          >
            <Icon name="globe" className="w-4 h-4" />
            Fit All
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={4}
            onLoad={setMap}
            options={{
              styles: [], // Can add custom styles here for dark mode
              zoomControl: true,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Marker Clusterer for grouping nearby markers */}
            <MarkerClusterer>
              {(clusterer) => (
                <>
                  {markers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={marker.position}
                      title={marker.title}
                      icon={getMarkerIcon(marker.color)}
                      onClick={() => handleMarkerClick(marker)}
                      clusterer={clusterer}
                    />
                  ))}
                </>
              )}
            </MarkerClusterer>

            {/* Info Window */}
            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={handleInfoWindowClose}
              >
                <div className="p-2 max-w-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{selectedMarker.event.eventName}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" className="w-4 h-4" />
                      <span>
                        {selectedMarker.event.eventStartDate ? new Date(selectedMarker.event.eventStartDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="location" className="w-4 h-4" />
                      <span>
                        {selectedMarker.event.eventVenue}, {selectedMarker.event.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="briefcase" className="w-4 h-4" />
                      <span>{selectedMarker.campaign.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedMarker.event.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetails(selectedMarker.event)}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Colors:</span>
        {uniqueCampaigns.slice(0, 8).map((campaign) => (
          <div key={campaign.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: getCampaignColor(campaign.client) }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{campaign.client}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventMap;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate consistent color for campaign client
 */
function getCampaignColor(client: string): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  let hash = 0;
  for (let i = 0; i < client.length; i++) {
    hash = client.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
