import { MongoClient } from "mongodb";

async function verifyAllIndices() {
  const mongoUrl = "mongodb://localhost:27017";
  const client = new MongoClient(mongoUrl);
  
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db("oncoquery");
    const collection = db.collection("reviews");
    
    console.log("\n✓ Connected to MongoDB\n");
    
    // Get all current indices
    const currentIndexes = await collection.listIndexes().toArray();
    const indexNames = currentIndexes.map(idx => idx.name);
    
    console.log("📊 CURRENT INDICES:");
    currentIndexes.forEach((idx, i) => {
      console.log(`  [${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Expected indices
    const expectedIndices = [
      { key: { customer_id: 1 }, expected: "customer_id_1" },
      { key: { product_id: 1 }, expected: "product_id_1" },
      { key: { review_date: -1 }, expected: "review_date_-1" },
      { key: { verified_purchase: 1 }, expected: "verified_purchase_1" },
      { key: { total_votes: -1 }, expected: "total_votes_-1" },
      { key: { helpful_votes: -1 }, expected: "helpful_votes_-1" },
      { key: { product_category: 1 }, expected: "product_category_1" }
    ];
    
    console.log("\n✅ INDEX VERIFICATION:");
    let allCreated = true;
    expectedIndices.forEach(idx => {
      const exists = indexNames.includes(idx.expected);
      const status = exists ? "✓" : "✗";
      console.log(`  ${status} ${idx.expected}`);
      if (!exists) allCreated = false;
    });
    
    console.log(`\n${allCreated ? "✓ All indices created!" : "⚠️ Some indices are missing"}`);
    console.log(`\nTotal indices: ${currentIndexes.length}/8 (including _id)`);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

verifyAllIndices();
