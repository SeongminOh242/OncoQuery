import { MongoClient } from "mongodb";

async function createOneIndex(spec, name, description) {
  const mongoUrl = "mongodb://34.69.196.89:27017/oncoquery";
  const client = new MongoClient(mongoUrl, {
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000
  });
  
  try {
    await client.connect();
    const db = client.db("amazon");
    const collection = db.collection("reviews");
    
    console.log(`\n🔧 Creating index: ${name}`);
    console.log(`   Purpose: ${description}`);
    console.log(`   Keys: ${JSON.stringify(spec)}`);
    
    const result = await collection.createIndex(spec);
    console.log(`   ✅ SUCCESS - Index created\n`);
    
    return true;
  } catch (err) {
    if (err.code === 85) {
      console.log(`   ⚠️  Index already exists\n`);
      return true;
    } else {
      console.error(`   ❌ ERROR: ${err.message}\n`);
      return false;
    }
  } finally {
    await client.close();
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("Creating 3 Compound Indices (One by One)");
  console.log("═══════════════════════════════════════════════════════");
  
  // Index 1
  await createOneIndex(
    { product_category: 1, review_date: -1 },
    "product_category_1_review_date_-1",
    "bot-data: filter by category + sort by date"
  );
  
  console.log("⏳ Waiting 5 seconds...\n");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Index 2
  await createOneIndex(
    { total_votes: -1, helpful_votes: -1 },
    "total_votes_-1_helpful_votes_-1",
    "helpful/controversial: filter + sort on votes"
  );
  
  console.log("⏳ Waiting 5 seconds...\n");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Index 3
  await createOneIndex(
    { review_date: -1, product_id: 1 },
    "review_date_-1_product_id_1",
    "trending-products: filter by date + group by product"
  );
  
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ All indices creation attempted");
  console.log("═══════════════════════════════════════════════════════\n");
}

main();
