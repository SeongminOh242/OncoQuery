import React, { useState } from 'react';
import { Loader, Play } from 'lucide-react';
import { api } from '../services/api';

function VerifiedAnalysisPage() {
  const [weeksBack, setWeeksBack] = useState(4);
  const [verifiedReviews, setVerifiedReviews] = useState([]);
  const [verifiedStats, setVerifiedStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      const [reviews, stats] = await Promise.all([
        api.getVerifiedPurchaseReviews(weeksBack),
        api.getVerifiedStats(weeksBack)
      ]);
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setVerifiedReviews(Array.isArray(reviews) ? reviews : []);
      setVerifiedStats(stats);
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading verified data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Query Settings</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range (from Aug 31, 2015 backwards)
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

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Running query...</span>
        </div>
      )}

      {queryTime && hasRun && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800">
            ✅ Query completed in <strong>{queryTime}s</strong>
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {hasRun && !loading && verifiedStats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Verification Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Reviews</h4>
              <p className="text-2xl font-bold text-blue-600">{verifiedStats.totalReviews?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Verified Purchases</h4>
              <p className="text-2xl font-bold text-green-600">{verifiedStats.verifiedCount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Verification Rate</h4>
              <p className="text-2xl font-bold text-purple-600">{verifiedStats.verificationRate?.toFixed(2) || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {hasRun && !loading && verifiedReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Verified Purchase Reviews</h3>
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
              {verifiedReviews.map((review) => (
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
      )}
    </div>
  );
}

export default VerifiedAnalysisPage;
