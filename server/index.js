require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load configuration
const { PORT = 3000, MONGODB_URI, NODE_ENV = 'development' } = process.env;

// Initialize Express app
const app = express();

// Apply middleware
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(bodyParser.json());

// Import routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

// Apply routes
app.use('/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the application
startServer().catch(console.error);

module.exports = app; // Export for testing
