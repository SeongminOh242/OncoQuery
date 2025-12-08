import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

client.connect().then(async () => {
  const db = client.db("oncoquery");
  const indexes = await db.collection("reviews").listIndexes().toArray();
  
  console.log("\n✓ Connected to MongoDB\n");
  console.log("📊 INDICES ON 'reviews' COLLECTION:\n");
  
  indexes.forEach((idx, i) => {
    const keyStr = Object.entries(idx.key)
      .map(([k, v]) => `${k}: ${v > 0 ? 'asc' : 'desc'}`)
      .join(', ');
    console.log(`  [${i}] ${idx.name}`);
    console.log(`       ${keyStr}\n`);
  });
  
  // Check status
  const expectedCount = 8; // 7 + _id
  console.log(`✓ Total indices: ${indexes.length}/${expectedCount}`);
  
  const required = ["customer_id_1", "product_id_1", "review_date_-1", 
                    "verified_purchase_1", "total_votes_-1", 
                    "helpful_votes_-1", "product_category_1"];
  const created = required.filter(r => indexes.some(i => i.name === r));
  console.log(`✓ Required indices created: ${created.length}/${required.length}`);
  
  if (created.length < required.length) {
    const missing = required.filter(r => !indexes.some(i => i.name === r));
    console.log(`⚠️ Missing: ${missing.join(", ")}`);
  }
  
  await client.close();
  process.exit(0);
}).catch(err => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
