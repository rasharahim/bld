const db = require('../config/db');
const multer = require('../config/multer'); // Import multer configuration
const BASE_URL = "http://localhost:5000"; // Change this to your actual backend URL

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Ensure consistency with authMiddleware
        console.log("Decoded User:", req.user);

        // Get user details
        const [rows] = await db.query(`
            SELECT 
                u.id, u.fullName, u.phoneNumber, u.email, u.role, u.created_at,
                ud.date_of_birth, ud.blood_type, ud.profile_picture,
                da.is_available, da.last_donation_date
            FROM users u
            LEFT JOIN user_details ud ON u.id = ud.user_id
            LEFT JOIN donor_availability da ON u.id = da.user_id
            WHERE u.id = ?
        `, [userId]);

        // If user not found
        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let userData = rows[0];

        // If profile_picture exists, prepend BASE_URL
        if (userData.profile_picture) {
            userData.profile_picture = `${BASE_URL}${userData.profile_picture}`;
        }

        // Get user activities
        const [activities] = await db.query(`
            SELECT * FROM activities 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        res.json({ user: userData, activities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, date_of_birth, blood_type } = req.body;
        let profilePicture = null;

        // Check if a file is uploaded
        if (req.file) {
            profilePicture = `/uploads/${req.file.filename}`; // Save relative path
        }

        // Update users table
        await db.query(`
            UPDATE users 
            SET fullName = ?, phoneNumber = ? 
            WHERE id = ?
        `, [fullName, phoneNumber, userId]);

        // Update user_details table
        await db.query(`
            INSERT INTO user_details (user_id, date_of_birth, blood_type, profile_picture)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            date_of_birth = VALUES(date_of_birth),
            blood_type = VALUES(blood_type),
            profile_picture = COALESCE(VALUES(profile_picture), profile_picture)
        `, [userId, date_of_birth, blood_type, profilePicture]);

        res.json({ message: 'Profile updated successfully', profilePicture });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// EXPORT FUNCTIONS
module.exports = {
    getProfile,
    updateProfile
};
