/**
 * Azure SQL Database Connection Pool
 *
 * Provides connection pooling for Azure SQL Database using mssql library.
 * Replaces the JSON file-based database with enterprise-grade database.
 */

const sql = require('mssql');

// Database configuration from environment variables
const config = {
  user: process.env.DB_USER || process.env.AZURE_SQL_USER,
  password: process.env.DB_PASSWORD || process.env.AZURE_SQL_PASSWORD,
  server: process.env.DB_SERVER || process.env.AZURE_SQL_SERVER,
  database: process.env.DB_NAME || process.env.AZURE_SQL_DATABASE || 'UXP',
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false, // Use true for local dev, false for Azure
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool promise
let poolPromise = null;

/**
 * Initialize database connection pool
 */
async function initializePool() {
  try {
    console.log('[DB] Connecting to Azure SQL Database...');
    console.log(`[DB] Server: ${config.server}`);
    console.log(`[DB] Database: ${config.database}`);

    const pool = await new sql.ConnectionPool(config).connect();

    console.log('[DB] ✅ Successfully connected to Azure SQL Database');

    // Connection pool events
    pool.on('error', err => {
      console.error('[DB] Pool error:', err);
    });

    return pool;
  } catch (error) {
    console.error('[DB] ❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Get database connection pool (creates if doesn't exist)
 */
async function getPool() {
  if (!poolPromise) {
    poolPromise = initializePool();
  }
  return poolPromise;
}

/**
 * Execute a query with parameters
 *
 * @param {string} query - SQL query
 * @param {object} params - Query parameters { param1: value1, param2: value2 }
 * @returns {Promise<object>} Query result
 */
async function executeQuery(query, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters to request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('[DB] Query execution error:', error.message);
    console.error('[DB] Query:', query);
    console.error('[DB] Params:', params);
    throw error;
  }
}

/**
 * Find all records from a table with optional filtering, sorting, and pagination
 *
 * @param {string} table - Table name
 * @param {object} options - Query options
 * @param {object} options.filter - WHERE clause filters { column: value }
 * @param {string} options.sort - ORDER BY clause (e.g., 'createdDate DESC')
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Records per page
 * @returns {Promise<object>} { data: [...], pagination: {...} }
 */
async function findAll(table, options = {}) {
  try {
    const {
      filter = {},
      sort = 'createdDate DESC',
      page = 1,
      limit = 50,
    } = options;

    const pool = await getPool();
    const request = pool.request();

    // Build WHERE clause
    const whereClauses = [];
    Object.entries(filter).forEach(([key, value], index) => {
      const paramName = `param${index}`;
      whereClauses.push(`${key} = @${paramName}`);
      request.input(paramName, value);
    });
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Build main query with pagination
    const dataQuery = `
      SELECT * FROM ${table}
      ${whereClause}
      ORDER BY ${sort}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const dataResult = await request.query(dataQuery);

    return {
      data: dataResult.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error(`[DB] Error in findAll(${table}):`, error.message);
    throw error;
  }
}

/**
 * Find a single record by ID
 *
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @returns {Promise<object|null>} Record or null if not found
 */
async function findById(table, id) {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', id);

    const query = `SELECT * FROM ${table} WHERE id = @id`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    console.error(`[DB] Error in findById(${table}, ${id}):`, error.message);
    throw error;
  }
}

/**
 * Find records matching a query
 *
 * @param {string} table - Table name
 * @param {object} query - WHERE clause filters { column: value }
 * @returns {Promise<Array>} Matching records
 */
async function find(table, queryFilters) {
  try {
    const pool = await getPool();
    const request = pool.request();

    const whereClauses = [];
    Object.entries(queryFilters).forEach(([key, value], index) => {
      const paramName = `param${index}`;
      whereClauses.push(`${key} = @${paramName}`);
      request.input(paramName, value);
    });

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT * FROM ${table} ${whereClause}`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error(`[DB] Error in find(${table}):`, error.message);
    throw error;
  }
}

/**
 * Create a new record
 *
 * @param {string} table - Table name
 * @param {object} record - Record data
 * @returns {Promise<object>} Created record
 */
async function create(table, record) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Generate ID if not provided
    if (!record.id) {
      const prefix = table.slice(0, 4).toLowerCase();
      record.id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add timestamps
    record.createdDate = record.createdDate || new Date().toISOString();
    record.lastModified = new Date().toISOString();

    // Build INSERT query
    const columns = Object.keys(record);
    const values = columns.map((col, idx) => `@param${idx}`);

    columns.forEach((col, idx) => {
      request.input(`param${idx}`, record[col]);
    });

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${values.join(', ')});
      SELECT * FROM ${table} WHERE id = @recordId;
    `;

    request.input('recordId', record.id);
    const result = await request.query(query);

    console.log(`[DB] ✅ Created ${table} record: ${record.id}`);
    return result.recordset[0];
  } catch (error) {
    console.error(`[DB] Error in create(${table}):`, error.message);
    throw error;
  }
}

/**
 * Update a record by ID
 *
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated record or null if not found
 */
async function update(table, id, updates) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Preserve ID and add lastModified
    delete updates.id;
    delete updates.createdDate;
    updates.lastModified = new Date().toISOString();

    // Build UPDATE query
    const setClauses = Object.keys(updates).map((col, idx) => `${col} = @param${idx}`);

    Object.keys(updates).forEach((col, idx) => {
      request.input(`param${idx}`, updates[col]);
    });

    request.input('id', id);

    const query = `
      UPDATE ${table}
      SET ${setClauses.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${table} WHERE id = @id;
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      console.log(`[DB] ⚠️ Update failed - ${table} record not found: ${id}`);
      return null;
    }

    console.log(`[DB] ✅ Updated ${table} record: ${id}`);
    return result.recordset[0];
  } catch (error) {
    console.error(`[DB] Error in update(${table}, ${id}):`, error.message);
    throw error;
  }
}

