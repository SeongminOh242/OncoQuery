import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { api } from '../services/api';

function VerifiedAnalysisPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [verifiedReviews, setVerifiedReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  useEffect(() => {
    const loadVerifiedData = async () => {
      try {
        setLoading(true);
        setError(null);
        const startTime = performance.now();
        const reviews = await api.getVerifiedPurchaseReviews(selectedCategory, currentPage);
        const endTime = performance.now();
        setQueryTime(((endTime - startTime) / 1000).toFixed(2));
        setVerifiedReviews(Array.isArray(reviews) ? reviews : []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading verified data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVerifiedData();
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
          <h3 className="text-xl font-semibold">Verified Purchase Analysis</h3>
          <select
            className="border rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

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
              {verifiedReviews.slice(0, 50).map((review) => (
                <tr key={review.review_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{review.review_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{review.product_title?.slice(0, 60)}...</td>
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

export default VerifiedAnalysisPage;
