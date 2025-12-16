

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";


dotenv.config();

const mongoUrl = process.env.MONGO_URI || "mongodb://136.119.60.82:27017/oncoquery";
const dbName = process.env.MONGO_DB_NAME || "oncoquery";
let db;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Configuration
const LIMITS = {
  BOT_REVIEWS: 1000,        // Feature 2: Display sample of flagged reviews (reduced from 5000)
  TRENDING_PRODUCTS: 100,   // Feature 4: Top trending products (reduced from 500)
  VERIFIED_REVIEWS: 1000,   // Feature 5: Sample verified reviews for display (reduced from 5000)
  HELPFUL_REVIEWS: 500      // Feature 3: Helpful reviews per query (reduced from 1000)
};

// Early-limit configuration for fast-but-partial aggregations
const EARLY_LIMIT = Math.min(parseInt(process.env.EARLY_LIMIT || "100000", 10), 2000000);

// Query Timeout Configuration
const QUERY_CONFIG = {
  maxTimeMS: 30000,         // 30 second timeout for aggregation queries
  allowDiskUse: true,       // Allow disk usage for large aggregations
  sampleSize: 0.1           // Sample 10% of data for exploratory queries (when ?sample=true)
};

// Cache for dataset date range (to avoid repeated queries)
let datasetMaxDate = null;

// Helper: Get date range going backwards from most recent review
async function getDateRange(collection, weeksBack = 4) {
  // Support dynamic year/month/week
  const args = arguments;
  let weeksBackArg = weeksBack;
  let year, month, week;
  if (args.length > 2) {
    year = args[2];
    month = args[3];
    week = args[4];
  }
  const y = parseInt(year);
  const m = month ? parseInt(month) - 1 : 0;
  const w = week ? parseInt(week) : null;
  const validYear = year && !isNaN(y) && y > 1900 && y < 2100;
  const validMonth = month && !isNaN(parseInt(month)) && parseInt(month) >= 1 && parseInt(month) <= 12;
  const validWeek = week && !isNaN(parseInt(week)) && parseInt(week) >= 1 && parseInt(week) <= 5;
  if (validYear) {
    let startDateObj, endDateObj;
    if (validWeek) {
      startDateObj = new Date(Date.UTC(y, m, 1));
      startDateObj.setUTCDate(1 + (w - 1) * 7);
      endDateObj = new Date(startDateObj);
      endDateObj.setUTCDate(startDateObj.getUTCDate() + 6);
    } else if (validMonth) {
      startDateObj = new Date(Date.UTC(y, m, 1));
      endDateObj = new Date(Date.UTC(y, m + 1, 0));
    } else {
      startDateObj = new Date(Date.UTC(y, 0, 1));
      endDateObj = new Date(Date.UTC(y, 11, 31));
    }
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      // Fallback to weeksBack if invalid
      const endDate = '2015-08-31';
      const endDateObj = new Date(endDate);
      const startDateObj = new Date(endDateObj);
      startDateObj.setDate(startDateObj.getDate() - (weeksBackArg * 7));
      const startDate = startDateObj.toISOString().split('T')[0];
      return { startDate, endDate };
    }
    const startDate = startDateObj.toISOString().split('T')[0];
    const endDate = endDateObj.toISOString().split('T')[0];
    return { startDate, endDate };
  }
  // Use the known max date from the dataset
  const endDate = '2015-08-31';
  const endDateObj = new Date(endDate);
  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - (weeksBackArg * 7));
  const startDate = startDateObj.toISOString().split('T')[0];
  return { startDate, endDate };
}



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

