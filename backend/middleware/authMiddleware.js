const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    try {
        // Extract token (Remove "Bearer " prefix if present)
        const formattedToken = token.replace("Bearer ", "").trim();
        
        // Verify JWT
        const decoded = jwt.verify(formattedToken, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);


        // Ensure the payload matches expected format
        if (!decoded.userId) {
            return res.status(400).json({ message: "Invalid token: userId missing" });
        }

        // Attach user info to request
        req.user = { id: decoded.userId, role: decoded.role, bloodType: decoded.bloodType };

        next(); // Proceed to next middleware
    } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ message: "Invalid or Expired Token" });
    }
};

module.exports = authMiddleware;
