const BASE_URL = 'http://localhost:5000';

async function quickTest() {
  console.log("Testing Overview Stats endpoint...\n");
  
  const start = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/stats/overview`);
    const duration = Date.now() - start;
    
    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    console.log(`✓ Success in ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`\nResults:`);
    console.log(`  Total Reviews: ${data.totalReviews?.toLocaleString()}`);
    console.log(`  Verified: ${data.verifiedReviews?.toLocaleString()}`);
    console.log(`  Average Rating: ${data.averageRating}`);
    
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }
}

quickTest().then(() => process.exit(0));
