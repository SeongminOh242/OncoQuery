import React, { useState } from 'react';
import { Search } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import BotDetectionPage from './pages/BotDetectionPage';
import TrendingProductsPage from './pages/TrendingProductsPage';
import VerifiedAnalysisPage from './pages/VerifiedAnalysisPage';
import { mockBotData, mockTrendingProducts, mockVerifiedAnalysis } from './assets/mockData';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('30days');
  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed header + nav at very top */}
      <div className="fixed top-0 left-0 w-full z-20">
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-center">
              <Search className="w-8 h-8" />
              Amazon Reviews Analysis Dashboard
            </h1>
            <p className="text-blue-100 mt-2">
              Detecting fake reviews and analyzing product trends across 5M+ records
            </p>
          </div>
        </header>
        <nav className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-1 justify-center">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'bot-detection', label: 'Bot Detection' },
                { id: 'trending', label: 'Trending Products' },
                { id: 'verified', label: 'Verified Analysis' },
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
      </div>

      {/* Main content with padding top to clear fixed header+nav and add breathing space */}
      <main className="max-w-5xl mx-auto px-4 pt-44 pb-8 flex-grow">
        {activeTab === 'overview' && (
          <OverviewPage
            mockBotData={mockBotData}
            mockVerifiedAnalysis={mockVerifiedAnalysis}
          />
        )}
        {activeTab === 'bot-detection' && (
          <BotDetectionPage
            mockBotData={mockBotData}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
        {activeTab === 'trending' && (
          <TrendingProductsPage
            mockTrendingProducts={mockTrendingProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}
        {activeTab === 'verified' && (
          <VerifiedAnalysisPage
            mockVerifiedAnalysis={mockVerifiedAnalysis}
          />
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Amazon US Customer Reviews Dataset Analysis | CS 554 Database Project
        </div>
      </footer>
    </div>
  );
}

export default App;
