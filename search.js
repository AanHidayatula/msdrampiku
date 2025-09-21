const express = require('express');
const dramaboxHelper = require('./dramaboxHelper');
const tokenManager = require('./get-token');

const router = express.Router();

// GET /api/search - Search for dramas, actors, etc.
router.get('/', async (req, res) => {
  try {
    const { 
      q, 
      type = 'all', // all, drama, actor, genre
      page = 1, 
      limit = 20,
      sort = 'relevance' // relevance, date, rating, popularity
    } = req.query;
    
    // Validate parameters
    if (!q || q.trim().length < 2) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Search query must be at least 2 characters long'
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
    
    // Perform search
    const result = await dramaboxHelper.searchDramas(q, parseInt(page), parseInt(limit));
    
    if (result.success) {
      // Process and categorize search results
      const searchResults = {
        query: q,
        type,
        results: result.data?.results || [],
        categories: {
          dramas: result.data?.dramas || [],
          actors: result.data?.actors || [],
          genres: result.data?.genres || []
        },
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          total: result.data?.total || 0,
          totalPages: Math.ceil((result.data?.total || 0) / parseInt(limit))
        },
        sort,
        suggestions: result.data?.suggestions || [],
        executionTime: result.data?.executionTime || '0.1s'
      };
      
      res.json(dramaboxHelper.formatResponse(
        true,
        searchResults,
        `Found ${searchResults.pagination.total} results for "${q}"`
      ));
    } else {
      res.status(result.status || 500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        result.error || 'Search failed'
      ));
    }
  } catch (error) {
    console.error('Error performing search:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many search requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Search failed due to server error'
      ));
    }
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Query parameter is required'
      ));
    }
    
    // Rate limiting removed for better performance
    
    // Mock suggestions (replace with actual search suggestions API)
    const mockSuggestions = [
      `${q} drama`,
      `${q} korean drama`,
      `${q} romance`,
      `${q} 2023`,
      `${q} episodes`
    ].slice(0, parseInt(limit));
    
    const suggestions = {
      query: q,
      suggestions: mockSuggestions.map((suggestion, index) => ({
        id: index + 1,
        text: suggestion,
        category: 'drama',
        popularity: Math.floor(Math.random() * 1000) + 100
      })),
      popular: [
        'Korean Drama 2023',
        'Romance Drama',
        'Action Series',
        'Comedy Shows',
        'Thriller Movies'
      ].slice(0, 5)
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      suggestions,
      'Search suggestions retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many suggestion requests. Please slow down.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Failed to get search suggestions'
      ));
    }
  }
});

// POST /api/search/advanced - Advanced search with filters
router.post('/advanced', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.body;
    
    // Validate parameters
    if (!query || query.trim().length < 2) {
      return res.status(400).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Search query must be at least 2 characters long'
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
    
    // Process advanced filters
    const processedFilters = {
      genre: filters.genre || [],
      country: filters.country || [],
      year: filters.year || [],
      rating: filters.rating || { min: 0, max: 10 },
      status: filters.status || [],
      duration: filters.duration || {}
    };
    
    // Mock advanced search results
    const mockResults = Array.from({ length: parseInt(limit) }, (_, index) => ({
      id: `advanced_result_${index + 1}`,
      title: `${query} Result ${index + 1}`,
      description: `Advanced search result matching your criteria for "${query}"`,
      thumbnail: `https://example.com/search/${index + 1}.jpg`,
      genre: ['Romance', 'Drama', 'Comedy'][Math.floor(Math.random() * 3)],
      country: 'South Korea',
      year: 2020 + Math.floor(Math.random() * 4),
      rating: 4.0 + Math.random(),
      status: 'Completed',
      relevanceScore: 100 - index * 2,
      matchedFields: ['title', 'description', 'genre']
    }));
    
    const advancedResults = {
      query,
      filters: processedFilters,
      results: mockResults,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        total: 150, // Mock total
        totalPages: Math.ceil(150 / parseInt(limit))
      },
      sort,
      facets: {
        genres: { 'Romance': 45, 'Drama': 38, 'Comedy': 22 },
        countries: { 'South Korea': 67, 'Japan': 23, 'China': 15 },
        years: { '2023': 40, '2022': 35, '2021': 30 },
        ratings: { '4.5+': 25, '4.0-4.5': 50, '3.5-4.0': 30 }
      },
      executionTime: '0.2s'
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      advancedResults,
      `Advanced search completed for "${query}"`
    ));
  } catch (error) {
    console.error('Error performing advanced search:', error);
    
    if (error.message === 'Rate limit exceeded') {
      res.status(429).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Too many advanced search requests. Please try again later.'
      ));
    } else {
      res.status(500).json(dramaboxHelper.formatResponse(
        false,
        null,
        null,
        'Advanced search failed'
      ));
    }
  }
});

// GET /api/search/trending - Get trending search terms
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, period = '24h' } = req.query; // 24h, 7d, 30d
    
    // Mock trending searches
    const trendingTerms = [
      { term: 'Korean Drama 2024', searches: 15420, change: '+23%' },
      { term: 'Romance Series', searches: 12300, change: '+15%' },
      { term: 'Action Thriller', searches: 9850, change: '+8%' },
      { term: 'Comedy Shows', searches: 8900, change: '+12%' },
      { term: 'Historical Drama', searches: 7650, change: '+5%' },
      { term: 'School Romance', searches: 6780, change: '+18%' },
      { term: 'Crime Drama', searches: 5900, change: '+9%' },
      { term: 'Fantasy Series', searches: 5400, change: '+14%' },
      { term: 'Medical Drama', searches: 4800, change: '+7%' },
      { term: 'Slice of Life', searches: 4200, change: '+11%' }
    ].slice(0, parseInt(limit));
    
    const trending = {
      period,
      terms: trendingTerms,
      categories: {
        drama: trendingTerms.filter((_, index) => index % 3 === 0),
        genre: trendingTerms.filter((_, index) => index % 3 === 1),
        actor: trendingTerms.filter((_, index) => index % 3 === 2)
      },
      generatedAt: new Date().toISOString()
    };
    
    res.json(dramaboxHelper.formatResponse(
      true,
      trending,
      'Trending search terms retrieved successfully'
    ));
  } catch (error) {
    console.error('Error getting trending searches:', error);
    res.status(500).json(dramaboxHelper.formatResponse(
      false,
      null,
      null,
      'Failed to retrieve trending searches'
    ));
  }
});

module.exports = router;