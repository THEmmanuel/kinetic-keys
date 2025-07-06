const { createVoucher, decryptVoucher } = require('../../utils/KineticKeyUtils');
const { generateUnlockHash, verifyUnlockHash } = require('../../utils/UnlockHash');
const crypto = require('crypto');

describe('KineticKeyUtils', () => {
  const SYSTEM_SECRET_KEY = 'test-system-secret-key';
  
  describe('createVoucher', () => {
    it('should create a valid voucher', async () => {
      const data = 'test-data';
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      
      expect(voucher).toBeDefined();
      expect(typeof voucher).toBe('string');
      expect(voucher).toBeValidBase64();
    });

    it('should create different vouchers for same data', async () => {
      const data = 'test-data';
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher1 = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      const voucher2 = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      
      expect(voucher1).not.toBe(voucher2); // Due to random salt
    });

    it('should handle complex data', async () => {
      const complexData = JSON.stringify({
        user: 'test-user',
        amount: 100,
        metadata: { nested: { value: 'test' } }
      });
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher = createVoucher(complexData, UH, SYSTEM_SECRET_KEY);
      
      expect(voucher).toBeDefined();
      expect(voucher).toBeValidBase64();
    });
  });

  describe('decryptVoucher', () => {
    it('should decrypt a valid voucher with correct passphrase', async () => {
      const originalData = 'test-data-to-encrypt';
      const passphrase = 'correct-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher = createVoucher(originalData, UH, SYSTEM_SECRET_KEY);
      const decrypted = await decryptVoucher(voucher, passphrase, UH, SYSTEM_SECRET_KEY);
      
      expect(decrypted).toBe(originalData);
    });

    it('should reject voucher with wrong passphrase', async () => {
      const originalData = 'test-data';
      const correctPassphrase = 'correct-passphrase';
      const wrongPassphrase = 'wrong-passphrase';
      const UH = await generateUnlockHash(correctPassphrase);
      
      const voucher = createVoucher(originalData, UH, SYSTEM_SECRET_KEY);
      
      await expect(
        decryptVoucher(voucher, wrongPassphrase, UH, SYSTEM_SECRET_KEY)
      ).rejects.toThrow('Invalid passphrase');
    });

    it('should handle JSON data', async () => {
      const jsonData = JSON.stringify({ key: 'value', number: 42 });
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher = createVoucher(jsonData, UH, SYSTEM_SECRET_KEY);
      const decrypted = await decryptVoucher(voucher, passphrase, UH, SYSTEM_SECRET_KEY);
      
      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual({ key: 'value', number: 42 });
    });

    it('should reject tampered voucher', async () => {
      const originalData = 'test-data';
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      let voucher = createVoucher(originalData, UH, SYSTEM_SECRET_KEY);
      
      // Tamper with the voucher
      const decodedVoucher = Buffer.from(voucher, 'base64').toString('utf8');
      const tamperedVoucher = Buffer.from(decodedVoucher + 'tampered').toString('base64');
      
      await expect(
        decryptVoucher(tamperedVoucher, passphrase, UH, SYSTEM_SECRET_KEY)
      ).rejects.toThrow();
    });
  });

  describe('Voucher Security', () => {
    it('should use different encryption keys for each voucher', async () => {
      const data = 'test-data';
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      
      const voucher1 = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      const voucher2 = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      
      // Decode vouchers to check structure
      const decoded1 = JSON.parse(Buffer.from(voucher1, 'base64').toString('utf8'));
      const decoded2 = JSON.parse(Buffer.from(voucher2, 'base64').toString('utf8'));
      
      // Different IVs and encrypted data
      expect(decoded1.iv).not.toBe(decoded2.iv);
      expect(decoded1.encryptedData).not.toBe(decoded2.encryptedData);
      expect(decoded1.salt).not.toBe(decoded2.salt);
    });

    it('should properly handle different system secret keys', async () => {
      const data = 'test-data';
      const passphrase = 'test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      const DIFFERENT_KEY = 'different-system-key';
      
      const voucher = createVoucher(data, UH, SYSTEM_SECRET_KEY);
      
      await expect(
        decryptVoucher(voucher, passphrase, UH, DIFFERENT_KEY)
      ).rejects.toThrow();
    });
  });
}); 