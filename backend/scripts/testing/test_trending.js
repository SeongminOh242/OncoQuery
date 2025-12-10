async function testTrendingProducts() {
  try {
    console.log("Testing /api/trending-products...\n");
    console.log("Connecting to http://localhost:5000...\n");
    
    const response = await fetch('http://localhost:5000/api/trending-products', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log(`\n✅ Got ${data.data.length} products!`);
      data.data.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.product_title} (${p.review_count} reviews)`);
      });
    } else {
      console.log(`\n❌ No data returned (${data.returned || 0} products)`);
      console.log("\nPossible causes:");
      console.log("1. Time window too short (all reviews are older)");
      console.log("2. Database connection issue");
      console.log("3. Index not created");
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error("\nMake sure backend is running: node index.js");
  }
}

testTrendingProducts();
