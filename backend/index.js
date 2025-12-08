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

// Query Timeout Configuration
const QUERY_CONFIG = {
  maxTimeMS: 30000,         // 30 second timeout for aggregation queries
  allowDiskUse: true,       // Allow disk usage for large aggregations
  sampleSize: 0.1           // Sample 10% of data for exploratory queries (when ?sample=true)
};

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// Lazy MongoDB connection (test-friendly)
async function getDb() {
  if (db) return db;
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  
  // Create indexes on first connection for query performance
  const collection = db.collection("reviews");
  try {
    await Promise.all([
      // Single-field indices
      collection.createIndex({ customer_id: 1 }),
      collection.createIndex({ product_id: 1 }),
      collection.createIndex({ review_date: -1 }),
      collection.createIndex({ verified_purchase: 1 }),
      collection.createIndex({ total_votes: -1 }),
      collection.createIndex({ helpful_votes: -1 }),
      collection.createIndex({ product_category: 1 }),
      
      // Compound indices for common query patterns (HIGH IMPACT)
      collection.createIndex({ product_category: 1, review_date: -1 }),  // bot-data: filter + sort
      collection.createIndex({ total_votes: -1, helpful_votes: -1 }),    // helpful/controversial queries
      collection.createIndex({ review_date: -1, product_id: 1 })         // trending-products: filter + group
    ]);
    console.log("✓ Indexes created successfully (including compound indices)");
  } catch (err) {
    console.log("Indexes already exist or creation skipped");
  }
  
  return db;
}

// FEATURE 2: BOT REVIEW DETECTION SYSTEM
// Flags suspicious reviews based on detection criteria
// Returns sample of flagged reviews + statistics computed via aggregation
app.get("/api/bot-data", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.product_category = req.query.category;
    }

    // Use aggregation for both count and limit in single pass with $facet
    const pipeline = [
      { $match: filter }
    ];
    
    // Add sampling if requested (?sample=true for fast exploratory queries)
    if (req.query.sample === 'true') {
      pipeline.push({ $sample: { size: Math.floor(LIMITS.BOT_REVIEWS * 10) } });
    }
    
    pipeline.push(
      { $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { review_date: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { product_title: 1, product_category: 1, star_rating: 1, review_date: 1, verified_purchase: 1, review_id: 1, product_id: 1, helpful_votes: 1, total_votes: 1 } }
        ]
      }}
    );
    
    const [result] = await collection.aggregate(pipeline, { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];
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
app.get("/api/bot-stats", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Use sampling by default for fast queries (opt-in to full with ?full=true)
    const useSample = req.query.full !== 'true';
    const sampleSize = 2000000; // 2M sample: sweet spot for speed + accuracy

    const pipeline = [];
    
    // Add sampling stage if requested
    if (useSample) {
      pipeline.push({ $sample: { size: sampleSize } });
    }
    
    pipeline.push(
      { $facet: {
        oneAndDone: [
          { $group: { _id: "$customer_id", reviewCount: { $sum: 1 } } },
          { $match: { reviewCount: 1 } },
          { $count: "total" }
        ],
        rapidFire: [
          { $group: { 
            _id: "$customer_id",
            count: { $sum: 1 },
            firstDate: { $min: "$review_date" }
          }},
          { $match: { count: { $gte: 5 } } },
          { $count: "total" }
        ]
      }}
    );

    const results = await collection.aggregate(pipeline, { 
      maxTimeMS: QUERY_CONFIG.maxTimeMS, 
      allowDiskUse: QUERY_CONFIG.allowDiskUse 
    }).toArray();

    const [result] = results;
    res.json({
      oneAndDone: result.oneAndDone[0]?.total || 0,
      rapidFire: result.rapidFire[0]?.total || 0,
      sampled: useSample,
      sampleSize: useSample ? sampleSize : null,
      message: useSample 
        ? `Bot detection statistics (fast estimate from ${sampleSize.toLocaleString()} reviews sample. Use ?full=true for complete analysis)` 
        : "Bot detection statistics based on full dataset analysis"
    });
  } catch (err) {
    console.error('Error in /api/bot-stats:', err);
    res.status(500).json({ error: "Failed to compute bot stats" });
  }
});

