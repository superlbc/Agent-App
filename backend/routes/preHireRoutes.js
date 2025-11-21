/**
 * Pre-Hire Routes
 *
 * REST API endpoints for Pre-Hire CRUD operations
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateAzureADToken, checkPermission } = require('../middleware/auth');

// Apply Azure AD authentication to all routes
router.use(validateAzureADToken);

/**
 * GET /api/pre-hires
 * Get all pre-hire records
 *
 * Permission: PREHIRE_READ
 */
router.get('/', checkPermission('PREHIRE_READ'), (req, res) => {
  try {
    const { status, department, startDate_from, startDate_to, page, limit } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const options = {
      filter,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    };

    let result = db.findAll('preHires', options);

    // Additional filtering for date ranges (not supported by simple filter)
    if (startDate_from || startDate_to) {
      result.data = result.data.filter(preHire => {
        const startDate = new Date(preHire.startDate);

        if (startDate_from && startDate < new Date(startDate_from)) {
          return false;
        }

        if (startDate_to && startDate > new Date(startDate_to)) {
          return false;
        }

        return true;
      });

      // Recalculate pagination after filtering
      result.pagination.total = result.data.length;
      result.pagination.totalPages = Math.ceil(result.data.length / result.pagination.limit);
    }

    res.json(result);
  } catch (error) {
    console.error('[PreHireRoutes] Error fetching pre-hires:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch pre-hire records'
    });
  }
});

/**
 * GET /api/pre-hires/:id
 * Get pre-hire by ID
 *
 * Permission: PREHIRE_READ
 */
router.get('/:id', checkPermission('PREHIRE_READ'), (req, res) => {
  try {
    const { id } = req.params;
    const preHire = db.findById('preHires', id);

    if (!preHire) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Pre-hire record not found'
      });
    }

    res.json(preHire);
  } catch (error) {
    console.error('[PreHireRoutes] Error fetching pre-hire:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch pre-hire record'
    });
  }
});

/**
 * POST /api/pre-hires
 * Create a new pre-hire record
 *
 * Permission: PREHIRE_CREATE
 */
router.post('/', checkPermission('PREHIRE_CREATE'), (req, res) => {
  try {
    const {
      candidateName,
      email,
      role,
      department,
      startDate,
      hiringManager,
      status,
      assignedPackage,
      customizations,
    } = req.body;

    // Validation
    if (!candidateName || !role || !department || !startDate || !hiringManager) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields',
        details: [
          { field: 'candidateName', message: 'Required' },
          { field: 'role', message: 'Required' },
          { field: 'department', message: 'Required' },
          { field: 'startDate', message: 'Required' },
          { field: 'hiringManager', message: 'Required' },
        ].filter(d => !req.body[d.field])
      });
    }

    // Check for duplicate email
    if (email) {
      const existing = db.find('preHires', { email });
      if (existing.length > 0) {
        return res.status(409).json({
          error: 'conflict',
          message: 'Pre-hire with this email already exists'
        });
      }
    }

    // Create pre-hire record
    const preHire = db.create('preHires', {
      candidateName,
      email: email || null,
      role,
      department,
      startDate: new Date(startDate).toISOString(),
      hiringManager,
      status: status || 'candidate',
      assignedPackage: assignedPackage || null,
      customizations: customizations || null,
      linkedEmployeeId: null,
      createdBy: req.user?.email || 'system',
    });

    console.log(`[PreHireRoutes] Created pre-hire: ${preHire.id} - ${candidateName}`);

    res.status(201).json(preHire);
  } catch (error) {
    console.error('[PreHireRoutes] Error creating pre-hire:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create pre-hire record'
    });
  }
});

/**
 * PUT /api/pre-hires/:id
 * Update a pre-hire record
 *
 * Permission: PREHIRE_UPDATE
 */
router.put('/:id', checkPermission('PREHIRE_UPDATE'), (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating these fields
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdDate;

    // Check if pre-hire exists
    const existing = db.findById('preHires', id);
    if (!existing) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Pre-hire record not found'
      });
    }

    // Convert startDate to ISO if provided
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate).toISOString();
    }

    // Update the record
    const updatedPreHire = db.update('preHires', id, updates);

    console.log(`[PreHireRoutes] Updated pre-hire: ${id}`);

    res.json(updatedPreHire);
  } catch (error) {
    console.error('[PreHireRoutes] Error updating pre-hire:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update pre-hire record'
    });
  }
});

/**
 * DELETE /api/pre-hires/:id
 * Delete a pre-hire record
 *
 * Permission: PREHIRE_DELETE
 */
router.delete('/:id', checkPermission('PREHIRE_DELETE'), (req, res) => {
  try {
    const { id } = req.params;

    const success = db.deleteById('preHires', id);

    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Pre-hire record not found'
      });
    }

    console.log(`[PreHireRoutes] Deleted pre-hire: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error('[PreHireRoutes] Error deleting pre-hire:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete pre-hire record'
    });
  }
});

module.exports = router;
