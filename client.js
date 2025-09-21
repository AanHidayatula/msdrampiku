const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/client - Get client information and configuration
router.get('/', async (req, res) => {
  try {
    const clientInfo = {
      name: 'DramaBox API Client',
      version: '1.0.0',
      apiVersion: 'v1',
      supportedFeatures: [
        'authentication',
        'drama_search',
        'chapter_streaming',
        'user_interactions',
        'analytics_tracking'
      ],
      endpoints: {
        authentication: '/api/token',
        search: '/api/search',
        dramas: '/api/drama',
        chapters: '/api/chapter',
        details: '/api/detail',
        comprehensiveDetails: '/api/details'
      },
      status: 'operational',
      lastUpdated: new Date().toISOString()
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      clientInfo,
      'Client information retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting client info:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve client information'
    ));
  }
});

// GET /api/client/status - Get API status and health check
router.get('/status', async (req, res) => {
  try {
    const status = {
      api: 'operational',
      database: 'operational',
      authentication: 'operational',
      streaming: 'operational',
      search: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      performance: {
        responseTime: Math.random() * 100 + 50, // Mock response time in ms
        requestsPerSecond: Math.floor(Math.random() * 100) + 20
      }
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      status,
      'API status retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve API status'
    ));
  }
});

// POST /api/client/feedback - Submit client feedback
router.post('/feedback', async (req, res) => {
  try {
    const { type, message, rating, email, category } = req.body;
    
    // Validate required fields
    if (!type || !message) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Type and message are required'
      ));
    }
    
    // Rate limiting removed for better performance
    
    // Mock feedback storage
    const feedback = {
      id: `feedback_${Date.now()}`,
      type,
      message,
      rating: rating || null,
      email: email || null,
      category: category || 'general',
      timestamp: new Date().toISOString(),
      clientIp: clientIp,
      userAgent: req.get('User-Agent'),
      status: 'received'
    };
    
    res.status(201).json(dramaboxHelper.formatResponse(
      true,
      {
        feedbackId: feedback.id,
        status: feedback.status,
        message: 'Thank you for your feedback!'
      },
      'Feedback submitted successfully'
    ));
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many feedback submissions. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to submit feedback'
      ));
    }
  }
});

// GET /api/client/config - Get client configuration
router.get('/config', async (req, res) => {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    const config = {
      api: {
        baseURL: req.protocol + '://' + req.get('host'),
        version: 'v1',
        timeout: 30000,
        retryAttempts: 3
      },
      features: {
        search: {
          enabled: true,
          minQueryLength: 2,
          maxResults: 100,
          suggestionsEnabled: true
        },
        streaming: {
          enabled: isAuthenticated,
          supportedQualities: ['sd', 'hd', 'fhd'],
          maxConcurrentStreams: 3
        },
        authentication: {
          required: true,
          tokenExpiry: 3600,
          refreshEnabled: true
        },
        analytics: {
          enabled: true,
          trackViews: true,
          trackInteractions: true
        }
      },
      limits: {
        requestsPerMinute: 60,
        searchesPerMinute: 60,
        streamsPerMinute: 20,
        downloadSizeLimit: '100MB'
      },
      ui: {
        theme: 'default',
        language: 'en',
        pagination: {
          defaultSize: 20,
          maxSize: 100
        }
      },
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        maxSize: '50MB'
      }
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      config,
      'Client configuration retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve client configuration'
    ));
  }
});

// POST /api/client/log - Log client events for debugging
router.post('/log', async (req, res) => {
  try {
    const { level, message, data, source } = req.body;
    
    // Validate required fields
    if (!level || !message) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Level and message are required'
      ));
    }
    
    // Rate limiting removed for better performance
    
    // Mock log entry
    const logEntry = {
      id: `log_${Date.now()}`,
      level,
      message,
      data: data || {},
      source: source || 'client',
      timestamp: new Date().toISOString(),
      clientIp: clientIp,
      userAgent: req.get('User-Agent')
    };
    
    // Log to console (in production, send to logging service)
    console.log(`[CLIENT ${level.toUpperCase()}] ${message}`, data || '');
    
    res.json(dramaboxHelper.formatResponse(
      true,
      {
        logId: logEntry.id,
        status: 'logged'
      },
      'Log entry recorded successfully'
    ));
  } catch (error) {
    console.error('Error logging client event:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many log entries. Please reduce logging frequency.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to record log entry'
      ));
    }
  }
});

// GET /api/client/metrics - Get API usage metrics
router.get('/metrics', async (req, res) => {
  try {
    // Check authorization (mock admin check)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Authorization required'
      ));
    }
    
    // Mock metrics data
    const metrics = {
      requests: {
        total: 125000,
        successful: 118000,
        failed: 7000,
        successRate: 94.4
      },
      endpoints: {
        '/api/search': { requests: 45000, avgResponseTime: 120 },
        '/api/drama': { requests: 35000, avgResponseTime: 85 },
        '/api/chapter': { requests: 25000, avgResponseTime: 95 },
        '/api/token': { requests: 15000, avgResponseTime: 200 },
        '/api/detail': { requests: 5000, avgResponseTime: 75 }
      },
      users: {
        active: 1250,
        new: 89,
        returning: 1161
      },
      performance: {
        averageResponseTime: 105,
        p95ResponseTime: 350,
        errorRate: 5.6,
        uptime: 99.8
      },
      period: '24h',
      generatedAt: new Date().toISOString()
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      metrics,
      'API metrics retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve API metrics'
    ));
  }
});

module.exports = router;