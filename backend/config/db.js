const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'Chill@12', // Replace with your MySQL password
  database: 'auth_system',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;