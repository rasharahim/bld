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


// 🔒 Protected route for accepting a blood request
router.post("/accept-request", authMiddleware.authenticate, donorStatusController.acceptBloodRequest);

// ✅ Admin routes
router.put('/:id/status', authMiddleware.authenticate, authMiddleware.authorizeAdmin, donorController.approveDonor);
router.get('/all', authMiddleware.authenticate, authMiddleware.authorizeAdmin, donorController.getAllDonors);

//router.get('/blood-requests', authMiddleware.authenticate, authMiddleware.authorizeAdmin, bloodRequestController.getAllBloodRequests);

// 🌍 Public route for nearby donors
//router.get('/nearby', donorController.getNearbyDonors);

// Get nearby blood requests
router.get('/blood-requests', authMiddleware.authenticate, async (req, res) => {
  try {
    // First get the donor's location and blood type
    const [donor] = await db.execute(
      `SELECT u.location_lat, u.location_lng, u.blood_type, d.status
       FROM users u
       INNER JOIN donors d ON u.id = d.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!donor.length || donor[0].status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved donors can view blood requests'
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

// Get donor status
router.get('/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT status FROM donors WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        status: 'not_registered'
      });
    }

    res.json({
      success: true,
      status: rows[0].status
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

module.exports = router;
