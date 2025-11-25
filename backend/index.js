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
    const data = await database.collection("reviews").find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bot data" });
  }
});

app.get("/api/trending-products", async (req, res) => {
  try {
    const database = await getDb();
    const data = await database.collection("reviews").aggregate([
      { $group: { _id: "$product_id", avg_rating: { $avg: { $toInt: "$star_rating" } }, count: { $sum: 1 } } },
      { $sort: { avg_rating: -1, count: -1 } },
      { $limit: 10 }
    ]).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

app.get("/api/verified-analysis", async (req, res) => {
  try {
    const database = await getDb();
    const data = await database.collection("reviews").find({ verified_purchase: "Y" }).toArray();
    res.json(data);
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
