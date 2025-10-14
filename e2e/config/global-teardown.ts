/**
 * Jest Global Teardown
 * Runs once after all test suites
 */

import { execSync } from 'child_process';

export default async function globalTeardown() {
  console.log('\n🧹 Starting global test cleanup...\n');

  try {
    console.log('🛑 Stopping test services...');
    execSync('docker-compose -f docker-compose.test.yml down -v', {
      cwd: __dirname + '/..',
      stdio: 'inherit',
    });

    console.log('✅ Test environment cleaned up!\n');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
  }
}
