import React, { useState, useEffect } from 'react';
import { Loader, Play } from 'lucide-react';
function Pagination({ currentPage, onPageChange, onRunQuery }) {
  const handlePageChange = async (newPage) => {
    onPageChange(newPage);
    setTimeout(() => onRunQuery(), 0);
  };
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-gray-600">Page {currentPage}</span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}
import { api } from '../services/api';

function BotDetectionPage() {
  const [weeksBack] = useState(1); // Always 1 week
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [week, setWeek] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [botReviews, setBotReviews] = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [meta, setMeta] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [weekOptions, setWeekOptions] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    api.getCategories().then(cats => {
      let arr = cats;
      if (cats && typeof cats === 'object' && !Array.isArray(cats) && cats.categories) {
        arr = cats.categories;
      }
      if (Array.isArray(arr) && arr.length > 0) {
        setCategories(arr);
      } else {
        setCategories(['All']);
        console.error('Categories API did not return a valid array:', cats);
      }
    }).catch(err => {
      setCategories(['All']);
      console.error('Error fetching categories:', err);
    });
    // Fetch meta for date range
    api.getOverviewMeta().then(meta => {
      setMeta(meta);
      if (meta && meta.earliestDate && meta.latestDate) {
        const startYear = parseInt(meta.earliestDate.slice(0, 4));
        const endYear = parseInt(meta.latestDate.slice(0, 4));
        const years = [];
        for (let y = endYear; y >= startYear; y--) years.push(y);
        setYearOptions(years);
        setMonthOptions([1,2,3,4,5,6,7,8,9,10,11,12]);
        setWeekOptions([1, 2, 3, 4]);
      }
    });
  }, []);

  const runQuery = async (newPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      // Build params for API
      let params = { weeksBack };
      if (year) params.year = year;
      if (month) params.month = month;
      if (week) params.week = week;
      if (category && category !== 'All') params.category = category;
      const [reviewsRes, stats] = await Promise.all([
        api.getBotDetectionReviews(params, newPage),
        api.getBotStats(weeksBack)
      ]);
      const endTime = performance.now();
      let reviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes.data || []);
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setBotReviews(reviews.data || reviews || []);
      setBotStats(stats);
      setTotalPages(reviewsRes.totalPages || 1);
      setHasMore(reviewsRes.hasMore || false);
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading bot data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    runQuery(newPage);
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, year, month, week]);

  return (
    <div className="space-y-6">
      {/* Query Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Query Settings</h3>
        <div className="flex flex-col gap-2">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Year:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={year}
              onChange={e => setYear(e.target.value)}
              disabled={!yearOptions.length}
            >
              <option value="">Year</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-sm font-medium text-gray-700">Month:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={month}
              onChange={e => setMonth(e.target.value)}
              disabled={!monthOptions.length}
            >
              <option value="">Month</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="text-sm font-medium text-gray-700">Week:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={week}
              onChange={e => setWeek(e.target.value)}
              disabled={!weekOptions.length}
            >
              <option value="">Week</option>
              {weekOptions.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <button
              onClick={runQuery}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
            >
              <Play className="w-4 h-4" />
              Run Query
            </button>
          </div>
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

      {hasRun && !loading && botStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">One and Done</h4>
            <p className="text-2xl font-bold text-blue-600">{botStats.oneAndDone?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Rapid Fire</h4>
            <p className="text-2xl font-bold text-orange-600">{botStats.rapidFire?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Suspicious</h4>
            <p className="text-2xl font-bold text-green-600">
              {((botStats.oneAndDone || 0) + (botStats.rapidFire || 0)).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Bot Reviews Table */}
      {hasRun && !loading && botReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Flagged Bot-Like Reviews</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Review Count</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {botReviews.map((review) => (
                  <tr key={review.review_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{review.review_id}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{review.customer_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-blue-700 font-bold">{review.user_review_count ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{review.product_title?.slice(0, 60)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{review.product_category}</td>
                    <td className="px-4 py-3 text-sm">{review.star_rating}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{review.review_date ? new Date(review.review_date).toLocaleDateString() : 'N/A'}</td>
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
          <Pagination currentPage={page} onPageChange={setPage} onRunQuery={runQuery} />
        </div>
      )}
      {hasRun && !loading && botReviews.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No flagged bot reviews found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}

export default BotDetectionPage;
