/**
 * Request Validation Middleware
 *
 * Validates request body, query params, and path params against schemas.
 * Returns 400 Bad Request with detailed error messages for invalid data.
 */

/**
 * Validate required fields in request body
 *
 * @param {Array<string>} requiredFields - List of required field names
 * @returns {Function} Express middleware function
 */
function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missing = [];

    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields',
        details: {
          missingFields: missing,
          requiredFields,
        },
      });
    }

    next();
  };
}

/**
 * Validate Campaign creation/update
 */
function validateCampaign(req, res, next) {
  const { campaignName, client, year, campaignOwner, status } = req.body;

  const errors = [];

  // Campaign name (required, 3-200 chars)
  if (!campaignName || typeof campaignName !== 'string') {
    errors.push('campaignName is required and must be a string');
  } else if (campaignName.length < 3 || campaignName.length > 200) {
    errors.push('campaignName must be between 3 and 200 characters');
  }

  // Client (required)
  if (!client || typeof client !== 'string') {
    errors.push('client is required and must be a string');
  }

  // Year (required, valid year)
  if (!year || typeof year !== 'number') {
    errors.push('year is required and must be a number');
  } else if (year < 2020 || year > 2100) {
    errors.push('year must be between 2020 and 2100');
  }

  // Campaign owner (required, valid email format)
  if (!campaignOwner || typeof campaignOwner !== 'string') {
    errors.push('campaignOwner is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campaignOwner)) {
    errors.push('campaignOwner must be a valid email address');
  }

  // Status (optional, but if provided must be valid)
  if (status && !['planning', 'active', 'completed', 'cancelled'].includes(status)) {
    errors.push('status must be one of: planning, active, completed, cancelled');
  }

  // Month validation (if provided)
  if (req.body.month !== undefined && req.body.month !== null) {
    if (typeof req.body.month !== 'number' || req.body.month < 1 || req.body.month > 12) {
      errors.push('month must be a number between 1 and 12');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Campaign validation failed',
      details: { errors },
    });
  }

  next();
}

/**
 * Validate Event creation/update
 */
