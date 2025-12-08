import { MongoClient } from "mongodb";

// GCP MongoDB connection
const mongoUrl = "mongodb://34.27.38.94:27017/oncoquery";
const dbName = "amazon";

const client = new MongoClient(mongoUrl);

(async () => {
  try {
    console.log("🔗 Connecting to GCP MongoDB...\n");
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection("reviews");
    
    console.log(`✓ Connected to ${dbName}.reviews\n`);
    console.log("🔧 Creating indices on GCP MongoDB...\n");
    
    const indices = [
      { spec: { customer_id: 1 }, name: "customer_id_1" },
      { spec: { product_id: 1 }, name: "product_id_1" },
      { spec: { review_date: -1 }, name: "review_date_-1" },
      { spec: { verified_purchase: 1 }, name: "verified_purchase_1" },
      { spec: { total_votes: -1 }, name: "total_votes_-1" },
      { spec: { helpful_votes: -1 }, name: "helpful_votes_-1" },
      { spec: { product_category: 1 }, name: "product_category_1" }
    ];
    
    const results = [];
    
    for (const idx of indices) {
      try {
        const result = await collection.createIndex(idx.spec);
        console.log(`✓ Created: ${result}`);
        results.push({ name: idx.name, status: "created" });
      } catch (err) {
        if (err.code === 85) {
          console.log(`⚠️ ${idx.name}: Already exists`);
          results.push({ name: idx.name, status: "already_exists" });
        } else {
          console.log(`❌ ${idx.name}: ${err.message}`);
          results.push({ name: idx.name, status: "error", error: err.message });
        }
      }
    }
    
    // Verify all indices
    console.log("\n📊 Verifying all indices on GCP:\n");
    const allIndexes = await collection.listIndexes().toArray();
    allIndexes.forEach((idx, i) => {
      console.log(`  [${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\n✓ Total indices: ${allIndexes.length}`);
    
    // Summary
    console.log("\n📈 Index Creation Summary:");
    const created = results.filter(r => r.status === "created").length;
    const existing = results.filter(r => r.status === "already_exists").length;
    const errors = results.filter(r => r.status === "error").length;
    
    console.log(`  ✓ Created: ${created}`);
    console.log(`  ⚠️ Already exist: ${existing}`);
    console.log(`  ❌ Errors: ${errors}`);
    
    if (errors === 0) {
      console.log("\n✅ All indices ready on GCP MongoDB!");
    }
    
  } catch (err) {
    console.error("❌ Connection error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
