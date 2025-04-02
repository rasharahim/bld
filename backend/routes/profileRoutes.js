const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

// Route to get user profile
router.get('/', getProfile);

// Route to update user profile
router.put('/update', updateProfile);

module.exports = router;
