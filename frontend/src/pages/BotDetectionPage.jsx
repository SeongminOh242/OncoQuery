import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function BotDetectionPage({ mockBotData, categories, selectedCategory, setSelectedCategory }) {
  return (
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
}

export default BotDetectionPage;
