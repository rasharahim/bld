const express = require("express");
const router = express.Router();
const donorStatusController = require("../controllers/DonorStatusController.js");



// Get all donors (for admin)
router.get("/donors", donorStatusController.getAllDonors);

// Get donors by status (new route)
//router.get("/donors/status", donorStatusController.getAllDonors);


// Update donor status (approve/reject)
router.put("/donors/:id", donorStatusController.updateDonorStatus);

// Get all pending donors (for admin)
router.get("/donors/pending", donorStatusController.getPendingDonors);


module.exports = router;
