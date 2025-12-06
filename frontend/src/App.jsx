import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertTriangle, Star, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Loader } from 'lucide-react';
import { api } from './services/api';
import StatCard from './components/StatCard';
import OverviewPage from './pages/OverviewPage';
import BotDetectionPage from './pages/BotDetectionPage';
import TrendingProductsPage from './pages/TrendingProductsPage';
import VerifiedAnalysisPage from './pages/VerifiedAnalysisPage';
import ReviewsPage from './pages/ReviewsPage';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // All page data is now managed by individual page components

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, dateRange, activeTab]);

  // All data loading is now managed by individual page components



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
        {activeTab === 'bot-detection' && <BotDetectionPage />}
        {activeTab === 'trending' && <TrendingProductsPage />}
        {activeTab === 'verified' && <VerifiedAnalysisPage />}
        {activeTab === 'reviews' && <ReviewsPage />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Amazon US Customer Reviews Dataset Analysis | CS 554 Database Project
        </div>
      </footer>
    </div>
  );
}

export default App;
