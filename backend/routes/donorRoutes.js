const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
//const donorStatusController = require('../controllers/donorStatusController'); // Fix import
const authMiddleware = require('../middlewares/authMiddleware');
const donorStatusController = require('../controllers/DonorStatusController');
const db = require('../config/db');

console.log("authMiddleware:", authMiddleware);
console.log("authMiddleware.authenticate type:", typeof authMiddleware.authenticate);
console.log("authMiddleware.authorizeAdmin type:", typeof authMiddleware.authorizeAdmin);


// ✅ Log `authMiddleware` before using it
//console.log("authMiddleware:", authMiddleware);
//console.log("authMiddleware.authenticate type:", typeof authMiddleware.authenticate);
//console.log("authMiddleware.authorizeAdmin type:", typeof authMiddleware.authorizeAdmin);

//console.log("donorStatusController:", donorStatusController);
// ✅ Import correctly from donorStatusController
const { acceptBloodRequest } = donorStatusController;


// ✅ Log functions from donorStatusController

//console.log("acceptBloodRequest:", acceptBloodRequest);
//console.log("typeof acceptBloodRequest:", typeof acceptBloodRequest);

// ✅ Use only one definition for createDonor
router.post('/createDonor', authMiddleware.authenticate, donorController.createDonor);
router.get('/', authMiddleware.authenticate, donorController.getDonor); // Get single donor

// Get donor status by user ID
router.get('/user/:userId/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        d.status,
        d.id as donor_id,
        d.user_id,
        u.full_name,
        u.blood_type,
        d.created_at,
        d.last_donation_date,
        d.donation_gap_months
      FROM donors d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?`,
      [req.params.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Check if the authenticated user is the donor or an admin
    if (req.user.id !== parseInt(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this donor status'
      });
    }

    res.json({
      success: true,
      status: rows[0].status,
      donor: {
        id: rows[0].donor_id,
        fullName: rows[0].full_name,
        bloodType: rows[0].blood_type,
        registeredDate: rows[0].created_at,
        lastDonationDate: rows[0].last_donation_date,
        donationGapMonths: rows[0].donation_gap_months
      }
    });
  } catch (error) {
    console.error('Error fetching donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor status',
      error: error.message
    });
  }
});

// Get donor status by donor ID
router.get('/:donorId/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        d.status,
        d.id as donor_id,
        d.user_id,
        u.full_name,
        u.blood_type,
        d.created_at,
        d.last_donation_date,
        d.donation_gap_months
      FROM donors d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.id = ?`,
      [req.params.donorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Check if the authenticated user is the donor or an admin
    if (req.user.id !== rows[0].user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this donor status'
      });
    }

    res.json({
      success: true,
      status: rows[0].status,
      donor: {
        id: rows[0].donor_id,
        fullName: rows[0].full_name,
        bloodType: rows[0].blood_type,
        registeredDate: rows[0].created_at,
        lastDonationDate: rows[0].last_donation_date,
        donationGapMonths: rows[0].donation_gap_months
      }
    });
  } catch (error) {
    console.error('Error fetching donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor status',
      error: error.message
    });
  }
});

// Get nearby blood requests for a specific donor
router.get('/:donorId/blood-requests', authMiddleware.authenticate, async (req, res) => {
  try {
    // First get the donor's location and blood type
    const [donor] = await db.execute(
      `SELECT u.location_lat, u.location_lng, u.blood_type, d.status, d.user_id
       FROM users u
       INNER JOIN donors d ON u.id = d.user_id
       WHERE d.id = ?`,
      [req.params.donorId]
    );

    if (!donor.length || donor[0].status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved donors can view blood requests'
      });
    }

    // Check if the authenticated user is the donor or an admin
    if (req.user.id !== donor[0].user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view these blood requests'
      });
    }

    const donorLocation = {
      lat: donor[0].location_lat,
      lng: donor[0].location_lng
    };

    if (!donorLocation.lat || !donorLocation.lng) {
      return res.status(400).json({
        success: false,
        message: 'Donor location not available'
      });
    }

    // Get nearby requests using Haversine formula
    const [requests] = await db.execute(`
      SELECT 
        r.id,
        u.full_name as user_name,
        r.blood_type,
        r.location_lat,
        r.location_lng,
        r.address,
        r.urgency,
        r.additional_notes,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(r.location_lat)) *
            cos(radians(r.location_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(r.location_lat))
          )
        ) AS distance
      FROM receivers r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.status = 'approved'
        AND r.blood_type = ?
        AND r.location_lat IS NOT NULL 
        AND r.location_lng IS NOT NULL
        AND r.selected_donor_id IS NULL
      HAVING distance <= 20
      ORDER BY distance
    `, [donorLocation.lat, donorLocation.lng, donorLocation.lat, donor[0].blood_type]);

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message
    });
  }
});

// Accept blood request for a specific donor
router.post('/:donorId/accept-request', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId } = req.body;
    const donorId = req.params.donorId;

    // Check if the donor exists and is approved
    const [donor] = await db.execute(
      'SELECT user_id, status FROM donors WHERE id = ?',
      [donorId]
    );

    if (!donor.length || donor[0].status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved donors can accept requests'
      });
    }

    // Check if the authenticated user is the donor
    if (req.user.id !== donor[0].user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to accept this request'
      });
    }

    // Update the receiver with the selected donor
    const [result] = await db.execute(
      'UPDATE receivers SET selected_donor_id = ? WHERE id = ? AND selected_donor_id IS NULL',
      [donorId, requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Blood request not found or already accepted'
      });
    }

    res.json({
      success: true,
      message: 'Blood request accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept blood request',
      error: error.message
    });
  }
});

// ✅ Admin routes
router.put('/:id/status', authMiddleware.authenticate, authMiddleware.authorizeAdmin, donorController.approveDonor);
router.get('/all', authMiddleware.authenticate, authMiddleware.authorizeAdmin, donorController.getAllDonors);

//router.get('/blood-requests', authMiddleware.authenticate, authMiddleware.authorizeAdmin, bloodRequestController.getAllBloodRequests);

// 🌍 Public route for nearby donors
//router.get('/nearby', donorController.getNearbyDonors);

module.exports = router;
