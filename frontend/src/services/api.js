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
  getOverviewStats: async () => {
    return safeFetchJson(`${API_BASE_URL}/stats/overview`);
  },

  // Bot Detection (backend exposes /api/bot-data)
  getBotDetectionReviews: async (category = 'All', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    const json = await safeFetchJson(`${API_BASE_URL}/bot-data?${params}`);
    return json.data || json;
  },

  getBotStats: async () => {
    // No dedicated endpoint; fetch a reasonable sample and compute simple stats
    try {
      const params = new URLSearchParams({ page: 1, limit: 1000 });
      const json = await safeFetchJson(`${API_BASE_URL}/bot-data?${params}`);
      const data = Array.isArray(json) ? json : (json.data || []);
      if (!Array.isArray(data) || data.length === 0) return { oneAndDone: 0, rapidFire: 0, brandLoyalists: 0 };

      const oneAndDone = data.filter(r => r.total_reviews_by_reviewer === 1).length;
      const rapidFire = data.filter(r => r.reviews_in_one_day && r.reviews_in_one_day >= 5).length;
      const brandLoyalists = data.filter(r => r.same_brand_repeats && r.same_brand_repeats >= 3).length;

      return { oneAndDone, rapidFire, brandLoyalists };
    } catch (err) {
      return { oneAndDone: 0, rapidFire: 0, brandLoyalists: 0 };
    }
  },

  // Trending Products (backend: /api/trending-products)
  getTrendingProducts: async (category = 'All', dateRange = '30days', page = 1, limit = 20) => {
    return safeFetchJson(`${API_BASE_URL}/trending-products`);
  },

  // Verified Purchase Analysis (backend: /api/verified-analysis)
  getVerifiedPurchaseReviews: async (category = 'All', page = 1, limit = 20) => {
    const params = new URLSearchParams({ category, page, limit });
    const json = await safeFetchJson(`${API_BASE_URL}/verified-analysis?${params}`);
    return json.data || json;
  },

  getHighRiskProducts: async () => {
    // No dedicated endpoint in backend; reuse verified-analysis as fallback
    try {
      const json = await safeFetchJson(`${API_BASE_URL}/verified-analysis?page=1&limit=100`);
      return json.data || json || [];
    } catch (e) {
      return [];
    }
  },

  // Helpful/Controversial Reviews (no backend endpoints available) - fall back to paginated bot-data
  getHelpfulReviews: async (category = 'All', productId = null, page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams({ category, page, limit });
      const json = await safeFetchJson(`${API_BASE_URL}/bot-data?${params}`);
      const all = Array.isArray(json) ? json : (json.data || []);
      return all;
    } catch (err) {
      return [];
    }
  },

  getControversialReviews: async (category = 'All', page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams({ category, page, limit });
      const json = await safeFetchJson(`${API_BASE_URL}/bot-data?${params}`);
      const all = Array.isArray(json) ? json : (json.data || []);
      return all;
    } catch (err) {
      return [];
    }
  }
};