// Endpoint to get all distinct product categories
app.get("/api/categories", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    let categories = await collection.distinct("product_category");
    
    // Generalized filter: remove categories that look like dates, are too long, contain HTML, or are mostly non-alphabetic
    categories = categories.filter(c => {
      if (!c || c === "All") return false;
      if (typeof c !== "string") return false;
      // Remove if looks like a date (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return false;
      // Remove if contains HTML tags or entities
      if (/<[^>]+>|&#\d+;|&[a-z]+;/.test(c)) return false;
      // Remove if too long (e.g., > 40 chars)
      if (c.length > 40) return false;
      // Remove if less than 2 alphabetic characters
      if ((c.match(/[a-zA-Z]/g) || []).length < 2) return false;
      // Remove if more than 60% of chars are non-alphabetic
      const alphaCount = (c.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount / c.length < 0.4) return false;
      return true;
    });
    categories.sort();
    // console.log("Fetched categories from DB:", categories);
    res.json({ categories: ["All", ...categories] });
  } catch (err) {
    console.error("Error in /api/categories:", err);
    
    res.status(500).json({ categories: ["All"], error: "Failed to fetch categories" });
  }
});

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
    
    // Time frame support
  const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 1;
    const { year, month, week, category } = req.query;
    const { startDate, endDate } = await getDateRange(await getDb().then(db => db.collection("reviews")), weeksBack, year, month, week);
    const filter = {
      review_date: { $gte: startDate, $lte: endDate }
    };
    if (category && category !== 'All') {
      filter.product_category = category;
    }

    // Use compound index when filtering by category, date index otherwise
    const sortKey = Object.keys(filter).length > 1 && filter.product_category
      ? { product_category: 1, review_date: -1 }
      : { review_date: -1 };

    const pipeline = [
      { $match: filter },
      { $sort: sortKey },
      { $limit: skip + limit },  // Limit early to reduce memory
      { $skip: skip },
      { $limit: limit },
      // Lookup review count for each customer_id
      { $lookup: {
         from: "reviews",
         let: { cid: "$customer_id" },
         pipeline: [
           { $match: { $expr: { $eq: ["$customer_id", "$$cid"] } } },
           { $count: "count" }
         ],
         as: "user_review_count"
      }},
      { $addFields: {
         user_review_count: { $ifNull: [ { $arrayElemAt: [ "$user_review_count.count", 0 ] }, 1 ] }
      }},
      { $project: { product_title: 1, product_category: 1, star_rating: 1, review_date: 1, verified_purchase: 1, review_id: 1, product_id: 1, helpful_votes: 1, total_votes: 1, customer_id: 1, user_review_count: 1 } }
    ];
    
    // Fetch data only - no count operation (instant response)
    const [data, estimatedTotal] = await Promise.all([
      collection.aggregate(pipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse,
        hint: Object.keys(filter).length > 0 && filter.product_category 
          ? { product_category: 1, review_date: -1 }  // Force index usage
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
  const weeksBack = parseInt(req.query.weeksBack) || 1; // Default: last 1 week
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
    
    // Dynamic time frame
  const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 1;
    const { year, month, week, category } = req.query;
    const { startDate, endDate } = await getDateRange(collection, weeksBack, year, month, week);
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate 
      }
    };
    if (category && category !== 'All') {
      dateFilter.product_category = category;
    }
    
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
        avg_rating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } },
        review_dates: { $push: "$review_date" }
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
        review_dates: 1,
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

// Overview meta endpoint: database size, date range, categories
app.get("/api/overview-meta", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    const [size, earliestDocs, latestDocs, categories] = await Promise.all([
      collection.estimatedDocumentCount(),
      collection.find({ review_date: { $regex: /^\d{4}-\d{2}-\d{2}$/ } }).sort({ review_date: 1 }).limit(10).toArray(),
      collection.find({ review_date: { $regex: /^\d{4}-\d{2}-\d{2}$/ } }).sort({ review_date: -1 }).limit(10).toArray(),
      collection.distinct("product_category")
    ]);
    // Debug: log earliestDocs
//     console.log('DEBUG overview-meta: earliestDocs =', Array.isArray(earliestDocs) ? earliestDocs : 'not an array');
    // Only consider review_date values that are valid YYYY-MM-DD
    let earliestDate = null;
    if (Array.isArray(earliestDocs)) {
      const validDates = earliestDocs
        .map(doc => (doc && typeof doc.review_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(doc.review_date)) ? doc.review_date : null)
        .filter(Boolean)
        .sort();
      if (validDates.length > 0) {
        earliestDate = validDates[0];
      }
    }
    let latestDate = null;
    if (Array.isArray(latestDocs)) {
      const validDates = latestDocs
        .map(doc => (doc && typeof doc.review_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(doc.review_date)) ? doc.review_date : null)
        .filter(Boolean)
        .sort();
      if (validDates.length > 0) {
        latestDate = validDates[validDates.length - 1];
      }
    }
//     console.log('DEBUG overview-meta: computed earliestDate =', earliestDate, 'latestDate =', latestDate);
    const filteredCategories = (categories || []).filter(c => {
      if (!c || c === "All") return false;
      if (typeof c !== "string") return false;
      if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return false;
      if (/<[^>]+>|&#\d+;|&[a-z]+;/.test(c)) return false;
      if (c.length > 40) return false;
      if ((c.match(/[a-zA-Z]/g) || []).length < 2) return false;
      const alphaCount = (c.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount / c.length < 0.4) return false;
      return true;
    });
    res.json({
      size,
      earliestDate,
      latestDate,
      categories: ["All", ...filteredCategories.sort()]
    });
  } catch (err) {
    console.error("Error in /api/overview-meta:", err);
    res.status(500).json({ error: "Failed to fetch overview meta" });
  }
});

