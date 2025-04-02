require('dotenv').config();
const cors = require('cors');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Allow frontend connections from multiple origins
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
