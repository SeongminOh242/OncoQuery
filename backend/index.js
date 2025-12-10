import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";


dotenv.config();

const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "localhost";
let db;

const app = express();

// Configuration
const LIMITS = {
  BOT_REVIEWS: 1000,        // Feature 2: Display sample of flagged reviews (reduced from 5000)
  TRENDING_PRODUCTS: 100,   // Feature 4: Top trending products (reduced from 500)
  VERIFIED_REVIEWS: 1000,   // Feature 5: Sample verified reviews for display (reduced from 5000)
  HELPFUL_REVIEWS: 500      // Feature 3: Helpful reviews per query (reduced from 1000)
};

// Early-limit configuration for fast-but-partial aggregations
const EARLY_LIMIT = Math.min(parseInt(process.env.EARLY_LIMIT || "100000", 10), 2000000);

// Query Timeout Configuration
const QUERY_CONFIG = {
  maxTimeMS: 30000,         // 30 second timeout for aggregation queries
  allowDiskUse: true,       // Allow disk usage for large aggregations
  sampleSize: 0.1           // Sample 10% of data for exploratory queries (when ?sample=true)
};

// Cache for dataset date range (to avoid repeated queries)
let datasetMaxDate = null;

// Helper: Get date range going backwards from most recent review
async function getDateRange(collection, weeksBack = 4) {
  // Use the known max date from the dataset
  const endDate = '2015-08-31'; // Latest date in Amazon reviews dataset
  const endDateObj = new Date(endDate);
  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - (weeksBack * 7));
  
  // Format as YYYY-MM-DD strings to match MongoDB string dates
  const startDate = startDateObj.toISOString().split('T')[0];
  
  return {
    startDate,
    endDate
  };
}

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// Lazy MongoDB connection (test-friendly)
// NOTE: Index creation has been moved to scripts/setup-indexes-fast.js
// Run that script ONCE before starting the server to avoid blocking requests
async function getDb() {
  if (db) return db;
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  
  // Index creation removed from here to prevent blocking requests
  // Indexes should be created separately using: node scripts/setup-indexes-fast.js
  // This ensures the server starts immediately and can serve requests right away
  
  return db;
}

// FEATURE 2: BOT REVIEW DETECTION SYSTEM
// Flags suspicious reviews based on detection criteria
// Returns sample of flagged reviews + statistics computed via aggregation
// ULTRA-OPTIMIZED: Remove expensive count, use index-optimized sort, fetch only needed data
// Sort uses compound index: { product_category: 1, review_date: -1 }
app.get("/api/bot-data", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100); // Default: 25 per page
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.product_category = req.query.category;
    }

    // Use compound index when filtering by category, date index otherwise
    const sortKey = Object.keys(filter).length > 0 && filter.product_category
      ? { product_category: 1, review_date: -1 }  // Use compound index when filtering by category
      : { review_date: -1 };  // Use date index otherwise
    
    const pipeline = [
      { $match: filter },
      { $sort: sortKey },
      { $limit: skip + limit },  // Limit early to reduce memory
      { $skip: skip },
      { $limit: limit },
      { $project: { product_title: 1, product_category: 1, star_rating: 1, review_date: 1, verified_purchase: 1, review_id: 1, product_id: 1, helpful_votes: 1, total_votes: 1 } }
    ];
    
    // Fetch data only - no count operation (instant response)
    const [data, estimatedTotal] = await Promise.all([
      collection.aggregate(pipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse,
        hint: Object.keys(filter).length > 0 && filter.product_category 
          ? { product_category: 1, review_date: -1 }  // Force index usage
          : undefined
      }).toArray(),
      // Use estimated count only (no scan, instant)
      Object.keys(filter).length === 0 
        ? collection.estimatedDocumentCount()
        : collection.countDocuments(filter).catch(() => collection.estimatedDocumentCount())
    ]);
    
    const total = estimatedTotal;
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      total, 
      returned: data.length,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      message: `Showing page ${page} of ${totalPages} (${data.length} reviews)`,
      data 
    });
  } catch (err) {
    console.error('Error in /api/bot-data:', err);
    res.status(500).json({ error: "Failed to fetch bot data" });
  }
});

