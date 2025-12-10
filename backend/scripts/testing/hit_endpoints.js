const base = 'http://localhost:5000';

const REQUEST_TIMEOUT_MS = 60000;  // 60 seconds for testing

async function hit(path, label) {
  const url = `${base}${path}`;
  const start = Date.now();
  console.log(`\n--> ${label}: requesting ${url}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const elapsed = Date.now() - start;
    let body = null;
    try {
      body = await res.json();
    } catch (err) {
      console.error(`❌ ${label}: failed to parse JSON (${err.message})`);
      return;
    }
    console.log(`\n${label} -> status ${res.status} in ${elapsed} ms`);
    const summary = {
      returned: body.returned ?? body.data?.length ?? undefined,
      message: body.message,
      page: body.page,
      limit: body.limit,
      sample: body.sampleSize,
      keys: Object.keys(body)
    };
    console.log('Summary:', JSON.stringify(summary, null, 2));
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`❌ ${label}: fetch error after ${elapsed} ms -> ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log('Starting endpoint smoke test...');
  console.log(`Base URL: ${base}`);
  console.log(`Timeout: ${REQUEST_TIMEOUT_MS/1000}s per request\n`);
  await hit('/api/stats/overview', 'Overview');
  await hit('/api/verified-stats', 'Verified Stats');
  await hit('/api/trending-products', 'Trending');
  await hit('/api/helpful-reviews', 'Helpful');
  await hit('/api/controversial-reviews', 'Controversial');
  await hit('/api/bot-stats', 'Bot Stats');
  console.log('\nFinished endpoint smoke test.');
}

main();
