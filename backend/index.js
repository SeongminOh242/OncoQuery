import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";


dotenv.config();

const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "localhost";
let db;

const app = express();

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
  return db;
}

// API routes fetching from MongoDB
app.get("/api/bot-data", async (req, res) => {
  try {
    const database = await getDb();
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.product_category = req.query.category;
    }

    const [data, total] = await Promise.all([
      database.collection("reviews").find(filter)
        .project({ product_title: 1, product_category: 1, star_rating: 1, review_date: 1, verified_purchase: 1, review_id: 1, product_id: 1, helpful_votes: 1, total_votes: 1 })
        .toArray(),
      database.collection("reviews").countDocuments(filter)
    ]);

    res.json({ total, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bot data" });
  }
});

app.get("/api/trending-products", async (req, res) => {
  try {
    const database = await getDb();
    
    // Full dataset approach: process all reviews and group by product
    const allReviews = await database.collection("reviews")
      .find({})
      .project({ product_id: 1, product_title: 1, product_category: 1, star_rating: 1 })
      .toArray();
    
    // Group by product_id and compute stats
    const productMap = {};
    allReviews.forEach(doc => {
      const pid = doc.product_id;
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id: pid,
          product_title: doc.product_title,
          product_category: doc.product_category,
          ratings: [],
          count: 0
        };
      }
      productMap[pid].ratings.push(parseInt(doc.star_rating || 0));
      productMap[pid].count++;
    });
    
    // Convert to array, compute avg_rating, and sort by count (trending)
    const trending = Object.values(productMap)
      .map(p => ({
        product_id: p.product_id,
        product_title: p.product_title,
        product_category: p.product_category,
        review_count: p.count,
        avg_rating: p.ratings.length > 0 ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.review_count - a.review_count);
    
    res.json(trending);
  } catch (err) {
    console.error('Error in /api/trending-products:', err);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

app.get("/api/stats/overview", async (req, res) => {
  try {
    const database = await getDb();
    const collection = database.collection("reviews");
    
    // Get exact counts from full dataset
    const totalReviews = await collection.countDocuments({});
    const verifiedReviews = await collection.countDocuments({ verified_purchase: "Y" });
    
    // Calculate average rating from all reviews
    const allReviews = await collection.find({})
      .project({ star_rating: 1 })
      .toArray();
    
    const ratingSum = allReviews.reduce((sum, doc) => sum + parseInt(doc.star_rating || 0), 0);
    const averageRating = allReviews.length > 0 ? (ratingSum / allReviews.length).toFixed(2) : 0;
    
    res.json({
      totalReviews,
      verifiedReviews,
      verifiedPercentage: totalReviews ? ((verifiedReviews / totalReviews) * 100).toFixed(2) : "0",
      averageRating: parseFloat(averageRating)
    });
  } catch (err) {
    console.error('Error in /api/stats/overview:', err);
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
});

app.get("/api/verified-analysis", async (req, res) => {
  try {
    const database = await getDb();
    const filter = { verified_purchase: "Y" };
    const [data, total] = await Promise.all([
      database.collection("reviews").find(filter)
        .project({ product_title: 1, product_category: 1, star_rating: 1, review_date: 1, review_id: 1, product_id: 1 })
        .toArray(),
      database.collection("reviews").countDocuments(filter)
    ]);
    
    res.json({ total, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch verified analysis" });
  }
});

// Start server only outside test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export { getDb };
export default app;
