import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

(async () => {
  try {
    await client.connect();
    const adminDb = client.db("admin");
    
    // Get current operations
    const currentOp = await adminDb.admin().command({ currentOp: true });
    
    console.log("\n📊 MongoDB Current Operations:\n");
    
    if (currentOp.inprog && currentOp.inprog.length > 0) {
      console.log(`Active operations: ${currentOp.inprog.length}\n`);
      
      currentOp.inprog.forEach((op, i) => {
        console.log(`[${i}] Operation: ${op.op}`);
        console.log(`    Command: ${op.command?.createIndexes ? 'Creating Index' : op.command}`);
        console.log(`    NS: ${op.ns}`);
        if (op.progress) console.log(`    Progress: ${JSON.stringify(op.progress)}`);
        console.log("");
      });
    } else {
      console.log("✓ No active operations - indexing may have completed\n");
    }
    
    // Check index build status
    const collection = client.db("oncoquery").collection("reviews");
    const indexes = await collection.listIndexes().toArray();
    
    console.log("📋 Current Indices:");
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log(`\nTotal: ${indexes.length} indices`);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
