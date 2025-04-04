const db = require("../config/db");
const Donor = require("../models/User"); // Ensure this correctly references the Donor model

// ✅ Get all donors (with optional status filter)
const getAllDonors = async (req, res) => {
    try {
        const { status } = req.query; // Example: ?status=approved

        let donors;
        if (status) {
            donors = await Donor.findAll({ where: { status } }); // Filter by status
        } else {
            donors = await Donor.findAll(); // Get all donors
        }

        res.json(donors);
    } catch (error) {
        console.error("Error fetching donors:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Get donors by status (using SQL)
const getDonorsByStatus = (req, res) => {
    const { filter } = req.query; // Example: ?filter=approved

    if (!["pending", "approved", "rejected"].includes(filter)) {
        return res.status(400).json({ error: "Invalid status filter" });
    }

    const sql = "SELECT * FROM donors WHERE status = ?";
    db.query(sql, [filter], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// ✅ Update donor status (approve/reject)
const updateDonorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const donor = await Donor.findByPk(id);
        if (!donor) {
            return res.status(404).json({ error: "Donor not found" });
        }

        donor.status = status;
        await donor.save();

        res.json({ message: `Donor status updated to ${status}` });
    } catch (error) {
        console.error("Error updating donor status:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Get all pending donors (status = "pending")
const getPendingDonors = (req, res) => {
    const sql = "SELECT * FROM donors WHERE status = 'pending'";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// ✅ Accept blood request (donor accepts a request)
const acceptBloodRequest = async (req, res) => {
    const { donorId, requestId } = req.body;

    try {
        // Fetch request & donor details
        const request = await queryAsync("SELECT * FROM blood_requests WHERE id = ?", [requestId]);
        const donor = await queryAsync("SELECT * FROM donors WHERE id = ?", [donorId]);

        // Validate request & donor existence
        if (!request.length || !donor.length) {
            return res.status(404).json({ error: "Donor or request not found" });
        }

        const receiverContact = request[0].contact_number;
        const donorContact = donor[0].contact_number;

        // Notify the receiver
        await queryAsync(
            "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
            [request[0].user_id, `Your blood request has been accepted by ${donor[0].full_name}. Contact: ${donorContact}`]
        );

        // Notify the donor
        await queryAsync(
            "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
            [donor[0].user_id, `You accepted a blood request from ${request[0].patientName}. Contact: ${receiverContact}`]
        );

        res.json({ message: "Request accepted, contact details shared." });

    } catch (error) {
        console.error("Error accepting blood request:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ✅ Export functions properly
module.exports = {
    getAllDonors,
    getDonorsByStatus,
    updateDonorStatus,
    getPendingDonors,
    acceptBloodRequest,
};
