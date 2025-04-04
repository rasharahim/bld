const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const receiverController = require('../controllers/receiverController');
const db = require('../config/db');

// Create a new blood request - protected route
router.post('/create', authMiddleware.authenticate, receiverController.upload, receiverController.createReceiver);

// Get user's requests - protected route
router.get('/my-requests', authMiddleware.authenticate, receiverController.getUserRequests);

// Get all pending requests - protected route
router.get('/pending', authMiddleware.authenticate, receiverController.getAllPendingRequests);

// Update request status - protected route
router.put('/:requestId/status', authMiddleware.authenticate, receiverController.updateRequestStatus);

// Delete request - protected route
router.delete('/:requestId', authMiddleware.authenticate, receiverController.deleteRequest);

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Get nearby donors for a receiver
router.get('/nearby-donors', authMiddleware.authenticate, async (req, res) => {
  try {
    const { bloodType, latitude, longitude, maxDistance = 20 } = req.query;

    if (!bloodType || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Blood type, latitude, and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Get all donors with matching blood type
    console.log('Query parameters:', { bloodType, latitude, longitude, maxDistance });
    
    // First, let's check all donors in the database
    const [allDonors] = await db.execute(`
      SELECT 
        d.*,
        u.full_name as donor_name,
        u.phone_number as donor_phone,
        d.location_lat as latitude,
        d.location_lng as longitude,
        d.status,
        d.blood_type
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_admin = 0
    `);
    console.log('All donors in database:', allDonors);

    // Then get donors matching the criteria
    const [donors] = await db.execute(`
      SELECT 
        d.*,
        u.full_name as donor_name,
        u.phone_number as donor_phone,
        d.location_lat as latitude,
        d.location_lng as longitude
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'Approved'
      AND d.blood_type = ?
      AND d.location_lat IS NOT NULL
      AND d.location_lng IS NOT NULL
      AND u.is_admin = 0
    `, [bloodType]);
    console.log('Matching donors:', donors);

    // Filter donors within maxDistance km
    const nearbyDonors = donors.filter(donor => {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(donor.latitude),
        parseFloat(donor.longitude)
      );
      donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
      const isNearby = distance <= maxDistance;
      console.log('Donor distance check:', {
        donorId: donor.id,
        donorName: donor.donor_name,
        distance,
        isWithinRange: isNearby
      });
      return isNearby;
    });
    console.log('Filtered nearby donors:', nearbyDonors);

    // Sort by distance
    nearbyDonors.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: nearbyDonors
    });
  } catch (error) {
    console.error('Error fetching nearby donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby donors',
      error: error.message
    });
  }
});

module.exports = router;