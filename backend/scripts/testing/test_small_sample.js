import { MongoClient } from 'mongodb';

const uri = 'mongodb://34.69.196.89:27017/amazon';
const dbName = 'amazon';

async function testSmallSample() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected\n');
    
    const collection = client.db(dbName).collection('reviews');
    
    console.log('Test: Sample 1000 docs...');
    const start = Date.now();
    const result = await collection.aggregate([
      { $sample: { size: 1000 } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: [{ $eq: ["$verified_purchase", "Y"] }, 1, 0] } },
        avgRating: { $avg: { $convert: { input: "$star_rating", to: "int", onError: 0 } } }
      }}
    ], { maxTimeMS: 10000 }).toArray();
    
    console.log(`✅ Completed in ${Date.now() - start}ms`);
    console.log('Result:', result[0]);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

testSmallSample();
