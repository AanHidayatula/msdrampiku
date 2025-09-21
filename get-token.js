const axios = require('axios');
const dramaboxHelper = require('./dramaboxHelper');

class TokenManager {
  constructor() {
    this.currentToken = null;
    this.currentDeviceId = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
  }

  // Get authentication token dari DramaBox Token URL
  async getToken(force = false) {
    try {
      const now = Date.now();
      
      // Jika token masih valid dan tidak dipaksa refresh, return yang ada
      if (!force && this.isTokenValid()) {
        return {
          success: true,
          token: this.currentToken,
          deviceId: this.currentDeviceId,
          expiresAt: this.tokenExpiry
        };
      }

      // Jika sudah ada proses refresh yang berjalan, tunggu
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }

      // Mulai proses refresh token
      this.refreshPromise = this._fetchNewToken();
      const result = await this.refreshPromise;
      this.refreshPromise = null;

      return result;
    } catch (error) {
      this.refreshPromise = null;
      console.error('Token fetch error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Internal method untuk fetch token baru dari DRAMABOX_TOKEN_URL
  async _fetchNewToken() {
    try {
      const tokenUrl = process.env.DRAMABOX_TOKEN_URL;
      
      if (!tokenUrl) {
        throw new Error('DRAMABOX_TOKEN_URL environment variable is not set');
      }

      console.log('Fetching new token from:', tokenUrl);
      
      const response = await axios.get(tokenUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'DramaBox-API-Client/1.0.0'
        }
      });
      
      const data = response.data;
      
      if (!data?.token || !data?.deviceid) {
        throw new Error('Invalid token response: missing token or deviceid');
      }
      
      // Set token dan device ID
      this.currentToken = data.token;
      this.currentDeviceId = data.deviceid;
      this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Update helper dengan token baru
      dramaboxHelper.setToken(this.currentToken, this.currentDeviceId);
      
      return {
        success: true,
        token: this.currentToken,
        deviceId: this.currentDeviceId,
        expiresAt: this.tokenExpiry
      };
      
    } catch (error) {
      console.error('Error fetching token:', error.message);
      throw new Error(`Failed to fetch token: ${error.message}`);
    }
  }

  // Check if current token is still valid
  isTokenValid() {
    return this.currentToken && 
           this.currentDeviceId &&
           this.tokenExpiry && 
           new Date() < new Date(this.tokenExpiry.getTime() - 60000); // 1 minute buffer
  }

  // Manually set token (untuk testing atau external token management)
  setToken(token, deviceId, expiresIn = 3600) {
    this.currentToken = token;
    this.currentDeviceId = deviceId;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    dramaboxHelper.setToken(token, deviceId);
    
    return {
      success: true,
      token: this.currentToken,
      deviceId: this.currentDeviceId,
      expiresAt: this.tokenExpiry
    };
  }

  // Clear current token
  clearToken() {
    this.currentToken = null;
    this.currentDeviceId = null;
    this.tokenExpiry = null;
    dramaboxHelper.setToken(null, null);
  }

  // Get token information
  getTokenInfo() {
    return {
      hasToken: !!this.currentToken,
      hasDeviceId: !!this.currentDeviceId,
      isValid: this.isTokenValid(),
      expiresAt: this.tokenExpiry,
      tokenPreview: this.currentToken ? `${this.currentToken.substring(0, 20)}...` : null
    };
  }
}

// Export singleton instance
module.exports = new TokenManager();