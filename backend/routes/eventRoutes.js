/**
 * Event API Routes
 *
 * Endpoints for managing events in UXP Platform.
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, find, create, update, deleteById, executeQuery } = require('../database/azureSqlDb');
const { validateEvent, validatePagination, validateId } = require('../middleware/validation');
const { requirePermission } = require('../middleware/uxpRbac');
const { PERMISSIONS } = require('../config/uxpRbac');

/**
 * GET /api/events
 * List all events with filtering, sorting, and pagination
 *
 * Query params:
 * - campaignId: Filter by campaign ID
 * - status: Filter by status (scheduled, in-progress, completed, cancelled)
 * - city: Filter by city
 * - country: Filter by country
 * - startDateFrom: Filter events starting from this date (ISO format)
 * - startDateTo: Filter events starting before this date (ISO format)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - sort: Sort field (default: 'eventStartDate ASC')
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.EVENT_READ),
  validatePagination,
  async (req, res) => {
    try {
      const { campaignId, status, city, country, startDateFrom, startDateTo, page, limit, sort } = req.query;

      // Build filter object
      const filter = {};
      if (campaignId) filter.campaignId = campaignId;
      if (status) filter.status = status;
      if (city) filter.city = city;
      if (country) filter.country = country;

      // Query options
      const options = {
        filter,
        sort: sort || 'eventStartDate ASC',
        page: page || 1,
        limit: limit || 50,
      };

      // Note: Date range filtering requires custom query
      // For simplicity, we'll use basic filtering here
      // TODO: Enhance with date range support

      const result = await findAll('Events', options);

      console.log(`[API] Retrieved ${result.data.length} events (page ${result.pagination.page}/${result.pagination.totalPages})`);

      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching events:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch events',
        details: { error: error.message },
      });
    }
  }
);

/**
 * POST /api/events
 * Create a new event
 *
 * Required fields:
 * - campaignId
 * - eventName
 * - eventStartDate
 * - eventEndDate
 * - eventVenue
 * - city
 * - country
 * - owner
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.EVENT_CREATE),
  validateEvent,
  async (req, res) => {
    try {
      // Verify campaign exists
      const campaign = await findById('Campaigns', req.body.campaignId);
      if (!campaign) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Campaign not found',
        });
      }

      const eventData = {
        ...req.body,
        createdBy: req.user.email,
        lastModifiedBy: req.user.email,
        status: req.body.status || 'scheduled',
      };

      const event = await create('Events', eventData);

      console.log(`[API] ✅ Event created: ${event.id} by ${req.user.email}`);

      res.status(201).json(event);
    } catch (error) {
      console.error('[API] Error creating event:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create event',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/events/:id
 * Get a single event by ID
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_READ),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const event = await findById('Events', id);

      if (!event) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Event not found',
        });
      }

      console.log(`[API] Retrieved event: ${event.id}`);

      res.json(event);
    } catch (error) {
      console.error('[API] Error fetching event:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch event',
        details: { error: error.message },
      });
    }
  }
);

/**
 * PUT /api/events/:id
 * Update an event
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_UPDATE),
  validateId,
  validateEvent,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Add lastModifiedBy
      const updates = {
        ...req.body,
        lastModifiedBy: req.user.email,
      };

      const updatedEvent = await update('Events', id, updates);

      if (!updatedEvent) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Event not found',
        });
      }

      console.log(`[API] ✅ Event updated: ${id} by ${req.user.email}`);

      res.json(updatedEvent);
    } catch (error) {
      console.error('[API] Error updating event:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to update event',
        details: { error: error.message },
      });
    }
  }
);

/**
 * DELETE /api/events/:id
 * Delete an event
 *
 * Note: This will cascade delete all associated QR codes and assignments
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_DELETE),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await deleteById('Events', id);

      if (!deleted) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Event not found',
        });
      }

      console.log(`[API] ✅ Event deleted: ${id} by ${req.user.email}`);

      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting event:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to delete event',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/events/calendar
 * Get events formatted for calendar view
 *
 * Returns events with date/time info formatted for calendar UI
 */
router.get(
  '/calendar/view',
  requirePermission(PERMISSIONS.EVENT_READ),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Build query for date range
      let query = 'SELECT * FROM Events';
      const params = {};

      if (startDate && endDate) {
        query += ' WHERE eventStartDate >= @startDate AND eventEndDate <= @endDate';
        params.startDate = startDate;
        params.endDate = endDate;
      }

      query += ' ORDER BY eventStartDate ASC';

      const result = await executeQuery(query, params);
      const events = result.recordset;

      // Format for calendar
      const calendarEvents = events.map(event => ({
        id: event.id,
        title: event.eventName,
        start: event.eventStartDate,
        end: event.eventEndDate,
        campaignId: event.campaignId,
        city: event.city,
        country: event.country,
        venue: event.eventVenue,
        status: event.status,
        owner: event.owner,
      }));

      console.log(`[API] Retrieved ${calendarEvents.length} events for calendar view`);

      res.json({
        totalEvents: calendarEvents.length,
        events: calendarEvents,
      });
    } catch (error) {
      console.error('[API] Error fetching calendar events:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch calendar events',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/events/map
 * Get events formatted for map view
 *
 * Returns events with lat/long for map markers
 */
router.get(
  '/map/view',
  requirePermission(PERMISSIONS.EVENT_READ),
  async (req, res) => {
    try {
      // Get events with valid lat/long coordinates
      const query = `
        SELECT *
        FROM Events
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY eventStartDate DESC
      `;

      const result = await executeQuery(query);
      const events = result.recordset;

      // Format for map
      const mapMarkers = events.map(event => ({
        id: event.id,
        eventName: event.eventName,
        campaignId: event.campaignId,
        latitude: event.latitude,
        longitude: event.longitude,
        city: event.city,
        country: event.country,
        venue: event.eventVenue,
        status: event.status,
        startDate: event.eventStartDate,
        endDate: event.eventEndDate,
      }));

      console.log(`[API] Retrieved ${mapMarkers.length} events for map view`);

      res.json({
        totalMarkers: mapMarkers.length,
        markers: mapMarkers,
      });
    } catch (error) {
      console.error('[API] Error fetching map events:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch map events',
        details: { error: error.message },
      });
    }
  }
);

module.exports = router;
