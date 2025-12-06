import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { api } from '../services/api';

function BotDetectionPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [botReviews, setBotReviews] = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  useEffect(() => {
    const loadBotData = async () => {
      try {
        setLoading(true);
        setError(null);
        const startTime = performance.now();
        const [reviews, stats] = await Promise.all([
          api.getBotDetectionReviews(selectedCategory, currentPage),
          api.getBotStats()
        ]);
        const endTime = performance.now();
        setQueryTime(((endTime - startTime) / 1000).toFixed(2));
        setBotReviews(reviews);
        setBotStats(stats);
      } catch (err) {
        setError(err.message);
        console.error('Error loading bot data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBotData();
  }, [selectedCategory, currentPage]);

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
          <h3 className="text-xl font-semibold">Suspicious Reviews</h3>
          <select
            className="border rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {botStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500">One-and-Done Reviewers</div>
              <div className="text-2xl font-bold text-red-600">{botStats.oneAndDone?.toLocaleString() || '0'}</div>
              <div className="text-xs text-gray-400">Single review accounts</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500">Rapid Fire Reviewers</div>
              <div className="text-2xl font-bold text-orange-600">{botStats.rapidFire?.toLocaleString() || '0'}</div>
              <div className="text-xs text-gray-400">5+ reviews in one day</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500">Brand Loyalists</div>
              <div className="text-2xl font-bold text-yellow-600">{botStats.brandLoyalists?.toLocaleString() || '0'}</div>
              <div className="text-xs text-gray-400">Repeated 5-star same brand</div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {botReviews.slice(0, 20).map((review) => (
                <tr key={review.review_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{review.review_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{review.product_title?.slice(0, 50)}...</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{review.product_category}</td>
                  <td className="px-4 py-3 text-sm">{review.star_rating}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.verified_purchase === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {review.verified_purchase === 'Y' ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BotDetectionPage;
