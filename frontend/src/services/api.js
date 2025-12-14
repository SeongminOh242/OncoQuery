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
  // Overview meta: database size, date range, categories
  getOverviewMeta: async () => {
    const json = await safeFetchJson(`${API_BASE_URL}/overview-meta`);
    return json;
  },

  // Bot Detection (backend exposes /api/bot-data and /api/bot-stats)
  // Accepts paramsObj: { weeksBack, year, month, week, category }, page
  getBotDetectionReviews: async (paramsObj = {}, page = 1) => {
    const params = new URLSearchParams();
    if (paramsObj.category && paramsObj.category !== 'All') params.append('category', paramsObj.category);
    if (paramsObj.weeksBack !== undefined) params.append('weeksBack', paramsObj.weeksBack.toString());
    if (paramsObj.year) params.append('year', paramsObj.year);
    if (paramsObj.month) params.append('month', paramsObj.month);
    if (paramsObj.week) params.append('week', paramsObj.week);
    params.append('page', page.toString());
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
  getTrendingProducts: async (paramsObj = {}, page = 1) => {
    const params = new URLSearchParams();
    // Accepts paramsObj: { weeksBack, year, month, week, category }
    if (paramsObj.weeksBack !== undefined) params.append('weeksBack', paramsObj.weeksBack.toString());
    if (paramsObj.year) params.append('year', paramsObj.year);
    if (paramsObj.month) params.append('month', paramsObj.month);
    if (paramsObj.week) params.append('week', paramsObj.week);
    if (paramsObj.category) params.append('category', paramsObj.category);
    params.append('page', page.toString());
    const json = await safeFetchJson(`${API_BASE_URL}/trending-products?${params}`);
    return json.data || json || [];
  },

  // Verified Purchase Analysis (backend: /api/verified-analysis and /api/verified-stats)

  // Accepts paramsObj: { weeksBack, year, month, week, category }, page
  getVerifiedPurchaseReviews: async (paramsObj = {}, page = 1) => {
    const params = new URLSearchParams();
    if (paramsObj.weeksBack !== undefined) params.append('weeksBack', paramsObj.weeksBack.toString());
    if (paramsObj.year) params.append('year', paramsObj.year);
    if (paramsObj.month) params.append('month', paramsObj.month);
    if (paramsObj.week) params.append('week', paramsObj.week);
    if (paramsObj.category && paramsObj.category !== 'All') params.append('category', paramsObj.category);
    if (paramsObj.limit) params.append('limit', paramsObj.limit);
    params.append('page', page.toString());
    const json = await safeFetchJson(`${API_BASE_URL}/verified-analysis?${params}`);
    return json.data || json;
  },

  getVerifiedStats: async (paramsObj = {}) => {
    const params = new URLSearchParams();
    if (paramsObj.weeksBack !== undefined) params.append('weeksBack', paramsObj.weeksBack.toString());
    if (paramsObj.year) params.append('year', paramsObj.year);
    if (paramsObj.month) params.append('month', paramsObj.month);
    if (paramsObj.week) params.append('week', paramsObj.week);
    if (paramsObj.category && paramsObj.category !== 'All') params.append('category', paramsObj.category);
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

  // Accepts paramsObj: { category, weeksBack, year, month, week }, page
  getHelpfulReviews: async (paramsObj = {}, page = 1) => {
    try {
      const params = new URLSearchParams();
      if (paramsObj.category && paramsObj.category !== 'All') params.append('category', paramsObj.category);
      if (paramsObj.weeksBack != null) params.append('weeksBack', paramsObj.weeksBack.toString());
      if (paramsObj.year) params.append('year', paramsObj.year);
      if (paramsObj.month) params.append('month', paramsObj.month);
      if (paramsObj.week) params.append('week', paramsObj.week);
      params.append('page', page.toString());
      const json = await safeFetchJson(`${API_BASE_URL}/helpful-reviews?${params}`);
      return json.data || json || [];
    } catch (err) {
      console.error('Failed to fetch helpful reviews:', err);
      return [];
    }
  },

  getControversialReviews: async (paramsObj = {}, page = 1) => {
    try {
      const params = new URLSearchParams();
      if (paramsObj.category && paramsObj.category !== 'All') params.append('category', paramsObj.category);
      if (paramsObj.weeksBack != null) params.append('weeksBack', paramsObj.weeksBack.toString());
      if (paramsObj.year) params.append('year', paramsObj.year);
      if (paramsObj.month) params.append('month', paramsObj.month);
      if (paramsObj.week) params.append('week', paramsObj.week);
      params.append('page', page.toString());
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