const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Register a new user
const register = (req, res) => {
  const { username, email, password, name } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    // Insert user into the database
    const query = 'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, hash, name], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error registering user' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

// Login a user
const login = (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error finding user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    // Compare the password with the hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, name: user.name } });
    });
  });
};

const forgotPassword = (req, res) => {
  const { email } = req.body;

  // Simulate sending a password reset email
  console.log(`Password reset email sent to: ${email}`);

  res.status(200).json({ message: 'Password reset instructions sent to your email.' });
};

module.exports = { register, login, forgotPassword };

