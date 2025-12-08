import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "amazon";

async function testConnection() {
  let client;
  try {
    console.log(`\n🔍 Testing MongoDB Connection...`);
    console.log(`📍 Connection URL: ${mongoUrl}`);
    console.log(`📚 Database Name: ${dbName}\n`);

    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log(`✅ Connected to MongoDB successfully!\n`);

    const db = client.db(dbName);
    
    // Get database stats
    const admin = db.admin();
    const serverInfo = await admin.serverInfo();
    console.log(`📊 MongoDB Server Version: ${serverInfo.version}`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Collections in database "${dbName}":`);
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count.toLocaleString()} documents`);
    }

    // Check reviews collection specifically
    if (collections.some(c => c.name === "reviews")) {
      const reviewsCollection = db.collection("reviews");
      const reviewCount = await reviewsCollection.countDocuments();
      const sampleReview = await reviewsCollection.findOne();
      
      console.log(`\n✨ Reviews Collection Details:`);
      console.log(`   Total Reviews: ${reviewCount.toLocaleString()}`);
      console.log(`   Sample Review Fields: ${Object.keys(sampleReview).join(", ")}`);
    }

    console.log(`\n✅ All tests passed! Your database connection is working.\n`);

  } catch (error) {
    console.error(`\n❌ Connection Error:`, error.message);
    console.error(`\n⚠️  Could not connect to MongoDB at ${mongoUrl}`);
    console.error(`\nMake sure:`);
    console.error(`  1. MongoDB is running`);
    console.error(`  2. MONGO_URI in .env is correct`);
    console.error(`  3. Check your firewall/network settings\n`);
  } finally {
    if (client) {
      await client.close();
      console.log(`🔌 Connection closed.\n`);
    }
  }
}

testConnection();
