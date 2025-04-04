const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
//const donorStatusController = require('../controllers/donorStatusController'); // Fix import
const authMiddleware = require('../middlewares/authMiddleware');
const donorStatusController = require('../controllers/DonorStatusController');

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

module.exports = router;
