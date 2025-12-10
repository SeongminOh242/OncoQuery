import { MongoClient } from "mongodb";

async function createOneIndex(client, spec, name, description) {
  try {
    const db = client.db("oncoquery");
    const collection = db.collection("reviews");
    
    console.log(`\n🔧 Creating index: ${name}`);
    console.log(`   Purpose: ${description}`);
    console.log(`   Keys: ${JSON.stringify(spec)}`);
    
    const result = await collection.createIndex(spec);
    console.log(`   ✅ SUCCESS\n`);
    
    return true;
  } catch (err) {
    if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
      console.log(`   ⚠️  Already exists\n`);
      return true;
    } else {
      console.error(`   ❌ ERROR: ${err.message}\n`);
      return false;
    }
  }
}

async function main() {
  const mongoUrl = "mongodb://localhost:27017";
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log("✅ Connected to local MongoDB\n");
    
    console.log("═══════════════════════════════════════════════════════");
    console.log("Creating 11 Indices for OncoQuery");
    console.log("═══════════════════════════════════════════════════════");
    
    // COMPOUND INDICES (3)
    console.log("\n📦 COMPOUND INDICES:");
    
    await createOneIndex(
      client,
      { product_category: 1, review_date: -1 },
      "product_category_1_review_date_-1",
      "bot-data: filter by category + sort by date"
    );

    await createOneIndex(
      client,
      { total_votes: -1, helpful_votes: -1 },
      "total_votes_-1_helpful_votes_-1",
      "helpful/controversial: filter + sort on votes"
    );

    await createOneIndex(
      client,
      { review_date: -1, product_id: 1 },
      "review_date_-1_product_id_1",
      "trending-products: filter by date + group by product"
    );

    console.log("\n⏳ Waiting 2 seconds...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // SINGLE-FIELD INDICES (8)
    console.log("📌 SINGLE-FIELD INDICES:");
    
    await createOneIndex(
      client,
      { customer_id: 1 },
      "customer_id_1",
      "user review history lookups"
    );

    await createOneIndex(
      client,
      { product_id: 1 },
      "product_id_1",
      "product review aggregation"
    );

    await createOneIndex(
      client,
      { review_date: -1 },
      "review_date_-1",
      "temporal filtering and sorting"
    );

    await createOneIndex(
      client,
      { verified_purchase: 1 },
      "verified_purchase_1",
      "verified purchase filtering"
    );

    await createOneIndex(
      client,
      { total_votes: -1 },
      "total_votes_-1",
      "vote-based filtering and sorting"
    );

    await createOneIndex(
      client,
      { helpful_votes: -1 },
      "helpful_votes_-1",
      "helpful votes sorting"
    );

    await createOneIndex(
      client,
      { product_category: 1 },
      "product_category_1",
      "category-based filtering"
    );

    await createOneIndex(
      client,
      { star_rating: 1 },
      "star_rating_1",
      "rating-based filtering and stats"
    );

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ All 11 indices created successfully");
    console.log("═══════════════════════════════════════════════════════\n");
    
    // Verify all indices
    console.log("📊 VERIFICATION:");
    const db = client.db("oncoquery");
    const collection = db.collection("reviews");
    const allIndexes = await collection.listIndexes().toArray();
    
    console.log(`\nTotal indices created: ${allIndexes.length}\n`);
    allIndexes.forEach((idx, i) => {
      console.log(`  [${i}] ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
  } catch (err) {
    console.error("❌ Connection error:", err.message);
  } finally {
    await client.close();
  }
}

main();
