const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Register a new user
const register = (req, res) => {
  const { fullName, phoneNumber, email, password, confirmPassword } = req.body;

  // Debug: Log the request body
  console.log('Request Body:', req.body);

  // Validate required fields
  if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Check if email already exists
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking email' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password and proceed with registration
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      const insertQuery = 'INSERT INTO users (fullName, phoneNumber, email, password) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [fullName, phoneNumber, email, hash], (err, result) => {
        if (err) {
          console.error('Database Error:', err); // Debug: Log database errors
          return res.status(500).json({ error: 'Error registering user' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
};

// Login a user
const login = (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
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

      // If login is successful, return user data (excluding password)
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
      });
    });
  });
};

// Forgot password (placeholder)
const forgotPassword = (req, res) => {
  const { email } = req.body;

  // Simulate sending a password reset email
  console.log(`Password reset email sent to: ${email}`);

  res.status(200).json({ message: 'Password reset instructions sent to your email.' });
};

module.exports = { register, login, forgotPassword };