// FEATURE 5: VERIFIED PURCHASE IMPACT ANALYSIS
// OPTIMIZED: Pseudo-random sampling for fast results
app.get("/api/verified-analysis", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const skip = (page - 1) * limit;
    // Dynamic time frame
  const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 1;
    const { year, month, week, category } = req.query;
    const { startDate, endDate } = await getDateRange(collection, weeksBack, year, month, week);
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate
      }
    };
    // Add category filter if provided and not 'All'
    if (category && category !== 'All') {
      dateFilter.product_category = category;
    }
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
        { $match: { verified_purchase: "Y" } },
        { $project: { product_title: 1, product_category: 1, star_rating: 1, review_date: 1, review_id: 1, product_id: 1 } },
        { $limit: skip + limit },
        { $skip: skip },
        { $limit: limit }
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
    const totalPages = Math.ceil(verifiedCount / limit);
    res.json({
      total: verifiedCount,
      returned: verifiedReviews.length,
      page,
      limit,
      totalReviews,
      sampleSize,
      randomOffset,
      totalPages,
      hasMore: page < totalPages,
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
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const skip = (page - 1) * limit;
    // Dynamic time frame
  const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 1;
    const { year, month, week, category } = req.query;
    const { startDate, endDate } = await getDateRange(collection, weeksBack, year, month, week);
    const dateFilter = {
      review_date: {
        $gte: startDate,
        $lte: endDate 
      } 
    };
    // Add category filter if provided and not 'All'
    if (category && category !== 'All') {
      dateFilter.product_category = category;
    }
    // Get total count for random offset
    const totalReviews = await collection.countDocuments(dateFilter);
    // Pseudo-random sampling
    const sampleSize = 10000;
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalReviews - sampleSize));
    const pipeline = [
      // 1. MATCH date range and category
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
      },
      // 6. Pagination for stats array (simulate pagination on grouped results)
      { $limit: skip + limit },
      { $skip: skip },
      { $limit: limit }
    ];
    const results = await collection.aggregate(pipeline, { 
      allowDiskUse: QUERY_CONFIG.allowDiskUse 
    }).toArray();
    const duration = Date.now() - startTime;
    const totalStats = results.length > 0 ? results.reduce((acc, cur) => acc + (cur.count || 0), 0) : 0;
    const totalPages = Math.ceil(totalStats / limit);
    res.json({
      comparisonStats: results,
      page,
      limit,
      totalReviews,
      sampleSize,
      randomOffset,
      totalPages,
      hasMore: page < totalPages,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `Verified vs unverified from ${sampleSize.toLocaleString()} sample at offset ${randomOffset.toLocaleString()} (${totalReviews.toLocaleString()} total, ${duration}ms)`
    });
  } catch (err) {
    console.error('Error in /api/verified-stats:', err);
    res.status(500).json({ error: "Failed to fetch verified comparison stats" });
  }
});

