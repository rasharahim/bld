const Receiver = require('../models/receiver');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/prescriptions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

exports.upload = upload.single('prescription');

exports.createReceiver = async (req, res) => {
  try {
    console.log('Received request data:', req.body); // Debug log

    const receiverData = {
      user_id: req.user.id,
      full_name: req.body.fullName,
      age: req.body.age,
      blood_type: req.body.bloodType,
      contact_number: req.body.contactNumber,
      country: req.body.country,
      state: req.body.state,
      district: req.body.district,
      address: req.body.address,
      location_lat: req.body.lat,
      location_lng: req.body.lng,
      location_address: req.body.locationAddress,
      reason_for_request: req.body.reasonForRequest,
      prescription_path: req.file ? req.file.filename : null
    };

    
    // Validate required fields
    const requiredFields = ['full_name', 'age', 'blood_type', 'contact_number', 'country', 'state', 'district', 'address', 'reason_for_request'];
    const missingFields = requiredFields.filter(field => !receiverData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Convert age to number
    receiverData.age = Number(receiverData.age);

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(receiverData.blood_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type'
      });
    }

    const receiverId = await Receiver.create(receiverData);
    const [request] = await db.execute(
      `SELECT * FROM receivers WHERE id = ?`,
      [receiverId]
    );

    res.status(201).json({
      success: true,
      message: 'Receiver request created successfully',
      data:{
        id: receiverId  // Ensure this matches what frontend expects
      }
    });
  } catch (error) {
    console.error('Error creating receiver:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating receiver request',
      error: error.message
    });
  }
};

exports.getAllReceivers = async (req, res) => {
  try {
    const receivers = await Receiver.getAll();
    res.status(200).json({
      success: true,
      data: receivers
    });
  } catch (error) {
    console.error('Error fetching receivers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver requests',
      error: error.message
    });
  }
};

exports.getReceiverById = async (req, res) => {
  try {
    const receiver = await Receiver.getById(req.params.id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }
    res.status(200).json({
      success: true,
      data: receiver
    });
  } catch (error) {
    console.error('Error fetching receiver:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver request',
      error: error.message
    });
  }
};

exports.getUserReceivers = async (req, res) => {
  try {
    const receivers = await Receiver.getByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: receivers
    });
  } catch (error) {
    console.error('Error fetching user receivers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user receiver requests',
      error: error.message
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await Receiver.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

// Create a new blood request
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      bloodType, 
      quantity, 
      hospital,
      fullName,
      contactNumber,
      reasonForRequest
    } = req.body;

    console.log('Received request data:', req.body); // Debug log

    // Validate input
    if (!bloodType || !quantity || !hospital || !fullName || !contactNumber || !reasonForRequest) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        received: req.body
      });
    }

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(bloodType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type'
      });
    }

    // Validate quantity
    if (quantity <= 0 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 10 units'
      });
    }

    // Create blood request
    const [result] = await db.execute(
      `INSERT INTO receivers (
        user_id, 
        blood_type, 
        quantity, 
        hospital,
        full_name,
        contact_number,
        reason_for_request,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [userId, bloodType, quantity, hospital, fullName, contactNumber, reasonForRequest]
    );

    console.log('Database insert result:', result); // Debug log

    // Fetch the created request
    const [request] = await db.execute(
      `SELECT * FROM receivers WHERE id = ?`,
      [result.insertId]
    );

    console.log('Created request:', request[0]); // Debug log

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      request: request[0]
    });

  } catch (error) {
    console.error('Error in createRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating blood request',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all requests for a user
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.execute(
      `SELECT 
        r.*,
        u.full_name,
        u.phone_number,
        r.location_lat as latitude,
        r.location_lng as longitude,
        d.full_name as donor_name,
        d.contact_number as donor_contact
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN donors d ON r.selected_donor_id = d.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error in getUserRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// Get all pending requests (for donors to view)
exports.getAllPendingRequests = async (req, res) => {
  try {
    const [requests] = await db.execute(
      `SELECT r.*, u.full_name, u.phone_number
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'Pending'
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Error in getAllPendingRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if request exists and belongs to user
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

    // Update status
    await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ?',
      [status, requestId]
    );

    res.json({
      success: true,
      message: 'Request status updated successfully'
    });

  } catch (error) {
    console.error('Error in updateRequestStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request status',
      error: error.message
    });
  }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Check if request exists and belongs to user
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

    // Delete request
    await db.execute(
      'DELETE FROM receivers WHERE id = ?',
      [requestId]
    );

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting request',
      error: error.message
    });
  }
};