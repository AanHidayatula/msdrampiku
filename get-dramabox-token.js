const express = require('express');
const axios = require('axios');

const router = express.Router();

// GET /get-token - Generate DramaBox token and device ID
router.get('/', async (req, res) => {
  try {
    // Generate random device ID
    const deviceId = generateDeviceId();
    
    // Generate mock token (in production, this would call actual DramaBox API)
    const token = await generateDramaBoxToken(deviceId);
    
    res.json({
      success: true,
      token: token,
      deviceid: deviceId,
      timestamp: new Date().toISOString(),
      expiresIn: 3600 // 1 hour
    });
    
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

// Generate random device ID
function generateDeviceId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'device_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate DramaBox-compatible token
async function generateDramaBoxToken(deviceId) {
  try {
    // This is a mock token generator
    // In production, you would call actual DramaBox token API
    
    const mockToken = generateJWTLikeToken({
      device_id: deviceId,
      app_version: process.env.DRAMABOX_VERSION_NAME || '4.3.0',
      platform: 'android',
      cid: process.env.DRAMABOX_CID || 'DRA1000042',
      timestamp: Date.now(),
      expires: Date.now() + (3600 * 1000) // 1 hour
    });
    
    return mockToken;
    
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate DramaBox token');
  }
}

// Generate JWT-like token for DramaBox
function generateJWTLikeToken(payload) {
  // Mock JWT-like token (in production use proper JWT library)
  const header = Buffer.from(JSON.stringify({
    alg: "HS256",
    typ: "JWT"
  })).toString('base64');
  
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  // Mock signature
  const signature = Buffer.from('mock_signature_' + Date.now()).toString('base64');
  
  return `${header}.${payloadB64}.${signature}`;
}

// POST /get-token - Alternative endpoint for POST requests
router.post('/', async (req, res) => {
  try {
    // Same logic as GET but for POST requests
    const deviceId = generateDeviceId();
    const token = await generateDramaBoxToken(deviceId);
    
    res.json({
      success: true,
      token: token,
      deviceid: deviceId,
      timestamp: new Date().toISOString(),
      expiresIn: 3600
    });
    
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

module.exports = router;