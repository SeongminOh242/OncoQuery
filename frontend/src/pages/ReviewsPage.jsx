import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Star, CheckCircle, AlertTriangle, Loader, MessageSquare, Play } from 'lucide-react';
import { api } from '../services/api';

function ReviewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reviewsSubTab, setReviewsSubTab] = useState('helpful');
  const [currentPage, setCurrentPage] = useState(1);
  const [weeksBack] = useState(1); // Always 1 week
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [week, setWeek] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(['All']);
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
      // Build year options
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

  const runQuery = async (pageToUse = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      const params = {
        category: selectedCategory,
        weeksBack,
        year: year || undefined,
        month: month || undefined,
        week: week || undefined
      };
      let reviewData;
      if (reviewsSubTab === 'helpful') {
        reviewData = await api.getHelpfulReviews(params, pageToUse);
      } else {
        reviewData = await api.getControversialReviews(params, pageToUse);
      }
      
      // Handle response - could be object with data property or array
      if (reviewData && typeof reviewData === 'object' && !Array.isArray(reviewData)) {
        setReviews(reviewData.data || []);
        // Use backend's calculated totalPages and hasMore
        setTotalPages(reviewData.totalPages || 1);
        setHasMore(reviewData.hasMore || false);
      } else {
        // Fallback for array response
        const reviewsArray = Array.isArray(reviewData) ? reviewData : [];
        setReviews(reviewsArray);
        setHasMore(false);
        setTotalPages(1);
      }
      
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading reviews data:', err);
      setReviews([]);
      setHasMore(false);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, year, month, week, reviewsSubTab]);

  return (
    <div className="space-y-6">
      {/* Query Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Query Settings</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Review Type:</span>
            <button
              onClick={() => setReviewsSubTab('helpful')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                reviewsSubTab === 'helpful'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4 inline mr-1" />
              Helpful
            </button>
            <button
              onClick={() => setReviewsSubTab('controversial')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                reviewsSubTab === 'controversial'
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsDown className="w-4 h-4 inline mr-1" />
              Controversial
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Year:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={year}
              onChange={e => setYear(e.target.value)}
              disabled={!yearOptions.length}
            >
              <option value="">All</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Month:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={month}
              onChange={e => setMonth(e.target.value)}
              disabled={!monthOptions.length}
            >
              <option value="">All</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Week:</span>
            <select
              className="border rounded-lg px-2 py-1"
              value={week}
              onChange={e => setWeek(e.target.value)}
              disabled={!weekOptions.length}
            >
              <option value="">All</option>
              {weekOptions.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
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

      {hasRun && !loading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {reviewsSubTab === 'helpful'
                ? 'Showing top helpful reviews per rating level (1-5 stars) with minimum 5 helpful votes'
                : 'Showing controversial reviews with 10+ total votes based on unhelpful vote ratio'}
            </p>
          </div>

          <div className="space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <ReviewCard
                  key={review.review_id || idx}
                  review={review}
                  showHelpfulStats={true}
                  showControversialStats={reviewsSubTab === 'controversial'}
                />
              ))
            ) : (
              <EmptyState message={`No ${reviewsSubTab} reviews found`} />
            )}
          </div>

          <Pagination 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
            onRunQuery={runQuery}
            hasMore={hasMore}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, showHelpfulStats, showControversialStats }) {
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">{review.product_title || 'Product'}</h4>
            {review.verified_purchase === 'Y' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              {renderStars(review.star_rating)}
              <span className="ml-1 font-medium">{review.star_rating}</span>
            </span>
            <span>Category: {review.product_category}</span>
            <span>Date: {review.review_date ? new Date(review.review_date).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h5 className="font-medium text-gray-900 mb-1">{review.review_headline}</h5>
        <p className="text-gray-700 text-sm">{review.review_body}</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {showHelpfulStats && (
          <>
            <span className="flex items-center gap-1 text-green-600">
              <ThumbsUp className="w-4 h-4" />
              {review.helpful_votes || 0} helpful
            </span>
            <span className="text-gray-500">
              {review.total_votes || 0} total votes
            </span>
          </>
        )}

        {showControversialStats && (
          <>
            <span className="flex items-center gap-1 text-orange-600">
              <ThumbsDown className="w-4 h-4" />
              {review.unhelpful_votes || 0} unhelpful
            </span>
            <span className="text-gray-500">
              Controversy Score: {review.controversy_score || 0}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Pagination({ currentPage, onPageChange, onRunQuery, hasMore = false, totalPages = 1 }) {
  const handlePageChange = async (newPage) => {
    onPageChange(newPage);
    // Pass the new page number directly to runQuery to avoid stale state
    onRunQuery(newPage);
  };

  // Hide Next button when hasMore is false (most reliable indicator)
  // Also hide if we're at or beyond totalPages as a safety check
  const showNextButton = hasMore && currentPage < totalPages;

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
      {showNextButton && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Next
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p>{message}</p>
    </div>
  );
}

export default ReviewsPage;
