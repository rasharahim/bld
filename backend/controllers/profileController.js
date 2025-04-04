const db = require('../config/db');
const multer = require('../config/multer'); // Import multer configuration
const BASE_URL = "http://localhost:5000"; // Change this to your actual backend URL

const profileController = {
    // Get user profile
    getProfile: async (req, res) => {
        try {
            console.log('Profile request received:', {
                headers: req.headers,
                user: req.user,
                method: req.method,
                path: req.path
            });

            if (!req.user || !req.user.id) {
                console.error('No user ID found in request');
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const userId = req.user.id;
            console.log('Fetching profile for user ID:', userId);

            // First, check if user exists
            const [userExists] = await db.execute(
                'SELECT id FROM users WHERE id = ?',
                [userId]
            );

            if (userExists.length === 0) {
                console.error('User not found in database:', userId);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user profile data
            const [rows] = await db.execute(
                `SELECT 
                    u.id,
                    u.full_name as fullName,
                    u.email,
                    u.phone_number as contactNumber,
                    u.dob as dateOfBirth,
                    u.blood_type as bloodType,
                    u.profile_picture as profilePicture,
                    u.is_available as isAvailable,
                    u.created_at as createdAt
            FROM users u
                WHERE u.id = ?`,
                [userId]
            );

        if (rows.length === 0) {
                console.error('No profile data found for user:', userId);
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            const user = rows[0];
            
            // Calculate age from date of birth
            if (user.dateOfBirth) {
                const dob = new Date(user.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                user.age = age;
            }

            // Format profile picture URL if exists
            if (user.profilePicture) {
                user.profilePicture = `${BASE_URL}/uploads/profile-pictures/${user.profilePicture}`;
            }

            console.log('Profile data retrieved successfully:', user);
            
            res.json({
                success: true,
                profile: user
            });

        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching profile',
                error: error.message
            });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                fullName,
                contactNumber,
                dateOfBirth,
                bloodType,
                isAvailable,
                location_lat,
                location_lng,
                address
            } = req.body;

            console.log('Update profile request:', {
                userId,
                body: req.body
            });

            // Validate blood type if provided
            if (bloodType) {
                const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                if (!validBloodTypes.includes(bloodType)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid blood type'
                    });
                }
            }

            // Validate date of birth if provided
            if (dateOfBirth) {
                const dobDate = new Date(dateOfBirth);
                if (isNaN(dobDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid date of birth format'
                    });
                }

                const today = new Date();
                const age = today.getFullYear() - dobDate.getFullYear();
                
                if (age < 18 || age > 65) {
                    return res.status(400).json({
                        success: false,
                        message: 'Age must be between 18 and 65 years'
                    });
                }
            }

            // Build update query dynamically
            let updateFields = [];
            let queryParams = [];

            if (fullName !== undefined) {
                updateFields.push('full_name = ?');
                queryParams.push(fullName);
            }
            if (contactNumber !== undefined) {
                if (contactNumber && !/^\+?[\d\s-()]+$/.test(contactNumber)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid phone number format'
                    });
                }
                updateFields.push('phone_number = ?');
                queryParams.push(contactNumber);
            }
            if (dateOfBirth !== undefined) {
                updateFields.push('dob = ?');
                queryParams.push(dateOfBirth);
            }
            if (bloodType !== undefined) {
                updateFields.push('blood_type = ?');
                queryParams.push(bloodType);
            }
            if (typeof isAvailable === 'boolean') {
                updateFields.push('is_available = ?');
                queryParams.push(isAvailable);
            }
            if (location_lat !== undefined && location_lng !== undefined) {
                if (location_lat === null && location_lng === null) {
                    updateFields.push('location_lat = NULL');
                    updateFields.push('location_lng = NULL');
                } else {
                    updateFields.push('location_lat = ?');
                    updateFields.push('location_lng = ?');
                    queryParams.push(parseFloat(location_lat));
                    queryParams.push(parseFloat(location_lng));
                }
            }
            if (address !== undefined) {
                updateFields.push('address = ?');
                queryParams.push(address);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            queryParams.push(userId);

            const query = `
                UPDATE users 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            console.log('Executing update query:', {
                query,
                params: queryParams
            });

            const [result] = await db.execute(query, queryParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            // Fetch and return updated profile
            const [updated] = await db.execute(
                `SELECT 
                    id, full_name as fullName, email, 
                    phone_number as contactNumber,
                    dob as dateOfBirth, blood_type as bloodType,
                    profile_picture as profilePicture, 
                    is_available as isAvailable,
                    location_lat, location_lng, address,
                    created_at, updated_at,
                    TIMESTAMPDIFF(YEAR, dob, CURDATE()) as age
                FROM users 
                WHERE id = ?`,
                [userId]
            );

            if (updated[0].profilePicture) {
                updated[0].profilePicture = `${BASE_URL}/uploads/profile-pictures/${updated[0].profilePicture}`;
            }

            console.log('Profile updated successfully:', updated[0]);

            res.json({
                success: true,
                profile: updated[0]
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    },

    // Toggle availability status
    toggleAvailability: async (req, res) => {
    try {
        const userId = req.user.id;

            // Get current availability status
            const [currentStatus] = await db.execute(
                'SELECT is_available FROM users WHERE id = ?',
                [userId]
            );

            if (currentStatus.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const newStatus = !currentStatus[0].is_available;

            // Update availability status
            const [result] = await db.execute(
                'UPDATE users SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, userId]
            );

            res.json({
                success: true,
                message: `You are now ${newStatus ? 'available' : 'unavailable'} as a donor`,
                isAvailable: newStatus
            });

        } catch (error) {
            console.error('Error toggling availability:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle availability status',
                error: error.message
            });
        }
    },

    // Update profile picture
    updateProfilePicture: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const userId = req.user.id;
            const profilePicture = req.file.filename;

            const [result] = await db.execute(
                'UPDATE users SET profile_picture = ? WHERE id = ?',
                [profilePicture, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile picture updated successfully',
                profilePicture: `${BASE_URL}/uploads/profile-pictures/${profilePicture}`
            });

        } catch (error) {
            console.error('Error updating profile picture:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile picture',
                error: error.message
            });
        }
    }
};

module.exports = profileController;