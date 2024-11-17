import mysql from 'mysql2/promise';  // Use mysql2/promise
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from the .env file

// Create the MySQL connection
const db = await mysql.createConnection({
  host: process.env.DB_HOST, // srv1561.hstgr.io
  user: process.env.DB_USER, // u125368758_zemhm
  password: process.env.DB_PASSWORD, // yShSd8nPyzsB6RdjdMcI1aUYHGDXA0rQ
  database: process.env.DB_NAME, // 7sW:QMx3D~
  port: process.env.DB_PORT, // 3306
});

console.log('Connected to MySQL database');

export default db;