/**
 * Delete a record by ID
 *
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
async function deleteById(table, id) {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', id);

    const query = `DELETE FROM ${table} WHERE id = @id`;
    const result = await request.query(query);

    const deleted = result.rowsAffected[0] > 0;

    if (deleted) {
      console.log(`[DB] ✅ Deleted ${table} record: ${id}`);
    } else {
      console.log(`[DB] ⚠️ Delete failed - ${table} record not found: ${id}`);
    }

    return deleted;
  } catch (error) {
    console.error(`[DB] Error in deleteById(${table}, ${id}):`, error.message);
    throw error;
  }
}

/**
 * Count records matching a query
 *
 * @param {string} table - Table name
 * @param {object} queryFilters - WHERE clause filters (optional)
 * @returns {Promise<number>} Count of matching records
 */
async function count(table, queryFilters = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();

    const whereClauses = [];
    Object.entries(queryFilters).forEach(([key, value], index) => {
      const paramName = `param${index}`;
      whereClauses.push(`${key} = @${paramName}`);
      request.input(paramName, value);
    });

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;

    const result = await request.query(query);
    return result.recordset[0].total;
  } catch (error) {
    console.error(`[DB] Error in count(${table}):`, error.message);
    throw error;
  }
}

/**
 * Bulk create records (transaction-safe)
 *
 * @param {string} table - Table name
 * @param {Array<object>} records - Array of records to create
 * @returns {Promise<object>} { success: number, failed: number, errors: [...] }
 */
async function bulkCreate(table, records) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    await transaction.begin();

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];

        // Generate ID if not provided
        if (!record.id) {
          const prefix = table.slice(0, 4).toLowerCase();
          record.id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Add timestamps
        record.createdDate = record.createdDate || new Date().toISOString();
        record.lastModified = new Date().toISOString();

        const request = new sql.Request(transaction);

        // Build INSERT query
        const columns = Object.keys(record);
        const values = columns.map((col, idx) => `@param${idx}`);

        columns.forEach((col, idx) => {
          request.input(`param${idx}`, record[col]);
        });

        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;

        await request.query(query);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    await transaction.commit();
    console.log(`[DB] ✅ Bulk create completed: ${results.success} success, ${results.failed} failed`);

    return results;
  } catch (error) {
    await transaction.rollback();
    console.error('[DB] Bulk create transaction failed:', error.message);
    throw error;
  }
}

/**
 * Close database connection pool (for graceful shutdown)
 */
async function closePool() {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      await pool.close();
      poolPromise = null;
      console.log('[DB] Connection pool closed');
    }
  } catch (error) {
    console.error('[DB] Error closing pool:', error.message);
  }
}

module.exports = {
  sql, // Export sql object for advanced usage
  getPool,
  executeQuery,
  findAll,
  findById,
  find,
  create,
  update,
  deleteById,
  count,
  bulkCreate,
  closePool,
};
