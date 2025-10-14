/**
 * Jest Global Setup
 * Runs once before all test suites
 */

import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('\n🚀 Starting global test setup...\n');

  // Check if Docker is running
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Docker is not running. Please start Docker first.');
    process.exit(1);
  }

  // Start test environment
  try {
    console.log('📦 Starting test services...');
    execSync('docker-compose -f docker-compose.test.yml up -d', {
      cwd: __dirname + '/..',
      stdio: 'inherit',
    });

    // Wait for services to be healthy
    console.log('⏳ Waiting for services to be ready...');
    await sleep(30000); // 30 seconds

    console.log('✅ Test environment ready!\n');
  } catch (error) {
    console.error('❌ Failed to start test environment:', error);
    throw error;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
