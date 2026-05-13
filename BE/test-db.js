require('dotenv').config();
const sql = require('mssql');

async function testConnection() {
  const server = process.env.DB_SERVER || 'localhost';
  const port = process.env.DB_PORT || 1433;
  const database = process.env.DB_NAME || 'master';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const instance = process.env.DB_INSTANCE;

  console.log(`DB Server: ${server}:${port}`);
  console.log(`DB Name: ${database}`);
  console.log(`DB User: ${user}`);
  console.log(`DB Password: ${password ? '***' : '(empty)'}`);
  console.log(`DB Instance: ${instance || '(none)'}`);

  // Thu 1: Named pipes (khong can TCP/IP hay SQL Browser)
  const pipeConfig = `Server=np\\\\.\\pipe\\MSSQL\\$SQLEXPRESS\\sql\\query;Database=${database};User Id=${user};Password=${password};TrustServerCertificate=yes;Connection Timeout=60;`;

  console.log(`\n[Thu 1] Named pipes: np\\.\\pipe\\MSSQL\\$SQLEXPRESS\\sql\\query`);
  try {
    const pool = await sql.connect(pipeConfig);
    console.log(`SUCCESS via named pipes!`);
    const rs = await pool.query(`SELECT name FROM sys.databases WHERE name = '${database}'`);
    console.log(`Database '${database}' exists: ${rs.recordset.length > 0}`);
    await pool.close();
    console.log(`\n=== KET NOI THANH CONG ===`);
    process.exit(0);
  } catch (e) {
    console.log(`Named pipes FAILED: ${e.message}`);
  }

  // Thu 2: localhost voi port cua SQLEXPRESS
  const tcpConfig = `Server=localhost,${port};Database=${database};User Id=${user};Password=${password};TrustServerCertificate=yes;Encrypt=false;Connection Timeout=60;`;
  console.log(`\n[Thu 2] TCP port: localhost:${port}`);
  try {
    const pool = await sql.connect(tcpConfig);
    console.log(`SUCCESS via TCP!`);
    const rs = await pool.query(`SELECT name FROM sys.databases WHERE name = '${database}'`);
    console.log(`Database '${database}' exists: ${rs.recordset.length > 0}`);
    await pool.close();
    console.log(`\n=== KET NOI THANH CONG ===`);
    process.exit(0);
  } catch (e) {
    console.log(`TCP FAILED: ${e.message}`);
  }

  // Thu 3: instance name (cach cu)
  const instConfig = `Server=${server};Database=${database};User Id=${user};Password=${password};TrustServerCertificate=yes;Encrypt=false;Instance=${instance};Connection Timeout=60;`;
  console.log(`\n[Thu 3] Instance name: ${server}`);
  try {
    const pool = await sql.connect(instConfig);
    console.log(`SUCCESS via instance!`);
    const rs = await pool.query(`SELECT name FROM sys.databases WHERE name = '${database}'`);
    console.log(`Database '${database}' exists: ${rs.recordset.length > 0}`);
    await pool.close();
    console.log(`\n=== KET NOI THANH CONG ===`);
    process.exit(0);
  } catch (e) {
    console.log(`Instance FAILED: ${e.message}`);
  }

  console.log(`\n=== KHONG KET NOI DUOC ===`);
  process.exit(1);
}

testConnection();
