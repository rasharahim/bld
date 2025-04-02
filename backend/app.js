const express = require('express');
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Added profile routes ✅

const app = express();

// CORS Middleware (Allow frontend connections)
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (Profile pictures, uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/notifications', notificationRoutes); // Notifications route
app.use('/api/profile', profileRoutes); // Profile-related routes ✅

// Global Error Handler (Better debugging)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
