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
    
    // Get all indices
    const allIndexes = await collection.listIndexes().toArray();
    
    console.log("═══════════════════════════════════════════════════════");
    console.log("  INDEX VERIFICATION REPORT - GCP MongoDB");
    console.log("═══════════════════════════════════════════════════════\n");
    
    console.log(`Database: ${dbName}`);
    console.log(`Collection: reviews`);
    console.log(`Total Indices: ${allIndexes.length}\n`);
    
    console.log("INDICES FOUND:\n");
    allIndexes.forEach((idx, i) => {
      const keyStr = JSON.stringify(idx.key);
      const size = idx.key ? Object.keys(idx.key).length : 0;
      console.log(`[${i}] ${idx.name}`);
      console.log(`    Keys: ${keyStr}`);
      if (size > 1) console.log(`    ⚠️  COMPOUND INDEX (${size} fields)`);
      console.log("");
    });
    
    // Check for required indices
    const required = [
      "customer_id_1",
      "product_id_1",
      "review_date_-1",
      "verified_purchase_1",
      "total_votes_-1",
      "helpful_votes_-1",
      "product_category_1"
    ];
    
    console.log("REQUIRED INDICES STATUS:\n");
    let allPresent = true;
    required.forEach(name => {
      const found = allIndexes.some(idx => idx.name === name);
      console.log(`  ${found ? "✓" : "✗"} ${name}`);
      if (!found) allPresent = false;
    });
    
    // Check for duplicates or redundant indices
    const indexNames = allIndexes.map(idx => idx.name);
    const duplicates = indexNames.filter((name, index) => indexNames.indexOf(name) !== index);
    
    console.log("\nDUPLICATE CHECK:\n");
    if (duplicates.length > 0) {
      console.log(`  ⚠️  Found duplicates: ${duplicates.join(", ")}`);
    } else {
      console.log("  ✓ No duplicate indices");
    }
    
    // Check for unexpected indices
    const expected = ["_id_", ...required];
    const unexpected = allIndexes.filter(idx => !expected.includes(idx.name));
    
    console.log("\nUNEXPECTED INDICES:\n");
    if (unexpected.length > 0) {
      unexpected.forEach(idx => {
        console.log(`  ⚠️  ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } else {
      console.log("  ✓ No unexpected indices");
    }
    
    console.log("\n═══════════════════════════════════════════════════════");
    if (allPresent && duplicates.length === 0) {
      console.log("✅ ALL INDICES VERIFIED - READY FOR PRODUCTION");
    } else {
      console.log("⚠️  ISSUES DETECTED - REVIEW ABOVE");
    }
    console.log("═══════════════════════════════════════════════════════\n");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
