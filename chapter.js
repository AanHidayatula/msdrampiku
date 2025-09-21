const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/chapter/:bookId - Get chapters for a specific book/drama
router.get('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate parameters
    if (!bookId) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Book ID is required'
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
    
    // Get chapters
    const result = await dramaboxHelper.getChapters(bookId, parseInt(page));
    
    if (result.success) {
      // Process and format chapter data
      const formattedData = {
        bookId,
        chapters: result.data?.chapters || [],
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          total: result.data?.total || 0,
          totalPages: Math.ceil((result.data?.total || 0) / parseInt(limit))
        },
        metadata: {
          bookTitle: result.data?.bookTitle,
          totalChapters: result.data?.totalChapters
        }
      };
      
      res.json(dramaboxHelper.formatResponse(
        true,
        formattedData,
        'Chapters retrieved successfully'
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to retrieve chapters'
      ));
    }
  } catch (error) {
    console.error('Error getting chapters:', error);
    
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
        'Failed to retrieve chapters'
      ));
    }
  }
});

// GET /api/chapter/:bookId/:chapterId - Get specific chapter details
router.get('/:bookId/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    
    // Validate parameters
    dramaboxHelper.validateParams({ bookId, chapterId }, ['bookId', 'chapterId']);
    
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
    
    // Mock chapter detail retrieval (replace with actual API call)
    const chapterDetail = {
      bookId,
      chapterId,
      title: `Chapter ${chapterId}`,
      content: 'Chapter content would be here...',
      duration: '25:30',
      thumbnail: `https://example.com/thumbnails/${bookId}/${chapterId}.jpg`,
      streamingUrls: {
        hd: `https://stream.example.com/hd/${bookId}/${chapterId}.m3u8`,
        md: `https://stream.example.com/md/${bookId}/${chapterId}.m3u8`,
        sd: `https://stream.example.com/sd/${bookId}/${chapterId}.m3u8`
      },
      subtitles: [
        { language: 'en', url: `https://subs.example.com/${bookId}/${chapterId}/en.vtt` },
        { language: 'id', url: `https://subs.example.com/${bookId}/${chapterId}/id.vtt` }
      ]
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      chapterDetail,
      'Chapter details retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting chapter details:', error);
    
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
        'Too many requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to retrieve chapter details'
      ));
    }
  }
});

// POST /api/chapter/:bookId/:chapterId/stream - Get streaming URL for a chapter
router.post('/:bookId/:chapterId/stream', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const { quality = 'hd' } = req.body;
    
    // Validate parameters
    dramaboxHelper.validateParams({ bookId, chapterId }, ['bookId', 'chapterId']);
    
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
    
    // Get streaming URL
    const result = await dramaboxHelper.getStreamingUrl(bookId, chapterId);
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          bookId,
          chapterId,
          streamingUrl: result.data?.url,
          quality,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          metadata: result.data?.metadata
        },
        'Streaming URL retrieved successfully'
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to get streaming URL'
      ));
    }
  } catch (error) {
    console.error('Error getting streaming URL:', error);
    
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
        'Too many streaming requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to get streaming URL'
      ));
    }
  }
});

module.exports = router;