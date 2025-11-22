/**
 * Campaign API Routes
 *
 * Endpoints for managing campaigns in UXP Platform.
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, create, update, deleteById } = require('../database/azureSqlDb');
const { validateCampaign, validatePagination, validateId } = require('../middleware/validation');
const { requirePermission } = require('../middleware/uxpRbac');
const { PERMISSIONS } = require('../config/uxpRbac');

/**
 * GET /api/campaigns
 * List all campaigns with filtering, sorting, and pagination
 *
 * Query params:
 * - client: Filter by client name
 * - eventType: Filter by event type
 * - region: Filter by region
 * - status: Filter by status (planning, active, completed, cancelled)
 * - year: Filter by year
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - sort: Sort field (default: 'createdDate DESC')
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.CAMPAIGN_READ),
  validatePagination,
  async (req, res) => {
    try {
      const { client, eventType, region, status, year, page, limit, sort } = req.query;

      // Build filter object
      const filter = {};
      if (client) filter.client = client;
      if (eventType) filter.eventType = eventType;
      if (region) filter.region = region;
      if (status) filter.status = status;
      if (year) filter.year = parseInt(year, 10);

      // Query options
      const options = {
        filter,
        sort: sort || 'createdDate DESC',
        page: page || 1,
        limit: limit || 50,
      };

      const result = await findAll('Campaigns', options);

      console.log(`[API] Retrieved ${result.data.length} campaigns (page ${result.pagination.page}/${result.pagination.totalPages})`);

      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching campaigns:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch campaigns',
        details: { error: error.message },
      });
    }
  }
);

/**
 * POST /api/campaigns
 * Create a new campaign
 *
 * Required fields:
 * - campaignName
 * - client
 * - year
 * - campaignOwner
 *
 * Optional fields:
 * - campaignDescription
 * - eventType
 * - masterProgram
 * - region
 * - month
 * - campaignStartDate
 * - campaignEndDate
 * - status
 * - budget
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.CAMPAIGN_CREATE),
  validateCampaign,
  async (req, res) => {
    try {
      const campaignData = {
        ...req.body,
        createdBy: req.user.email,
        lastModifiedBy: req.user.email,
        status: req.body.status || 'planning',
      };

      const campaign = await create('Campaigns', campaignData);

      console.log(`[API] ✅ Campaign created: ${campaign.id} by ${req.user.email}`);

      res.status(201).json(campaign);
    } catch (error) {
      console.error('[API] Error creating campaign:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create campaign',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/campaigns/:id
 * Get a single campaign by ID
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CAMPAIGN_READ),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await findById('Campaigns', id);

      if (!campaign) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Campaign not found',
        });
      }

      console.log(`[API] Retrieved campaign: ${campaign.id}`);

      res.json(campaign);
    } catch (error) {
      console.error('[API] Error fetching campaign:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch campaign',
        details: { error: error.message },
      });
    }
  }
);

/**
 * PUT /api/campaigns/:id
 * Update a campaign
 *
 * Updates fields provided in request body.
 * Preserves id, createdBy, and createdDate.
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.CAMPAIGN_UPDATE),
  validateId,
  validateCampaign,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Add lastModifiedBy
      const updates = {
        ...req.body,
        lastModifiedBy: req.user.email,
      };

      const updatedCampaign = await update('Campaigns', id, updates);

      if (!updatedCampaign) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Campaign not found',
        });
      }

      console.log(`[API] ✅ Campaign updated: ${id} by ${req.user.email}`);

      res.json(updatedCampaign);
    } catch (error) {
      console.error('[API] Error updating campaign:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to update campaign',
        details: { error: error.message },
      });
    }
  }
);

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 *
 * Note: This will cascade delete all associated events, QR codes, and assignments
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CAMPAIGN_DELETE),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await deleteById('Campaigns', id);

      if (!deleted) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Campaign not found',
        });
      }

      console.log(`[API] ✅ Campaign deleted: ${id} by ${req.user.email}`);

      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting campaign:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to delete campaign',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/campaigns/:id/events
 * Get all events for a campaign
 */
router.get(
  '/:id/events',
  requirePermission(PERMISSIONS.EVENT_READ),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      // First verify campaign exists
      const campaign = await findById('Campaigns', id);
      if (!campaign) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Campaign not found',
        });
      }

      // Get events for this campaign
      const { find } = require('../database/azureSqlDb');
      const events = await find('Events', { campaignId: id });

      console.log(`[API] Retrieved ${events.length} events for campaign: ${id}`);

      res.json({
        campaignId: id,
        campaignName: campaign.campaignName,
        totalEvents: events.length,
        events,
      });
    } catch (error) {
      console.error('[API] Error fetching campaign events:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch campaign events',
        details: { error: error.message },
      });
    }
  }
);

module.exports = router;
