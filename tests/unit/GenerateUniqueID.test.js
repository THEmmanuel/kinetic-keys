// Import the actual implementation
const { generateUniqueID } = require('../../utils/GenerateUniqueID');

describe('GenerateUniqueID', () => {
  it('should generate ID with specified length', async () => {
    const length = 16;
    const id = await generateUniqueID(length);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(length);
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
    }
  });

  it('should generate empty string for length 0', async () => {
    const id = await generateUniqueID(0);
    expect(id).toBe('');
  });

  it('should handle very large lengths', async () => {
    const id = await generateUniqueID(1000);
    expect(id.length).toBe(1000);
  });
}); 