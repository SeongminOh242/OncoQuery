import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { Star, AlertTriangle, TrendingUp, CheckCircle, Loader } from 'lucide-react';
import { api } from '../services/api';

function OverviewPage() {
  const [overviewStats, setOverviewStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);
        const startTime = performance.now();
        const stats = await api.getOverviewStats();
        const endTime = performance.now();
        setQueryTime(((endTime - startTime) / 1000).toFixed(2));
        setOverviewStats(stats);
      } catch (err) {
        setError(err.message);
        console.error('Error loading overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

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

  if (!overviewStats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No data available</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Star className="w-6 h-6" />} 
          title="Total Reviews" 
          value={overviewStats.totalReviews?.toLocaleString() || '0'} 
          color="blue" 
        />
        <StatCard 
          icon={<AlertTriangle className="w-6 h-6" />} 
          title="Suspicious Reviews" 
          value={overviewStats.suspiciousReviews?.toLocaleString() || '0'} 
          color="red" 
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6" />} 
          title="Trending Products" 
          value={overviewStats.trendingProducts?.toLocaleString() || '0'} 
          color="green" 
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6" />} 
          title="Verified Purchases" 
          value={`${overviewStats.verifiedPercentage || 0}%`} 
          color="purple" 
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Database Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm text-gray-500">Total Products</div>
            <div className="text-2xl font-bold">{overviewStats.totalProducts?.toLocaleString() || '0'}</div>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <div className="text-sm text-gray-500">Total Customers</div>
            <div className="text-2xl font-bold">{overviewStats.totalCustomers?.toLocaleString() || '0'}</div>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="text-sm text-gray-500">Categories Analyzed</div>
            <div className="text-2xl font-bold">{overviewStats.totalCategories || '40+'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
