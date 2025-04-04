const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_donation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // Create a promise-based pool

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to database as ID', connection.threadId);
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  });

// Handle disconnects
pool.on('error', err => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was lost. Attempting to reconnect...');
  }
});

module.exports = pool;