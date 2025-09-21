const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/details/:id - Get comprehensive detail information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include = 'basic' } = req.query; // basic, extended, full
    
    // Validate parameters
    if (!id) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'ID is required'
      ));
    }
    
    // Rate limiting removed for better performance
    
    // Ensure we have a valid token
    const tokenResult = await tokenManager.getToken();
    if (!tokenResult.success) {
      return res.status(401).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Authentication required'
      ));
    }
    
    // Build comprehensive details based on include parameter
    let details = {
      id,
      title: `Drama ${id}`,
      description: 'A comprehensive description of the drama...',
      thumbnail: `https://example.com/posters/${id}.jpg`,
      banner: `https://example.com/banners/${id}.jpg`
    };
    
    // Add more details based on include level
    if (include === 'extended' || include === 'full') {
      details = {
        ...details,
        metadata: {
          genre: ['Romance', 'Drama'],
          year: 2023,
          country: 'South Korea',
          language: 'Korean',
          duration: '16 episodes',
          status: 'Completed',
          rating: {
            average: 4.7,
            count: 15420
          }
        },
        cast: [
          { name: 'Actor 1', role: 'Main Lead', image: 'actor1.jpg' },
          { name: 'Actor 2', role: 'Female Lead', image: 'actor2.jpg' }
        ],
        crew: {
          director: 'Director Name',
          writer: 'Writer Name',
          producer: 'Producer Name'
        }
      };
    }
    
    if (include === 'full') {
      details = {
        ...details,
        statistics: {
          totalViews: 1250000,
          totalLikes: 45600,
          totalComments: 8900,
          averageWatchTime: '42:30',
          completionRate: 78.5
        },
        chapters: [
          { id: 1, title: 'Episode 1', duration: '45:30', views: 125000 },
          { id: 2, title: 'Episode 2', duration: '44:15', views: 120000 }
        ],
        related: [
          { id: 'related1', title: 'Similar Drama 1', thumbnail: 'thumb1.jpg' },
          { id: 'related2', title: 'Similar Drama 2', thumbnail: 'thumb2.jpg' }
        ],
        reviews: [
          { 
            user: 'user123', 
            rating: 5, 
            comment: 'Amazing drama!',
            date: '2023-10-15'
          }
        ]
      };
    }
    
    res.json(dramaboxHelper.formatResponse(
      true,
      details,
      'Comprehensive details retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting comprehensive details:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to retrieve comprehensive details'
      ));
    }
  }
});

// GET /api/details/:id/analytics - Get analytics data for the item
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y
    
    // Mock analytics data
    const analytics = {
      id,
      period,
      metrics: {
        views: {
          total: 125000,
          unique: 89000,
          trend: '+12.5%'
        },
        engagement: {
          likes: 4560,
          comments: 890,
          shares: 234,
          averageRating: 4.7
        },
        demographics: {
          ageGroups: {
            '18-24': 35,
            '25-34': 40,
            '35-44': 20,
            '45+': 5
          },
          countries: {
            'US': 40,
            'KR': 25,
            'JP': 15,
            'Others': 20
          }
        },
        watchTime: {
          average: '42:30',
          completion: 78.5,
          dropOffPoints: ['15:30', '28:45']
        }
      },
      generatedAt: new Date().toISOString()
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      analytics,
      'Analytics data retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve analytics data'
    ));
  }
});

// POST /api/details/:id/interaction - Record user interaction
router.post('/:id/interaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, data } = req.body; // type: view, like, comment, share, etc.
    
    // Validate parameters
    dramaboxHelper.validateParams({ type }, ['type']);
    
    // Rate limiting removed for better performance
    
    // Mock interaction recording
    const interaction = {
      id,
      type,
      data,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: clientIp
    };
    
    // Process different interaction types
    let response = { recorded: true };
    
    switch (type) {
      case 'view':
        response.message = 'View recorded';
        break;
      case 'like':
        response.message = 'Like recorded';
        response.newTotal = Math.floor(Math.random() * 10000) + 1000;
        break;
      case 'comment':
        response.message = 'Comment recorded';
        response.commentId = `comment_${Date.now()}`;
        break;
      default:
        response.message = 'Interaction recorded';
    }
    
    res.json(dramaboxHelper.formatResponse(
      true,
      response,
      'Interaction recorded successfully'
    ));
  } catch (error) {
    console.error('Error recording interaction:', error);
    
    if (error.message.includes('Missing required parameters')) {
      res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        error.message
      ));
    } else if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many interactions. Please slow down.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to record interaction'
      ));
    }
  }
});

module.exports = router;