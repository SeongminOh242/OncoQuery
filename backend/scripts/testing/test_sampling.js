import { MongoClient } from 'mongodb';

const uri = 'mongodb://34.69.196.89:27017/amazon';
const dbName = 'amazon';

async function testSampling() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected\n');
    
    const collection = client.db(dbName).collection('reviews');
    
    console.log('Test 1: Sample 10K docs...');
    const start1 = Date.now();
    const result1 = await collection.aggregate([
      { $sample: { size: 10000 } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ], { maxTimeMS: 30000 }).toArray();
    console.log(`✅ Completed in ${Date.now() - start1}ms - Count: ${result1[0]?.count || 0}\n`);
    
    console.log('Test 2: Sample 50K docs...');
    const start2 = Date.now();
    const result2 = await collection.aggregate([
      { $sample: { size: 50000 } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ], { maxTimeMS: 30000 }).toArray();
    console.log(`✅ Completed in ${Date.now() - start2}ms - Count: ${result2[0]?.count || 0}\n`);
    
    console.log('Test 3: EstimatedDocumentCount...');
    const start3 = Date.now();
    const total = await collection.estimatedDocumentCount();
    console.log(`✅ Completed in ${Date.now() - start3}ms - Total: ${total}\n`);
    
    console.log('Test 4: Sample with $match filter...');
    const start4 = Date.now();
    const result4 = await collection.aggregate([
      { $sample: { size: 50000 } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: [{ $eq: ["$verified_purchase", "Y"] }, 1, 0] } }
      }}
    ], { maxTimeMS: 30000 }).toArray();
    console.log(`✅ Completed in ${Date.now() - start4}ms`);
    console.log(`   Total: ${result4[0]?.total || 0}, Verified: ${result4[0]?.verified || 0}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

testSampling();
