// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Service
export const api = {
  // Overview/Statistics
  getOverviewStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/overview`);
    if (!response.ok) throw new Error('Failed to fetch overview stats');
    return response.json();
  },

  // Bot Detection
  getBotDetectionReviews: async (category = 'All', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    const response = await fetch(`${API_BASE_URL}/bot-detection/reviews?${params}`);
    if (!response.ok) throw new Error('Failed to fetch bot detection reviews');
    return response.json();
  },

  getBotStats: async () => {
    const response = await fetch(`${API_BASE_URL}/bot-detection/stats`);
    if (!response.ok) throw new Error('Failed to fetch bot stats');
    return response.json();
  },

  // Trending Products
  getTrendingProducts: async (category = 'All', dateRange = '30days', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, dateRange, page, limit });
    const response = await fetch(`${API_BASE_URL}/trending?${params}`);
    if (!response.ok) throw new Error('Failed to fetch trending products');
    return response.json();
  },

  // Verified Purchase Analysis
  getVerifiedPurchaseReviews: async (category = 'All', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    const response = await fetch(`${API_BASE_URL}/verified-analysis/reviews?${params}`);
    if (!response.ok) throw new Error('Failed to fetch verified purchase reviews');
    return response.json();
  },

  getHighRiskProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/verified-analysis/high-risk`);
    if (!response.ok) throw new Error('Failed to fetch high risk products');
    return response.json();
  },

  // Helpful/Controversial Reviews
  getHelpfulReviews: async (category = 'All', productId = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    if (productId) params.append('productId', productId);
    const response = await fetch(`${API_BASE_URL}/reviews/helpful?${params}`);
    if (!response.ok) throw new Error('Failed to fetch helpful reviews');
    return response.json();
  },

  getControversialReviews: async (category = 'All', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    const response = await fetch(`${API_BASE_URL}/reviews/controversial?${params}`);
    if (!response.ok) throw new Error('Failed to fetch controversial reviews');
    return response.json();
  }
};
