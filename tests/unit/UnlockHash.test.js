const {
  generateUnlockHash,
  verifyUnlockHash,
  base62Decode,
  xorBuffers,
  encodeBase62
} = require('../../utils/UnlockHash');

// Import internal functions for testing
const UnlockHashModule = require('../../utils/UnlockHash');
const crypto = require('crypto');

// Test the internal base62Decode function by accessing it through the module
function testBase62Functions() {
  // We need to access the internal functions for testing
  const fs = require('fs');
  const path = require('path');
  const moduleCode = fs.readFileSync(path.join(__dirname, '../../utils/UnlockHash.js'), 'utf8');
  
  // Extract and test the base62Decode function
  const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  
  function base62Decode(str) {
    let num = BigInt(0);
    for (const char of str) {
      num = num * 62n + BigInt(base62.indexOf(char));
    }
    const hex = num.toString(16);
    return Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex");
  }
  
  return { base62Decode };
}

describe('UnlockHash', () => {
  describe('Single Mode', () => {
    it('should generate unlock hash in single mode', async () => {
      const passphrase = 'test-passphrase-123';
      const unlockHash = await generateUnlockHash(passphrase);

      expect(unlockHash).toBeDefined();
      expect(typeof unlockHash).toBe('string');
      expect(unlockHash.split('.').length).toBe(2);
    });

    it('should verify correct passphrase in single mode', async () => {
      const passphrase = 'correct-passphrase';
      const unlockHash = await generateUnlockHash(passphrase);
      
      const isValid = await verifyUnlockHash(unlockHash, passphrase);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passphrase in single mode', async () => {
      const correctPassphrase = 'correct-passphrase';
      const wrongPassphrase = 'wrong-passphrase';
      const unlockHash = await generateUnlockHash(correctPassphrase);
      
      const isValid = await verifyUnlockHash(unlockHash, wrongPassphrase);
      expect(isValid).toBe(false);
    });

    it('should handle 3-part single mode hash format', async () => {
      const passphrase = 'test-passphrase';
      const unlockHash = await generateUnlockHash(passphrase);
      
      // Simulate 3-part format by adding a prefix
      const threePart = `prefix.${unlockHash}`;
      
      const isValid = await verifyUnlockHash(threePart, passphrase);
      expect(isValid).toBe(true);
    });
  });

  describe('Dual Mode', () => {
    it('should generate unlock hash in dual mode', async () => {
      const passphraseA = 'passphrase-a';
      const passphraseB = 'passphrase-b';
      const unlockHash = await generateUnlockHash(passphraseA, passphraseB, 'dual');

      expect(unlockHash).toBeDefined();
      expect(typeof unlockHash).toBe('string');
      expect(unlockHash.startsWith('dual.')).toBe(true);
      expect(unlockHash.split('.').length).toBe(5);
    });

    it('should verify either passphrase in dual mode', async () => {
      const passphraseA = 'passphrase-a';
      const passphraseB = 'passphrase-b';
      const unlockHash = await generateUnlockHash(passphraseA, passphraseB, 'dual');
      
      const isValidA = await verifyUnlockHash(unlockHash, passphraseA, 'dual');
      const isValidB = await verifyUnlockHash(unlockHash, passphraseB, 'dual');
      
      expect(isValidA).toBe(true);
      expect(isValidB).toBe(true);
    });

    it('should reject incorrect passphrase in dual mode', async () => {
      const passphraseA = 'passphrase-a';
      const passphraseB = 'passphrase-b';
      const wrongPassphrase = 'wrong-passphrase';
      const unlockHash = await generateUnlockHash(passphraseA, passphraseB, 'dual');
      
      const isValid = await verifyUnlockHash(unlockHash, wrongPassphrase, 'dual');
      expect(isValid).toBe(false);
    });

    it('should auto-detect dual mode from hash format', async () => {
      const passphraseA = 'passphrase-a';
      const passphraseB = 'passphrase-b';
      const unlockHash = await generateUnlockHash(passphraseA, passphraseB, 'dual');
      
      // Should work even without explicitly specifying dual mode
      const isValid = await verifyUnlockHash(unlockHash, passphraseA);
      expect(isValid).toBe(true);
    });

    it('should throw error when dual mode missing second passphrase', async () => {
      const passphraseA = 'passphrase-a';
      
      await expect(generateUnlockHash(passphraseA, null, 'dual'))
        .rejects.toThrow('Dual mode requires two passphrases.');
    });
  });

  describe('Internal Functions Coverage', () => {
    it('should test base62Decode function', () => {
      // Test encoding and decoding roundtrip
      const testBuffer = Buffer.from('Hello World', 'utf8');
      const encoded = encodeBase62(testBuffer);
      const decoded = base62Decode(encoded);
      
      expect(decoded.toString('utf8')).toBe('Hello World');
    });

    it('should handle empty string in base62Decode', () => {
      const result = base62Decode('0');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should test xorBuffers function', () => {
      const buf1 = Buffer.from([1, 2, 3, 4]);
      const buf2 = Buffer.from([5, 6, 7, 8]);
      const result = xorBuffers(buf1, buf2);
      
      expect(result).toEqual(Buffer.from([4, 4, 4, 12])); // 1^5=4, 2^6=4, 3^7=4, 4^8=12
    });

    it('should handle different buffer lengths in xorBuffers', () => {
      const buf1 = Buffer.from([1, 2, 3]);
      const buf2 = Buffer.from([5, 6, 7, 8, 9]);
      const result = xorBuffers(buf1, buf2);
      
      expect(result.length).toBe(3); // Should use the shorter buffer length
      expect(result).toEqual(Buffer.from([4, 4, 4]));
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid unlock hash format', async () => {
      // Test with invalid format (not enough parts)
      await expect(verifyUnlockHash('invalid', 'password')).rejects.toThrow('Invalid unlock hash format.');
      
      // Test with too many parts but not dual mode
      await expect(verifyUnlockHash('part1.part2.part3.part4.part5', 'password')).rejects.toThrow('Invalid unlock hash format.');
    });

    it('should handle malformed unlock hash parts', async () => {
      // Create a malformed hash with only one part
      await expect(verifyUnlockHash('onlyonepart', 'password')).rejects.toThrow('Invalid unlock hash format.');
    });
  });
}); 