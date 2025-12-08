import { MongoClient } from "mongodb";

async function checkDatabases() {
  const mongoUrl = "mongodb://localhost:27017";
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const adminDb = client.db("admin");
    
    // List all databases
    const databases = await adminDb.admin().listDatabases();
    
    console.log("\n✓ Connected to MongoDB\n");
    console.log("📊 Available Databases:");
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check oncoquery specifically
    console.log("\n📋 Checking 'oncoquery' database:");
    const oncoDb = client.db("oncoquery");
    const collections = await oncoDb.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log("  ❌ No collections found in 'oncoquery'");
    } else {
      console.log(`  ✓ Found ${collections.length} collection(s):`);
      collections.forEach(col => {
        console.log(`    - ${col.name}`);
      });
      
      // Check reviews collection indexes
      const reviewsCollection = oncoDb.collection("reviews");
      const indexes = await reviewsCollection.listIndexes().toArray();
      console.log(`\n  📊 Indexes on 'reviews' collection: ${indexes.length}`);
      indexes.forEach(idx => {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

checkDatabases();
