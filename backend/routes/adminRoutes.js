const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Get all receiver requests
router.get('/receiver-requests', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [receivers] = await db.execute(`
      SELECT r.*, u.full_name as user_name, u.phone_number as user_phone
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      data: receivers
    });
  } catch (error) {
    console.error('Error fetching receiver requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver requests',
      error: error.message
    });
  }
});

// Get all donors
router.get('/donors', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [donors] = await db.execute(`
      SELECT d.*, u.full_name as user_name, u.phone_number as user_phone
      FROM donors d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      data: donors
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donors',
      error: error.message
    });
  }
});

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

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get receiver details including location
    const [receiverDetails] = await db.execute(`
      SELECT r.*, u.full_name, u.phone_number, r.location_lat as latitude, r.location_lng as longitude
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    if (!receiverDetails.length) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    const receiver = receiverDetails[0];

    await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ?',
      [status, id]
    );

    let nearbyDonors = [];
    if (status === 'approved') {
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

      // Filter donors within 20km
      nearbyDonors = donors.filter(donor => {
        const distance = calculateDistance(
          receiver.latitude,
          receiver.longitude,
          donor.latitude,
          donor.longitude
        );
        donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
        return distance <= 20;
      });

      // Sort by distance
      nearbyDonors.sort((a, b) => a.distance - b.distance);
    }

    // Create notification for the receiver
    await db.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [receiver.user_id, `Your blood request has been ${status}`]
    );

    // If approved and there are nearby donors, add this information
    if (status === 'approved') {
      await db.execute(
        'UPDATE receivers SET nearby_donors = ? WHERE id = ?',
        [JSON.stringify(nearbyDonors), id]
      );
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: {
        status,
        nearbyDonors: status === 'approved' ? nearbyDonors : []
      }
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request status',
      error: error.message
    });
  }
});

// Update donor status
router.put('/donors/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await db.execute(
      'UPDATE donors SET status = ? WHERE id = ?',
      [status, id]
    );

    // Create notification for the donor
    const [donor] = await db.execute(
      'SELECT user_id FROM donors WHERE id = ?',
      [id]
    );

    if (donor.length > 0) {
      await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [donor[0].user_id, `Your donor application has been ${status}`]
      );
    }

    res.json({
      success: true,
      message: `Donor ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donor status',
      error: error.message
    });
  }
});

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