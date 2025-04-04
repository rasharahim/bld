const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
    authenticate: async (req, res, next) => {
        try {
            // Log headers for debugging
            console.log('Auth Headers:', req.headers);
            
            // Get token from header
            const authHeader = req.header('Authorization');
            console.log('Auth Header received:', authHeader); // Debug log
            
            if (!authHeader) {
                console.log('No Authorization header found');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access denied. No token provided.' 
                });
            }

            // Extract token
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            console.log('Token extracted:', token.substring(0, 20) + '...'); // Debug log - only show first 20 chars

            if (!token) {
                console.log('No token found in Authorization header');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access denied. No token provided.' 
                });
            }

            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('Token decoded successfully:', { userId: decoded.id }); // Debug log
                
                // Add user info to request
                req.user = decoded;
                next();
            } catch (jwtError) {
                console.error('JWT Verification failed:', jwtError);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token.',
                    error: jwtError.message
                });
            }
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: error.message
            });
        }
    },

    authorizeAdmin: (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated.' 
            });
        }
        
        if (!req.user.is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin rights required.' 
            });
        }
        next();
    }
};

module.exports = authMiddleware; 