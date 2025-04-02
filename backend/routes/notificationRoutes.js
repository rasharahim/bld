const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, createNotification } = require('../controllers/notificationController'); 
const protect = require('../middleware/authMiddleware');

// Check if functions are correctly imported
if (!getNotifications) {
    console.error("Error: getNotifications is not defined.");
}

// Get all notifications
router.get('/', protect, getNotifications);

// Mark notification as read
router.put('/:id/read', protect, markAsRead);

// Create a notification
router.post('/', protect, createNotification);

module.exports = router;
