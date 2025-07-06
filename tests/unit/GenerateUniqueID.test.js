// Mock only the nanoid dependency, not the entire module
jest.mock('nanoid', () => ({
  customAlphabet: jest.fn((alphabet, size) => {
    return jest.fn(() => {
      let result = '';
      for (let i = 0; i < size; i++) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return result;
    });
  })
}));

// Import the actual implementation after mocking nanoid
const { generateUniqueID } = require('../../utils/GenerateUniqueID');
const { customAlphabet } = require('nanoid');

describe('GenerateUniqueID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate ID with specified length', async () => {
    const length = 16;
    const id = await generateUniqueID(length);
    
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(length);
    expect(customAlphabet).toHaveBeenCalledWith(
      '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      length
    );
  });

  it('should generate unique IDs', async () => {
    const ids = new Set();
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const id = await generateUniqueID(10);
      ids.add(id);
    }
    
    // Should have high uniqueness (at least 95%)
    expect(ids.size).toBeGreaterThan(95);
    expect(customAlphabet).toHaveBeenCalledTimes(iterations);
  });

  it('should use correct alphabet characters', async () => {
    const id = await generateUniqueID(100);
    const validChars = '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    for (const char of id) {
      expect(validChars).toContain(char);
    }
  });

  it('should handle different lengths', async () => {
    const lengths = [1, 5, 10, 20, 50, 100];
    
    for (const length of lengths) {
      const id = await generateUniqueID(length);
      expect(id.length).toBe(length);
      expect(customAlphabet).toHaveBeenCalledWith(
        '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        length
      );
    }
    
    expect(customAlphabet).toHaveBeenCalledTimes(lengths.length);
  });

  it('should generate empty string for length 0', async () => {
    const id = await generateUniqueID(0);
    expect(id).toBe('');
    expect(customAlphabet).toHaveBeenCalledWith(
      '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      0
    );
  });

  it('should handle very large lengths', async () => {
    const id = await generateUniqueID(1000);
    expect(id.length).toBe(1000);
  });
}); 