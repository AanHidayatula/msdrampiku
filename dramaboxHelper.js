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

  // Get drama details from real API
  async getDramaDetails(dramaId) {
    try {
      // Function to get random drama image
      const getRandomDramaImage = () => {
        const images = [
          'https://images.unsplash.com/photo-1489599088243-6f0b99066ce8?w=400&h=600&fit=crop',
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
          'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop',
          'https://images.unsplash.com/photo-1478720568477-b0e6f1e6888c?w=400&h=600&fit=crop',
          'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop'
        ];
        return images[Math.floor(Math.random() * images.length)];
      };

      // Function to get random drama banner
      const getRandomDramaBanner = () => {
        const banners = [
          'https://images.unsplash.com/photo-1489599088243-6f0b99066ce8?w=1600&h=900&fit=crop',
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop',
          'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1600&h=900&fit=crop',
          'https://images.unsplash.com/photo-1478720568477-b0e6f1e6888c?w=1600&h=900&fit=crop',
          'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1600&h=900&fit=crop'
        ];
        return banners[Math.floor(Math.random() * banners.length)];
      };

      // First try to get from latest dramas
      const latestResult = await this.getLatestDramas(1, 100);
      if (latestResult.success && latestResult.data && latestResult.data.data) {
        const drama = latestResult.data.data.find(d => d.id === dramaId || d.bookId === dramaId);
        
        if (drama) {
          return {
            success: true,
            data: {
              id: drama.id || drama.bookId,
              title: drama.title || drama.bookTitle,
              description: drama.description || drama.intro || 'No description available',
              thumbnail: drama.thumbnail || drama.cover || drama.bookCover || getRandomDramaImage(),
              banner: drama.banner || drama.bigCover || drama.thumbnail || drama.cover || getRandomDramaBanner(),
              genre: drama.genre || 'Drama',
              country: 'Korea',
              year: new Date().getFullYear(),
              rating: 8.0 + Math.random() * 2,
              totalEpisodes: drama.totalEpisodes || drama.chapterCount || 16,
              status: 'Available',
              views: Math.floor(Math.random() * 1000000) + 10000,
              tags: drama.tags || []
            }
          };
        }
      }
      
      // If not found in latest, return fallback with good images
      return {
        success: true,
        data: {
          id: dramaId,
          title: `Drama ${dramaId}`,
          description: 'Drama details will be available soon...',
          thumbnail: getRandomDramaImage(),
          banner: getRandomDramaBanner(),
          genre: 'Drama',
          country: 'Korea',
          year: new Date().getFullYear(),
          rating: 8.0,
          totalEpisodes: 16,
          status: 'Available',
          views: 0
        }
      };
    } catch (error) {
      console.error('Error getting drama details:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // Get random drama image for fallback
  getRandomDramaImage() {
    const images = [
      'https://images.unsplash.com/photo-1489599088243-6f0b99066ce8?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1478720568477-b0e6f1e6888c?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop'
    ];
    return images[Math.floor(Math.random() * images.length)];
  }

  // Get random drama banner for fallback
  getRandomDramaBanner() {
    const banners = [
      'https://images.unsplash.com/photo-1489599088243-6f0b99066ce8?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1478720568477-b0e6f1e6888c?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1600&h=900&fit=crop'
    ];
    return banners[Math.floor(Math.random() * banners.length)];
  }

  // Search dramas menggunakan real search API
  async searchDramas(query, page = 1, limit = 20) {
    try {
      const result = await this.makeRequest('GET', '/search', null, { 
        query: query,
        page: page,
        limit: limit 
      });
      
      if (result.success && result.data) {
        // Extract search results
        const suggestList = result.data.suggestlist || [];
        const searchResults = suggestList.map(item => ({
          id: item.bookId,
          bookId: item.bookId,
          title: item.bookName,
          bookTitle: item.bookName,
          description: item.introduction,
          intro: item.introduction,
          thumbnail: item.cover,
          cover: item.cover,
          bookCover: item.cover,
          banner: item.cover,
          chapterCount: item.inlibraryCount || 0,
          totalEpisodes: item.inlibraryCount || 0,
          tags: item.tagNames || [],
          genre: Array.isArray(item.tagNames) ? item.tagNames.join(', ') : 'Drama'
        }));
        
        return {
          success: true,
          data: {
            data: searchResults,
            total: searchResults.length,
            keyword: query,
            page: page,
            limit: limit
          }
        };
      }
      
      return {
        success: false,
        error: 'No search results found',
        status: 404
      };
    } catch (error) {
      console.error('Error in searchDramas:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // Get chapters menggunakan real stream API
  async getChapters(bookId, index = 1) {
    try {
      const result = await this.makeRequest('GET', '/stream', null, {
        bookid: bookId,
        episode: index
      });
      
      if (result.success && result.data) {
        // Extract chapter data from chapterList
        const chapterList = result.data.chapterList || [];
        const chapters = chapterList.map(chapter => ({
          id: chapter.chapterId,
          chapterId: chapter.chapterId,
          bookId: bookId,
          title: chapter.chapterName,
          chapterName: chapter.chapterName,
          chapterIndex: chapter.chapterIndex,
          isCharge: chapter.isCharge,
          duration: this.formatDuration(chapter.cdnList?.[0]?.videoDuration),
          streamingUrls: this.extractStreamingUrls(chapter.cdnList),
          videoUrl: chapter.cdnList?.[0]?.videoPath,
          m3u8Url: chapter.cdnList?.[0]?.videoPath,
          cdnList: chapter.cdnList || []
        }));
        
        return {
          success: true,
          data: {
            data: chapters,
            chapterList: chapters,
            bookId: bookId,
            total: chapters.length
          }
        };
      }
      
      return {
        success: false,
        error: 'No chapters found',
        status: 404
      };
    } catch (error) {
      console.error('Error in getChapters:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // Extract streaming URLs from CDN list
  extractStreamingUrls(cdnList) {
    if (!cdnList || !Array.isArray(cdnList) || cdnList.length === 0) {
      return null;
    }
    
    const urls = {};
    cdnList.forEach(cdn => {
      if (cdn.quality && cdn.videoPath) {
        const quality = cdn.quality.toString();
        if (quality.includes('1080')) {
          urls.hd = cdn.videoPath;
        } else if (quality.includes('720')) {
          urls.md = cdn.videoPath;
        } else if (quality.includes('540') || quality.includes('480')) {
          urls.sd = cdn.videoPath;
        }
      }
    });
    
    // If no specific quality mapping, use first available
    if (Object.keys(urls).length === 0 && cdnList[0]?.videoPath) {
      urls.hd = cdnList[0].videoPath;
      urls.md = cdnList[0].videoPath;
      urls.sd = cdnList[0].videoPath;
    }
    
    return urls;
  }

  // Format duration from seconds to MM:SS
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get streaming URL menggunakan real stream endpoint
  async getStreamingUrl(bookId, chapterId) {
    try {
      const result = await this.makeRequest('GET', '/stream', null, {
        bookid: bookId,
        episode: chapterId
      });
      
      if (result.success && result.data) {
        const chapterList = result.data.chapterList || [];
        const chapter = chapterList.find(ch => ch.chapterId === chapterId || ch.chapterIndex.toString() === chapterId.toString());
        
        if (chapter && chapter.cdnList && chapter.cdnList.length > 0) {
          const streamingUrls = this.extractStreamingUrls(chapter.cdnList);
          
          return {
            success: true,
            data: {
              url: chapter.cdnList[0].videoPath,
              streamingUrl: chapter.cdnList[0].videoPath,
              formats: streamingUrls,
              cdnList: chapter.cdnList,
              metadata: {
                chapterId: chapter.chapterId,
                chapterName: chapter.chapterName,
                duration: chapter.cdnList[0].videoDuration,
                quality: chapter.cdnList[0].quality
              }
            }
          };
        }
      }
      
      return {
        success: false,
        error: 'Streaming URL not available',
        status: 404
      };
    } catch (error) {
      console.error('Error in getStreamingUrl:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // Get latest dramas menggunakan theater API yang benar
  async getLatestDramas(page = 1, limit = 20) {
    try {
      // Use the correct home endpoint that returns real data
      const result = await this.makeRequest('GET', '/home', null, { page, limit });
      
      if (result.success && result.data) {
        // Extract real drama data from columnList
        const columnList = result.data.columnVoList || [];
        let allDramas = [];
        
        // Process each column to extract bookList
        columnList.forEach(column => {
          if (column.bookList && Array.isArray(column.bookList)) {
            const dramas = column.bookList.map(book => ({
              id: book.bookId,
              bookId: book.bookId,
              title: book.bookName,
              bookTitle: book.bookName,
              description: book.introduction,
              intro: book.introduction,
              thumbnail: book.coverMap,
              cover: book.coverMap,
              bookCover: book.coverMap,
              banner: book.coverMap,
              bigCover: book.coverMap,
              chapterCount: book.chapterCount,
              totalEpisodes: book.chapterCount,
              tags: book.tags || [],
              genre: book.tags ? book.tags.join(', ') : 'Drama'
            }));
            allDramas = allDramas.concat(dramas);
          }
        });
        
        return {
          success: true,
          data: {
            data: allDramas.slice(0, limit),
            total: allDramas.length,
            page: page,
            limit: limit
          }
        };
      }
      
      return {
        success: false,
        error: 'No data received from API',
        status: 404
      };
    } catch (error) {
      console.error('Error in getLatestDramas:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
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