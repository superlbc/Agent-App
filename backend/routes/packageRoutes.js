/**
 * Package API Routes
 *
 * RESTful endpoints for Package CRUD operations
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateAzureADToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(validateAzureADToken);

/**
 * GET /api/packages
 * Get all packages with optional filtering and pagination
 *
 * Query Parameters:
 * - roleTarget (string): Filter by target role
 * - departmentTarget (string): Filter by target department
 * - isStandard (boolean): Filter by package type (true=standard, false=exception)
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 50, max: 100)
 *
 * Required Permission: PACKAGE_READ
 */
router.get('/', checkPermission('PACKAGE_READ'), (req, res) => {
  try {
    const { roleTarget, departmentTarget, isStandard, page, limit } = req.query;

    console.log(`[PackageRoutes] GET /api/packages - Query:`, req.query);

    // Build filter object
    const filter = {};
    if (roleTarget) {
      filter.roleTarget = roleTarget; // Note: This will need special handling for arrays
    }
    if (departmentTarget) {
      filter.departmentTarget = departmentTarget; // Note: This will need special handling for arrays
    }
    if (isStandard !== undefined) {
      filter.isStandard = isStandard === 'true';
    }

    const options = {
      filter,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    };

    let result = db.findAll('packages', options);

    // Apply array filtering manually (since JSON file DB doesn't support array contains)
    if (roleTarget || departmentTarget) {
      result.data = result.data.filter(pkg => {
        let matches = true;

        if (roleTarget && pkg.roleTarget) {
          matches = matches && pkg.roleTarget.includes(roleTarget);
        }

        if (departmentTarget && pkg.departmentTarget) {
          matches = matches && pkg.departmentTarget.includes(departmentTarget);
        }

        return matches;
      });

      // Recalculate pagination after filtering
      result.pagination.total = result.data.length;
      result.pagination.totalPages = Math.ceil(result.data.length / options.limit);
    }

    console.log(`[PackageRoutes] Returning ${result.data.length} packages`);
    res.json(result);
  } catch (error) {
    console.error('[PackageRoutes] Error fetching packages:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch package records'
    });
  }
});

/**
 * GET /api/packages/:id
 * Get a single package by ID
 *
 * Required Permission: PACKAGE_READ
 */
router.get('/:id', checkPermission('PACKAGE_READ'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PackageRoutes] GET /api/packages/${id}`);

    const pkg = db.findById('packages', id);

    if (!pkg) {
      return res.status(404).json({
        error: 'not_found',
        message: `Package with ID ${id} not found`
      });
    }

    res.json(pkg);
  } catch (error) {
    console.error(`[PackageRoutes] Error fetching package ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch package record'
    });
  }
});

/**
 * POST /api/packages
 * Create a new package
 *
 * Required Permission: PACKAGE_CREATE_STANDARD or PACKAGE_CREATE_EXCEPTION
 * (Checks PACKAGE_CREATE_EXCEPTION for exception packages, PACKAGE_CREATE_STANDARD for standard)
 */
