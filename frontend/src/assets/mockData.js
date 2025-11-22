// Mock data - replace with actual API calls
export const mockBotData = [
  { category: 'Electronics', botPercentage: 15.2, totalReviews: 45000 },
  { category: 'Books', botPercentage: 8.5, totalReviews: 52000 },
  { category: 'Clothing', botPercentage: 12.3, totalReviews: 38000 },
  { category: 'Home & Kitchen', botPercentage: 10.1, totalReviews: 41000 },
  { category: 'Sports', botPercentage: 9.7, totalReviews: 29000 },
];

export const mockTrendingProducts = [
  { id: 1, name: 'Wireless Earbuds Pro', category: 'Electronics', rating: 4.7, reviewCount: 1250, trendScore: 92, velocity: '+45%' },
  { id: 2, name: 'Smart Fitness Watch', category: 'Electronics', rating: 4.5, reviewCount: 980, trendScore: 88, velocity: '+38%' },
  { id: 3, name: 'Yoga Mat Premium', category: 'Sports', rating: 4.8, reviewCount: 720, trendScore: 85, velocity: '+52%' },
  { id: 4, name: 'LED Desk Lamp', category: 'Home & Kitchen', rating: 4.6, reviewCount: 890, trendScore: 83, velocity: '+29%' },
  { id: 5, name: 'Running Shoes Ultra', category: 'Sports', rating: 4.4, reviewCount: 1100, trendScore: 81, velocity: '+33%' },
];

export const mockVerifiedAnalysis = [
  { category: 'Electronics', verifiedAvg: 4.2, nonVerifiedAvg: 4.7, gap: 0.5, verifiedCount: 35000 },
  { category: 'Books', verifiedAvg: 4.5, nonVerifiedAvg: 4.6, gap: 0.1, verifiedCount: 48000 },
  { category: 'Clothing', verifiedAvg: 4.1, nonVerifiedAvg: 4.5, gap: 0.4, verifiedCount: 32000 },
  { category: 'Home & Kitchen', verifiedAvg: 4.3, nonVerifiedAvg: 4.8, gap: 0.5, verifiedCount: 37000 },
];

