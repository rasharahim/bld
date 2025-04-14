const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const receiverController = require('../controllers/receiverController');
const db = require('../config/db');

// Create a new blood request - protected route
//router.post('/create', authMiddleware.authenticate, receiverController.upload, receiverController.createReceiver);

// Get user's requests - protected route
router.get('/my-requests', authMiddleware.authenticate, receiverController.getUserRequests);

// Get all pending requests - protected route
router.get('/pending', authMiddleware.authenticate, receiverController.getAllPendingRequests);

// Update request status - protected route
router.put('/:requestId/status', authMiddleware.authenticate, receiverController.updateRequestStatus);

// Delete request - protected route
router.delete('/:requestId', authMiddleware.authenticate, receiverController.deleteRequest);

// Add this to receiverRoutes.js
// Add this to your receiverRoutes.js
router.get('/request/:requestId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching request ${requestId} for user ${userId}`); // Debug log

    // Simplified query - adjust according to your actual schema
    const [request] = await db.execute(
      `SELECT 
        r.id,
        r.blood_type,
        r.status,
        r.created_at,
        r.full_name,
        r.contact_number,
        r.reason_for_request
      FROM receivers r
      WHERE r.id = ? AND r.user_id = ?`,
      [requestId, userId]
    );

    if (request.length === 0) {
      console.log('Request not found or unauthorized');
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    console.log('Found request:', request[0]); // Debug log

    res.json({
      success: true,
      request: request[0]  // Ensure this matches frontend expectation
    });

  } catch (error) {
    console.error('Error in /request/:requestId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get nearby donors
router.get('/nearby-donors', authMiddleware.authenticate, async (req, res) => {
  try {
    const { bloodType, latitude, longitude } = req.query;
    
    if (!latitude || !longitude || !bloodType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: bloodType, latitude, longitude'
      });
    }

    // Convert coordinates to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Haversine formula in MySQL to calculate distance
    const [donors] = await db.execute(`
      SELECT 
        d.id,
        u.full_name as donor_name,
        u.phone_number as donor_phone,
        u.blood_type,
        u.location_lat as latitude,
        u.location_lng as longitude,
        u.address,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(u.location_lat)) *
            cos(radians(u.location_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(u.location_lat))
          )
        ) AS distance
      FROM donors d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.status = 'approved'
        AND u.blood_type = ?
        AND u.location_lat IS NOT NULL 
        AND u.location_lng IS NOT NULL
      HAVING distance <= 20
      ORDER BY distance
    `, [lat, lng, lat, bloodType]);

    res.json({
      success: true,
      data: donors
    });

  } catch (error) {
    console.error('Error fetching nearby donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby donors',
      error: error.message
    });
  }
});

// Create new receiver request
router.post('/create-request', 
  authMiddleware.authenticate, 
  receiverController.upload, // This handles file upload
  async (req, res) => {
    try {
      console.log('Request body:', req.body);
      console.log('Uploaded file:', req.file);
      
      // Extract fields from form-data
      const {
        full_name,
        age,
        blood_type,
        contact_number,
        country,
        state,
        district,
        address,
        location_lat,
        location_lng,
        reason_for_request
      } = req.body;

      // Validate required fields
      const requiredFields = [
        'full_name', 'age', 'blood_type', 'contact_number',
        'country', 'state', 'district', 'address', 'reason_for_request'
      ];
      
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields: missingFields
        });
      }

      // Insert into database
      const [result] = await db.execute(
        `INSERT INTO receivers (
          user_id, full_name, age, blood_type, contact_number,
          country, state, district, address, 
          location_lat, location_lng, location_address,
          reason_for_request, prescription_path, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          req.user.id,
          req.body.full_name,
          req.body.age,
          req.body.blood_type,
          req.body.contact_number,
          req.body.country,
          req.body.state,
          req.body.district,
          req.body.address,
          req.body.location_lat || null,
          req.body.location_lng || null,
          req.body.location_address || req.body.address, // Fallback to address if location_address not provided
          req.body.reason_for_request,
          req.file ? req.file.filename : null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Blood request created successfully',
        data: {
          id: result.insertId
        }
      });

    } catch (error) {
      console.error('Error in /create-request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Select a donor
router.post('/select-donor', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;
    const userId = req.user.id;

    // Verify the request belongs to the user
    const [request] = await db.execute(
      'SELECT * FROM receivers WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    // Update the request with selected donor
    await db.execute(
      'UPDATE receivers SET selected_donor_id = ?, status = "matched" WHERE id = ?',
      [donorId, requestId]
    );

    // Create a notification for the donor
    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donor_selected")',
      [donorId, `You have been selected as a donor for a blood request`]
    );

    res.json({
      success: true,
      message: 'Donor selected successfully'
    });

  } catch (error) {
    console.error('Error selecting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select donor',
      error: error.message
    });
  }
});

// Complete donation
router.post('/complete-donation', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;
    const userId = req.user.id;

    // Verify the request belongs to the user
    const [request] = await db.execute(
      'SELECT * FROM receivers WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    // Update the request status
    await db.execute(
      'UPDATE receivers SET status = "completed" WHERE id = ?',
      [requestId]
    );

    // Create notifications for both parties
    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donation_completed")',
      [donorId, 'The blood donation has been marked as completed']
    );

    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donation_completed")',
      [userId, 'The blood donation has been marked as completed']
    );

    res.json({
      success: true,
      message: 'Donation marked as completed'
    });

  } catch (error) {
    console.error('Error completing donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation',
      error: error.message
    });
  }
});

module.exports = router;