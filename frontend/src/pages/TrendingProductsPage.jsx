import React, { useState, useEffect } from 'react';
import { Star, Loader } from 'lucide-react';
import { api } from '../services/api';

function TrendingProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('30days');
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  useEffect(() => {
    const loadTrendingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const startTime = performance.now();
        const products = await api.getTrendingProducts(selectedCategory, dateRange);
        const endTime = performance.now();
        setQueryTime(((endTime - startTime) / 1000).toFixed(2));
        setTrendingProducts(Array.isArray(products) ? products : []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading trending data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingData();
  }, [selectedCategory, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {queryTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            ⏱️ Query completed in <strong>{queryTime}s</strong>
          </span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Trending Products Discovery</h3>
          <div className="flex gap-2">
            <select
              className="border rounded px-3 py-2"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <select
              className="border rounded px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

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
              {trendingProducts.slice(0, 50).map((product, idx) => (
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
    </div>
  );
}

export default TrendingProductsPage;