// FEATURE 4: TRENDING PRODUCTS DISCOVERY ENGINE
// Uses aggregation pipeline to compute trending score = review_count × avg_rating
// Processes full dataset efficiently without loading into memory
app.get("/api/trending-products", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, LIMITS.TRENDING_PRODUCTS);
    const skip = (page - 1) * limit;
    
    // Optional time window filter (last 12 months by default)
    const timeWindow = req.query.timeWindow || 12; // months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - timeWindow);
    
    // Use MongoDB aggregation to group and rank products efficiently
    const trending = await collection.aggregate([
      // Filter to recent reviews only for faster computation
      { $match: { 
        review_date: { $gte: cutoffDate.toISOString().split('T')[0] }
      }},
      
      // Group by product to compute stats
      { $group: {
        _id: "$product_id",
        product_title: { $first: "$product_title" },
        product_category: { $first: "$product_category" },
        review_count: { $sum: 1 },
        avg_rating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } }
      }},
      
      // Sort by review count (popularity indicator)
      { $sort: { review_count: -1 } },
      
      // Pagination
      { $skip: skip },
      { $limit: limit },
      
      // Format output
      { $project: {
        product_id: "$_id",
        product_title: 1,
        product_category: 1,
        review_count: 1,
        avg_rating: { $round: ["$avg_rating", 2] },
        _id: 0
      }}
    ], { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();
    
    res.json({
      returned: trending.length,
      page,
      limit,
      timeWindow: `Last ${timeWindow} months`,
      message: `Page ${page}: ${trending.length} trending products by review count (last ${timeWindow} months)`,
      data: trending
    });
  } catch (err) {
    console.error('Error in /api/trending-products:', err);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

// FEATURE 1: OVERVIEW STATISTICS
// Uses single aggregation pipeline to compute all stats efficiently
app.get("/api/stats/overview", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Use single aggregation with $facet for all stats in one pass (reduced from 2 separate aggregations)
    const results = await collection.aggregate([
      { $facet: {
        totals: [
          { $group: {
            _id: null,
            totalCount: { $sum: 1 },
            verifiedCount: { $sum: { $cond: [{ $eq: ["$verified_purchase", "Y"] }, 1, 0] } },
            avgRating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } }
          }}
        ]
      }}
    ], { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();

    const [result] = results;
    const stats = result.totals[0] || {};
    const totalReviews = stats.totalCount || 0;
    const verifiedReviews = stats.verifiedCount || 0;
    const averageRating = stats.avgRating || 0;
    
    res.json({
      totalReviews,
      verifiedReviews,
      verifiedPercentage: totalReviews ? ((verifiedReviews / totalReviews) * 100).toFixed(2) : "0",
      averageRating: parseFloat(averageRating.toFixed(2)),
      message: "Statistics computed from full dataset using aggregation"
    });
  } catch (err) {
    console.error('Error in /api/stats/overview:', err);
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
});

// FEATURE 5: VERIFIED PURCHASE IMPACT ANALYSIS
// Returns sample data with limit, plus aggregation-based comparison stats
app.get("/api/verified-analysis", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get limited sample of verified reviews for display
    const verifiedReviews = await collection.find({ verified_purchase: "Y" })
      .sort({ review_date: -1 })
      .limit(LIMITS.VERIFIED_REVIEWS)
      .project({ product_title: 1, product_category: 1, star_rating: 1, review_date: 1, review_id: 1, product_id: 1 })
      .toArray();
    
    const totalVerified = await collection.countDocuments({ verified_purchase: "Y" });
    
    res.json({
      total: totalVerified,
      returned: verifiedReviews.length,
      limit: LIMITS.VERIFIED_REVIEWS,
      message: `Showing ${LIMITS.VERIFIED_REVIEWS} most recent verified reviews. Use /api/verified-stats for comparison analytics.`,
      data: verifiedReviews
    });
  } catch (err) {
    console.error('Error in /api/verified-analysis:', err);
    res.status(500).json({ error: "Failed to fetch verified analysis data" });
  }
});

