/**
 * Hardware API Routes
 *
 * RESTful endpoints for Hardware CRUD operations including bulk import
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateAzureADToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(validateAzureADToken);

/**
 * GET /api/hardware
 * Get all hardware with optional filtering and pagination
 *
 * Query Parameters:
 * - type (string): Filter by hardware type (computer, monitor, keyboard, mouse, dock, headset, accessory)
 * - status (string): Filter by status (available, assigned, maintenance, retired)
 * - manufacturer (string): Filter by manufacturer
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 50, max: 100)
 *
 * Required Permission: HARDWARE_READ
 */
router.get('/', checkPermission('HARDWARE_READ'), (req, res) => {
  try {
    const { type, status, manufacturer, page, limit } = req.query;

    console.log(`[HardwareRoutes] GET /api/hardware - Query:`, req.query);

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (manufacturer) filter.manufacturer = manufacturer;

    const options = {
      filter,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    };

    const result = db.findAll('hardware', options);

    console.log(`[HardwareRoutes] Returning ${result.data.length} hardware items`);
    res.json(result);
  } catch (error) {
    console.error('[HardwareRoutes] Error fetching hardware:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch hardware records'
    });
  }
});

/**
 * GET /api/hardware/:id
 * Get a single hardware item by ID
 *
 * Required Permission: HARDWARE_READ
 */
router.get('/:id', checkPermission('HARDWARE_READ'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HardwareRoutes] GET /api/hardware/${id}`);

    const hardware = db.findById('hardware', id);

    if (!hardware) {
      return res.status(404).json({
        error: 'not_found',
        message: `Hardware with ID ${id} not found`
      });
    }

    res.json(hardware);
  } catch (error) {
    console.error(`[HardwareRoutes] Error fetching hardware ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch hardware record'
    });
  }
});

/**
 * POST /api/hardware
 * Create a new hardware item
 *
 * Required Permission: HARDWARE_CREATE
 */
