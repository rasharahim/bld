const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const db = require('../config/db');

// Add logging middleware for admin actions
const logAdminAction = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const action = req.method + ' ' + req.path;
    const details = JSON.stringify({
      params: req.params,
      body: req.body,
      query: req.query
    });

    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [adminId, action, details]
    );
    next();
  } catch (error) {
    console.error('Error logging admin action:', error);
    next(); // Continue even if logging fails
  }
};

// Apply logging middleware to all admin routes
router.use(logAdminAction);

// Get all donors
router.get('/donors', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [donors] = await db.execute(`
      SELECT d.*, u.email, u.phone_number,
      CASE 
        WHEN d.status = 'pending' THEN 'Pending Approval'
        WHEN d.status = 'active' THEN 'Active Donor'
        WHEN d.status = 'rejected' THEN 'Registration Rejected'
        WHEN d.status = 'inactive' THEN 'Account Inactive'
      END as display_status
      FROM donors d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      data: donors
    });
  } catch (error) {
    console.error('Error fetching all donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donors',
      error: error.message
    });
  }
});

// Update donor status with enhanced logging
router.put('/donors/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input parameters
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Donor ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['active', 'rejected', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "active", "rejected", or "inactive"'
      });
    }

    // Check if donor exists before updating
    const [donor] = await db.execute(
      'SELECT * FROM donors WHERE id = ?',
      [id]
    );

    if (donor.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Log the status change attempt
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action_type, action_path, request_details) VALUES (?, ?, ?, ?)',
      [
        req.user.id,
        'PUT',
        `/admin/donors/${id}/status`,
        JSON.stringify({
          donorId: id,
          oldStatus: donor[0].status,
          newStatus: status,
          adminId: req.user.id,
          timestamp: new Date().toISOString()
        })
      ]
    );

    const [result] = await db.execute(
      'UPDATE donors SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Get updated donor data
    const [updatedDonor] = await db.execute(`
      SELECT d.*, u.email, u.phone_number,
      CASE 
        WHEN d.status = 'pending' THEN 'Pending Approval'
        WHEN d.status = 'active' THEN 'Active Donor'
        WHEN d.status = 'rejected' THEN 'Registration Rejected'
        WHEN d.status = 'inactive' THEN 'Account Inactive'
      END as display_status
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    res.json({
      success: true,
      message: `Donor ${status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'deactivated'} successfully`,
      data: updatedDonor[0]
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

// Get all receiver requests
router.get('/receiver-requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT r.*, u.full_name, u.email, u.phone_number,
      CASE 
        WHEN r.status = 'pending' THEN 'Pending Approval'
        WHEN r.status = 'approved' THEN 'Request Approved'
        WHEN r.status = 'rejected' THEN 'Request Rejected'
        ELSE 'Unknown Status'
      END as display_status
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      data: requests
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

// Update receiver request status
router.put('/receiver-requests/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "approved" or "rejected"'
      });
    }

    const [result] = await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Get updated receiver data
    const [updatedRequest] = await db.execute(`
      SELECT r.*, u.full_name, u.email, u.phone_number,
      CASE 
        WHEN r.status = 'pending' THEN 'Pending Approval'
        WHEN r.status = 'approved' THEN 'Request Approved'
        WHEN r.status = 'rejected' THEN 'Request Rejected'
        ELSE 'Unknown Status'
      END as display_status
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    res.json({
      success: true,
      message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: updatedRequest[0]
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

module.exports = router; 