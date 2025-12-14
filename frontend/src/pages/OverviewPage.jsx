import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import { BarChart3, Calendar, List, CheckCircle, Loader, Play } from 'lucide-react';
import { api } from '../services/api';

function OverviewPage() {
  const [weeksBack, setWeeksBack] = useState(4);
  const [overviewStats, setOverviewStats] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  // Fetch meta on mount
  React.useEffect(() => {
    api.getOverviewMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = performance.now();
      const stats = await api.getOverviewStats(weeksBack);
      const endTime = performance.now();
      setQueryTime(((endTime - startTime) / 1000).toFixed(2));
      setOverviewStats(stats);
      setHasRun(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Big Metadata Section - always visible */}
      {meta && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {meta.size?.toLocaleString() || '0'}
                </h2>
                <p className="text-lg text-gray-600">Database Size (Reviews)</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {meta.earliestDate || 'N/A'} - {meta.latestDate || 'N/A'}
                </h2>
                <p className="text-lg text-gray-600">Database Date Range</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <List className="w-16 h-16 mx-auto text-purple-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {meta.categories?.length || 0}
                </h2>
                <p className="text-lg text-gray-600">Categories</p>
                <div className="mt-2 text-xs text-gray-500 max-h-24 overflow-y-auto">
                  {meta.categories?.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


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
      {hasRun && !loading && overviewStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {overviewStats.totalReviews?.toLocaleString() || '0'}
                </h2>
                <p className="text-lg text-gray-600">
                  Total Reviews (Filtered)
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {overviewStats.activeUsers?.toLocaleString() || '0'}
                </h2>
                <p className="text-lg text-gray-600">
                  Active Users (&gt;5 reviews)
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Date Range: {new Date(overviewStats.dateRange?.startDate).toLocaleDateString()} - {new Date(overviewStats.dateRange?.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewPage;