router.post('/', checkPermission('HARDWARE_CREATE'), (req, res) => {
  try {
    const {
      type,
      model,
      manufacturer,
      specifications,
      status,
      serialNumber,
      purchaseDate,
      cost,
      assignedTo,
      assignedDate,
      maintenanceHistory,
    } = req.body;

    console.log(`[HardwareRoutes] POST /api/hardware - Creating hardware: ${model}`);

    // Validation
    if (!type || !model || !manufacturer || !status) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: type, model, manufacturer, status'
      });
    }

    // Validate type
    const validTypes = ['computer', 'monitor', 'keyboard', 'mouse', 'dock', 'headset', 'accessory'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'validation_error',
        message: `Invalid hardware type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate status
    const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'validation_error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate assigned status has assignedTo
    if (status === 'assigned' && !assignedTo) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'assignedTo is required when status is "assigned"'
      });
    }

    // Check for duplicate serial number
    if (serialNumber) {
      const existing = db.find('hardware', { serialNumber });
      if (existing.length > 0) {
        return res.status(409).json({
          error: 'conflict',
          message: `Hardware with serial number "${serialNumber}" already exists`
        });
      }
    }

    // Create hardware
    const newHardware = {
      type,
      model,
      manufacturer,
      specifications: specifications || {},
      status,
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate || null,
      cost: cost || null,
      assignedTo: assignedTo || null,
      assignedDate: assignedDate || null,
      maintenanceHistory: maintenanceHistory || [],
      createdBy: req.user.email,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const hardware = db.create('hardware', newHardware);
    console.log(`[HardwareRoutes] Hardware created successfully: ${hardware.id}`);

    res.status(201).json(hardware);
  } catch (error) {
    console.error('[HardwareRoutes] Error creating hardware:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create hardware'
    });
  }
});

/**
 * POST /api/hardware/bulk
 * Bulk import hardware items from CSV data
 *
 * Required Permission: HARDWARE_CREATE
 *
 * Request Body:
 * {
 *   items: Array<HardwareData>
 * }
 *
 * Response:
 * {
 *   success: number,
 *   failed: number,
 *   errors: Array<{ row: number, error: string }>
 * }
 */
router.post('/bulk', checkPermission('HARDWARE_CREATE'), (req, res) => {
  try {
    const { items } = req.body;

    console.log(`[HardwareRoutes] POST /api/hardware/bulk - Importing ${items?.length || 0} items`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Request body must contain an array of items'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const validTypes = ['computer', 'monitor', 'keyboard', 'mouse', 'dock', 'headset', 'accessory'];
    const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];

    items.forEach((item, index) => {
      const rowNumber = index + 1;

      try {
        // Validation
        if (!item.type || !item.model || !item.manufacturer || !item.status) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: type, model, manufacturer, status'
          });
          return;
        }

        if (!validTypes.includes(item.type)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Invalid type: ${item.type}. Must be one of: ${validTypes.join(', ')}`
          });
          return;
        }

        if (!validStatuses.includes(item.status)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Invalid status: ${item.status}. Must be one of: ${validStatuses.join(', ')}`
          });
          return;
        }

        // Check for duplicate serial number
        if (item.serialNumber) {
          const existing = db.find('hardware', { serialNumber: item.serialNumber });
          if (existing.length > 0) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: `Duplicate serial number: ${item.serialNumber}`
            });
            return;
          }
        }

        // Build specifications object based on type
        const specifications = {};
        if (item.type === 'computer') {
          if (item.processor) specifications.processor = item.processor;
          if (item.ram) specifications.ram = item.ram;
          if (item.storage) specifications.storage = item.storage;
        } else if (item.type === 'monitor') {
          if (item.screenSize) specifications.screenSize = item.screenSize;
        } else {
          if (item.connectivity) specifications.connectivity = item.connectivity;
        }

        // Create hardware
        const newHardware = {
          type: item.type,
          model: item.model,
          manufacturer: item.manufacturer,
          specifications,
          status: item.status,
          serialNumber: item.serialNumber || null,
          purchaseDate: item.purchaseDate || null,
          cost: item.cost ? parseFloat(item.cost) : null,
          assignedTo: null,
          assignedDate: null,
          maintenanceHistory: [],
          createdBy: req.user.email,
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        db.create('hardware', newHardware);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error'
        });
      }
    });

    console.log(`[HardwareRoutes] Bulk import complete: ${results.success} success, ${results.failed} failed`);

    res.status(201).json(results);
  } catch (error) {
    console.error('[HardwareRoutes] Error in bulk import:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to process bulk import'
    });
  }
});

/**
 * PUT /api/hardware/:id
 * Update an existing hardware item
 *
 * Required Permission: HARDWARE_UPDATE
 */
router.put('/:id', checkPermission('HARDWARE_UPDATE'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      model,
      manufacturer,
      specifications,
      status,
      serialNumber,
      purchaseDate,
      cost,
      assignedTo,
      assignedDate,
      maintenanceHistory,
    } = req.body;

    console.log(`[HardwareRoutes] PUT /api/hardware/${id}`);

    // Check if hardware exists
    const existingHardware = db.findById('hardware', id);
    if (!existingHardware) {
      return res.status(404).json({
        error: 'not_found',
        message: `Hardware with ID ${id} not found`
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'validation_error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Validate assigned status has assignedTo
      if (status === 'assigned' && !assignedTo && !existingHardware.assignedTo) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'assignedTo is required when status is "assigned"'
        });
      }
    }

    // Check for duplicate serial number (if changing serial number)
    if (serialNumber && serialNumber !== existingHardware.serialNumber) {
      const duplicates = db.find('hardware', { serialNumber });
      if (duplicates.length > 0) {
        return res.status(409).json({
          error: 'conflict',
          message: `Hardware with serial number "${serialNumber}" already exists`
        });
      }
    }

    // Prepare updates
    const updates = {
      lastModified: new Date().toISOString(),
    };

    if (type !== undefined) updates.type = type;
    if (model !== undefined) updates.model = model;
    if (manufacturer !== undefined) updates.manufacturer = manufacturer;
    if (specifications !== undefined) updates.specifications = specifications;
    if (status !== undefined) updates.status = status;
    if (serialNumber !== undefined) updates.serialNumber = serialNumber;
    if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate;
    if (cost !== undefined) updates.cost = cost;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (assignedDate !== undefined) updates.assignedDate = assignedDate;
    if (maintenanceHistory !== undefined) updates.maintenanceHistory = maintenanceHistory;

    const updatedHardware = db.update('hardware', id, updates);
    console.log(`[HardwareRoutes] Hardware updated successfully: ${id}`);

    res.json(updatedHardware);
  } catch (error) {
    console.error(`[HardwareRoutes] Error updating hardware ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update hardware'
    });
  }
});

/**
 * DELETE /api/hardware/:id
 * Delete a hardware item
 *
 * Required Permission: HARDWARE_DELETE
 */
router.delete('/:id', checkPermission('HARDWARE_DELETE'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HardwareRoutes] DELETE /api/hardware/${id}`);

    // Check if hardware exists
    const existingHardware = db.findById('hardware', id);
    if (!existingHardware) {
      return res.status(404).json({
        error: 'not_found',
        message: `Hardware with ID ${id} not found`
      });
    }

    // Check if hardware is currently assigned
    if (existingHardware.status === 'assigned' && existingHardware.assignedTo) {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot delete hardware: currently assigned to ${existingHardware.assignedTo}`,
        assignedTo: existingHardware.assignedTo
      });
    }

    db.deleteById('hardware', id);
    console.log(`[HardwareRoutes] Hardware deleted successfully: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error(`[HardwareRoutes] Error deleting hardware ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete hardware'
    });
  }
});

module.exports = router;
