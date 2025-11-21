/**
 * Software/License API Routes
 *
 * RESTful endpoints for Software CRUD operations and license management
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateAzureADToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(validateAzureADToken);

/**
 * GET /api/software
 * Get all software with optional filtering and pagination
 *
 * Query Parameters:
 * - vendor (string): Filter by vendor
 * - licenseType (string): Filter by license type (perpetual, subscription, concurrent)
 * - utilizationLevel (string): Filter by utilization (available, near-capacity, full, over-allocated)
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 50, max: 100)
 *
 * Required Permission: SOFTWARE_READ
 */
router.get('/', checkPermission('SOFTWARE_READ'), (req, res) => {
  try {
    const { vendor, licenseType, utilizationLevel, page, limit } = req.query;

    console.log(`[SoftwareRoutes] GET /api/software - Query:`, req.query);

    // Build filter object
    const filter = {};
    if (vendor) filter.vendor = vendor;
    if (licenseType) filter.licenseType = licenseType;

    const options = {
      filter,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    };

    let result = db.findAll('software', options);

    // Apply utilization filtering manually (calculated field)
    if (utilizationLevel) {
      result.data = result.data.filter(software => {
        const utilization = software.seatCount
          ? (software.assignedSeats / software.seatCount) * 100
          : 0;

        switch (utilizationLevel) {
          case 'available':
            return utilization < 75;
          case 'near-capacity':
            return utilization >= 75 && utilization < 90;
          case 'full':
            return utilization >= 90 && utilization <= 100;
          case 'over-allocated':
            return utilization > 100;
          default:
            return true;
        }
      });

      // Recalculate pagination after filtering
      result.pagination.total = result.data.length;
      result.pagination.totalPages = Math.ceil(result.data.length / options.limit);
    }

    console.log(`[SoftwareRoutes] Returning ${result.data.length} software items`);
    res.json(result);
  } catch (error) {
    console.error('[SoftwareRoutes] Error fetching software:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch software records'
    });
  }
});

/**
 * GET /api/software/:id
 * Get a single software item by ID
 *
 * Required Permission: SOFTWARE_READ
 */
router.get('/:id', checkPermission('SOFTWARE_READ'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[SoftwareRoutes] GET /api/software/${id}`);

    const software = db.findById('software', id);

    if (!software) {
      return res.status(404).json({
        error: 'not_found',
        message: `Software with ID ${id} not found`
      });
    }

    res.json(software);
  } catch (error) {
    console.error(`[SoftwareRoutes] Error fetching software ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch software record'
    });
  }
});

/**
 * POST /api/software
 * Create a new software/license
 *
 * Required Permission: SOFTWARE_CREATE
 */
router.post('/', checkPermission('SOFTWARE_CREATE'), (req, res) => {
  try {
    const {
      name,
      vendor,
      licenseType,
      requiresApproval,
      approver,
      cost,
      renewalFrequency,
      seatCount,
      description,
      renewalDate,
      autoRenew,
      administrator,
      purchaseDate,
    } = req.body;

    console.log(`[SoftwareRoutes] POST /api/software - Creating software: ${name}`);

    // Validation
    if (!name || !vendor || !licenseType) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: name, vendor, licenseType'
      });
    }

    // Validate license type
    const validLicenseTypes = ['perpetual', 'subscription', 'concurrent'];
    if (!validLicenseTypes.includes(licenseType)) {
      return res.status(400).json({
        error: 'validation_error',
        message: `Invalid licenseType. Must be one of: ${validLicenseTypes.join(', ')}`
      });
    }

    // Check for duplicate software name
    const existing = db.find('software', { name });
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'conflict',
        message: `Software with name "${name}" already exists`
      });
    }

    // Create software
    const newSoftware = {
      name,
      vendor,
      licenseType,
      requiresApproval: requiresApproval === true,
      approver: approver || null,
      cost: cost || 0,
      renewalFrequency: renewalFrequency || null,
      seatCount: seatCount || null,
      assignedSeats: 0,
      description: description || null,
      renewalDate: renewalDate || null,
      autoRenew: autoRenew === true,
      administrator: administrator || null,
      purchaseDate: purchaseDate || null,
      createdBy: req.user.email,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const software = db.create('software', newSoftware);
    console.log(`[SoftwareRoutes] Software created successfully: ${software.id}`);

    res.status(201).json(software);
  } catch (error) {
    console.error('[SoftwareRoutes] Error creating software:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create software'
    });
  }
});

