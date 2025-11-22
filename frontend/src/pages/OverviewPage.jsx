import React from 'react';
import StatCard from '../components/StatCard';
import { Star, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function OverviewPage({ mockBotData, mockVerifiedAnalysis }) {
  return (
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
}

export default OverviewPage;
