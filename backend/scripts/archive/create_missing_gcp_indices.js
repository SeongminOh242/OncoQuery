import { MongoClient } from "mongodb";

const mongoUrl = "mongodb://34.27.38.94:27017/oncoquery";
const dbName = "amazon";
const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 10000 });

(async () => {
  try {
    console.log("Connecting to GCP MongoDB...\n");
    await client.connect();
    console.log("✓ Connected!\n");
    
    const db = client.db(dbName);
    const collection = db.collection("reviews");
    
    console.log("Creating 6 missing indices sequentially...\n");
    
    const indices = [
      { spec: { product_id: 1 }, name: "product_id_1" },
      { spec: { review_date: -1 }, name: "review_date_-1" },
      { spec: { verified_purchase: 1 }, name: "verified_purchase_1" },
      { spec: { total_votes: -1 }, name: "total_votes_-1" },
      { spec: { helpful_votes: -1 }, name: "helpful_votes_-1" },
      { spec: { product_category: 1 }, name: "product_category_1" }
    ];
    
    for (const idx of indices) {
      try {
        console.log(`Creating ${idx.name}...`);
        const result = await collection.createIndex(idx.spec);
        console.log(`  ✓ ${result}\n`);
      } catch (err) {
        if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
          console.log(`  ⚠️  Already exists\n`);
        } else {
          console.log(`  ❌ Error: ${err.message}\n`);
        }
      }
    }
    
    // Verify
    console.log("═══════════════════════════════════════════\n");
    console.log("Verifying all indices...\n");
    const allIndexes = await collection.listIndexes().toArray();
    
    allIndexes.forEach((idx, i) => {
      console.log(`[${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\n✓ Total indices: ${allIndexes.length}/8`);
    
    if (allIndexes.length >= 8) {
      console.log("\n✅ ALL INDICES CREATED SUCCESSFULLY!");
    } else {
      console.log(`\n⚠️  Missing ${8 - allIndexes.length} indices`);
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
