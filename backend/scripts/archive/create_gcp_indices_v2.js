import { MongoClient } from "mongodb";

const mongoUrl = "mongodb://34.27.38.94:27017/oncoquery";
const dbName = "amazon";
const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });

(async () => {
  try {
    console.log("🔗 Connecting to GCP MongoDB at 34.27.38.94...");
    await client.connect();
    console.log("✓ Connected!\n");
    
    const db = client.db(dbName);
    const collection = db.collection("reviews");
    
    // Create all indices in parallel
    console.log("🔧 Creating 7 indices in parallel...\n");
    
    const indexPromises = [
      collection.createIndex({ customer_id: 1 }).then(() => "✓ customer_id_1"),
      collection.createIndex({ product_id: 1 }).then(() => "✓ product_id_1"),
      collection.createIndex({ review_date: -1 }).then(() => "✓ review_date_-1"),
      collection.createIndex({ verified_purchase: 1 }).then(() => "✓ verified_purchase_1"),
      collection.createIndex({ total_votes: -1 }).then(() => "✓ total_votes_-1"),
      collection.createIndex({ helpful_votes: -1 }).then(() => "✓ helpful_votes_-1"),
      collection.createIndex({ product_category: 1 }).then(() => "✓ product_category_1")
    ];
    
    const results = await Promise.allSettled(indexPromises);
    
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        console.log(result.value);
      } else {
        console.log(`❌ Index ${i}: ${result.reason.message}`);
      }
    });
    
    console.log("\n📊 Verifying indices...\n");
    const allIndexes = await collection.listIndexes().toArray();
    
    allIndexes.forEach((idx, i) => {
      console.log(`[${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\n✅ Total indices: ${allIndexes.length}`);
    console.log("✅ All indices created on GCP MongoDB!");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
