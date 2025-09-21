const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import routes
const tokenRoute = require('./token');
const chapterRoute = require('./chapter');
const clientRoute = require('./client');
const detailRoute = require('./detail');
const detailsRoute = require('./details');
const dramaRoute = require('./drama');
const searchRoute = require('./search');
const getTokenRoute = require('./get-dramabox-token');

const app = express();
const PORT = process.env.PORT || 3000; // Vercel default port

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/token', tokenRoute);
app.use('/api/chapter', chapterRoute);
app.use('/api/client', clientRoute);
app.use('/api/detail', detailRoute);
app.use('/api/details', detailsRoute);
app.use('/api/drama', dramaRoute);
app.use('/api/search', searchRoute);
app.use('/get-token', getTokenRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'DramaBox API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DramaBox API Server',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/token - Get authentication token',
      'GET /api/chapter/:bookId - Get chapter data',
      'GET /api/client - Client information',
      'GET /api/detail/:id - Get detail data',
      'GET /api/details/:id - Get detailed information',
      'GET /api/drama/:id - Get drama data',
      'GET /api/search - Search functionality'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DramaBox API Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;