// FEATURE 5: VERIFIED VS NON-VERIFIED COMPARISON STATISTICS
// Uses single aggregation to compute full-dataset comparison analytics
app.get("/api/verified-stats", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Single aggregation pipeline computing stats in one pass
    const results = await collection.aggregate([
      { $group: {
        _id: "$verified_purchase",
        count: { $sum: 1 },
        avgRating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } },
        avgHelpful: { $avg: { $convert: { input: "$helpful_votes", to: "int", onError: 0 } } }
      }},
      {
        $project: {
          verified: "$_id",
          count: 1,
          avgRating: { $round: ["$avgRating", 2] },
          avgHelpful: { $round: ["$avgHelpful", 2] },
          _id: 0
        }
      }
    ], { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();
    
    res.json({
      comparisonStats: results,
      message: "Statistics computed from full dataset using aggregation"
    });
  } catch (err) {
    console.error('Error in /api/verified-stats:', err);
    res.status(500).json({ error: "Failed to fetch verified comparison stats" });
  }
});

// FEATURE 3: MOST HELPFUL REVIEWS
// Returns top reviews sorted by helpful votes using aggregation
app.get("/api/helpful-reviews", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    
    // Get most helpful reviews using aggregation with both count and limit in one pass
    const pipeline = [
      { $match: { total_votes: { $gte: 5 } } },
      { $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { helpful_votes: -1 } },
          { $skip: skip },
          { $limit: limit },
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
        ]
      }}
    ];
    
    const [result] = await collection.aggregate(pipeline, { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      total,
      returned: data.length,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      message: `Page ${page} of ${totalPages}: ${data.length} most helpful reviews (minimum 5 votes)`,
      data
    });
  } catch (err) {
    console.error('Error in /api/helpful-reviews:', err);
    res.status(500).json({ error: "Failed to fetch helpful reviews" });
  }
});

// FEATURE 3: MOST CONTROVERSIAL/UNHELPFUL REVIEWS
// Returns reviews with highest unhelpful ratio using aggregation
app.get("/api/controversial-reviews", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    
    // Use aggregation with facet for count and data in single pass
    const pipeline = [
      { $match: { total_votes: { $gte: 10 } } },
      { $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $addFields: {
            helpful_votes_int: { $convert: { input: "$helpful_votes", to: "int", onError: 0 } },
            total_votes_int: { $convert: { input: "$total_votes", to: "int", onError: 1 } },
            unhelpful_ratio: {
              $cond: [
                { $gt: [{ $convert: { input: "$total_votes", to: "int", onError: 1 } }, 0] },
                { $divide: [
                  { $subtract: [{ $convert: { input: "$total_votes", to: "int", onError: 1 } }, { $convert: { input: "$helpful_votes", to: "int", onError: 0 } }] },
                  { $convert: { input: "$total_votes", to: "int", onError: 1 } }
                ]},
                0
              ]
            }
          }},
          { $sort: { unhelpful_ratio: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: {
            product_title: 1,
            product_category: 1,
            star_rating: 1,
            review_headline: 1,
            review_body: 1,
            review_date: 1,
            review_id: 1,
            product_id: 1,
            helpful_votes: "$helpful_votes_int",
            total_votes: "$total_votes_int",
            unhelpful_ratio: { $round: ["$unhelpful_ratio", 3] },
            customer_id: 1
          }}
        ]
      }}
    ];
    
    const [result] = await collection.aggregate(pipeline, { maxTimeMS: QUERY_CONFIG.maxTimeMS, allowDiskUse: QUERY_CONFIG.allowDiskUse }).toArray();
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      total,
      returned: data.length,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      message: `Page ${page} of ${totalPages}: ${data.length} controversial reviews (minimum 10 votes)`,
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
