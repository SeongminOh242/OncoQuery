import { MongoClient } from 'mongodb';

const uri = 'mongodb://34.69.196.89:27017/amazon';
const dbName = 'amazon';
const collectionName = 'reviews';

async function listIndices() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const indexes = await collection.indexes();
    console.log(`Total indices: ${indexes.length}\n`);
    
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.name}`);
      console.log(`   Keys: ${JSON.stringify(idx.key)}`);
      if (idx.sparse) console.log(`   Sparse: true`);
      if (idx.unique) console.log(`   Unique: true`);
      console.log('');
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

listIndices();
