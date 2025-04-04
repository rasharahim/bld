require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donorStatusRoutes = require('./routes/donorStatusRoutes'); 
const donorController = require("./controllers/donorController");
const receiverRoutes = require('./routes/receiverRoutes');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🛠 Registering Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donor-status', donorStatusRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'config/uploads')));

// 🩸 Accept Blood Request Route (Ensure it's in donorRoutes)
app.post('/api/donors/accept-request', require('./controllers/DonorStatusController').acceptBloodRequest);
app.post("/api/donors/createDonor", donorController.createDonor);

// ✅ Test DB connection
async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log('Connected to database as ID', connection.threadId);
    connection.release();

    // ✅ Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`CORS configured for: ${corsOptions.origin}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  }
}

// ✅ Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ❌ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🔒' : err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ❌ 404 Handler (should be last route)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start the server
startServer();
