const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const upload = require('../config/multer');

// Get user profile - protected route
router.get('/', authMiddleware.authenticate, profileController.getProfile);

// Update user profile - protected route
router.put('/update', authMiddleware.authenticate, profileController.updateProfile);

// Update profile picture - protected route
router.post('/upload-picture', authMiddleware.authenticate, upload.single('profilePicture'), profileController.updateProfilePicture);

// Toggle availability status - protected route
router.post('/toggle-availability', authMiddleware.authenticate, profileController.toggleAvailability);

module.exports = router;
