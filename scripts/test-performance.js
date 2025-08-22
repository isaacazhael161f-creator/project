/**
 * Performance Test Runner
 * Runs performance tests in isolation to avoid dependency issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mock AsyncStorage for tests
const mockAsyncStorage = `
const AsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

module.exports = AsyncStorage;
`;

// Create mock file
const mockDir = path.join(__dirname, '..', 'node_modules', '@react-native-async-storage', 'async-storage');
const mockFile = path.join(mockDir, 'jest', 'async-storage-mock.js');

if (!fs.existsSync(path.dirname(mockFile))) {
  fs.mkdirSync(path.dirname(mockFile), { recursive: true });
}

fs.writeFileSync(mockFile, mockAsyncStorage);

// Run performance tests
console.log('Running performance tests...');

try {
  // Test image compression
  console.log('\n1. Testing image compression...');
  execSync('npm test -- utils/manifiesto/__tests__/imageCompression.test.ts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Test performance utilities
  console.log('\n2. Testing performance utilities...');
  execSync('npm test -- utils/manifiesto/__tests__/performance.integration.test.ts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n✅ All performance tests passed!');
} catch (error) {
  console.error('\n❌ Performance tests failed:', error.message);
  process.exit(1);
}