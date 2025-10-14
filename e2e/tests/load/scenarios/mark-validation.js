/**
 * K6 Load Test: Mark Validation
 * Simulates high load on validation endpoint (warehouse scanning scenario)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const errorRate = new Rate('errors');
const validationTime = new Trend('validation_time');
const validMarks = new Counter('valid_marks');
const invalidMarks = new Counter('invalid_marks');

// Load test mark codes from setup
const markCodes = new SharedArray('marks', function () {
  // In real scenario, load from file or API
  return Array(1000)
    .fill(null)
    .map(
      (_, i) =>
        `99LAV0460717796408966LAV${Math.random().toString(36).substring(2, 18).toUpperCase()}`,
    );
});

export const options = {
  stages: [
    { duration: '1m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 1000 }, // Spike to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 5000 }, // Peak at 5000 users
    { duration: '3m', target: 5000 }, // Stay at peak
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% under 500ms
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    validation_time: ['p(95)<300'], // 95% under 300ms
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

export default function () {
  // Pick random mark code
  const markCode = markCodes[Math.floor(Math.random() * markCodes.length)];

  const payload = JSON.stringify({
    markCode,
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'ValidateMark' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/marks/validate`, payload, params);
  const duration = Date.now() - startTime;

  validationTime.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has isValid field': (r) => JSON.parse(r.body).isValid !== undefined,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (success) {
    const body = JSON.parse(response.body);
    if (body.isValid) {
      validMarks.add(1);
    } else {
      invalidMarks.add(1);
    }
  }

  errorRate.add(!success);

  // Simulate scanning interval (0.5-2 seconds between scans)
  sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
  return {
    'reports/validation-load-test.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // Custom summary format
  return `
    ====== Mark Validation Load Test Summary ======
    Duration: ${data.state.testRunDurationMs}ms
    Iterations: ${data.metrics.iterations.values.count}
    Valid Marks: ${data.metrics.valid_marks.values.count}
    Invalid Marks: ${data.metrics.invalid_marks.values.count}
    Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
    Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
  `;
}
