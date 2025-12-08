const BASE_URL = 'http://localhost:5000';

async function testEndpoint(name, url) {
  console.log(`\n🔄 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  const start = Date.now();
  
  try {
    const response = await fetch(url);
    const duration = Date.now() - start;
    
    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
      return { name, duration, success: false, status: response.status };
    }
    
    const data = await response.json();
    console.log(`   ✓ Success in ${duration}ms`);
    
    // Show some stats about the response
    if (data.total !== undefined) {
      console.log(`   📊 Total: ${data.total.toLocaleString()}`);
    }
    if (data.returned !== undefined) {
      console.log(`   📦 Returned: ${data.returned.toLocaleString()}`);
    }
    if (data.data && Array.isArray(data.data)) {
      console.log(`   📦 Records: ${data.data.length}`);
    }
    
    return { name, duration, success: true, data };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed after ${duration}ms: ${err.message}`);
    return { name, duration, success: false, error: err.message };
  }
}

async function runTests() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  QUERY PERFORMANCE TEST - GCP MongoDB with Indices");
  console.log("═══════════════════════════════════════════════════════");
  
  const tests = [
    { name: "Overview Stats", url: `${BASE_URL}/api/stats/overview` },
    { name: "Bot Stats", url: `${BASE_URL}/api/bot-stats` },
    { name: "Bot Data", url: `${BASE_URL}/api/bot-data` },
    { name: "Trending Products", url: `${BASE_URL}/api/trending-products` },
    { name: "Verified Stats", url: `${BASE_URL}/api/verified-stats` },
    { name: "Helpful Reviews", url: `${BASE_URL}/api/helpful-reviews` },
    { name: "Controversial Reviews", url: `${BASE_URL}/api/controversial-reviews` }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");
  
  results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    const time = r.duration < 1000 ? `${r.duration}ms` : `${(r.duration / 1000).toFixed(2)}s`;
    console.log(`${status} ${r.name.padEnd(25)} ${time.padStart(10)}`);
  });
  
  const successful = results.filter(r => r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  const avgTime = totalTime / results.length;
  
  console.log(`\n✓ Successful: ${successful}/${results.length}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`⏱️  Average time: ${(avgTime / 1000).toFixed(2)}s`);
  
  if (successful === results.length) {
    console.log("\n✅ All queries completed successfully!");
  } else {
    console.log("\n⚠️  Some queries failed - check errors above");
  }
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error("Test suite error:", err);
  process.exit(1);
});
