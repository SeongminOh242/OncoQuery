import React, { useState } from 'react';
import { Star, Loader, Play } from 'lucide-react';
import { api } from '../services/api';

function TrendingProductsPage() {
  const [weeksBack, setWeeksBack] = useState(4);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      const products = await api.getTrendingProducts(weeksBack);
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setTrendingProducts(Array.isArray(products) ? products : []);
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Running query...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Query Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Query Settings</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range (from most recent)
            </label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={weeksBack}
              onChange={(e) => setWeeksBack(parseInt(e.target.value))}
            >
              <option value={1}>Last 1 Week</option>
              <option value={2}>Last 2 Weeks</option>
              <option value={4}>Last 4 Weeks</option>
              <option value={8}>Last 8 Weeks</option>
              <option value={12}>Last 12 Weeks</option>
              <option value={26}>Last 26 Weeks (6 months)</option>
              <option value={52}>Last 52 Weeks (1 year)</option>
            </select>
          </div>
          <button
            onClick={runQuery}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
          >
            <Play className="w-4 h-4" />
            Run Query
          </button>
        </div>
      </div>

      {queryTime && hasRun && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800">
            ✅ Query completed in <strong>{queryTime}s</strong> - Found {trendingProducts.length} products
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}
      
      {hasRun && !loading && trendingProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6">Trending Products (Last {weeksBack} Week{weeksBack !== 1 ? 's' : ''})</h3>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trendingProducts.map((product, idx) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.product_title?.slice(0, 60)}...</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.product_category}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      {product.avg_rating}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.review_count?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      
      {hasRun && !loading && trendingProducts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No trending products found for the selected time range.</p>
        </div>
      )}
    </div>
  );
}

export default TrendingProductsPage;
