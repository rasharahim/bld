const db = require('../config/db');
const { validationResult } = require('express-validator');

const donorController = {
  createDonor: async (req, res) => {
    let connection;
    try {
      // 1. Log the incoming request
      console.log('Headers:', req.headers);
      console.log('User from token:', req.user);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      // 2. Authentication check
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: User not logged in",
          debug: { user: req.user }
        });
      }

      // 3. Validate required fields
      const requiredFields = [
        'fullName', 'dob', 'age', 'weight', 'bloodType',
        'availabilityStart', 'availabilityEnd', 'contactNumber'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields
        });
      }

      // 4. Extract and validate data
      const {
        fullName, dob, age, weight, bloodType, hasDonatedBefore,
        lastDonationDate, donationGap, healthCondition, availabilityStart,
        availabilityEnd, contactNumber, country, state, district,
        street, location
      } = req.body;

      // 5. Validate numeric fields
      if (isNaN(age) || age < 18 || age > 65) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 18 and 65'
        });
      }

      if (isNaN(weight) || weight < 45) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be at least 45kg'
        });
      }

      // 6. Get connection and begin transaction
      connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        console.log("Starting donor creation for user:", req.user.id);
        
        // 7. Insert donor record
        const [result] = await connection.execute(
          `INSERT INTO donors (
            user_id, full_name, dob, age, weight, blood_type, 
            has_donated_before, last_donation_date, donation_gap_months,
            health_conditions, availability_start, availability_end,
            contact_number, country, state, district, street,
            location_lat, location_lng, location_address, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            req.user.id,
            fullName,
            dob,
            age,
            weight,
            bloodType,
            hasDonatedBefore || false,
            lastDonationDate || null,
            donationGap || null,
            JSON.stringify(healthCondition || []),
            availabilityStart,
            availabilityEnd,
            contactNumber,
            country || null,
            state || null,
            district || null,
            street || null,
            location?.lat || null,
            location?.lng || null,
            location?.address || null
          ]
        );

        // 8. Commit transaction
        await connection.commit();
        console.log("Donor created successfully, ID:", result.insertId);

        // 9. Send success response
        res.status(201).json({
          success: true,
          message: 'Donor registration submitted successfully',
          donorId: result.insertId
        });

      } catch (dbError) {
        // 10. Handle database errors
        console.error("Database error:", dbError);
        if (connection) {
          await connection.rollback();
        }
        
        // Check for specific MySQL errors
        if (dbError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: 'You have already registered as a donor'
          });
        }

        throw dbError; // Re-throw for general error handling
      }

    } catch (error) {
      // 11. General error handling
      console.error('Donor creation failed:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to register donor',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (connection) {
        connection.release(); // Always release the connection
      }
    }
  },

  getDonor: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not logged in" });
      }
      
      console.log("Fetching donor for user ID:", req.user.id);
      const [rows] = await db.execute(
        'SELECT * FROM donors WHERE user_id = ?',
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Donor not found' });
      }

      console.log("Successfully fetched donor ID:", rows[0].id);
      res.json({ success: true, donor: rows[0] });
    } catch (error) {
      console.error('Donor fetch failed:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch donor data', error: error.message });
    }
  },

  approveDonor: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not logged in" });
      }
      
      if (!req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      const [result] = await db.execute(
        'UPDATE donors SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Donor not found' });
      }

      res.json({ success: true, message: `Donor ${status} successfully`, donorId: id, status });
    } catch (error) {
      console.error('Donor approval failed:', error);
      res.status(500).json({ success: false, message: 'Failed to update donor status', error: error.message });
    }
  },

  getAllDonors: async (req, res) => {
    try {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
      }

      const [rows] = await db.execute(
        'SELECT * FROM donors ORDER BY created_at DESC'
      );
      res.json({ success: true, donors: rows });
    } catch (error) {
      console.error('Fetching all donors failed:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch donors', error: error.message });
    }
  }
};

console.log("donorController:", donorController);

module.exports = donorController;