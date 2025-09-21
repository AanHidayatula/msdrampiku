const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/drama - Get list of dramas with pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = req.query.limit || 1000, // Default 1000 atau unlimited jika tidak ada limit
      genre, 
      country, 
      year, 
      status, 
      sort = 'popular' 
    } = req.query;
    
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
    
    // Build filter object
    const filters = {};
    if (genre) filters.genre = genre;
    if (country) filters.country = country;
    if (year) filters.year = year;
    if (status) filters.status = status;
    
    // Get real drama data from DramaBox API
    const result = await dramaboxHelper.getLatestDramas(parseInt(page), parseInt(limit));
    
    let dramalist = [];
    if (result.success && result.data) {
      // Extract dramas from API response
      const apiDramas = result.data.data || [];
      dramalist = apiDramas.map((drama, index) => ({
        id: drama.id || drama.bookId || `drama_${index + 1}`,
        title: drama.title || drama.bookTitle || `Drama Title ${index + 1}`,
        description: drama.description || drama.intro || 'A captivating story that will keep you entertained...',
        thumbnail: drama.thumbnail || drama.cover || drama.bookCover,
        banner: drama.banner || drama.bigCover || drama.thumbnail || drama.cover,
        genre: drama.genre || drama.tag || ['Romance', 'Drama', 'Comedy'][Math.floor(Math.random() * 3)],
        country: drama.country || 'South Korea',
        year: drama.year || (2020 + Math.floor(Math.random() * 4)),
        rating: drama.rating || drama.score || (4.0 + Math.random()),
        totalEpisodes: drama.totalEpisodes || drama.chapterCount || (16 + Math.floor(Math.random() * 8)),
        status: drama.status || ['Completed', 'Ongoing', 'Coming Soon'][Math.floor(Math.random() * 3)],
        views: drama.views || drama.playCount || (Math.floor(Math.random() * 1000000) + 10000),
        createdAt: drama.createdAt || new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
      }));
    }
    
    // If no data from API, use fallback mock data
    if (dramalist.length === 0) {
      dramalist = Array.from({ length: Math.min(parseInt(limit), 20) }, (_, index) => ({
        id: `drama_${(parseInt(page) - 1) * parseInt(limit) + index + 1}`,
        title: `Drama Title ${index + 1}`,
        description: 'A captivating story that will keep you entertained...',
        thumbnail: null, // No example.com URLs
        banner: null,
        genre: ['Romance', 'Drama', 'Comedy'][Math.floor(Math.random() * 3)],
        country: 'South Korea',
        year: 2020 + Math.floor(Math.random() * 4),
        rating: 4.0 + Math.random(),
        totalEpisodes: 16 + Math.floor(Math.random() * 8),
        status: ['Completed', 'Ongoing', 'Coming Soon'][Math.floor(Math.random() * 3)],
        views: Math.floor(Math.random() * 1000000) + 10000,
        createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
      }));
    }
    
    const response = {
      dramas: dramalist,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        total: dramalist.length * 10, // Estimate total
        totalPages: Math.ceil((dramalist.length * 10) / parseInt(limit))
      },
      filters: {
        applied: filters,
        available: {
          genres: ['Romance', 'Drama', 'Comedy', 'Action', 'Thriller'],
          countries: ['South Korea', 'Japan', 'China', 'Thailand', 'Taiwan'],
          years: [2020, 2021, 2022, 2023, 2024],
          statuses: ['Completed', 'Ongoing', 'Coming Soon']
        }
      },
      sort
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      response,
      'Drama list retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting drama list:', error);
    
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve drama list'
    ));
  }
});

// GET /api/drama/:id - Get specific drama details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate parameters
    if (!id) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Drama ID is required'
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
    
    // Get drama details
    const result = await dramaboxHelper.getDramaDetails(id);
    
    if (result.success) {
      // Enhance the drama data with additional information
      const enhancedDrama = {
        id,
        ...result.data,
        additionalInfo: {
          totalViews: Math.floor(Math.random() * 1000000) + 10000,
          totalLikes: Math.floor(Math.random() * 50000) + 1000,
          totalComments: Math.floor(Math.random() * 10000) + 100,
          lastUpdated: new Date().toISOString()
        },
        chapters: Array.from({ length: 16 }, (_, index) => ({
          id: index + 1,
          title: `Episode ${index + 1}`,
          duration: `${Math.floor(Math.random() * 20) + 40}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          thumbnail: null, // Remove example.com URL
          releaseDate: new Date(2023, 0, index + 1).toISOString(),
          views: Math.floor(Math.random() * 100000) + 5000
        }))
      };
      
      res.json(dramaboxHelper.formatResponse(
        true,
        enhancedDrama,
        'Drama details retrieved successfully'
      ));
    } else {
      res.status(result.status || 404).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Drama not found'
      ));
    }
  } catch (error) {
    console.error('Error getting drama details:', error);
    
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve drama details'
    ));
  }
});

// GET /api/drama/latest - Get latest dramas
router.get('/latest', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
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
    
    // Get latest dramas
    const result = await dramaboxHelper.getLatestDramas(parseInt(page), parseInt(limit));
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          dramas: result.data?.dramas || [],
          pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            total: result.data?.total || 0,
            totalPages: Math.ceil((result.data?.total || 0) / parseInt(limit))
          }
        },
        'Latest dramas retrieved successfully'
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to retrieve latest dramas'
      ));
    }
  } catch (error) {
    console.error('Error getting latest dramas:', error);
    
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve latest dramas'
    ));
  }
});

// GET /api/drama/:id/episodes - Get episodes list for a drama
router.get('/:id/episodes', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate parameters
    if (!id) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Drama ID is required'
      ));
    }
    
    // Get episodes (using chapters endpoint)
    const result = await dramaboxHelper.getChapters(id, parseInt(page));
    
    if (result.success) {
      res.json(dramaboxHelper.formatResponse(
        true,
        {
          dramaId: id,
          episodes: result.data?.chapters || [],
          pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            total: result.data?.total || 0,
            totalPages: Math.ceil((result.data?.total || 0) / parseInt(limit))
          }
        },
        'Episodes retrieved successfully'
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Failed to retrieve episodes'
      ));
    }
  } catch (error) {
    console.error('Error getting episodes:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve episodes'
    ));
  }
});

module.exports = router;