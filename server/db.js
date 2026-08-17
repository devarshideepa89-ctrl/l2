const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function createPool() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'anti_music',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    console.log('[DB] Connection pool created successfully');
    return pool;
  } catch (err) {
    console.error('[DB] Failed to create connection pool:', err.message);
    return null;
  }
}

function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}

async function query(sql, params = []) {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database connection unavailable');
  }
  try {
    const [results] = await dbPool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('[DB] Query error:', err.message);
    throw err;
  }
}

async function testConnection() {
  const dbPool = getPool();
  if (!dbPool) return false;
  try {
    const [rows] = await dbPool.execute('SELECT 1 as test');
    console.log('[DB] Connection test passed');
    return true;
  } catch (err) {
    console.error('[DB] Connection test failed:', err.message);
    return false;
  }
}

module.exports = {
  createPool,
  getPool,
  query,
  testConnection
};
