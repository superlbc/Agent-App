/**
 * People Assignment API Routes
 *
 * Endpoints for managing team assignments to events.
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, find, create, deleteById } = require('../database/azureSqlDb');
const { validatePeopleAssignment, validatePagination, validateId } = require('../middleware/validation');
const { requirePermission } = require('../middleware/uxpRbac');
const { PERMISSIONS } = require('../config/uxpRbac');

/**
 * GET /api/assignments
 * List all assignments with filtering
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.ASSIGNMENT_READ),
  validatePagination,
  async (req, res) => {
    try {
      const { eventId, userId, onSite, page, limit, sort } = req.query;

      const filter = {};
      if (eventId) filter.eventId = eventId;
      if (userId) filter.userId = userId;
      if (onSite !== undefined) filter.onSite = onSite === 'true' ? 1 : 0;

      const options = {
        filter,
        sort: sort || 'assignmentDate DESC',
        page: page || 1,
        limit: limit || 50,
      };

      const result = await findAll('PeopleAssignments', options);

      console.log(`[API] Retrieved ${result.data.length} assignments`);
      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching assignments:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to fetch assignments',
        details: { error: error.message },
      });
    }
  }
);

/**
 * POST /api/assignments
 * Create a new assignment
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.ASSIGNMENT_CREATE),
  validatePeopleAssignment,
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

      const assignmentData = {
        ...req.body,
        onSite: req.body.onSite !== undefined ? req.body.onSite : 0,
      };

      const assignment = await create('PeopleAssignments', assignmentData);

      console.log(`[API] ✅ Assignment created: ${assignment.id}`);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('[API] Error creating assignment:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create assignment',
        details: { error: error.message },
      });
    }
  }
);

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.ASSIGNMENT_DELETE),
  validateId,
  async (req, res) => {
    try {
      const deleted = await deleteById('PeopleAssignments', req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Assignment not found',
        });
      }

      console.log(`[API] ✅ Assignment deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting assignment:', error.message);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to delete assignment',
        details: { error: error.message },
      });
    }
  }
);

module.exports = router;
