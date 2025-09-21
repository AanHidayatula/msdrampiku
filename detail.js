const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/detail/:id - Get basic detail information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'drama' } = req.query; // drama, chapter, user, etc.
    
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
    
    // Get detail based on type
    let result;
    switch (type) {
      case 'drama':
        result = await dramaboxHelper.getDramaDetails(id);
        break;
      default:
        // Mock detail data for other types
        result = {
          success: true,
          data: {
            id,
            type,
            title: `${type} ${id}`,
            description: `Description for ${type} ${id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
    }
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          id,
          type,
          ...result.data
        },
        'Detail information retrieved successfully'
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to retrieve detail information'
      ));
    }
  } catch (error) {
    console.error('Error getting detail:', error);
    
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
        'Failed to retrieve detail information'
      ));
    }
  }
});

// GET /api/detail/:id/summary - Get summary of detail information
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock summary data
    const summary = {
      id,
      title: `Item ${id}`,
      shortDescription: 'Brief summary...',
      thumbnail: `https://example.com/thumbs/${id}.jpg`,
      rating: 4.5,
      views: 12345,
      status: 'active'
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      summary,
      'Summary retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve summary'
    ));
  }
});

// POST /api/detail/:id/update - Update detail information (admin only)
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate authorization (mock check)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Authorization header required'
      ));
    }
    
    // Mock update operation
    const updatedDetail = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      updatedDetail,
      'Detail updated successfully'
    ));
  } catch (error) {
    console.error('Error updating detail:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to update detail'
    ));
  }
});

module.exports = router;