/**
 * PUT /api/software/:id
 * Update an existing software/license
 *
 * Required Permission: SOFTWARE_UPDATE
 */
router.put('/:id', checkPermission('SOFTWARE_UPDATE'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      vendor,
      licenseType,
      requiresApproval,
      approver,
      cost,
      renewalFrequency,
      seatCount,
      description,
      renewalDate,
      autoRenew,
      administrator,
      purchaseDate,
    } = req.body;

    console.log(`[SoftwareRoutes] PUT /api/software/${id}`);

    // Check if software exists
    const existingSoftware = db.findById('software', id);
    if (!existingSoftware) {
      return res.status(404).json({
        error: 'not_found',
        message: `Software with ID ${id} not found`
      });
    }

    // Check for duplicate name (if name is being changed)
    if (name && name !== existingSoftware.name) {
      const duplicates = db.find('software', { name });
      if (duplicates.length > 0) {
        return res.status(409).json({
          error: 'conflict',
          message: `Software with name "${name}" already exists`
        });
      }
    }

    // Validate seat count change
    if (seatCount !== undefined && seatCount < existingSoftware.assignedSeats) {
      return res.status(400).json({
        error: 'validation_error',
        message: `Cannot reduce seat count below assigned seats (${existingSoftware.assignedSeats} currently assigned)`
      });
    }

    // Prepare updates
    const updates = {
      lastModified: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (vendor !== undefined) updates.vendor = vendor;
    if (licenseType !== undefined) updates.licenseType = licenseType;
    if (requiresApproval !== undefined) updates.requiresApproval = requiresApproval;
    if (approver !== undefined) updates.approver = approver;
    if (cost !== undefined) updates.cost = cost;
    if (renewalFrequency !== undefined) updates.renewalFrequency = renewalFrequency;
    if (seatCount !== undefined) updates.seatCount = seatCount;
    if (description !== undefined) updates.description = description;
    if (renewalDate !== undefined) updates.renewalDate = renewalDate;
    if (autoRenew !== undefined) updates.autoRenew = autoRenew;
    if (administrator !== undefined) updates.administrator = administrator;
    if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate;

    const updatedSoftware = db.update('software', id, updates);
    console.log(`[SoftwareRoutes] Software updated successfully: ${id}`);

    res.json(updatedSoftware);
  } catch (error) {
    console.error(`[SoftwareRoutes] Error updating software ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update software'
    });
  }
});

/**
 * DELETE /api/software/:id
 * Delete a software/license
 *
 * Required Permission: SOFTWARE_DELETE
 */
router.delete('/:id', checkPermission('SOFTWARE_DELETE'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[SoftwareRoutes] DELETE /api/software/${id}`);

    // Check if software exists
    const existingSoftware = db.findById('software', id);
    if (!existingSoftware) {
      return res.status(404).json({
        error: 'not_found',
        message: `Software with ID ${id} not found`
      });
    }

    // Check if software has active assignments
    if (existingSoftware.assignedSeats > 0) {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot delete software: ${existingSoftware.assignedSeats} license(s) currently assigned`,
        assignedSeats: existingSoftware.assignedSeats
      });
    }

    db.deleteById('software', id);
    console.log(`[SoftwareRoutes] Software deleted successfully: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error(`[SoftwareRoutes] Error deleting software ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete software'
    });
  }
});

/**
 * POST /api/software/:id/assign
 * Assign a license to an employee
 *
 * Required Permission: LICENSE_ASSIGN
 *
 * Request Body:
 * {
 *   employeeId: string,
 *   employeeName: string,
 *   employeeEmail: string,
 *   expirationDate?: string,
 *   notes?: string
 * }
 */
router.post('/:id/assign', checkPermission('LICENSE_ASSIGN'), (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, employeeName, employeeEmail, expirationDate, notes } = req.body;

    console.log(`[SoftwareRoutes] POST /api/software/${id}/assign - Assigning to ${employeeName}`);

    // Validation
    if (!employeeId || !employeeName || !employeeEmail) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: employeeId, employeeName, employeeEmail'
      });
    }

    // Check if software exists
    const software = db.findById('software', id);
    if (!software) {
      return res.status(404).json({
        error: 'not_found',
        message: `Software with ID ${id} not found`
      });
    }

    // Check seat availability
    if (software.seatCount !== null && software.assignedSeats >= software.seatCount) {
      return res.status(409).json({
        error: 'conflict',
        message: `No available seats. ${software.assignedSeats} of ${software.seatCount} seats already assigned.`,
        warning: 'This assignment will result in over-allocation'
      });
    }

    // Create license assignment record
    const assignment = {
      softwareId: id,
      softwareName: software.name,
      employeeId,
      employeeName,
      employeeEmail,
      assignedBy: req.user.email,
      assignedDate: new Date().toISOString(),
      expirationDate: expirationDate || null,
      status: 'active',
      notes: notes || null,
    };

    const createdAssignment = db.create('licenseAssignments', assignment);

    // Update assigned seats count
    db.update('software', id, {
      assignedSeats: software.assignedSeats + 1,
      lastModified: new Date().toISOString(),
    });

    console.log(`[SoftwareRoutes] License assigned successfully: ${createdAssignment.id}`);

    res.status(201).json({
      assignment: createdAssignment,
      updatedSoftware: db.findById('software', id),
    });
  } catch (error) {
    console.error(`[SoftwareRoutes] Error assigning license ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to assign license'
    });
  }
});