router.post('/', validateAzureADToken, (req, res) => {
  try {
    const {
      name,
      description,
      roleTarget,
      departmentTarget,
      hardware,
      software,
      licenses,
      isStandard,
    } = req.body;

    console.log(`[PackageRoutes] POST /api/packages - Creating package: ${name}`);

    // Check permission based on package type
    const { hasPermission, getUserRolesFromGroups } = require('../config/rbac');
    const userRoles = getUserRolesFromGroups(req.user.groups);

    const requiredPermission = isStandard
      ? 'PACKAGE_CREATE_STANDARD'
      : 'PACKAGE_CREATE_EXCEPTION';

    if (!hasPermission(userRoles, requiredPermission)) {
      console.warn(`[PackageRoutes] Permission denied for user ${req.user.email}: ${requiredPermission}`);
      return res.status(403).json({
        error: 'forbidden',
        message: `Insufficient permissions to create ${isStandard ? 'standard' : 'exception'} packages`,
        requiredPermission
      });
    }

    // Validation
    if (!name || !description || !roleTarget || !departmentTarget) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: name, description, roleTarget, departmentTarget'
      });
    }

    if (!Array.isArray(roleTarget) || roleTarget.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'roleTarget must be a non-empty array'
      });
    }

    if (!Array.isArray(departmentTarget) || departmentTarget.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'departmentTarget must be a non-empty array'
      });
    }

    // Check for duplicate package name
    const existingPackages = db.find('packages', { name });
    if (existingPackages.length > 0) {
      return res.status(409).json({
        error: 'conflict',
        message: `Package with name "${name}" already exists`
      });
    }

    // Create package
    const newPackage = {
      name,
      description,
      roleTarget: Array.isArray(roleTarget) ? roleTarget : [roleTarget],
      departmentTarget: Array.isArray(departmentTarget) ? departmentTarget : [departmentTarget],
      hardware: hardware || [],
      software: software || [],
      licenses: licenses || [],
      isStandard: isStandard === true,
      createdBy: req.user.email,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const pkg = db.create('packages', newPackage);
    console.log(`[PackageRoutes] Package created successfully: ${pkg.id}`);

    res.status(201).json(pkg);
  } catch (error) {
    console.error('[PackageRoutes] Error creating package:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create package'
    });
  }
});

/**
 * PUT /api/packages/:id
 * Update an existing package
 *
 * Required Permission: PACKAGE_UPDATE
 */
router.put('/:id', checkPermission('PACKAGE_UPDATE'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      roleTarget,
      departmentTarget,
      hardware,
      software,
      licenses,
      isStandard,
    } = req.body;

    console.log(`[PackageRoutes] PUT /api/packages/${id}`);

    // Check if package exists
    const existingPackage = db.findById('packages', id);
    if (!existingPackage) {
      return res.status(404).json({
        error: 'not_found',
        message: `Package with ID ${id} not found`
      });
    }

    // Check for duplicate name (if name is being changed)
    if (name && name !== existingPackage.name) {
      const duplicates = db.find('packages', { name });
      if (duplicates.length > 0) {
        return res.status(409).json({
          error: 'conflict',
          message: `Package with name "${name}" already exists`
        });
      }
    }

    // Prepare updates
    const updates = {
      lastModified: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (roleTarget !== undefined) {
      updates.roleTarget = Array.isArray(roleTarget) ? roleTarget : [roleTarget];
    }
    if (departmentTarget !== undefined) {
      updates.departmentTarget = Array.isArray(departmentTarget) ? departmentTarget : [departmentTarget];
    }
    if (hardware !== undefined) updates.hardware = hardware;
    if (software !== undefined) updates.software = software;
    if (licenses !== undefined) updates.licenses = licenses;
    if (isStandard !== undefined) updates.isStandard = isStandard === true;

    const updatedPackage = db.update('packages', id, updates);
    console.log(`[PackageRoutes] Package updated successfully: ${id}`);

    res.json(updatedPackage);
  } catch (error) {
    console.error(`[PackageRoutes] Error updating package ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update package'
    });
  }
});

/**
 * DELETE /api/packages/:id
 * Delete a package
 *
 * Required Permission: PACKAGE_DELETE
 */
router.delete('/:id', checkPermission('PACKAGE_DELETE'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PackageRoutes] DELETE /api/packages/${id}`);

    // Check if package exists
    const existingPackage = db.findById('packages', id);
    if (!existingPackage) {
      return res.status(404).json({
        error: 'not_found',
        message: `Package with ID ${id} not found`
      });
    }

    // Check if package is in use by pre-hires
    const preHiresWithPackage = db.find('preHires', { assignedPackageId: id });
    if (preHiresWithPackage.length > 0) {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot delete package: ${preHiresWithPackage.length} pre-hire record(s) are using this package`,
        affectedRecords: preHiresWithPackage.length
      });
    }

    db.deleteById('packages', id);
    console.log(`[PackageRoutes] Package deleted successfully: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error(`[PackageRoutes] Error deleting package ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete package'
    });
  }
});

module.exports = router;
