import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

(async () => {
  try {
    await client.connect();
    const collection = client.db("oncoquery").collection("reviews");
    
    console.log("\n🔧 Creating remaining indices on 'reviews' collection...\n");
    
    const indices = [
      { spec: { verified_purchase: 1 }, name: "verified_purchase_1" },
      { spec: { total_votes: -1 }, name: "total_votes_-1" },
      { spec: { helpful_votes: -1 }, name: "helpful_votes_-1" },
      { spec: { product_category: 1 }, name: "product_category_1" }
    ];
    
    for (const idx of indices) {
      try {
        const result = await collection.createIndex(idx.spec);
        console.log(`✓ Created: ${result}`);
      } catch (err) {
        if (err.code === 85) {
          console.log(`⚠️ ${idx.name}: Index already exists`);
        } else {
          console.log(`❌ ${idx.name}: ${err.message}`);
        }
      }
    }
    
    // Verify all indices
    console.log("\n📊 Verifying all indices:\n");
    const allIndexes = await collection.listIndexes().toArray();
    allIndexes.forEach((idx, i) => {
      console.log(`  [${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\n✓ Total indices: ${allIndexes.length}`);
    
    // Check if all required indices exist
    const required = ["customer_id_1", "product_id_1", "review_date_-1", 
                      "verified_purchase_1", "total_votes_-1", 
                      "helpful_votes_-1", "product_category_1"];
    const indexNames = allIndexes.map(i => i.name);
    const allCreated = required.every(r => indexNames.includes(r));
    
    console.log(allCreated ? "\n✅ ALL REQUIRED INDICES CREATED!" : "\n⚠️ Some indices still missing");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