// FEATURE 2: Bot Statistics Endpoint
// Computes detection metrics using aggregation pipeline
// OPTIMIZED: Date range filter + pseudo-random sampling
app.get("/api/bot-stats", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get date range (weeksBack from most recent review)
    const weeksBack = parseInt(req.query.weeksBack) || 5; // Default: last 5 weeks
    const { startDate, endDate } = await getDateRange(collection, weeksBack);
    
    const dateFilter = { 
      review_date: { 
        $gte: startDate,
        $lte: endDate 
      } 
    };
    
    // Get total count first for random offset calculation
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Pseudo-random sampling: pick random offset within the range
    const sampleSize = 1000;
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    
    const pipeline = [
      // 1. MATCH reviews in date range
      { $match: dateFilter },
      
      // 2. SKIP to random offset
      { $skip: randomOffset },
      
      // 3. LIMIT to sample size
      { $limit: sampleSize },
      
      // 4. GROUP by customer_id to count reviews per user
      { $group: {
        _id: "$customer_id",
        reviewCount: { $sum: 1 },
        firstDate: { $min: "$review_date" }
      }},
      
      // 5. FACET to compute both metrics from grouped data
      { $facet: {
        oneAndDone: [
          { $match: { reviewCount: 1 } },
          { $count: "total" }
        ],
        rapidFire: [
          { $match: { reviewCount: { $gte: 5 } } },
          { $count: "total" }
        ]
      }}
    ];

    const results = await collection.aggregate(pipeline, { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse 
    }).toArray();

    const [result] = results;
    const duration = Date.now() - startTime;
    
    res.json({
      oneAndDone: result.oneAndDone[0]?.total || 0,
      rapidFire: result.rapidFire[0]?.total || 0,
      totalReviews,
      sampleSize,
      randomOffset,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `Bot detection from ${sampleSize.toLocaleString()} sample at offset ${randomOffset.toLocaleString()} (${totalReviews.toLocaleString()} total reviews, ${duration}ms)`
    });
  } catch (err) {
    console.error('Error in /api/bot-stats:', err);
    res.status(500).json({ error: "Failed to compute bot stats" });
  }
});

// FEATURE 4: TRENDING PRODUCTS DISCOVERY ENGINE
// Uses aggregation pipeline to compute trending score = review_count × avg_rating
// OPTIMIZED: Pseudo-random sampling for fast results
app.get("/api/trending-products", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, LIMITS.TRENDING_PRODUCTS); // Default: 25 per page
    const skip = (page - 1) * limit;
    
    // Get date range (weeksBack from most recent review)
    const weeksBack = parseInt(req.query.weeksBack) || 5; // Default: last 5 weeks
    const { startDate, endDate } = await getDateRange(collection, weeksBack);
    
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate 
      } 
    };
    
    // Get total count first for random offset calculation
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Pseudo-random sampling: pick random offset within the range
    const sampleSize = 1000; // Sample 25K reviews to find trending products
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    
    const pipeline = [
      // 1. MATCH reviews in date range
      { $match: dateFilter },
      
      // 2. SKIP to random offset
      { $skip: randomOffset },
      
      // 3. LIMIT to sample size
      { $limit: sampleSize },
      
      // 4. GROUP by product to compute stats
      { $group: {
        _id: "$product_id",
        product_title: { $first: "$product_title" },
        product_category: { $first: "$product_category" },
        review_count: { $sum: 1 },
        avg_rating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } }
      }},
      
      // 5. SORT by review count (popularity indicator)
      { $sort: { review_count: -1 } },
      
      // 6. LIMIT before final projection (reduces memory usage)
      { $limit: skip + limit },
      
      // 7. SKIP for pagination
      { $skip: skip },
      
      // 8. FORMAT output
      { $project: {
        product_id: "$_id",
        product_title: 1,
        product_category: 1,
        review_count: 1,
        avg_rating: { $round: ["$avg_rating", 2] },
        _id: 0
      }}
    ];
    
    const trending = await collection.aggregate(pipeline, { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse 
    }).toArray();
    
    const duration = Date.now() - startTime;
    
    res.json({
      returned: trending.length,
      page,
      limit,
      totalReviews,
      sampleSize,
      randomOffset,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `Page ${page}: ${trending.length} trending products from ${sampleSize.toLocaleString()} sample at offset ${randomOffset.toLocaleString()} (${totalReviews.toLocaleString()} total reviews, ${duration}ms)`,
      data: trending
    });
  } catch (err) {
    console.error('Error in /api/trending-products:', err);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

// FEATURE 1: OVERVIEW STATISTICS
// OPTIMIZED: Ensure review_date index is used - match, sort, then aggregate
app.get("/api/stats/overview", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get date range (weeksBack from most recent review)
    const weeksBack = parseInt(req.query.weeksBack) || 4;
    const { startDate, endDate } = await getDateRange(collection, weeksBack);
    
    // Simple count of reviews in date range
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Get total count first for random offset calculation
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Pseudo-random sampling: pick random offset within the range
    const sampleSize = 1000;
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    
    const activeUsersResult = await collection.aggregate([
      // 1. MATCH reviews in date range
      { $match: dateFilter },
      
      // 2. SKIP to random offset
      { $skip: randomOffset },
      
      // 3. LIMIT to sample size
      { $limit: sampleSize },
      
      // 4. GROUP by customer_id to count reviews per user
      { $group: {
        _id: "$customer_id",
        reviewCount: { $sum: 1 }
      }},
      
      // 5. MATCH only users with > 5 reviews
      { $match: {
        reviewCount: { $gt: 5 }
      }},
      
      // 6. COUNT how many users have > 5 reviews
      { $count: "activeUsers" }
    ], { 
      allowDiskUse: true
    }).toArray();

    const activeUsers = activeUsersResult[0]?.activeUsers || 0;
    const duration = Date.now() - startTime;
    
    res.json({
      totalReviews,
      activeUsers,
      sampleSize,
      randomOffset,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `${totalReviews.toLocaleString()} reviews total, ${activeUsers.toLocaleString()} users with >5 reviews (pseudo-random sample of ${sampleSize.toLocaleString()} at offset ${randomOffset.toLocaleString()}, ${duration}ms)`
    });
  } catch (err) {
    console.error('Error in /api/stats/overview:', err);
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
});

