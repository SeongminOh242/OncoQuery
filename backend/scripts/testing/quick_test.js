import { MongoClient } from "mongodb";

async function test() {
  const client = new MongoClient("mongodb://localhost:27017", { serverSelectionTimeoutMS: 5000 });
  try {
    console.log("Testing connection...");
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");
    
    const db = client.db("oncoquery");
    const adminDb = client.db("admin");
    const ping = await adminDb.command({ ping: 1 });
    console.log("✅ Ping successful:", ping.ok);
    
  } catch (e) {
    console.log("❌ Error:", e.message);
  } finally {
    await client.close();
    console.log("Done!");
  }
}

test();
