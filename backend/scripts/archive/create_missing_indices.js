import { MongoClient } from "mongodb";

async function createMissingIndices() {
  const mongoUrl = "mongodb://localhost:27017";
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db("oncoquery");
    const collection = db.collection("reviews");
    
    console.log("\n🔧 Creating missing indices...\n");
    
    // Indices to create
    const indexesToCreate = [
      { key: { verified_purchase: 1 }, name: "verified_purchase_1" },
      { key: { total_votes: -1 }, name: "total_votes_-1" },
      { key: { helpful_votes: -1 }, name: "helpful_votes_-1" },
      { key: { product_category: 1 }, name: "product_category_1" }
    ];
    
    for (const indexSpec of indexesToCreate) {
      try {
        const result = await collection.createIndex(indexSpec.key);
        console.log(`✓ Created index: ${result}`);
      } catch (err) {
        console.log(`⚠️  ${indexSpec.name}: ${err.message}`);
      }
    }
    
    // List all indices after creation
    console.log("\n📊 All indices on 'reviews' collection:");
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach((idx, i) => {
      console.log(`  [${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\n✓ Total indices: ${indexes.length}`);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

createMissingIndices();
