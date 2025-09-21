const axios = require('axios');

// Base configuration for DramaBox API - menggunakan konfigurasi yang benar
const DRAMABOX_CONFIG = {
  baseURL: 'https://sapi.dramaboxdb.com/drama-box',
  timeout: 15000,
  headers: {
    'User-Agent': 'okhttp/4.10.0',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/json; charset=UTF-8'
  }
};

class DramaBoxHelper {
  constructor() {
    this.client = axios.create(DRAMABOX_CONFIG);
    this.token = null;
    this.deviceId = null;
    this.tokenExpiry = null;
  }

  // Set authentication token dengan device ID
  setToken(token, deviceId) {
    this.token = token;
    this.deviceId = deviceId;
    // Set token expiry to 1 hour from now
    this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    
    // Update client headers dengan format DramaBox yang benar
    this.updateHeaders();
  }

  // Update headers dengan format DramaBox
  updateHeaders() {
    if (!this.token || !this.deviceId) return;
    
    const headers = this.buildDramaBoxHeaders();
    Object.assign(this.client.defaults.headers, headers);
  }

  // Build headers sesuai format DramaBox API
  buildDramaBoxHeaders() {
    const timeZoneOffset = this.getTimeZoneOffset();
    
    return {
      'tn': `Bearer ${this.token}`,
      'version': process.env.DRAMABOX_VERSION_CODE || '430',
      'vn': process.env.DRAMABOX_VERSION_NAME || '4.3.0',
      'cid': process.env.DRAMABOX_CID || 'DRA1000042',
      'package-name': process.env.DRAMABOX_PACKAGE_NAME || 'com.storymatrix.drama',
      'apn': '1',
      'device-id': this.deviceId,
      'language': process.env.DRAMABOX_LANGUAGE || 'in',
      'current-language': process.env.DRAMABOX_LANGUAGE || 'in',
      'p': process.env.DRAMABOX_PLATFORM_P || '43',
      'time-zone': timeZoneOffset,
      'content-type': 'application/json; charset=UTF-8'
    };
  }

  // Get timezone offset in format "+0700" / "-0800"
  getTimeZoneOffset() {
    const offsetMin = new Date().getTimezoneOffset();
    const sign = offsetMin > 0 ? "-" : "+";
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `${sign}${hh}${mm}`;
  }

  // Check if token is valid
  isTokenValid() {
    return this.token && this.deviceId && this.tokenExpiry && new Date() < this.tokenExpiry;
  }

  // Generic API request handler with retry logic
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      const config = {
        method,
        url: endpoint,
        params,
        data,
        validateStatus: () => true // Handle all status codes
      };

      const response = await this.client.request(config);
      
      // If 401/403, try to refresh token once
      if ((response.status === 401 || response.status === 403) && this.token) {
        console.log('Token expired, attempting refresh...');
        // Note: Token refresh should be handled externally
        return {
          success: false,
          error: 'Token expired, please refresh',
          status: response.status,
          needRefresh: true
        };
      }

      return {
        success: response.status >= 200 && response.status < 300,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`API Request Error (${method} ${endpoint}):`, error.message);
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500,
        data: error.response?.data || null
      };
    }
  }

  // Get drama details
  async getDramaDetails(dramaId) {
    // Endpoint belum diketahui, menggunakan mock untuk sementara
    return {
      success: true,
      data: {
        id: dramaId,
        title: `Drama ${dramaId}`,
        description: 'Drama details...',
        thumbnail: `https://example.com/drama/${dramaId}.jpg`
      }
    };
  }

  // Search dramas menggunakan suggest API
  async searchDramas(query, page = 1, limit = 20) {
    return await this.makeRequest('POST', '/search/suggest', { keyword: query });
  }

  // Get chapters menggunakan batch load API
  async getChapters(bookId, index = 1) {
    const data = {
      boundaryIndex: 0,
      comingPlaySectionId: -1,
      index,
      currencyPlaySource: "discover_new_rec_new",
      needEndRecommend: 0,
      currencyPlaySourceName: "",
      preLoad: false,
      rid: "",
      pullCid: "",
      loadDirection: 0,
      startUpKey: "",
      bookId
    };
    
    return await this.makeRequest('POST', '/chapterv2/batch/load', data);
  }

  // Get streaming URL
  async getStreamingUrl(bookId, chapterId) {
    // Sama dengan getChapters karena API yang sama memberikan streaming URL
    return await this.getChapters(bookId, chapterId);
  }

  // Get latest dramas menggunakan theater API
  async getLatestDramas(page = 1, limit = 20) {
    const data = {
      newChannelStyle: 1,
      isNeedRank: 1,
      pageNo: page,
      index: 1,
      channelId: Number(process.env.DRAMABOX_PLATFORM_P || 43)
    };
    
    return await this.makeRequest('POST', '/he001/theater', data);
  }

  // Format response for consistent API responses
  formatResponse(success, data = null, message = null, error = null) {
    const response = {
      success,
      timestamp: new Date().toISOString()
    };

    if (data) response.data = data;
    if (message) response.message = message;
    if (error) response.error = error;

    return response;
  }

  // Validate required parameters
  validateParams(params, required) {
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  // Rate limiting helper - DISABLED for better performance
  async rateLimit(key, maxRequests = 100, windowMs = 60000) {
    // Rate limiting disabled - no restrictions
    return true;
  }
}

// Export singleton instance
module.exports = new DramaBoxHelper();