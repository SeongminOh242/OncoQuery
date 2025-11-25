import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// Retrieval-only tests: assumes data already exists in the connected MongoDB.
// Set MONGO_URI / MONGO_DB_NAME before running `npm test` to point at your local DB.

describe('API Routes (retrieval only)', () => {
  it('GET /api/bot-data responds with an array', async () => {
    const res = await request(app).get('/api/bot-data');
    console.log('\n[bot-data] count:', res.body.length);
    if (res.body.length > 0) {
      console.log('[bot-data] first doc snippet:', {
        customer_id: res.body[0].customer_id,
        review_id: res.body[0].review_id,
        product_id: res.body[0].product_id,
        star_rating: res.body[0].star_rating
      });
    }
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('review_id');
    }
  });

  it('GET /api/verified-analysis returns only verified_purchase === "Y" (may be empty)', async () => {
    const res = await request(app).get('/api/verified-analysis');
    console.log('\n[verified-analysis] count:', res.body.length);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const allVerified = res.body.every(r => r.verified_purchase === 'Y');
    expect(allVerified).toBe(true);
  });

  it('GET /api/trending-products returns aggregation array', async () => {
    const res = await request(app).get('/api/trending-products');
    console.log('\n[trending-products] count:', res.body.length);
    if (res.body.length > 0) {
      console.log('[trending-products] first agg:', res.body[0]);
    }
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('_id');
      expect(res.body[0]).toHaveProperty('avg_rating');
      expect(res.body[0]).toHaveProperty('count');
    }
  });
});