function validateEvent(req, res, next) {
  const {
    campaignId,
    eventName,
    eventStartDate,
    eventEndDate,
    eventVenue,
    city,
    country,
    owner,
    status,
  } = req.body;

  const errors = [];

  // Campaign ID (required for creation, skip for updates)
  if (req.method === 'POST' && !campaignId) {
    errors.push('campaignId is required');
  }

  // Event name (required, 3-200 chars)
  if (!eventName || typeof eventName !== 'string') {
    errors.push('eventName is required and must be a string');
  } else if (eventName.length < 3 || eventName.length > 200) {
    errors.push('eventName must be between 3 and 200 characters');
  }

  // Event dates (required, valid ISO dates)
  if (!eventStartDate) {
    errors.push('eventStartDate is required');
  } else if (isNaN(Date.parse(eventStartDate))) {
    errors.push('eventStartDate must be a valid ISO date string');
  }

  if (!eventEndDate) {
    errors.push('eventEndDate is required');
  } else if (isNaN(Date.parse(eventEndDate))) {
    errors.push('eventEndDate must be a valid ISO date string');
  }

  // Validate end date is after start date
  if (eventStartDate && eventEndDate) {
    const start = new Date(eventStartDate);
    const end = new Date(eventEndDate);
    if (end < start) {
      errors.push('eventEndDate must be after eventStartDate');
    }
  }

  // Venue, city, country (required)
  if (!eventVenue || typeof eventVenue !== 'string') {
    errors.push('eventVenue is required and must be a string');
  }

  if (!city || typeof city !== 'string') {
    errors.push('city is required and must be a string');
  }

  if (!country || typeof country !== 'string') {
    errors.push('country is required and must be a string');
  }

  // Owner (required, valid email)
  if (!owner || typeof owner !== 'string') {
    errors.push('owner is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) {
    errors.push('owner must be a valid email address');
  }

  // Status (optional, but if provided must be valid)
  if (status && !['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    errors.push('status must be one of: scheduled, in-progress, completed, cancelled');
  }

  // Latitude/Longitude validation (if provided)
  if (req.body.latitude !== undefined && req.body.latitude !== null) {
    if (typeof req.body.latitude !== 'number' || req.body.latitude < -90 || req.body.latitude > 90) {
      errors.push('latitude must be a number between -90 and 90');
    }
  }

  if (req.body.longitude !== undefined && req.body.longitude !== null) {
    if (typeof req.body.longitude !== 'number' || req.body.longitude < -180 || req.body.longitude > 180) {
      errors.push('longitude must be a number between -180 and 180');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Event validation failed',
      details: { errors },
    });
  }

  next();
}

/**
 * Validate Venue creation/update
 */
function validateVenue(req, res, next) {
  const { name, fullAddress, city, country, latitude, longitude } = req.body;

  const errors = [];

  // Name (required)
  if (!name || typeof name !== 'string') {
    errors.push('name is required and must be a string');
  } else if (name.length < 2 || name.length > 300) {
    errors.push('name must be between 2 and 300 characters');
  }

  // Full address (required)
  if (!fullAddress || typeof fullAddress !== 'string') {
    errors.push('fullAddress is required and must be a string');
  }

  // City and country (required)
  if (!city || typeof city !== 'string') {
    errors.push('city is required and must be a string');
  }

  if (!country || typeof country !== 'string') {
    errors.push('country is required and must be a string');
  }

  // Latitude and longitude (required, valid ranges)
  if (latitude === undefined || latitude === null) {
    errors.push('latitude is required');
  } else if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    errors.push('latitude must be a number between -90 and 90');
  }

  if (longitude === undefined || longitude === null) {
    errors.push('longitude is required');
  } else if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    errors.push('longitude must be a number between -180 and 180');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Venue validation failed',
      details: { errors },
    });
  }

  next();
}

/**
 * Validate People Assignment creation/update
 */
function validatePeopleAssignment(req, res, next) {
  const { eventId, userId, userName, userEmail, assignmentDate } = req.body;

  const errors = [];

  // Event ID (required for creation)
  if (req.method === 'POST' && !eventId) {
    errors.push('eventId is required');
  }

  // User information (required)
  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  if (!userName || typeof userName !== 'string') {
    errors.push('userName is required and must be a string');
  }

  if (!userEmail || typeof userEmail !== 'string') {
    errors.push('userEmail is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    errors.push('userEmail must be a valid email address');
  }

  // Assignment date (required, valid date)
  if (!assignmentDate) {
    errors.push('assignmentDate is required');
  } else if (isNaN(Date.parse(assignmentDate))) {
    errors.push('assignmentDate must be a valid ISO date string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'People Assignment validation failed',
      details: { errors },
    });
  }

  next();
}

/**
 * Validate QR Code creation
 */
function validateQRCode(req, res, next) {
  const { eventId, codeData } = req.body;

  const errors = [];

  // Event ID (required for creation)
  if (req.method === 'POST' && !eventId) {
    errors.push('eventId is required');
  }

  // Code data (required)
  if (!codeData || typeof codeData !== 'string') {
    errors.push('codeData is required and must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'QR Code validation failed',
      details: { errors },
    });
  }

  next();
}

/**
 * Validate pagination query parameters
 */
function validatePagination(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'page must be a positive integer',
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'limit must be between 1 and 100',
      });
    }
    req.query.limit = limitNum;
  }

  next();
}

/**
 * Validate ID parameter in URL
 */
function validateId(req, res, next) {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Invalid ID parameter',
    });
  }

  next();
}

module.exports = {
  validateRequiredFields,
  validateCampaign,
  validateEvent,
  validateVenue,
  validatePeopleAssignment,
  validateQRCode,
  validatePagination,
  validateId,
};
