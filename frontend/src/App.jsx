import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, AlertTriangle, Star, CheckCircle, Filter } from 'lucide-react';
import './App.css';

// Mock data - replace with actual API calls
const mockBotData = [
  { category: 'Electronics', botPercentage: 15.2, totalReviews: 45000 },
  { category: 'Books', botPercentage: 8.5, totalReviews: 52000 },
  { category: 'Clothing', botPercentage: 12.3, totalReviews: 38000 },
  { category: 'Home & Kitchen', botPercentage: 10.1, totalReviews: 41000 },
  { category: 'Sports', botPercentage: 9.7, totalReviews: 29000 },
];

const mockTrendingProducts = [
  { id: 1, name: 'Wireless Earbuds Pro', category: 'Electronics', rating: 4.7, reviewCount: 1250, trendScore: 92, velocity: '+45%' },
  { id: 2, name: 'Smart Fitness Watch', category: 'Electronics', rating: 4.5, reviewCount: 980, trendScore: 88, velocity: '+38%' },
  { id: 3, name: 'Yoga Mat Premium', category: 'Sports', rating: 4.8, reviewCount: 720, trendScore: 85, velocity: '+52%' },
  { id: 4, name: 'LED Desk Lamp', category: 'Home & Kitchen', rating: 4.6, reviewCount: 890, trendScore: 83, velocity: '+29%' },
  { id: 5, name: 'Running Shoes Ultra', category: 'Sports', rating: 4.4, reviewCount: 1100, trendScore: 81, velocity: '+33%' },
];

const mockVerifiedAnalysis = [
  { category: 'Electronics', verifiedAvg: 4.2, nonVerifiedAvg: 4.7, gap: 0.5, verifiedCount: 35000 },
  { category: 'Books', verifiedAvg: 4.5, nonVerifiedAvg: 4.6, gap: 0.1, verifiedCount: 48000 },
  { category: 'Clothing', verifiedAvg: 4.1, nonVerifiedAvg: 4.5, gap: 0.4, verifiedCount: 32000 },
  { category: 'Home & Kitchen', verifiedAvg: 4.3, nonVerifiedAvg: 4.8, gap: 0.5, verifiedCount: 37000 },
];

// Preserved COLORS constant from original dashboard (currently unused)
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('30days');

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Home & Kitchen', 'Sports'];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Star className="w-6 h-6" />} title="Total Reviews" value="5.2M" color="blue" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} title="Suspicious Reviews" value="127K" color="red" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} title="Trending Products" value="2,341" color="green" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} title="Verified Purchases" value="78%" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Bot Detection by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockBotData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Bot %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="botPercentage" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Verified vs Non-Verified Ratings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockVerifiedAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[3.5, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="verifiedAvg" stroke="#10b981" name="Verified" strokeWidth={2} />
              <Line type="monotone" dataKey="nonVerifiedAvg" stroke="#ef4444" name="Non-Verified" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderBotDetection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Bot Review Detection System</h3>
          <div className="flex gap-2">
            <select
              className="border rounded px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">One-and-Done Reviewers</div>
            <div className="text-2xl font-bold text-red-600">45,230</div>
            <div className="text-xs text-gray-400">Single review accounts</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Rapid Fire Reviewers</div>
            <div className="text-2xl font-bold text-orange-600">28,450</div>
            <div className="text-xs text-gray-400">5+ reviews in one day</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Brand Loyalists</div>
            <div className="text-2xl font-bold text-yellow-600">53,680</div>
            <div className="text-xs text-gray-400">Repeated 5-star same brand</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockBotData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis yAxisId="left" orientation="left" stroke="#ef4444" label={{ value: 'Bot %', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" label={{ value: 'Total Reviews', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="botPercentage" fill="#ef4444" name="Bot %" />
            <Bar yAxisId="right" dataKey="totalReviews" fill="#3b82f6" name="Total Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrendingProducts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Trending Products Discovery</h3>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockTrendingProducts.map((product, idx) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      {product.rating}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.reviewCount}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {product.trendScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {product.velocity}
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

  const renderVerifiedAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-6">Verified Purchase Impact Analysis</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Average Rating Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockVerifiedAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[3.5, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="verifiedAvg" fill="#10b981" name="Verified" />
                <Bar dataKey="nonVerifiedAvg" fill="#ef4444" name="Non-Verified" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Rating Gap by Category</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockVerifiedAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Rating Gap', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="gap" fill="#f59e0b">
                  {mockVerifiedAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gap > 0.4 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Products with High Rating Disparities</h4>
              <p className="text-sm text-yellow-800">
                Found 234 products with rating gaps &gt;0.5 stars between verified and non-verified reviews.
                These products may have inflated ratings from suspicious sources.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Category Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified Avg</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Non-Verified Avg</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gap</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockVerifiedAnalysis.map((item) => (
                  <tr key={item.category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.verifiedAvg}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.nonVerifiedAvg}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.gap}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.gap > 0.4 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          High Risk
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bot-detection' && renderBotDetection()}
        {activeTab === 'trending' && renderTrendingProducts()}
        {activeTab === 'verified' && renderVerifiedAnalysis()}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Amazon US Customer Reviews Dataset Analysis | CS 554 Database Project
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default App;
