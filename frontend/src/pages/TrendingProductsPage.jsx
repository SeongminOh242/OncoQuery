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
import React, { useState, useEffect } from 'react';
import { Star, Loader, Play } from 'lucide-react';
import { api } from '../services/api';

function TrendingProductsPage() {
  const [weeksBack] = useState(1); // Always 1 week
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [week, setWeek] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [trendingProducts, setTrendingProducts] = useState([]);
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
      const res = await api.getTrendingProducts(params, newPage);
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      // Support both array and object response
      if (Array.isArray(res)) {
        setTrendingProducts(res);
        setTotalPages(1);
        setHasMore(false);
      } else {
        setTrendingProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setHasMore(res.hasMore || false);
      }
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading trending data:', err);
    } finally {
      setLoading(false);
    }
  };
  // Fetch categories and meta on mount
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

  const handlePageChange = (newPage) => {
    setPage(newPage);
    runQuery(newPage);
  };
  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, year, month, week]);

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
          <h3 className="text-xl font-semibold mb-6">Trending Products</h3>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trendingProducts.map((product, idx) => {
                // Show only the first review date for the product
                let reviewDates = product.review_dates || [];
                let reviewDate = reviewDates.length > 0 ? reviewDates[0] : null;
                return (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">#{idx + 1 + (page - 1) * trendingProducts.length}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.product_title?.slice(0, 60)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.product_category}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        {product.avg_rating}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.review_count?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {reviewDate ? reviewDate : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <Pagination currentPage={page} onPageChange={setPage} onRunQuery={runQuery} />
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
