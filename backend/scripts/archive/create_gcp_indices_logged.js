import { MongoClient } from "mongodb";
import fs from "fs";

const mongoUrl = "mongodb://34.27.38.94:27017/oncoquery";
const dbName = "amazon";
const outputFile = "./index_creation_result.txt";

const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 10000 });

(async () => {
  const logs = [];
  
  try {
    logs.push("🔗 Connecting to GCP MongoDB at 34.27.38.94...");
    console.log(logs[logs.length - 1]);
    
    await client.connect();
    
    logs.push("✓ Connected!\n");
    console.log(logs[logs.length - 1]);
    
    const db = client.db(dbName);
    const collection = db.collection("reviews");
    
    logs.push("🔧 Creating 7 indices in parallel...\n");
    console.log(logs[logs.length - 1]);
    
    const indexSpecs = [
      { customer_id: 1 },
      { product_id: 1 },
      { review_date: -1 },
      { verified_purchase: 1 },
      { total_votes: -1 },
      { helpful_votes: -1 },
      { product_category: 1 }
    ];
    
    for (const spec of indexSpecs) {
      try {
        const result = await collection.createIndex(spec);
        const msg = `✓ Created index: ${result}`;
        logs.push(msg);
        console.log(msg);
      } catch (err) {
        const msg = `❌ Error creating index ${JSON.stringify(spec)}: ${err.message}`;
        logs.push(msg);
        console.log(msg);
      }
    }
    
    logs.push("\n📊 Verifying all indices...\n");
    console.log(logs[logs.length - 1]);
    
    const allIndexes = await collection.listIndexes().toArray();
    
    allIndexes.forEach((idx, i) => {
      const msg = `[${i}] ${idx.name}: ${JSON.stringify(idx.key)}`;
      logs.push(msg);
      console.log(msg);
    });
    
    const summaryMsg = `\n✅ Total indices: ${allIndexes.length}\n✅ All indices created on GCP MongoDB!`;
    logs.push(summaryMsg);
    console.log(summaryMsg);
    
  } catch (err) {
    const errorMsg = `❌ Error: ${err.message}`;
    logs.push(errorMsg);
    console.error(errorMsg);
  } finally {
    await client.close();
    
    // Write to file
    fs.writeFileSync(outputFile, logs.join("\n"));
    console.log(`\n📝 Results saved to: ${outputFile}`);
    
    process.exit(0);
  }
})();
