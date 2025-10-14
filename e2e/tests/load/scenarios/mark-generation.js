/**
 * K6 Load Test: Mark Generation
 * Simulates high load on mark generation endpoint
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const generationTime = new Trend('generation_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 1000 }, // Spike to 1000 users
    { duration: '3m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    errors: ['rate<0.05'], // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// Helper function to generate random GTIN
function generateGTIN() {
  return (
    '04607177' +
    Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')
  );
}

export default function () {
  const payload = JSON.stringify({
    gtin: generateGTIN(),
    quantity: Math.floor(Math.random() * 100) + 1, // 1-100 marks
    productionDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    supplierId: Math.floor(Math.random() * 10000),
    manufacturerId: Math.floor(Math.random() * 100000),
    generateQrCodes: false, // Skip QR generation for performance
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'GenerateMarks' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/marks/generate`, payload, params);
  const duration = Date.now() - startTime;

  // Record metrics
  generationTime.add(duration);

  // Verify response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has marks array': (r) => JSON.parse(r.body).marks !== undefined,
    'correct count': (r) => {
      const body = JSON.parse(r.body);
      return body.count === body.marks.length;
    },
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!success);

  // Think time between requests
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Error rate: ${errorRate.rate}`);
}
