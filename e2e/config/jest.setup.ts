/**
 * Jest Global Setup
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

// Set test timeouts
jest.setTimeout(60000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console during tests unless there's an error
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};

// Setup global test helpers
(global as any).sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
