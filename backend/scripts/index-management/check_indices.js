import { MongoClient } from "mongodb";

async function checkIndices() {
  const mongoUrl = "mongodb://localhost:27017";
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db("localhost");
    const collection = db.collection("reviews");
    
    // Get all indexes
    const indexes = await collection.listIndexes().toArray();
    
    console.log("\n✓ Connected to MongoDB");
    console.log(`\n📊 Total Indexes on 'reviews' collection: ${indexes.length}\n`);
    
    indexes.forEach((idx, i) => {
      console.log(`[${i}] Name: ${idx.name}`);
      console.log(`    Keys: ${JSON.stringify(idx.key)}`);
      if (idx.v !== undefined) console.log(`    Version: ${idx.v}`);
      console.log("");
    });
    
    // Check for specific indexes we created
    const expectedIndexes = [
      "customer_id_1",
      "product_id_1", 
      "review_date_-1",
      "verified_purchase_1",
      "total_votes_-1",
      "helpful_votes_-1",
      "product_category_1"
    ];
    
    console.log("✓ Index Creation Status:");
    expectedIndexes.forEach(idx => {
      const exists = indexes.some(i => i.name === idx);
      console.log(`  ${exists ? '✓' : '✗'} ${idx}`);
    });
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

checkIndices();
