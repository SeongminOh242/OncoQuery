// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper to safe-fetch JSON with fallback error message
async function safeFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

// API Service (aligned with backend endpoints)
export const api = {
  // Overview/Statistics (backend: /api/stats/overview)
  getOverviewStats: async (weeksBack = 4) => {
    const params = new URLSearchParams({ weeksBack: weeksBack.toString() });
    return safeFetchJson(`${API_BASE_URL}/stats/overview?${params}`);
  },

  // Bot Detection (backend exposes /api/bot-data and /api/bot-stats)
  getBotDetectionReviews: async (category = 'All', page = 1) => {
    const params = new URLSearchParams({ category, page });
    const json = await safeFetchJson(`${API_BASE_URL}/bot-data?${params}`);
    return json.data || json;
  },

  getBotStats: async (weeksBack = 4) => {
    const params = new URLSearchParams({ weeksBack: weeksBack.toString() });
    try {
      const json = await safeFetchJson(`${API_BASE_URL}/bot-stats?${params}`);
      return json;
    } catch (err) {
      console.error('Failed to fetch bot stats:', err);
      return { oneAndDone: 0, rapidFire: 0, message: 'Error loading stats' };
    }
  },

  // Trending Products (backend: /api/trending-products)
  getTrendingProducts: async (weeksBack = 4, page = 1) => {
    const params = new URLSearchParams({ weeksBack: weeksBack.toString(), page: page.toString() });
    const json = await safeFetchJson(`${API_BASE_URL}/trending-products?${params}`);
    return json.data || json || [];
  },

  // Verified Purchase Analysis (backend: /api/verified-analysis and /api/verified-stats)
  getVerifiedPurchaseReviews: async (weeksBack = 4, page = 1) => {
    const params = new URLSearchParams({ weeksBack: weeksBack.toString(), page: page.toString() });
    const json = await safeFetchJson(`${API_BASE_URL}/verified-analysis?${params}`);
    return json.data || json;
  },

  getVerifiedStats: async (weeksBack = 4) => {
    const params = new URLSearchParams({ weeksBack: weeksBack.toString() });
    try {
      const json = await safeFetchJson(`${API_BASE_URL}/verified-stats?${params}`);
      return json;
    } catch (err) {
      console.error('Failed to fetch verified stats:', err);
      return { comparisonStats: [], message: 'Error loading stats' };
    }
  },

  getHighRiskProducts: async () => {
    // Reuse verified-analysis as fallback
    try {
      const json = await safeFetchJson(`${API_BASE_URL}/verified-analysis`);
      return json.data || json || [];
    } catch (e) {
      return [];
    }
  },

  // Helpful/Controversial Reviews (backend: /api/helpful-reviews and /api/controversial-reviews)
  getHelpfulReviews: async (category = 'All', productId = null, page = 1) => {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (category && category !== 'All') {
        params.append('category', category);
      }
      const json = await safeFetchJson(`${API_BASE_URL}/helpful-reviews?${params}`);
      return json.data || json || [];
    } catch (err) {
      console.error('Failed to fetch helpful reviews:', err);
      return [];
    }
  },

  getControversialReviews: async (category = 'All', page = 1) => {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (category && category !== 'All') {
        params.append('category', category);
      }
      const json = await safeFetchJson(`${API_BASE_URL}/controversial-reviews?${params}`);
      return json.data || json || [];
    } catch (err) {
      console.error('Failed to fetch controversial reviews:', err);
      return [];
    }
  },

  // Get distinct categories from database
  getCategories: async () => {
    try {
      const json = await safeFetchJson(`${API_BASE_URL}/categories`);
      return json.categories || ['All'];
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      return ['All'];
    }
  }
};
