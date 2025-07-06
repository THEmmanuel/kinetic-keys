const {
  processEncryption,
  processDecryption
} = require('../../utils/KineticKeyHelpers');
const { generateUnlockHash } = require('../../utils/UnlockHash');

// Mock the dependencies
jest.mock('../../utils/KineticKeyUtils', () => ({
  createVoucher: jest.fn((data) => {
    // Simple mock that returns base64 encoded data
    return Buffer.from(data).toString('base64');
  }),
  decryptVoucher: jest.fn((voucher, passphrase, hash) => {
    // Simple mock that decodes base64
    if (voucher === 'invalid-voucher') {
      throw new Error('Invalid voucher');
    }
    return Buffer.from(voucher, 'base64').toString();
  })
}));

describe('KineticKeyHelpers', () => {
  const SYSTEM_SECRET_KEY = 'test-system-secret';
  
  describe('processEncryption', () => {
    it('should encrypt array of items', async () => {
      const testData = [
        { _id: '1', name: 'Item 1', value: 100 },
        { _id: '2', name: 'Item 2', value: 200 },
        { _id: '3', name: 'Item 3', value: 300 }
      ];
      const hash = await generateUnlockHash('test-passphrase');
      
      const encrypted = await processEncryption(testData, hash);
      
      expect(encrypted).toBeDefined();
      expect(Array.isArray(encrypted)).toBe(true);
      expect(encrypted.length).toBe(testData.length);
      
      encrypted.forEach((item, index) => {
        expect(item._id).toBe(testData[index]._id);
        expect(item.KK).toBeDefined();
        expect(typeof item.KK).toBe('string');
      });
    });

    it('should handle empty array', async () => {
      const hash = await generateUnlockHash('test-passphrase');
      const encrypted = await processEncryption([], hash);
      
      expect(encrypted).toEqual([]);
    });

    it('should preserve _id field', async () => {
      const testData = [
        { _id: 'unique-id-123', data: 'test' }
      ];
      const hash = await generateUnlockHash('test-passphrase');
      
      const encrypted = await processEncryption(testData, hash);
      
      expect(encrypted[0]._id).toBe('unique-id-123');
    });
  });

  describe('processDecryption', () => {
    it('should decrypt array of encrypted items', async () => {
      const originalData = [
        { _id: '1', name: 'Item 1', value: 100 },
        { _id: '2', name: 'Item 2', value: 200 }
      ];
      
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      // Create encrypted data
      const encrypted = originalData.map(item => ({
        _id: item._id,
        KK: Buffer.from(JSON.stringify(item)).toString('base64')
      }));
      
      const decrypted = await processDecryption(encrypted, passphrase, hash);
      
      expect(decrypted).toBeDefined();
      expect(Array.isArray(decrypted)).toBe(true);
      expect(decrypted.length).toBe(originalData.length);
      
      decrypted.forEach((item, index) => {
        expect(item._id).toBe(originalData[index]._id);
        expect(item.data).toEqual(originalData[index]);
        expect(item.error).toBeUndefined();
      });
    });

    it('should decrypt single encrypted item', async () => {
      const originalData = { name: 'Single Item', value: 500 };
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      const encrypted = Buffer.from(JSON.stringify(originalData)).toString('base64');
      const decrypted = await processDecryption(encrypted, passphrase, hash);
      
      expect(decrypted).toEqual(originalData);
    });

    it('should handle decryption errors in array', async () => {
      const encrypted = [
        { _id: '1', KK: 'invalid-voucher' },
        { _id: '2', KK: Buffer.from('{"valid": true}').toString('base64') }
      ];
      
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      const decrypted = await processDecryption(encrypted, passphrase, hash);
      
      expect(decrypted[0]._id).toBe('1');
      expect(decrypted[0].data).toBeNull();
      expect(decrypted[0].error).toBe('Decryption failed');
      
      expect(decrypted[1]._id).toBe('2');
      expect(decrypted[1].data).toEqual({ valid: true });
      expect(decrypted[1].error).toBeUndefined();
    });

    it('should throw error for single item decryption failure', async () => {
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      await expect(
        processDecryption('invalid-voucher', passphrase, hash)
      ).rejects.toThrow('Failed to decrypt transaction 2');
    });

    it('should handle empty array', async () => {
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      const decrypted = await processDecryption([], passphrase, hash);
      expect(decrypted).toEqual([]);
    });

    it('should handle malformed JSON in decryption', async () => {
      const encrypted = [{
        _id: '1',
        KK: Buffer.from('not-valid-json').toString('base64')
      }];
      
      const passphrase = 'test-passphrase';
      const hash = await generateUnlockHash(passphrase);
      
      const decrypted = await processDecryption(encrypted, passphrase, hash);
      
      expect(decrypted[0]._id).toBe('1');
      expect(decrypted[0].data).toBeNull();
      expect(decrypted[0].error).toBe('Decryption failed');
    });
  });
}); 