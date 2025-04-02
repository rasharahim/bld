const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const profileController = require('../controllers/profileController');
const activityController = require('../controllers/activityController');
const upload = require('../config/multer');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure user is authenticated


console.log("Profile Controller:", profileController);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
// Add this test route
router.post('/test-admin-login', authController.testAdminLogin);

// Profile routes
router.get('/profile', authMiddleware, profileController.getProfile);
router.put('/profile', authMiddleware, profileController.updateProfile);
router.put('/update', authMiddleware, upload.single('profilePicture'), profileController.updateProfile);


// Activity routes
router.post('/activities/donate', authMiddleware, activityController.createDonation);
router.post('/activities/request', authMiddleware, upload.single('prescription'), activityController.createRequest);

module.exports = router;