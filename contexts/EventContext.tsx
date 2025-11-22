/**
 * EventContext - State Management for UXP Event Management
 *
 * Provides:
 * - CRUD operations for events
 * - Filter and search functionality
 * - Calendar data transformation
 * - Map marker data preparation
 * - Integration with CampaignContext (when available)
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  Event,
  Campaign,
  EventFilters,
  CalendarEvent,
  EventMapMarker,
  EventStatistics,
  PeopleAssignment,
  QRCode,
} from '../types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface EventContextValue {
  // State
  events: Event[];
  filteredEvents: Event[];
  selectedEvent: Event | null;
  filters: EventFilters;
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  createEvent: (event: Omit<Event, 'id' | 'createdBy' | 'createdDate' | 'lastModified' | 'modifiedBy'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => Event | null;
  duplicateEvent: (id: string) => Promise<Event>;

  // Team Assignments
  addPeopleAssignment: (eventId: string, assignment: Omit<PeopleAssignment, 'id' | 'assignedBy' | 'assignedDate'>) => Promise<PeopleAssignment>;
  removePeopleAssignment: (eventId: string, assignmentId: string) => Promise<void>;
  updatePeopleAssignment: (eventId: string, assignmentId: string, updates: Partial<PeopleAssignment>) => Promise<PeopleAssignment>;

  // QR Codes
  generateQRCode: (eventId: string, codeData: string) => Promise<QRCode>;
  deleteQRCode: (eventId: string, qrCodeId: string) => Promise<void>;

  // Selection
  selectEvent: (event: Event | null) => void;

  // Filtering
  setFilters: (filters: Partial<EventFilters>) => void;
  clearFilters: () => void;
  searchEvents: (query: string) => void;

  // Data Transformations
  getCalendarEvents: (campaigns?: Campaign[]) => CalendarEvent[];
  getMapMarkers: (campaigns?: Campaign[]) => EventMapMarker[];
  getEventStatistics: () => EventStatistics;

  // Bulk Operations
  bulkDeleteEvents: (eventIds: string[]) => Promise<void>;
  bulkUpdateStatus: (eventIds: string[], status: Event['status']) => Promise<void>;

  // Import/Export
  exportEventsToCSV: () => void;
  importEventsFromCSV: (file: File) => Promise<void>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const EventContext = createContext<EventContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const EventProvider: React.FC<{ children: React.ReactNode; currentUser?: { name: string; email: string } }> = ({
  children,
  currentUser = { name: 'Unknown User', email: 'unknown@example.com' },
}) => {
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFiltersState] = useState<EventFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createEvent = useCallback(
    async (eventData: Omit<Event, 'id' | 'createdBy' | 'createdDate' | 'lastModified' | 'modifiedBy'>) => {
      setIsLoading(true);
      setError(null);
      try {
        const newEvent: Event = {
          ...eventData,
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdBy: currentUser.email,
          createdDate: new Date(),
          lastModified: new Date(),
          modifiedBy: currentUser.email,
        };

        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>) => {
      setIsLoading(true);
      setError(null);
      try {
        const eventIndex = events.findIndex((e) => e.id === id);
        if (eventIndex === -1) {
          throw new Error(`Event with ID ${id} not found`);
        }

        const updatedEvent: Event = {
          ...events[eventIndex],
          ...updates,
          lastModified: new Date(),
          modifiedBy: currentUser.email,
        };

        setEvents((prev) => {
          const newEvents = [...prev];
          newEvents[eventIndex] = updatedEvent;
          return newEvents;
        });

        if (selectedEvent?.id === id) {
          setSelectedEvent(updatedEvent);
        }

        return updatedEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [events, selectedEvent, currentUser]
  );

  const deleteEvent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  const getEvent = useCallback(
    (id: string) => {
      return events.find((e) => e.id === id) || null;
    },
    [events]
  );

  const duplicateEvent = useCallback(
    async (id: string) => {
      const eventToDuplicate = getEvent(id);
      if (!eventToDuplicate) {
        throw new Error(`Event with ID ${id} not found`);
      }

      const { id: _, createdBy: __, createdDate: ___, lastModified: ____, modifiedBy: _____, ...eventData } = eventToDuplicate;

      return createEvent({
        ...eventData,
        eventName: `${eventData.eventName} (Copy)`,
      });
    },
    [getEvent, createEvent]
  );

  // ============================================================================
  // TEAM ASSIGNMENTS
  // ============================================================================

  const addPeopleAssignment = useCallback(
    async (eventId: string, assignmentData: Omit<PeopleAssignment, 'id' | 'assignedBy' | 'assignedDate'>) => {
      const event = getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      const newAssignment: PeopleAssignment = {
        ...assignmentData,
        id: `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assignedBy: currentUser.email,
        assignedDate: new Date(),
      };

      const updatedEvent = await updateEvent(eventId, {
        peopleAssignments: [...(event.peopleAssignments || []), newAssignment],
      });

      return newAssignment;
    },
    [getEvent, updateEvent, currentUser]
  );

  const removePeopleAssignment = useCallback(
    async (eventId: string, assignmentId: string) => {
      const event = getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      await updateEvent(eventId, {
        peopleAssignments: (event.peopleAssignments || []).filter((a) => a.id !== assignmentId),
      });
    },
    [getEvent, updateEvent]
  );

  const updatePeopleAssignment = useCallback(
    async (eventId: string, assignmentId: string, updates: Partial<PeopleAssignment>) => {
      const event = getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      const assignmentIndex = (event.peopleAssignments || []).findIndex((a) => a.id === assignmentId);
      if (assignmentIndex === -1) {
        throw new Error(`Assignment with ID ${assignmentId} not found in event ${eventId}`);
      }

      const updatedAssignments = [...(event.peopleAssignments || [])];
      updatedAssignments[assignmentIndex] = {
        ...updatedAssignments[assignmentIndex],
        ...updates,
      };

      await updateEvent(eventId, {
        peopleAssignments: updatedAssignments,
      });

      return updatedAssignments[assignmentIndex];
    },
    [getEvent, updateEvent]
  );

  // ============================================================================
  // QR CODES
  // ============================================================================

  const generateQRCode = useCallback(
    async (eventId: string, codeData: string) => {
      const event = getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      const newQRCode: QRCode = {
        id: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        codeData,
        generatedOn: new Date(),
        scanCount: 0,
        createdBy: currentUser.email,
        lastModified: new Date(),
      };

      await updateEvent(eventId, {
        qrCodes: [...(event.qrCodes || []), newQRCode],
      });

      return newQRCode;
    },
    [getEvent, updateEvent, currentUser]
  );

  const deleteQRCode = useCallback(
    async (eventId: string, qrCodeId: string) => {
      const event = getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      await updateEvent(eventId, {
        qrCodes: (event.qrCodes || []).filter((qr) => qr.id !== qrCodeId),
      });
    },
    [getEvent, updateEvent]
  );

  // ============================================================================
  // SELECTION
  // ============================================================================

  const selectEvent = useCallback((event: Event | null) => {
    setSelectedEvent(event);
  }, []);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const setFilters = useCallback((newFilters: Partial<EventFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const searchEvents = useCallback((query: string) => {
    setFilters({ searchQuery: query });
  }, [setFilters]);

  // Apply filters whenever events or filters change
  useEffect(() => {
    let result = [...events];

    // Filter by campaigns
    if (filters.campaigns && filters.campaigns.length > 0) {
      result = result.filter((e) => filters.campaigns!.includes(e.campaignId));
    }

    // Filter by statuses
    if (filters.statuses && filters.statuses.length > 0) {
      result = result.filter((e) => filters.statuses!.includes(e.status));
    }

    // Filter by cities
    if (filters.cities && filters.cities.length > 0) {
      result = result.filter((e) => filters.cities!.includes(e.city));
    }

    // Filter by countries
    if (filters.countries && filters.countries.length > 0) {
      result = result.filter((e) => filters.countries!.includes(e.country));
    }

    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter((e) => new Date(e.eventStartDate) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((e) => new Date(e.eventEndDate) <= filters.dateTo!);
    }

    // Filter by owners
    if (filters.owners && filters.owners.length > 0) {
      result = result.filter((e) => filters.owners!.includes(e.owner));
    }

    // Search query (event name or venue)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName.toLowerCase().includes(query) ||
          e.eventVenue.toLowerCase().includes(query) ||
          e.city.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(result);
  }, [events, filters]);

  // ============================================================================
  // DATA TRANSFORMATIONS
  // ============================================================================

  const getCalendarEvents = useCallback(
    (campaigns: Campaign[] = []): CalendarEvent[] => {
      return filteredEvents.map((event) => {
        const campaign = campaigns.find((c) => c.id === event.campaignId);
        const color = campaign ? getCampaignColor(campaign.client) : '#3B82F6'; // Default blue

        return {
          id: event.id,
          title: event.eventName,
          start: new Date(event.eventStartDate),
          end: new Date(event.eventEndDate),
          resource: {
            event,
            campaign: campaign || ({ id: event.campaignId, client: 'Unknown' } as Campaign),
            color,
          },
        };
      });
    },
    [filteredEvents]
  );

  const getMapMarkers = useCallback(
    (campaigns: Campaign[] = []): EventMapMarker[] => {
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
    },
    [filteredEvents]
  );

  const getEventStatistics = useCallback((): EventStatistics => {
    const now = new Date();

    const stats: EventStatistics = {
      totalEvents: events.length,
      upcomingEvents: 0,
      inProgressEvents: 0,
      completedEvents: 0,
      cancelledEvents: 0,
      eventsByCampaign: {},
      eventsByMonth: {},
      eventsByCity: {},
    };

    events.forEach((event) => {
      // Status counts
      const startDate = new Date(event.eventStartDate);
      const endDate = new Date(event.eventEndDate);

      if (event.status === 'cancelled') {
        stats.cancelledEvents++;
      } else if (event.status === 'completed') {
        stats.completedEvents++;
      } else if (startDate <= now && endDate >= now) {
        stats.inProgressEvents++;
      } else if (startDate > now) {
        stats.upcomingEvents++;
      }

      // By campaign
      stats.eventsByCampaign[event.campaignId] = (stats.eventsByCampaign[event.campaignId] || 0) + 1;

      // By month
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      stats.eventsByMonth[monthKey] = (stats.eventsByMonth[monthKey] || 0) + 1;

      // By city
      stats.eventsByCity[event.city] = (stats.eventsByCity[event.city] || 0) + 1;
    });

    return stats;
  }, [events]);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const bulkDeleteEvents = useCallback(async (eventIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      setEvents((prev) => prev.filter((e) => !eventIds.includes(e.id)));
      if (selectedEvent && eventIds.includes(selectedEvent.id)) {
        setSelectedEvent(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  const bulkUpdateStatus = useCallback(async (eventIds: string[], status: Event['status']) => {
    setIsLoading(true);
    setError(null);
    try {
      setEvents((prev) =>
        prev.map((e) =>
          eventIds.includes(e.id)
            ? {
                ...e,
                status,
                lastModified: new Date(),
                modifiedBy: currentUser.email,
              }
            : e
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  const exportEventsToCSV = useCallback(() => {
    const csvHeaders = [
      'Event Name',
      'Campaign ID',
      'Start Date',
      'End Date',
      'Venue',
      'City',
      'Country',
      'Status',
      'Owner',
    ];

    const csvRows = filteredEvents.map((event) => [
      event.eventName,
      event.campaignId,
      event.eventStartDate.toISOString(),
      event.eventEndDate.toISOString(),
      event.eventVenue,
      event.city,
      event.country,
      event.status,
      event.ownerName || event.owner,
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents]);

  const importEventsFromCSV = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        // TODO: Implement CSV parsing and event creation
        // This is a placeholder - actual implementation would parse CSV and create events
        console.log('CSV import not yet implemented', { headers, rowCount: lines.length - 1 });
        throw new Error('CSV import not yet implemented');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import events from CSV';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: EventContextValue = {
    // State
    events,
    filteredEvents,
    selectedEvent,
    filters,
    isLoading,
    error,

    // CRUD
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    duplicateEvent,

    // Team Assignments
    addPeopleAssignment,
    removePeopleAssignment,
    updatePeopleAssignment,

    // QR Codes
    generateQRCode,
    deleteQRCode,

    // Selection
    selectEvent,

    // Filtering
    setFilters,
    clearFilters,
    searchEvents,

    // Transformations
    getCalendarEvents,
    getMapMarkers,
    getEventStatistics,

    // Bulk
    bulkDeleteEvents,
    bulkUpdateStatus,

    // Import/Export
    exportEventsToCSV,
    importEventsFromCSV,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate consistent color for campaign client
 * Uses simple hash to ensure same client always gets same color
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

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < client.length; i++) {
    hash = client.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
