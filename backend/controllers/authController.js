const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Add this at the top with other requires


// Register a new user
const register = (req, res) => {
  const { fullname, phoneNumber, email, password, confirmPassword, blood_type } = req.body;

  // Validation (unchanged)
  if (!fullname || !phoneNumber || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check email existence
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Email check failed' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Password hashing failed' });
      }

      // Start transaction for multiple inserts
      db.beginTransaction(err => {
        if (err) {
          return res.status(500).json({ error: 'Transaction failed' });
        }

        // 1. Insert into users
        db.query(
          'INSERT INTO users (fullname, phoneNumber, email, password) VALUES (?, ?, ?, ?)',
          [fullname, phoneNumber, email, hash],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'User creation failed' });
              });
            }

            const userId = result.insertId;

            // 2. Insert into user_details (if blood_type provided)
            if (blood_type) {
              db.query(
                'INSERT INTO user_details (user_id, blood_type) VALUES (?, ?)',
                [userId, blood_type],
                (err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ error: 'Profile setup failed' });
                    });
                  }
                }
              );
            }

            // 3. Initialize donor_availability
            db.query(
              'INSERT INTO donor_availability (user_id) VALUES (?)',
              [userId],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: 'Donor setup failed' });
                  });
                }

                // Commit transaction
                db.commit(err => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ error: 'Commit failed' });
                    });
                  }

                  res.status(201).json({ message: 'User registered successfully' });
                });
              }
            );
          }
        );
      });
    });
  });
};

// Login a user
const login = (req, res) => {
  const { email, password } = req.body;

  // Query updated for new schema
  const query = `
    SELECT u.id, u.fullname, u.email, u.password, u.role, ud.blood_type 
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.user_id
    WHERE u.email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Password comparison failed' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          bloodType: user.blood_type
        },
        process.env.JWT_SECRET || 'your_fallback_secret', // Always have a fallback
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullname, // Note: Now using full_name
          email: user.email,
          role: user.role,
          bloodType: user.blood_type // New field
        }
      });
    });
  });
};

// Forgot password (placeholder)
const forgotPassword = (req, res) => {
  const { email } = req.body;

  // Don't allow password reset for admin
  if (email === ADMIN_CREDENTIALS.email) {
    return res.status(403).json({ error: 'Admin password cannot be reset this way' });
  }

  // Simulate sending a password reset email
  console.log(`Password reset email sent to: ${email}`);

  res.status(200).json({ message: 'Password reset instructions sent to your email.' });
};

// Add to authController.js
const testAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Manual test with hardcoded values
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';
    const testHash = '$2b$16$yourhashedpassword'; // Copy from your DB
    
    if (email !== testEmail) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    const match = await bcrypt.compare(password, testHash);
    res.json({
      success: match,
      message: match ? 'Manual test successful' : 'Manual test failed'
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
};

module.exports = { register, login, forgotPassword, testAdminLogin  };