import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, CheckCircle, AlertTriangle, Loader, MessageSquare, Play } from 'lucide-react';
import { api } from '../services/api';

function ReviewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reviewsSubTab, setReviewsSubTab] = useState('helpful');
  const [currentPage, setCurrentPage] = useState(1);
  const [weeksBack, setWeeksBack] = useState(null); // null = all data, or set to a number for specific weeks
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      
      if (reviewsSubTab === 'helpful') {
        const reviewData = await api.getHelpfulReviews(selectedCategory, null, currentPage, weeksBack);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } else {
        const reviewData = await api.getControversialReviews(selectedCategory, currentPage, weeksBack);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      }
      
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading reviews data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Query Settings</h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Type
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setReviewsSubTab('helpful')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    reviewsSubTab === 'helpful'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 inline mr-2" />
                  Most Helpful
                </button>
                <button
                  onClick={() => setReviewsSubTab('controversial')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    reviewsSubTab === 'controversial'
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 inline mr-2" />
                  Most Controversial
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range (from Aug 31, 2015 backwards)
              </label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={weeksBack || ''}
                onChange={(e) => setWeeksBack(e.target.value === '' ? null : parseInt(e.target.value))}
              >
                <option value="">All Time</option>
                <option value={1}>Last 1 Week</option>
                <option value={2}>Last 2 Weeks</option>
                <option value={4}>Last 4 Weeks</option>
                <option value={8}>Last 8 Weeks</option>
                <option value={12}>Last 12 Weeks</option>
                <option value={26}>Last 26 Weeks (6 months)</option>
                <option value={52}>Last 52 Weeks (1 year)</option>
              </select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Filter
              </label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

          <Pagination currentPage={currentPage} onPageChange={setCurrentPage} onRunQuery={runQuery} />
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
            <span>Date: {new Date(review.review_date).toLocaleDateString()}</span>
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

function Pagination({ currentPage, onPageChange, onRunQuery }) {
  const handlePageChange = async (newPage) => {
    onPageChange(newPage);
    // Wait for state to update, then run query
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

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p>{message}</p>
    </div>
  );
}

export default ReviewsPage;
