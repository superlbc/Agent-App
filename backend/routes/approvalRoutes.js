/**
 * Approval API Routes
 *
 * RESTful endpoints for Approval workflow operations
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateAzureADToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(validateAzureADToken);

/**
 * GET /api/approvals
 * Get all approval requests with optional filtering and pagination
 *
 * Query Parameters:
 * - status (string): Filter by status (pending, approved, rejected, cancelled)
 * - requestType (string): Filter by type (equipment, software, exception, mid-employment)
 * - approver (string): Filter by approver name
 * - employeeId (string): Filter by employee ID
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 50, max: 100)
 *
 * Required Permission: APPROVAL_READ
 */
router.get('/', checkPermission('APPROVAL_READ'), (req, res) => {
  try {
    const { status, requestType, approver, employeeId, page, limit } = req.query;

    console.log(`[ApprovalRoutes] GET /api/approvals - Query:`, req.query);

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;
    if (approver) filter.approver = approver;
    if (employeeId) filter.employeeId = employeeId;

    const options = {
      filter,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    };

    const result = db.findAll('approvals', options);

    console.log(`[ApprovalRoutes] Returning ${result.data.length} approval requests`);
    res.json(result);
  } catch (error) {
    console.error('[ApprovalRoutes] Error fetching approvals:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch approval records'
    });
  }
});

/**
 * GET /api/approvals/:id
 * Get a single approval request by ID
 *
 * Required Permission: APPROVAL_READ
 */
router.get('/:id', checkPermission('APPROVAL_READ'), (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ApprovalRoutes] GET /api/approvals/${id}`);

    const approval = db.findById('approvals', id);

    if (!approval) {
      return res.status(404).json({
        error: 'not_found',
        message: `Approval request with ID ${id} not found`
      });
    }

    res.json(approval);
  } catch (error) {
    console.error(`[ApprovalRoutes] Error fetching approval ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch approval record'
    });
  }
});

/**
 * POST /api/approvals
 * Create a new approval request
 *
 * Required Permission: APPROVAL_CREATE
 */
router.post('/', checkPermission('APPROVAL_CREATE'), (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      requestType,
      items,
      packageId,
      requester,
      approver,
      automatedDecision,
      notes,
    } = req.body;

    console.log(`[ApprovalRoutes] POST /api/approvals - Creating approval for ${employeeName}`);

    // Validation
    if (!employeeId || !employeeName || !requestType || !items || !requester || !approver) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: employeeId, employeeName, requestType, items, requester, approver'
      });
    }

    // Validate request type
    const validRequestTypes = ['equipment', 'software', 'exception', 'mid-employment'];
    if (!validRequestTypes.includes(requestType)) {
      return res.status(400).json({
        error: 'validation_error',
        message: `Invalid requestType. Must be one of: ${validRequestTypes.join(', ')}`
      });
    }

    // Validate items is an array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'items must be a non-empty array'
      });
    }

    // Create approval request
    const newApproval = {
      employeeId,
      employeeName,
      requestType,
      items,
      packageId: packageId || null,
      requester: requester || req.user.email,
      requestDate: new Date().toISOString(),
      approver,
      status: automatedDecision === true ? 'approved' : 'pending',
      helixTicketId: null,
      automatedDecision: automatedDecision === true,
      approvalDate: automatedDecision === true ? new Date().toISOString() : null,
      rejectionReason: null,
      notes: notes || null,
      createdBy: req.user.email,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const approval = db.create('approvals', newApproval);
    console.log(`[ApprovalRoutes] Approval request created: ${approval.id}, status: ${approval.status}`);

    res.status(201).json(approval);
  } catch (error) {
    console.error('[ApprovalRoutes] Error creating approval:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create approval request'
    });
  }
});

/**
 * PATCH /api/approvals/:id/approve
 * Approve an approval request
 *
 * Required Permission: APPROVAL_APPROVE
 *
 * Request Body:
 * {
 *   helixTicketId?: string,
 *   notes?: string
 * }
 */
