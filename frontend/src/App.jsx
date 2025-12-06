import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertTriangle, Star, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Loader } from 'lucide-react';
import { api } from './services/api';
import StatCard from './components/StatCard';
import OverviewPage from './pages/OverviewPage';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // State for all data
  const [botReviews, setBotReviews] = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [verifiedReviews, setVerifiedReviews] = useState([]);
  const [helpfulReviews, setHelpfulReviews] = useState([]);
  const [controversialReviews, setControversialReviews] = useState([]);
  const [reviewsSubTab, setReviewsSubTab] = useState('helpful');

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, dateRange, activeTab, reviewsSubTab]);

  // Load bot detection data
  useEffect(() => {
    const loadBotData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [reviews, stats] = await Promise.all([
          api.getBotDetectionReviews(selectedCategory, currentPage),
          api.getBotStats()
        ]);
        setBotReviews(reviews);
        setBotStats(stats);
      } catch (err) {
        setError(err.message);
        console.error('Error loading bot data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'bot-detection') {
      loadBotData();
    }
  }, [activeTab, selectedCategory, currentPage]);

  // Load trending products
  useEffect(() => {
    const loadTrendingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await api.getTrendingProducts(selectedCategory, dateRange, currentPage);
        setTrendingProducts(products);
      } catch (err) {
        setError(err.message);
        console.error('Error loading trending data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'trending') {
      loadTrendingData();
    }
  }, [activeTab, selectedCategory, dateRange, currentPage]);

  // Load verified analysis
  useEffect(() => {
    const loadVerifiedData = async () => {
      try {
        setLoading(true);
        setError(null);
        const reviews = await api.getVerifiedPurchaseReviews(selectedCategory, currentPage);
        setVerifiedReviews(reviews);
      } catch (err) {
        setError(err.message);
        console.error('Error loading verified data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'verified') {
      loadVerifiedData();
    }
  }, [activeTab, selectedCategory, currentPage]);

  // Load reviews data
  useEffect(() => {
    const loadReviewsData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (reviewsSubTab === 'helpful') {
          const reviews = await api.getHelpfulReviews(selectedCategory, null, currentPage);
          setHelpfulReviews(reviews);
        } else {
          const reviews = await api.getControversialReviews(selectedCategory, currentPage);
          setControversialReviews(reviews);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading reviews data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'reviews') {
      loadReviewsData();
    }
  }, [activeTab, selectedCategory, currentPage, reviewsSubTab]);

  const renderBotDetection = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="space-y-6">
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
                <div className="text-2xl font-bold text-red-600">
                  {botStats.oneAndDone?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-400">Single review accounts</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">Rapid Fire Reviewers</div>
                <div className="text-2xl font-bold text-orange-600">
                  {botStats.rapidFire?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-400">5+ reviews in one day</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">Brand Loyalists</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {botStats.brandLoyalists?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-400">Repeated 5-star same brand</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {botReviews && botReviews.length > 0 ? (
              botReviews.map((review, idx) => (
                <ReviewCard key={review.review_id || idx} review={review} showSuspiciousFlags={true} />
              ))
            ) : (
              <EmptyState message="No suspicious reviews found" />
            )}
          </div>

          <Pagination currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    );
  };

  const renderTrendingProducts = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Trending Products</h3>
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

          <div className="space-y-4">
            {trendingProducts && trendingProducts.length > 0 ? (
              trendingProducts.map((product, idx) => (
                <ProductCard key={product.product_id || idx} product={product} rank={idx + 1 + (currentPage - 1) * 20} />
              ))
            ) : (
              <EmptyState message="No trending products found" />
            )}
          </div>

          <Pagination currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    );
  };

  const renderVerifiedAnalysis = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="space-y-6">
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

          <div className="space-y-4">
            {verifiedReviews && verifiedReviews.length > 0 ? (
              verifiedReviews.map((review, idx) => (
                <ReviewCard key={review.review_id || idx} review={review} showVerifiedBadge={true} />
              ))
            ) : (
              <EmptyState message="No reviews found" />
            )}
          </div>

          <Pagination currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    const reviews = reviewsSubTab === 'helpful' ? helpfulReviews : controversialReviews;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setReviewsSubTab('helpful')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reviewsSubTab === 'helpful'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ThumbsUp className="w-4 h-4 inline mr-2" />
                Most Helpful
              </button>
              <button
                onClick={() => setReviewsSubTab('controversial')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reviewsSubTab === 'controversial'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ThumbsDown className="w-4 h-4 inline mr-2" />
                Most Controversial
              </button>
            </div>
            <select 
              className="border rounded px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

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

          <Pagination currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Search className="w-8 h-8" />
            Amazon Reviews Analysis Dashboard
          </h1>
          <p className="text-blue-100 mt-2">Detecting fake reviews and analyzing product trends across 5M+ records</p>
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'bot-detection', label: 'Bot Detection' },
              { id: 'trending', label: 'Trending Products' },
              { id: 'verified', label: 'Verified Analysis' },
              { id: 'reviews', label: 'Reviews' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'bot-detection' && renderBotDetection()}
        {activeTab === 'trending' && renderTrendingProducts()}
        {activeTab === 'verified' && renderVerifiedAnalysis()}
        {activeTab === 'reviews' && renderReviews()}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Amazon US Customer Reviews Dataset Analysis | CS 554 Database Project
        </div>
      </footer>
    </div>
  );
}

function ReviewCard({ review, showSuspiciousFlags, showVerifiedBadge, showHelpfulStats, showControversialStats }) {
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
            {showVerifiedBadge && review.verified_purchase === 'Y' && (
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

        {showSuspiciousFlags && review.red_flags && (
          <span className="flex items-center gap-1 text-red-600 ml-auto">
            <AlertTriangle className="w-4 h-4" />
            {review.red_flags} red flags
          </span>
        )}
      </div>

      {showSuspiciousFlags && review.suspicious_reasons && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-800">
            <strong>Suspicious indicators:</strong> {review.suspicious_reasons.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, rank }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-400">#{rank}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{product.product_title || product.name}</h4>
              <p className="text-sm text-gray-500">{product.product_category || product.category}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">{product.avg_rating || product.rating}</span>
              <span className="text-sm text-gray-500">({(product.review_count || product.reviewCount)?.toLocaleString()} reviews)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Score: {product.trend_score || product.trendScore}
              </span>
            </div>

            {product.velocity && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {product.velocity}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, onPageChange }) {
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-gray-600">Page {currentPage}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-3 text-gray-600">Loading data...</span>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
        <div>
          <h4 className="font-medium text-red-900 mb-1">Error Loading Data</h4>
          <p className="text-sm text-red-800">{message}</p>
        </div>
      </div>
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

export default App;
