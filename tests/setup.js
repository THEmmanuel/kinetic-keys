// Jest setup file
// Configure test environment

// Set test timeout
jest.setTimeout(30000);

// Mock crypto if not available
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = {
    getRandomValues: (arr) => {
      const bytes = crypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    }
  };
}

// Add custom matchers
expect.extend({
  toBeValidHex(received) {
    const pass = typeof received === 'string' && /^[0-9a-fA-F]+$/.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid hex string`
        : `expected ${received} to be a valid hex string`
    };
  },
  toBeValidBase64(received) {
    const pass = typeof received === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid base64 string`
        : `expected ${received} to be a valid base64 string`
    };
  },
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  }
});

// Global test utilities
global.testUtils = {
  generateTestSeed: () => {
    return Buffer.from('test-seed-' + Date.now()).toString('hex');
  },
  generateTestMessage: (length = 32) => {
    return Buffer.from('a'.repeat(length)).toString('hex');
  }
}; 