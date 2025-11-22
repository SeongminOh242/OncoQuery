import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mockBotData, mockTrendingProducts, mockVerifiedAnalysis, COLORS } from "./mockData.js";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// mock data API routes
app.get("/api/bot-data", (req, res) => {
  res.json(mockBotData);
});

app.get("/api/trending-products", (req, res) => {
  res.json(mockTrendingProducts);
});

app.get("/api/verified-analysis", (req, res) => {
  res.json(mockVerifiedAnalysis);
});

app.get("/api/colors", (req, res) => {
  res.json(COLORS);
});

// port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