/**
 * POST /api/software/:id/reclaim
 * Reclaim licenses from terminated employees or expired assignments
 *
 * Required Permission: LICENSE_RECLAIM
 *
 * Request Body:
 * {
 *   employeeIds?: string[],  // Specific employees to reclaim from
 *   reclaimExpired?: boolean // Reclaim all expired assignments
 * }
 */
router.post('/:id/reclaim', checkPermission('LICENSE_RECLAIM'), (req, res) => {
  try {
    const { id } = req.params;
    const { employeeIds, reclaimExpired } = req.body;

    console.log(`[SoftwareRoutes] POST /api/software/${id}/reclaim`);

    // Check if software exists
    const software = db.findById('software', id);
    if (!software) {
      return res.status(404).json({
        error: 'not_found',
        message: `Software with ID ${id} not found`
      });
    }

    // Find assignments to reclaim
    const allAssignments = db.find('licenseAssignments', { softwareId: id, status: 'active' });
    let assignmentsToReclaim = [];

    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      // Reclaim from specific employees
      assignmentsToReclaim = allAssignments.filter(a => employeeIds.includes(a.employeeId));
    } else if (reclaimExpired) {
      // Reclaim expired assignments
      const now = new Date().toISOString();
      assignmentsToReclaim = allAssignments.filter(a => a.expirationDate && a.expirationDate < now);
    } else {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Must specify either employeeIds or reclaimExpired=true'
      });
    }

    if (assignmentsToReclaim.length === 0) {
      return res.status(200).json({
        message: 'No licenses to reclaim',
        reclaimed: 0,
        assignments: []
      });
    }

    // Reclaim licenses
    const reclaimedAssignments = [];
    assignmentsToReclaim.forEach(assignment => {
      db.update('licenseAssignments', assignment.id, {
        status: 'revoked',
        revokedBy: req.user.email,
        revokedDate: new Date().toISOString(),
      });
      reclaimedAssignments.push(assignment);
    });

    // Update assigned seats count
    const newAssignedSeats = Math.max(0, software.assignedSeats - reclaimedAssignments.length);
    db.update('software', id, {
      assignedSeats: newAssignedSeats,
      lastModified: new Date().toISOString(),
    });

    console.log(`[SoftwareRoutes] Reclaimed ${reclaimedAssignments.length} licenses`);

    res.json({
      message: `Successfully reclaimed ${reclaimedAssignments.length} license(s)`,
      reclaimed: reclaimedAssignments.length,
      assignments: reclaimedAssignments,
      updatedSoftware: db.findById('software', id),
    });
  } catch (error) {
    console.error(`[SoftwareRoutes] Error reclaiming licenses ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to reclaim licenses'
    });
  }
});

module.exports = router;
