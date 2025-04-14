const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const db = require('../config/db');

// Get all receiver requests
router.get('/receiver-requests', authenticate, authorizeAdmin, adminController.getReceiverRequests);

// Get all donors
router.get('/donors', authenticate, authorizeAdmin, adminController.getDonors);

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

// Update receiver request status
router.put('/receiver-requests/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Updating receiver request status:', { id, status, body: req.body });

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      console.log('Invalid status received:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get receiver details including location
    console.log('Fetching receiver details for ID:', id);
    const [receiverDetails] = await db.execute(`
      SELECT r.*, u.full_name, u.phone_number, r.location_lat as latitude, r.location_lng as longitude
      FROM receivers r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    console.log('Receiver details:', receiverDetails);

    if (!receiverDetails.length) {
      console.log('No receiver found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    const receiver = receiverDetails[0];
    console.log('Updating status in database:', { id, status });

    await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ?',
      [status, id]
    );

    let nearbyDonors = [];
    if (status === 'approved') {
      console.log('Finding nearby donors for blood type:', receiver.blood_type);
      // Find nearby donors with matching blood type
      const [donors] = await db.execute(`
        SELECT 
          d.*,
          u.full_name as donor_name,
          u.phone_number as donor_phone,
          d.location_lat as latitude,
          d.location_lng as longitude
        FROM donors d
        JOIN users u ON d.user_id = u.id
        WHERE d.status = 'approved'
        AND d.blood_type = ?
        AND d.location_lat IS NOT NULL
        AND d.location_lng IS NOT NULL
      `, [receiver.blood_type]);

      console.log('Found donors:', donors);

      // Filter donors within 20km
      nearbyDonors = donors.filter(donor => {
        if (!receiver.latitude || !receiver.longitude) {
          console.log('Receiver location not available');
          return false;
        }
        const distance = calculateDistance(
          receiver.latitude,
          receiver.longitude,
          donor.latitude,
          donor.longitude
        );
        donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
        return distance <= 20;
      });

      console.log('Filtered nearby donors:', nearbyDonors);
    }

    // Create notification for the receiver
    if (receiver.user_id) {
      console.log('Creating notification for user:', receiver.user_id);
      await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [receiver.user_id, `Your blood request has been ${status}`]
      );
    }

    // If approved and there are nearby donors, add this information
    if (status === 'approved') {
      console.log('Updating receiver with nearby donors');
      await db.execute(
        'UPDATE receivers SET nearby_donors = ? WHERE id = ?',
        [JSON.stringify(nearbyDonors), id]
      );
    }

    console.log('Successfully updated request status');
    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: {
        status,
        nearbyDonors: status === 'approved' ? nearbyDonors : []
      }
    });
  } catch (error) {
    console.error('Detailed error in status update:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    res.status(500).json({
      success: false,
      message: 'Error updating request status',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  }
});

// Update donor status
router.put('/donors/:id/status', authenticate, authorizeAdmin, adminController.updateDonorStatus);

// Get nearby donors
router.get('/donors/nearby', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { bloodType, latitude, longitude, maxDistance = 20 } = req.query;

    if (!bloodType || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Blood type, latitude, and longitude are required'
      });
    }

    // Get all donors with matching blood type
    const [donors] = await db.execute(`
      SELECT 
        d.*,
        u.full_name as donor_name,
        u.phone_number as donor_phone,
        d.location_lat as latitude,
        d.location_lng as longitude
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'approved'
      AND d.blood_type = ?
      AND d.location_lat IS NOT NULL
      AND d.location_lng IS NOT NULL
    `, [bloodType]);

    // Filter donors within maxDistance km
    const nearbyDonors = donors.filter(donor => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        donor.latitude,
        donor.longitude
      );
      donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
      return distance <= maxDistance;
    });

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

// Get nearby donors (for receivers)
router.get('/receivers/nearby-donors', authenticate, async (req, res) => {
  try {
    const { bloodType, latitude, longitude, maxDistance = 20 } = req.query;

    if (!bloodType || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Blood type, latitude, and longitude are required'
      });
    }

    // Get all donors with matching blood type
    const [donors] = await db.execute(`
      SELECT 
        d.*,
        u.full_name as donor_name,
        u.phone_number as donor_phone,
        d.location_lat as latitude,
        d.location_lng as longitude
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'approved'
      AND d.blood_type = ?
      AND d.location_lat IS NOT NULL
      AND d.location_lng IS NOT NULL
    `, [bloodType]);

    // Filter donors within maxDistance km
    const nearbyDonors = donors.filter(donor => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        donor.latitude,
        donor.longitude
      );
      donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
      return distance <= maxDistance;
    });

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