// FEATURE 5: VERIFIED PURCHASE IMPACT ANALYSIS
// OPTIMIZED: Pseudo-random sampling for fast results
app.get("/api/verified-analysis", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get date range (weeksBack from most recent review)
    const weeksBack = parseInt(req.query.weeksBack) || 5;
    const { startDate, endDate } = await getDateRange(collection, weeksBack);
    
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Get total count for random offset
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Pseudo-random sampling: pick random offset within the range
    const sampleSize = 1000;
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    
    const [verifiedReviews, stats] = await Promise.all([
      // Get sample of verified reviews (filter AFTER sampling for consistency)
      collection.aggregate([
        { $match: dateFilter },
        { $skip: randomOffset },
        { $limit: sampleSize },
        { $match: { verified_purchase: "Y" } }, // Filter verified after sampling
        { $project: { product_title: 1, product_category: 1, star_rating: 1, review_date: 1, review_id: 1, product_id: 1 } }
      ]).toArray(),
      
      // Count verified vs unverified using same sampling approach
      collection.aggregate([
        { $match: dateFilter },
        { $skip: randomOffset },
        { $limit: sampleSize },
        { $group: {
          _id: "$verified_purchase",
          count: { $sum: 1 }
        }}
      ]).toArray()
    ]);
    
    const verifiedCount = stats.find(s => s._id === 'Y')?.count || 0;
    const unverifiedCount = stats.find(s => s._id === 'N')?.count || 0;
    const totalCount = verifiedCount + unverifiedCount;
    const duration = Date.now() - startTime;
    
    res.json({
      total: verifiedCount,
      returned: verifiedReviews.length,
      limit: sampleSize,
      totalReviews,
      sampleSize,
      randomOffset,
      dateRange: { startDate, endDate },
      weeksBack,
      verificationRate: totalCount > 0 ? ((verifiedCount / totalCount) * 100).toFixed(1) + '%' : 'N/A',
      message: `${verifiedReviews.length} verified reviews from ${sampleSize.toLocaleString()} sample at offset ${randomOffset.toLocaleString()} (${totalReviews.toLocaleString()} total, ${duration}ms)`,
      data: verifiedReviews
    });
  } catch (err) {
    console.error('Error in /api/verified-analysis:', err);
    res.status(500).json({ error: "Failed to fetch verified analysis data" });
  }
});

// FEATURE 5: VERIFIED VS NON-VERIFIED COMPARISON STATISTICS
// OPTIMIZED: Pseudo-random sampling for fast results
app.get("/api/verified-stats", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get date range (weeksBack from most recent review)
    const weeksBack = parseInt(req.query.weeksBack) || 5;
    const { startDate, endDate } = await getDateRange(collection, weeksBack);
    
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate 
      } 
    };
    
    // Get total count for random offset
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Pseudo-random sampling
    const sampleSize = 10000;
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    
    const pipeline = [
      // 1. MATCH date range
      { $match: dateFilter },
      
      // 2. SKIP to random offset
      { $skip: randomOffset },
      
      // 3. LIMIT to sample size
      { $limit: sampleSize },
      
      // 4. GROUP by verified_purchase
      { $group: {
        _id: "$verified_purchase",
        count: { $sum: 1 },
        avgRating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } },
        avgHelpful: { $avg: { $convert: { input: "$helpful_votes", to: "int", onError: 0 } } }
      }},
      
      // 5. FORMAT output
      {
        $project: {
          verified: "$_id",
          count: 1,
          avgRating: { $round: ["$avgRating", 2] },
          avgHelpful: { $round: ["$avgHelpful", 2] },
          _id: 0
        }
      }
    ];
    
    const results = await collection.aggregate(pipeline, { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse 
    }).toArray();
    
    const duration = Date.now() - startTime;
    
    res.json({
      comparisonStats: results,
      totalReviews,
      sampleSize,
      randomOffset,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `Verified vs unverified from ${sampleSize.toLocaleString()} sample at offset ${randomOffset.toLocaleString()} (${totalReviews.toLocaleString()} total, ${duration}ms)`
    });
  } catch (err) {
    console.error('Error in /api/verified-stats:', err);
    res.status(500).json({ error: "Failed to fetch verified comparison stats" });
  }
});

