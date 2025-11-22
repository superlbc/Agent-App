/**
 * Venue API Routes
 *
 * Endpoints for managing venues in UXP Platform.
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, find, create, update, deleteById } = require('../database/azureSqlDb');
const { validateVenue, validatePagination, validateId } = require('../middleware/validation');
const { requirePermission } = require('../middleware/uxpRbac');
const { PERMISSIONS } = require('../config/uxpRbac');

/**
 * GET /api/venues
 * List all venues with filtering
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.VENUE_READ),
  validatePagination,
  async (req, res) => {
    try {
      const { city, country, category, page, limit, sort } = req.query;

      const filter = {};
      if (city) filter.city = city;
      if (country) filter.country = country;
      if (category) filter.category = category;

      const options = {
        filter,
        sort: sort || 'name ASC',
        page: page || 1,
        limit: limit || 50,
      };

      const result = await findAll('Venues', options);

      console.log(`[API] Retrieved ${result.data.length} venues`);
      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching venues:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch venues',
        details: { error: error.message },
      });
    }
  }
);

/**
 * POST /api/venues
 * Create a new venue
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.VENUE_CREATE),
  validateVenue,
  async (req, res) => {
    try {
      const venue = await create('Venues', req.body);
      console.log(`[API] ✅ Venue created: ${venue.id}`);
      res.status(201).json(venue);
    } catch (error) {
      console.error('[API] Error creating venue:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create venue',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/venues/:id
 * Get a single venue by ID
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.VENUE_READ),
  validateId,
  async (req, res) => {
    try {
      const venue = await findById('Venues', req.params.id);

      if (!venue) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Venue not found',
        });
      }

      res.json(venue);
    } catch (error) {
      console.error('[API] Error fetching venue:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch venue',
        details: { error: error.message },
      });
    }
  }
);

/**
 * PUT /api/venues/:id
 * Update a venue
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.VENUE_UPDATE),
  validateId,
  validateVenue,
  async (req, res) => {
    try {
      const updatedVenue = await update('Venues', req.params.id, req.body);

      if (!updatedVenue) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Venue not found',
        });
      }

      console.log(`[API] ✅ Venue updated: ${req.params.id}`);
      res.json(updatedVenue);
    } catch (error) {
      console.error('[API] Error updating venue:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to update venue',
        details: { error: error.message },
      });
    }
  }
);

/**
 * DELETE /api/venues/:id
 * Delete a venue
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.VENUE_DELETE),
  validateId,
  async (req, res) => {
    try {
      const deleted = await deleteById('Venues', req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Venue not found',
        });
      }

      console.log(`[API] ✅ Venue deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting venue:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to delete venue',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/venues/:id/events
 * Get all events at a venue
 */
router.get(
  '/:id/events',
  requirePermission(PERMISSIONS.EVENT_READ),
  validateId,
  async (req, res) => {
    try {
      const venue = await findById('Venues', req.params.id);
      if (!venue) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Venue not found',
        });
      }

      const events = await find('Events', { eventVenue: venue.name });

      res.json({
        venueId: req.params.id,
        venueName: venue.name,
        totalEvents: events.length,
        events,
      });
    } catch (error) {
      console.error('[API] Error fetching venue events:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch venue events',
        details: { error: error.message },
      });
    }
  }
);

module.exports = router;
