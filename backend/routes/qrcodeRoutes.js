/**
 * QR Code API Routes
 *
 * Endpoints for managing QR codes for lead capture and tracking.
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, find, create, deleteById } = require('../database/azureSqlDb');
const { validateQRCode, validatePagination, validateId } = require('../middleware/validation');
const { requirePermission } = require('../middleware/uxpRbac');
const { PERMISSIONS } = require('../config/uxpRbac');

/**
 * GET /api/qrcodes
 * List all QR codes
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.QRCODE_READ),
  validatePagination,
  async (req, res) => {
    try {
      const { eventId, page, limit, sort } = req.query;

      const filter = {};
      if (eventId) filter.eventId = eventId;

      const options = {
        filter,
        sort: sort || 'generatedOn DESC',
        page: page || 1,
        limit: limit || 50,
      };

      const result = await findAll('QRCodes', options);

      console.log(`[API] Retrieved ${result.data.length} QR codes`);
      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching QR codes:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch QR codes',
        details: { error: error.message },
      });
    }
  }
);

/**
 * POST /api/qrcodes
 * Generate a new QR code
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.QRCODE_CREATE),
  validateQRCode,
  async (req, res) => {
    try {
      // Verify event exists
      const event = await findById('Events', req.body.eventId);
      if (!event) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Event not found',
        });
      }

      const qrcodeData = {
        ...req.body,
        scanCount: 0,
        generatedOn: new Date().toISOString(),
      };

      const qrcode = await create('QRCodes', qrcodeData);

      console.log(`[API] ✅ QR Code generated: ${qrcode.id}`);
      res.status(201).json(qrcode);
    } catch (error) {
      console.error('[API] Error generating QR code:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to generate QR code',
        details: { error: error.message },
      });
    }
  }
);

/**
 * GET /api/qrcodes/:id
 * Get a single QR code by ID
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.QRCODE_READ),
  validateId,
  async (req, res) => {
    try {
      const qrcode = await findById('QRCodes', req.params.id);

      if (!qrcode) {
        return res.status(404).json({
          error: 'not_found',
          message: 'QR Code not found',
        });
      }

      res.json(qrcode);
    } catch (error) {
      console.error('[API] Error fetching QR code:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch QR code',
        details: { error: error.message },
      });
    }
  }
);

/**
 * DELETE /api/qrcodes/:id
 * Delete a QR code
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QRCODE_DELETE),
  validateId,
  async (req, res) => {
    try {
      const deleted = await deleteById('QRCodes', req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'not_found',
          message: 'QR Code not found',
        });
      }

      console.log(`[API] ✅ QR Code deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting QR code:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to delete QR code',
        details: { error: error.message },
      });
    }
  }
);

module.exports = router;
