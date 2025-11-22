/**
 * EventMap - Map View Component
 *
 * Features:
 * - OpenStreetMap showing all event venues (using Leaflet)
 * - Interactive markers for each event
 * - Click marker → event detail popup
 * - Filter by: Date range, Campaign, Status
 * - Zoom to fit all markers
 * - Legend showing campaign colors
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './EventMap.css';
import { useEvents } from '../../contexts/EventContext';
import type { Event, Campaign, EventMapMarker } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Icon } from '../ui/Icon';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const defaultCenter: [number, number] = [39.8283, -98.5795]; // Center of USA
const defaultZoom = 4;

interface EventMapProps {
  campaigns?: Campaign[];
  onEventClick?: (event: Event) => void;
  className?: string;
}

// Helper component to fit bounds when markers change
const FitBoundsController: React.FC<{ markers: EventMapMarker[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.position.lat, m.position.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
};

const EventMap: React.FC<EventMapProps> = ({ campaigns = [], onEventClick, className = '' }) => {
  const { filteredEvents, setFilters, filters } = useEvents();
  const mapRef = useRef<L.Map | null>(null);
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
    if (!mapRef.current || markers.length === 0) return;

    const bounds = L.latLngBounds(markers.map((m) => [m.position.lat, m.position.lng]));
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [markers]);

  // Handle marker click
  const handleMarkerClick = (marker: EventMapMarker) => {
    setSelectedMarker(marker);
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

  // Create custom marker icon based on campaign color
  const createCustomIcon = (color: string) => {
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="#ffffff" stroke-width="3" opacity="0.9"/>
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

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
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-fit bounds when markers change */}
          <FitBoundsController markers={markers} />

          {/* Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.position.lat, marker.position.lng]}
              icon={createCustomIcon(marker.color)}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="p-2 max-w-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{marker.event.eventName}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4">📅</span>
                      <span>
                        {marker.event.eventStartDate
                          ? new Date(marker.event.eventStartDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4">📍</span>
                      <span>
                        {marker.event.eventVenue}, {marker.event.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4">💼</span>
                      <span>{marker.campaign.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={marker.event.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetails(marker.event)}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
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
