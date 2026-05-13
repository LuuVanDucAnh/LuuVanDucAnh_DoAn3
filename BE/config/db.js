const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  },
  options: {
    port: parseInt(process.env.DB_PORT) || 1433,
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

async function query(sqlQuery, params = []) {
  const poolConnection = await getPool();
  const request = poolConnection.request();
  for (const param of params) {
    request.input(param.name, param.value);
  }
  const result = await request.query(sqlQuery);
  return result;
}

async function execute(procedureName, params = []) {
  const poolConnection = await getPool();
  const request = poolConnection.request();
  for (const param of params) {
    request.input(param.name, param.value);
  }
  const result = await request.execute(procedureName);
  return result;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { query, execute, getPool, closePool, sql };
