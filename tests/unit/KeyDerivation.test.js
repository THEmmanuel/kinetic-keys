const {
  generatePoemMatrix,
  generateKeyWithPoemMatrix,
  deriveBlueprintGranular,
  reconstructTextGranular,
  gen,
  receive
} = require('../../utils/KeyDerivation');

describe('KeyDerivation', () => {
  describe('generatePoemMatrix', () => {
    it('should generate a poem matrix with correct dimensions', () => {
      const size = 16;
      const length = 10;
      const matrix = generatePoemMatrix(size, length);
      
      expect(matrix).toBeDefined();
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBe(size);
      expect(matrix.every(row => row.length === length)).toBe(true);
    });

    it('should generate different matrices each time', () => {
      const matrix1 = generatePoemMatrix();
      const matrix2 = generatePoemMatrix();
      
      expect(matrix1).not.toEqual(matrix2);
    });

    it('should contain valid characters', () => {
      const matrix = generatePoemMatrix();
      const validChars = /^[0-9A-Za-z!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
      
      expect(matrix.every(row => validChars.test(row))).toBe(true);
    });
  });

  describe('generateKeyWithPoemMatrix', () => {
    it('should generate a key from poem matrix', () => {
      const matrix = generatePoemMatrix();
      const keyId = 'test-key-id';
      const result = generateKeyWithPoemMatrix(matrix, null, keyId);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('indices');
      expect(result).toHaveProperty('keyId');
      expect(Buffer.isBuffer(result.key)).toBe(true);
      expect(result.key.length).toBe(32); // SHA256 output
    });

    it('should use provided indices', () => {
      const matrix = generatePoemMatrix();
      const indices = [0, 2, 4, 6, 8, 10, 12, 14];
      const keyId = 'test-key-id';
      const result = generateKeyWithPoemMatrix(matrix, indices, keyId);
      
      expect(result.indices).toEqual(indices);
    });

    it('should generate consistent keys for same inputs', () => {
      const matrix = generatePoemMatrix();
      const indices = [1, 3, 5, 7, 9, 11, 13, 15];
      const keyId = 'test-key-id';
      
      const result1 = generateKeyWithPoemMatrix(matrix, indices, keyId);
      const result2 = generateKeyWithPoemMatrix(matrix, indices, keyId);
      
      expect(result1.key.toString('hex')).toBe(result2.key.toString('hex'));
    });
  });

  describe('deriveBlueprintGranular', () => {
    it('should create a blueprint from text and key', async () => {
      const text = 'Secret message to encrypt';
      const matrix = generatePoemMatrix();
      const { key } = generateKeyWithPoemMatrix(matrix, null, 'test-id');
      
      const blueprint = await deriveBlueprintGranular(text, key);
      
      expect(blueprint).toBeDefined();
      expect(typeof blueprint).toBe('string');
      expect(blueprint.split('.').length).toBe(5); // salt.encrypted.iv.tag.instruction
    });

    it('should create different blueprints for same text', async () => {
      const text = 'Same message';
      const matrix = generatePoemMatrix();
      const { key } = generateKeyWithPoemMatrix(matrix, null, 'test-id');
      
      const blueprint1 = await deriveBlueprintGranular(text, key);
      const blueprint2 = await deriveBlueprintGranular(text, key);
      
      expect(blueprint1).not.toBe(blueprint2); // Due to random salt and IV
    });
  });

  describe('reconstructTextGranular', () => {
    it('should reconstruct text from blueprint', async () => {
      const originalText = 'Text to encrypt and decrypt';
      const matrix = generatePoemMatrix();
      const { key } = generateKeyWithPoemMatrix(matrix, null, 'test-id');
      
      const blueprint = await deriveBlueprintGranular(originalText, key);
      const reconstructed = await reconstructTextGranular(blueprint, key);
      
      expect(reconstructed).toBe(originalText);
    });

    it('should fail with wrong key', async () => {
      const originalText = 'Secret text';
      const matrix = generatePoemMatrix();
      const { key: correctKey } = generateKeyWithPoemMatrix(matrix, null, 'test-id');
      const { key: wrongKey } = generateKeyWithPoemMatrix(matrix, null, 'wrong-id');
      
      const blueprint = await deriveBlueprintGranular(originalText, correctKey);
      const reconstructed = await reconstructTextGranular(blueprint, wrongKey);
      
      expect(reconstructed).toBeNull();
    });
  });

  describe('gen and receive', () => {
    it('should complete full gen/receive workflow', async () => {
      const originalText = 'Complete workflow test message';
      const poemMatrix = generatePoemMatrix();
      const keyId = 'workflow-test-id';
      
      // Generate blueprint and indices
      const { blueprint, indices } = await gen(originalText, poemMatrix, keyId);
      
      expect(blueprint).toBeDefined();
      expect(indices).toBeDefined();
      expect(indices.length).toBe(8);
      
      // Receive and reconstruct
      const reconstructed = await receive(blueprint, poemMatrix, indices, keyId);
      
      expect(reconstructed).toBe(originalText);
    });

    it('should handle complex text', async () => {
      const complexText = JSON.stringify({
        user: 'test-user',
        data: { nested: { value: 123 } },
        array: [1, 2, 3]
      });
      const poemMatrix = generatePoemMatrix();
      const keyId = 'complex-test-id';
      
      const { blueprint, indices } = await gen(complexText, poemMatrix, keyId);
      const reconstructed = await receive(blueprint, poemMatrix, indices, keyId);
      
      expect(reconstructed).toBe(complexText);
      expect(JSON.parse(reconstructed)).toEqual(JSON.parse(complexText));
    });

    it('should fail with wrong indices', async () => {
      const text = 'Test message';
      const poemMatrix = generatePoemMatrix();
      const keyId = 'test-id';
      
      const { blueprint, indices } = await gen(text, poemMatrix, keyId);
      
      // Use wrong indices
      const wrongIndices = indices.map(i => (i + 1) % poemMatrix.length);
      const reconstructed = await receive(blueprint, poemMatrix, wrongIndices, keyId);
      
      expect(reconstructed).toBeNull();
    });

    it('should fail with wrong keyId', async () => {
      const text = 'Test message';
      const poemMatrix = generatePoemMatrix();
      const keyId = 'correct-id';
      
      const { blueprint, indices } = await gen(text, poemMatrix, keyId);
      const reconstructed = await receive(blueprint, poemMatrix, indices, 'wrong-id');
      
      expect(reconstructed).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid indices for poem matrix', () => {
      const matrix = generatePoemMatrix(4, 5);
      
      // Test with indices that are out of bounds
      expect(() => {
        generateKeyWithPoemMatrix(matrix, [5, 10], 'test-key');
      }).toThrow('Invalid indices for poem matrix');
      
      // Test with negative indices
      expect(() => {
        generateKeyWithPoemMatrix(matrix, [-1, 2], 'test-key');
      }).toThrow('Invalid indices for poem matrix');
    });

    it('should handle decryption errors gracefully', async () => {
      const matrix = generatePoemMatrix();
      const { blueprint } = await gen('test message', matrix, 'test-key');
      
      // Corrupt the blueprint to trigger decryption error
      const corruptedBlueprint = blueprint.replace(/^[^.]+/, 'corrupted');
      
      const result = await receive(corruptedBlueprint, matrix, [0, 1, 2, 3, 4, 5, 6, 7], 'test-key');
      expect(result).toBeNull();
    });
  });
}); 