router.patch('/:id/approve', checkPermission('APPROVAL_APPROVE'), (req, res) => {
  try {
    const { id } = req.params;
    const { helixTicketId, notes } = req.body;

    console.log(`[ApprovalRoutes] PATCH /api/approvals/${id}/approve`);

    // Check if approval exists
    const existingApproval = db.findById('approvals', id);
    if (!existingApproval) {
      return res.status(404).json({
        error: 'not_found',
        message: `Approval request with ID ${id} not found`
      });
    }

    // Check if already approved or rejected
    if (existingApproval.status !== 'pending') {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot approve: approval request is already ${existingApproval.status}`,
        currentStatus: existingApproval.status
      });
    }

    // Update approval
    const updates = {
      status: 'approved',
      approvalDate: new Date().toISOString(),
      approvedBy: req.user.email,
      helixTicketId: helixTicketId || null,
      notes: notes || existingApproval.notes,
      lastModified: new Date().toISOString(),
    };

    const updatedApproval = db.update('approvals', id, updates);
    console.log(`[ApprovalRoutes] Approval approved: ${id}`);

    res.json(updatedApproval);
  } catch (error) {
    console.error(`[ApprovalRoutes] Error approving ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to approve request'
    });
  }
});

/**
 * PATCH /api/approvals/:id/reject
 * Reject an approval request
 *
 * Required Permission: APPROVAL_APPROVE
 *
 * Request Body:
 * {
 *   rejectionReason: string (required),
 *   notes?: string
 * }
 */
router.patch('/:id/reject', checkPermission('APPROVAL_APPROVE'), (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, notes } = req.body;

    console.log(`[ApprovalRoutes] PATCH /api/approvals/${id}/reject`);

    // Validation
    if (!rejectionReason) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'rejectionReason is required'
      });
    }

    // Check if approval exists
    const existingApproval = db.findById('approvals', id);
    if (!existingApproval) {
      return res.status(404).json({
        error: 'not_found',
        message: `Approval request with ID ${id} not found`
      });
    }

    // Check if already approved or rejected
    if (existingApproval.status !== 'pending') {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot reject: approval request is already ${existingApproval.status}`,
        currentStatus: existingApproval.status
      });
    }

    // Update approval
    const updates = {
      status: 'rejected',
      approvalDate: new Date().toISOString(),
      rejectedBy: req.user.email,
      rejectionReason,
      notes: notes || existingApproval.notes,
      lastModified: new Date().toISOString(),
    };

    const updatedApproval = db.update('approvals', id, updates);
    console.log(`[ApprovalRoutes] Approval rejected: ${id}`);

    res.json(updatedApproval);
  } catch (error) {
    console.error(`[ApprovalRoutes] Error rejecting ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to reject request'
    });
  }
});

/**
 * PATCH /api/approvals/:id/cancel
 * Cancel a pending approval request
 *
 * Required Permission: APPROVAL_CREATE (requester can cancel their own request)
 *
 * Request Body:
 * {
 *   notes?: string
 * }
 */
router.patch('/:id/cancel', checkPermission('APPROVAL_CREATE'), (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    console.log(`[ApprovalRoutes] PATCH /api/approvals/${id}/cancel`);

    // Check if approval exists
    const existingApproval = db.findById('approvals', id);
    if (!existingApproval) {
      return res.status(404).json({
        error: 'not_found',
        message: `Approval request with ID ${id} not found`
      });
    }

    // Check if already approved or rejected
    if (existingApproval.status !== 'pending') {
      return res.status(409).json({
        error: 'conflict',
        message: `Cannot cancel: approval request is already ${existingApproval.status}`,
        currentStatus: existingApproval.status
      });
    }

    // Update approval
    const updates = {
      status: 'cancelled',
      cancelledBy: req.user.email,
      cancelledDate: new Date().toISOString(),
      notes: notes || existingApproval.notes,
      lastModified: new Date().toISOString(),
    };

    const updatedApproval = db.update('approvals', id, updates);
    console.log(`[ApprovalRoutes] Approval cancelled: ${id}`);

    res.json(updatedApproval);
  } catch (error) {
    console.error(`[ApprovalRoutes] Error cancelling ${req.params.id}:`, error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to cancel request'
    });
  }
});

module.exports = router;
