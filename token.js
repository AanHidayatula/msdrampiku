const express = require('express');
const tokenManager = require('./get-token');
const dramaboxHelper = require('./dramaboxHelper');

const router = express.Router();

// GET /api/token - Get current token information
router.get('/', async (req, res) => {
  try {
    const tokenInfo = tokenManager.getTokenInfo();
    
    res.json(dramaboxHelper.formatResponse(
      true,
      tokenInfo,
      'Token information retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting token info:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve token information'
    ));
  }
});

// POST /api/token - Get or refresh authentication token
router.post('/', async (req, res) => {
  try {
    // Rate limiting removed for better performance
    
    // Untuk DramaBox API, tidak perlu credentials dari request body
    // Token didapat dari DRAMABOX_TOKEN_URL
    const result = await tokenManager.getToken();
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          token: result.token,
          deviceId: result.deviceId,
          expiresAt: result.expiresAt,
          type: 'Bearer'
        },
        'Token retrieved successfully'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to retrieve token'
      ));
    }
  } catch (error) {
    console.error('Error getting token:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many token requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to retrieve token'
      ));
    }
  }
});

// POST /api/token/refresh - Force refresh token
router.post('/refresh', async (req, res) => {
  try {
    // Force refresh token dari DRAMABOX_TOKEN_URL
    const result = await tokenManager.getToken(true); // force = true
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          token: result.token,
          deviceId: result.deviceId,
          expiresAt: result.expiresAt,
          type: 'Bearer'
        },
        'Token refreshed successfully'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Token refresh failed'
      ));
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to refresh token'
    ));
  }
});

// DELETE /api/token - Revoke/clear current token
router.delete('/', async (req, res) => {
  try {
    tokenManager.clearToken();
    
    res.json(dramaboxHelper.formatResponse(
      true,
      null,
      'Token cleared successfully'
    ));
  } catch (error) {
    console.error('Error clearing token:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to clear token'
    ));
  }
});

// POST /api/token/validate - Validate a token
router.post('/validate', async (req, res) => {
  try {
    const { token, deviceId } = req.body;
    
    if (!token) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Token is required'
      ));
    }
    
    // Set the token and check validity
    if (deviceId) {
      tokenManager.setToken(token, deviceId);
    }
    const isValid = tokenManager.isTokenValid();
    
    res.json(dramaboxHelper.formatResponse(
      true,
      {
        valid: isValid,
        tokenInfo: tokenManager.getTokenInfo()
      },
      isValid ? 'Token is valid' : 'Token is invalid or expired'
    ));
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to validate token'
    ));
  }
});

module.exports = router;