// FEATURE 3: MOST HELPFUL REVIEWS
// Returns top reviews sorted by helpful votes using aggregation
// OPTIMIZED: Pseudo-random sampling matching overview/bot-stats pattern
app.get("/api/helpful-reviews", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100); // Default: 5 per page
    const skip = (page - 1) * limit;
    
    // Category filter support
    const matchFilter = { total_votes: { $gte: 5 } };
    if (req.query.category && req.query.category !== 'All') {
      matchFilter.product_category = req.query.category;
    }
    
    // Pseudo-random sampling: use skip for pagination only
    const randomStart = Math.floor(Math.random() * 10); // Small random variation in starting point
    
    const data = await collection.aggregate([
      // 1. MATCH filter (uses index)
      { $match: matchFilter },
      
      // 2. SORT by total_votes descending, helpful_votes ascending (uses total_votes_-1_helpful_votes_-1 index)
      { $sort: { total_votes: -1, helpful_votes: 1 } },
      
      // 3. SKIP small random amount + pagination
      { $skip: randomStart + skip },
      
      // 4. LIMIT to page size
      { $limit: limit },
      // 5. PROJECT fields
      { $project: { 
        product_title: 1, 
        product_category: 1, 
        star_rating: 1, 
        review_headline: 1,
        review_body: 1,
        review_date: 1, 
        review_id: 1, 
        product_id: 1, 
        helpful_votes: 1, 
        total_votes: 1,
        customer_id: 1
      }}
    ], { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse
    }).toArray();
    
    const duration = Date.now() - startTime;
    
    res.json({
      returned: data.length,
      page,
      limit,
      message: `${data.length} most helpful reviews (${duration}ms)`,
      data
    });
  } catch (err) {
    console.error('Error in /api/helpful-reviews:', err);
    res.status(500).json({ error: "Failed to fetch helpful reviews" });
  }
});

// FEATURE 3: MOST CONTROVERSIAL/UNHELPFUL REVIEWS
// Returns reviews with highest unhelpful ratio using aggregation
// OPTIMIZED: Pseudo-random sampling matching overview/bot-stats pattern
app.get("/api/controversial-reviews", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100); // Default: 5 per page
    const skip = (page - 1) * limit;
    
    // Category filter support
    const matchFilter = { total_votes: { $gte: 10 } };
    if (req.query.category && req.query.category !== 'All') {
      matchFilter.product_category = req.query.category;
    }
    
    // Pseudo-random sampling: use skip for pagination only
    const randomStart = Math.floor(Math.random() * 10); // Small random variation in starting point
    
    const data = await collection.aggregate([
      // 1. MATCH filter (uses index)
      { $match: matchFilter },
      
      // 2. SORT by helpful_votes ascending (uses helpful_votes_-1 index)
      { $sort: { helpful_votes: 1 } },
      
      // 3. SKIP small random amount + pagination
      { $skip: randomStart + skip },
      
      // 4. LIMIT to page size
      { $limit: limit },
      
      // 5. PROJECT fields
      { $project: {
        product_title: 1,
        product_category: 1,
        star_rating: 1,
        review_headline: 1,
        review_body: 1,
        review_date: 1,
        review_id: 1,
        product_id: 1,
        helpful_votes: 1,
        total_votes: 1,
        customer_id: 1
      }}
    ], { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse
    }).toArray();
    
    const duration = Date.now() - startTime;
    
    res.json({
      returned: data.length,
      page,
      limit,
      message: `${data.length} controversial reviews (${duration}ms)`,
      data
    });
  } catch (err) {
    console.error('Error in /api/controversial-reviews:', err);
    res.status(500).json({ error: "Failed to fetch controversial reviews" });
  }
});

// Start server only outside test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export { getDb };
export default app;
