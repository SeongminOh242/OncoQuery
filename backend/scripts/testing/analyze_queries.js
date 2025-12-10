import { MongoClient } from 'mongodb';

const uri = 'mongodb://34.69.196.89:27017/amazon';
const dbName = 'amazon';
const collectionName = 'reviews';

async function analyzeQueries() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Test 1: Check if countDocuments uses index
    console.log('=== TEST 1: countDocuments with verified_purchase ===');
    const explain1 = await collection.countDocuments(
      { verified_purchase: "Y" }
    );
    console.log('Count result:', explain1);
    
    // Test 2: Check aggregation with $match on review_date
    console.log('\n=== TEST 2: Trending products date filter ===');
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 120);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    console.log('Cutoff date:', cutoffDateStr);
    
    const trendingCount = await collection.countDocuments({
      review_date: { $gte: cutoffDateStr }
    });
    console.log('Reviews matching date filter:', trendingCount);
    
    // Test 3: Check helpful reviews filter
    console.log('\n=== TEST 3: Helpful reviews filter ===');
    const helpfulCount = await collection.countDocuments({
      total_votes: { $gte: 20 }
    });
    console.log('Reviews with >= 20 votes:', helpfulCount);
    
    // Test 4: Sample some dates to understand data range
    console.log('\n=== TEST 4: Sample review dates ===');
    const samples = await collection.find({})
      .project({ review_date: 1, _id: 0 })
      .limit(10)
      .toArray();
    console.log('Sample dates:', samples.map(s => s.review_date).filter(Boolean));
    
    // Test 5: Check for NULL dates
    console.log('\n=== TEST 5: NULL/missing dates ===');
    const nullDates = await collection.countDocuments({ review_date: null });
    const missingDates = await collection.countDocuments({ review_date: { $exists: false } });
    console.log('NULL dates:', nullDates);
    console.log('Missing dates:', missingDates);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.close();
  }
}

analyzeQueries();
