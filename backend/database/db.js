/**
 * Simple JSON File Database Layer
 *
 * This provides an in-memory database with file persistence.
 * Can be replaced with PostgreSQL, MongoDB, or other databases later.
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILES = {
  preHires: path.join(DB_DIR, 'pre-hires.json'),
  packages: path.join(DB_DIR, 'packages.json'),
  hardware: path.join(DB_DIR, 'hardware.json'),
  software: path.join(DB_DIR, 'software.json'),
  approvals: path.join(DB_DIR, 'approvals.json'),
  roleAssignments: path.join(DB_DIR, 'role-assignments.json'),
};

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`[DB] Created database directory: ${DB_DIR}`);
}

// Initialize empty JSON files if they don't exist
Object.entries(DB_FILES).forEach(([name, file]) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
    console.log(`[DB] Initialized ${name}: ${file}`);
  }
});

/**
 * Read data from JSON file
 */
function readData(collection) {
  try {
    const file = DB_FILES[collection];
    if (!file) {
      throw new Error(`Unknown collection: ${collection}`);
    }

    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`[DB] Error reading ${collection}:`, error.message);
    return [];
  }
}

/**
 * Write data to JSON file
 */
function writeData(collection, data) {
  try {
    const file = DB_FILES[collection];
    if (!file) {
      throw new Error(`Unknown collection: ${collection}`);
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`[DB] Error writing ${collection}:`, error.message);
    return false;
  }
}

/**
 * Get all records from a collection
 */
function findAll(collection, options = {}) {
  let data = readData(collection);

  // Apply filters
  if (options.filter) {
    data = data.filter(item => {
      return Object.entries(options.filter).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  // Apply pagination
  const page = options.page || 1;
  const limit = options.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
    },
  };
}

/**
 * Find a single record by ID
 */
function findById(collection, id) {
  const data = readData(collection);
  return data.find(item => item.id === id);
}

/**
 * Find records matching a query
 */
function find(collection, query) {
  const data = readData(collection);
  return data.filter(item => {
    return Object.entries(query).every(([key, value]) => {
      return item[key] === value;
    });
  });
}

/**
 * Create a new record
 */
function create(collection, record) {
  const data = readData(collection);

  // Generate ID if not provided
  if (!record.id) {
    const prefix = collection.slice(0, 3);
    record.id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add timestamps
  record.createdDate = record.createdDate || new Date().toISOString();
  record.lastModified = new Date().toISOString();

  data.push(record);
  writeData(collection, data);

  return record;
}

/**
 * Update a record by ID
 */
function update(collection, id, updates) {
  const data = readData(collection);
  const index = data.findIndex(item => item.id === id);

  if (index === -1) {
    return null;
  }

  // Merge updates
  data[index] = {
    ...data[index],
    ...updates,
    id, // Preserve ID
    createdDate: data[index].createdDate, // Preserve created date
    lastModified: new Date().toISOString(),
  };

  writeData(collection, data);
  return data[index];
}

/**
 * Delete a record by ID
 */
function deleteById(collection, id) {
  const data = readData(collection);
  const filteredData = data.filter(item => item.id !== id);

  if (filteredData.length === data.length) {
    return false; // Not found
  }

  writeData(collection, filteredData);
  return true;
}

/**
 * Count records matching a query
 */
function count(collection, query = {}) {
  const data = readData(collection);

  if (Object.keys(query).length === 0) {
    return data.length;
  }

  return data.filter(item => {
    return Object.entries(query).every(([key, value]) => {
      return item[key] === value;
    });
  }).length;
}

/**
 * Bulk create records
 */
function bulkCreate(collection, records) {
  const data = readData(collection);
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  records.forEach((record, index) => {
    try {
      // Generate ID if not provided
      if (!record.id) {
        const prefix = collection.slice(0, 3);
        record.id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add timestamps
      record.createdDate = record.createdDate || new Date().toISOString();
      record.lastModified = new Date().toISOString();

      data.push(record);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: index + 1,
        error: error.message,
      });
    }
  });

  writeData(collection, data);
  return results;
}

module.exports = {
  findAll,
  findById,
  find,
  create,
  update,
  deleteById,
  count,
  bulkCreate,
};