app.get("/api/helpful-reviews", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const skip = (page - 1) * limit;
    
        // Dynamic time frame
    const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 1;
        const { year, month, week } = req.query;
        const { startDate, endDate } = await getDateRange(collection, weeksBack, year, month, week);
    
    const dateFilter = {
      review_date: { $gte: startDate, $lte: endDate }
    };
    
    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      dateFilter.product_category = req.query.category;
    }
    
    // Get total count for deterministic sampling
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Use deterministic "random" offset based on query parameters
    // This ensures all pages use the same sample for consistent sorting
    const sampleSize = 1000;
    const queryKey = `${startDate}-${endDate}-${req.query.category || 'All'}`;
    // Simple hash function to generate consistent offset
    let hash = 0;
    for (let i = 0; i < queryKey.length; i++) {
      const char = queryKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const randomOffset = Math.abs(hash) % Math.max(1, totalReviews - sampleSize);
    
    // Count pipeline to get total matching items (after sampling and filtering)
    const countPipeline = [
      // 1. MATCH reviews in date range (and category if provided)
      { $match: dateFilter },
      
      // 2. Sort by _id for consistent ordering before sampling
      { $sort: { _id: 1 } },
      
      // 3. SKIP to deterministic offset (consistent sampling)
      { $skip: randomOffset },
      
      // 4. LIMIT to sample size
      { $limit: sampleSize },
      
      // 5. Convert vote fields to numbers for proper filtering
      { $addFields: {
        helpful_votes_num: { 
          $convert: { 
            input: "$helpful_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        },
        total_votes_num: { 
          $convert: { 
            input: "$total_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        }
      }},
      
      // 6. Filter by votes AFTER conversion
      { $match: { total_votes_num: { $gte: 5 } } },
      
      // 7. Count total matching items
      { $count: "total" }
    ];
    
    const dataPipeline = [
      // 1. MATCH reviews in date range (and category if provided)
      { $match: dateFilter },
      
      // 2. Sort by _id for consistent ordering before sampling
      { $sort: { _id: 1 } },
      
      // 3. SKIP to deterministic offset (consistent sampling)
      { $skip: randomOffset },
      
      // 4. LIMIT to sample size
      { $limit: sampleSize },
      
      // 5. Convert vote fields to numbers for proper filtering and sorting
      { $addFields: {
        helpful_votes_num: { 
          $convert: { 
            input: "$helpful_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        },
        total_votes_num: { 
          $convert: { 
            input: "$total_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        }
      }},
      
      // 6. Filter by votes AFTER conversion
      { $match: { total_votes_num: { $gte: 5 } } },
      
      // 7. Sort using converted numeric fields (sort within the consistent sample)
      { $sort: { helpful_votes_num: -1, total_votes_num: -1 } },
      
      // 8. Apply pagination (skip and limit after sorting)
      { $skip: skip },
      { $limit: limit },
      
      // 8. Project final fields
      { $project: { 
        product_title: 1, product_category: 1, star_rating: 1, 
        review_headline: 1, review_body: 1, review_date: 1, 
        review_id: 1, product_id: 1, 
        helpful_votes: 1,  // Keep original field
        total_votes: 1,     // Keep original field
        customer_id: 1
      }}
    ];
    
    // Get count and data in parallel
    const [countResult, data] = await Promise.all([
      collection.aggregate(countPipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse
      }).toArray(),
      collection.aggregate(dataPipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse
      }).toArray()
    ]);
    
    const totalMatchingItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalMatchingItems / limit);
    const duration = Date.now() - startTime;
    
    res.json({
      returned: data.length,
      page,
      limit,
      totalMatchingItems,
      totalPages,
      hasMore: page < totalPages && data.length === limit,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `${data.length} most helpful reviews from ${sampleSize.toLocaleString()} sample (${totalMatchingItems.toLocaleString()} total matching, ${duration}ms)`,
      data
    });
  } catch (err) {
    console.error("Error in /api/helpful-reviews:", err);
    res.status(500).json({ error: "Failed to fetch helpful reviews", details: err.message });
  }
});

app.get("/api/controversial-reviews", async (req, res) => {
  const startTime = Date.now();
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const skip = (page - 1) * limit;
    
        // Dynamic time frame
        const weeksBack = req.query.weeksBack ? parseInt(req.query.weeksBack) : 5;
        const { year, month, week } = req.query;
        const { startDate, endDate } = await getDateRange(collection, weeksBack, year, month, week);
    
    const dateFilter = {
      review_date: { $gte: startDate, $lte: endDate }
    };
    
    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      dateFilter.product_category = req.query.category;
    }
    
    // Get total count for deterministic sampling
    const totalReviews = await collection.countDocuments(dateFilter);
    
    // Use deterministic "random" offset based on query parameters
    // This ensures all pages use the same sample for consistent sorting
    const sampleSize = 1000;
    const queryKey = `${startDate}-${endDate}-${req.query.category || 'All'}`;
    // Simple hash function to generate consistent offset
    let hash = 0;
    for (let i = 0; i < queryKey.length; i++) {
      const char = queryKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const randomOffset = Math.abs(hash) % Math.max(1, totalReviews - sampleSize);
    
    // Count pipeline to get total matching items (after sampling and filtering)
    const countPipeline = [
      // 1. MATCH reviews in date range (and category if provided)
      { $match: dateFilter },
      // 2. Sort by _id for consistent ordering before sampling
      { $sort: { _id: 1 } },
      // 3. SKIP to deterministic offset (consistent sampling)
      { $skip: randomOffset },
      // 4. LIMIT to sample size
      { $limit: sampleSize },
      // 5. Convert vote fields to numbers
      { $addFields: {
        helpful_votes_num: { 
          $convert: { 
            input: "$helpful_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        },
        total_votes_num: { 
          $convert: { 
            input: "$total_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        }
      }},
      // 6. Calculate unhelpful votes using already converted fields
      { $addFields: {
        unhelpful_votes_num: {
          $subtract: ["$total_votes_num", "$helpful_votes_num"]
        }
      }},
      // 7. Filter by votes AFTER conversion
      { $match: { total_votes_num: { $gte: 10 } } },
      // 8. Count total matching items
      { $count: "total" }
    ];
    
    const dataPipeline = [
      // 1. MATCH reviews in date range (and category if provided)
      { $match: dateFilter },
      // 2. Sort by _id for consistent ordering before sampling
      { $sort: { _id: 1 } },
      // 3. SKIP to deterministic offset (consistent sampling)
      { $skip: randomOffset },
      // 4. LIMIT to sample size
      { $limit: sampleSize },
      // 5. Convert vote fields to numbers
      { $addFields: {
        helpful_votes_num: { 
          $convert: { 
            input: "$helpful_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        },
        total_votes_num: { 
          $convert: { 
            input: "$total_votes", 
            to: "int", 
            onError: 0,
            onNull: 0
          } 
        }
      }},
      // 6. Calculate unhelpful votes using already converted fields
      { $addFields: {
        unhelpful_votes_num: {
          $subtract: ["$total_votes_num", "$helpful_votes_num"]
        }
      }},
      // 7. Filter by votes AFTER conversion
      { $match: { total_votes_num: { $gte: 10 } } },
      // 8. Calculate controversy_score BEFORE sorting (percentage of unhelpful votes)
      { $addFields: {
        controversy_score: {
          $cond: [
            { $gt: ["$total_votes_num", 0] },
            { $round: [{ $multiply: [{ $divide: ["$unhelpful_votes_num", "$total_votes_num"] }, 100] }, 1] },
            0
          ]
        }
      }},
      // 9. Sort by controversy_score descending (most controversial first), then by total_votes descending
      { $sort: { controversy_score: -1, total_votes_num: -1 } },
      // 10. Apply pagination
      { $skip: skip },
      { $limit: limit },
      // 11. Project final fields
      { $project: {
        product_title: 1, product_category: 1, star_rating: 1,
        review_headline: 1, review_body: 1, review_date: 1,
        review_id: 1, product_id: 1, 
        helpful_votes: 1,  // Keep original
        total_votes: 1,    // Keep original
        customer_id: 1,
        unhelpful_votes: "$unhelpful_votes_num",
        controversy_score: 1  // Use already calculated value
      }}
    ];
    
    // Get count and data in parallel
    const [countResult, data] = await Promise.all([
      collection.aggregate(countPipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse
      }).toArray(),
      collection.aggregate(dataPipeline, { 
        allowDiskUse: QUERY_CONFIG.allowDiskUse
      }).toArray()
    ]);
    
    const totalMatchingItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalMatchingItems / limit);
    const duration = Date.now() - startTime;
    
    res.json({
      returned: data.length,
      page,
      limit,
      totalMatchingItems,
      totalPages,
      hasMore: page < totalPages && data.length === limit,
      dateRange: { startDate, endDate },
      weeksBack,
      message: `${data.length} controversial reviews from ${sampleSize.toLocaleString()} sample (${totalMatchingItems.toLocaleString()} total matching, ${duration}ms)`,
      data
    });
  } catch (err) {
    console.error("Error in /api/controversial-reviews:", err);
    res.status(500).json({ error: "Failed to fetch controversial reviews", details: err.message });
  }
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});