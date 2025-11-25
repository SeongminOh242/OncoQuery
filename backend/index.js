import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// MongoDB connection
const mongoUrl = "mongodb://localhost:27017";
const dbName = "oncoquery";
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// API routes fetching from MongoDB
app.get("/api/bot-data", async (req, res) => {
  try {
    const data = await db.collection("reviews").find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bot data" });
  }
});

app.get("/api/trending-products", async (req, res) => {
  try {
    // Example: trending by star_rating
    const data = await db.collection("reviews").aggregate([
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
    // Example: only verified purchases
    const data = await db.collection("reviews").find({ verified_purchase: "Y" }).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch verified analysis" });
  }
});

// port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
