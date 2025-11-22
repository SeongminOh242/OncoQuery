import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function VerifiedAnalysisPage({ mockVerifiedAnalysis }) {
  return (
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
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">High Risk</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Normal</span>
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
}

export default VerifiedAnalysisPage;
