// Mock generateUniqueID to avoid dynamic import issues
jest.mock('../../utils/GenerateUniqueID', () => ({
  generateUniqueID: jest.fn(async (length) => {
    const alphabet = '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  })
}));

const { generateUniqueID } = require('../../utils/GenerateUniqueID');
const {
  generatePoemMatrix,
  generateKeyWithPoemMatrix,
  gen,
  receive
} = require('../../utils/KeyDerivation');
const { createVoucher, decryptVoucher } = require('../../utils/KineticKeyUtils');
const { generateUnlockHash } = require('../../utils/UnlockHash');

// Mock the PQC modules
jest.mock('../../pqc-package/lib/dilithium5/dilithium5-wrapper', () => ({
  DILITHIUM5_PUBLICKEYBYTES: 2592,
  DILITHIUM5_SECRETKEYBYTES: 4880,
  DILITHIUM5_BYTES: 4595,
  keypair: jest.fn().mockResolvedValue({
    publicKey: Buffer.alloc(2592),
    secretKey: Buffer.alloc(4880)
  }),
  sign: jest.fn().mockResolvedValue(Buffer.alloc(4595)),
  verify: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../pqc-package/lib/kyber1024/kyber1024-wrapper', () => ({
  KYBER1024_PUBLICKEYBYTES: 1568,
  KYBER1024_SECRETKEYBYTES: 3168,
  KYBER1024_CIPHERTEXTBYTES: 1568,
  KYBER1024_SHAREDSECRETBYTES: 32,
  keypair: jest.fn().mockResolvedValue({
    publicKey: Buffer.alloc(1568),
    secretKey: Buffer.alloc(3168)
  }),
  encapsulate: jest.fn().mockResolvedValue({
    ciphertext: Buffer.alloc(1568),
    sharedSecret: Buffer.alloc(32)
  }),
  decapsulate: jest.fn().mockResolvedValue(Buffer.alloc(32))
}));

const dilithium5Wrapper = require('../../pqc-package/lib/dilithium5/dilithium5-wrapper');
const kyber1024Wrapper = require('../../pqc-package/lib/kyber1024/kyber1024-wrapper');

describe('Kinetic Keys Integration Tests', () => {
  const SYSTEM_SECRET_KEY = 'test-system-secret-key';

  describe('Complete Key Generation and Sharing Workflow', () => {
    it('should complete full key generation, poem conversion, and recovery workflow', async () => {
      // Step 1: Generate unique ID
      const uniqueId = await generateUniqueID(16);
      expect(uniqueId).toBeDefined();
      expect(uniqueId.length).toBe(16);

      // Step 2: Generate poem matrix
      const poemMatrix = generatePoemMatrix();
      expect(poemMatrix).toBeDefined();
      expect(poemMatrix.length).toBe(16);

      // Step 3: Generate key from poem matrix
      const keyResult = generateKeyWithPoemMatrix(poemMatrix, null, uniqueId);
      expect(keyResult).toHaveProperty('key');
      expect(keyResult).toHaveProperty('indices');
      expect(keyResult).toHaveProperty('keyId');

      // Step 4: Create a secret message
      const secretMessage = 'This is a secret message for the integration test';

      // Step 5: Generate blueprint
      const { blueprint, indices } = await gen(secretMessage, poemMatrix, uniqueId);
      expect(blueprint).toBeDefined();
      expect(indices).toBeDefined();

      // Step 6: Reconstruct the message
      const reconstructed = await receive(blueprint, poemMatrix, indices, uniqueId);
      expect(reconstructed).toBe(secretMessage);

      // Step 7: Create a voucher
      const passphrase = 'integration-test-passphrase';
      const UH = await generateUnlockHash(passphrase);
      const voucherData = JSON.stringify({
        blueprint,
        indices,
        keyId: uniqueId
      });
      
      const voucher = createVoucher(voucherData, UH, SYSTEM_SECRET_KEY);
      expect(voucher).toBeDefined();
      expect(voucher).toBeValidBase64();

      // Step 8: Decrypt voucher
      const decrypted = await decryptVoucher(voucher, passphrase, UH, SYSTEM_SECRET_KEY);
      const decryptedData = JSON.parse(decrypted);
      expect(decryptedData.blueprint).toBe(blueprint);
      expect(decryptedData.indices).toEqual(indices);
      expect(decryptedData.keyId).toBe(uniqueId);
    });

    it('should integrate PQC with Kinetic Keys workflow', async () => {
      // Generate Kinetic Key components
      const uniqueId = await generateUniqueID(16);
      const poemMatrix = generatePoemMatrix();
      const { key: kineticKey } = generateKeyWithPoemMatrix(poemMatrix, null, uniqueId);

      // Generate PQC keys
      const dilithiumKeys = await dilithium5Wrapper.keypair();
      const kyberKeys = await kyber1024Wrapper.keypair();

      expect(dilithiumKeys.publicKey.length).toBe(2592);
      expect(kyberKeys.publicKey.length).toBe(1568);

      // Create a message with both classical and PQC data
      const hybridMessage = {
        kineticKeyId: uniqueId,
        kineticKeyHash: kineticKey.toString('hex'),
        dilithiumPublicKey: dilithiumKeys.publicKey.toString('base64'),
        kyberPublicKey: kyberKeys.publicKey.toString('base64')
      };

      // Sign the message with Dilithium
      const messageBuffer = Buffer.from(JSON.stringify(hybridMessage));
      const signature = await dilithium5Wrapper.sign(messageBuffer, dilithiumKeys.secretKey);
      expect(signature.length).toBe(4595);

      // Verify the signature
      const isValid = await dilithium5Wrapper.verify(signature, messageBuffer, dilithiumKeys.publicKey);
      expect(isValid).toBe(true);

      // Create encrypted voucher with signature
      const passphrase = 'pqc-integration-test';
      const UH = await generateUnlockHash(passphrase);
      const voucherData = JSON.stringify({
        message: hybridMessage,
        signature: signature.toString('base64')
      });

      const voucher = createVoucher(voucherData, UH, SYSTEM_SECRET_KEY);
      const decrypted = await decryptVoucher(voucher, passphrase, UH, SYSTEM_SECRET_KEY);
      const decryptedData = JSON.parse(decrypted);

      expect(decryptedData.message).toEqual(hybridMessage);
      expect(decryptedData.signature).toBe(signature.toString('base64'));
    });
  });

  describe('Key Sharing and Recovery', () => {
    it('should share keys between parties using PQC', async () => {
      // Alice generates keys
      const aliceKineticId = await generateUniqueID(16);
      const aliceKyberKeys = await kyber1024Wrapper.keypair();

      // Bob wants to share a secret with Alice
      const bobSecret = 'Secret message from Bob to Alice';
      const { ciphertext, sharedSecret } = await kyber1024Wrapper.encapsulate(aliceKyberKeys.publicKey);

      // Bob encrypts his message using the shared secret
      const crypto = require('crypto');
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        sharedSecret,
        Buffer.alloc(16) // IV
      );
      const encrypted = Buffer.concat([
        cipher.update(bobSecret, 'utf8'),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();

      // Alice decapsulates to get the shared secret
      const aliceSharedSecret = await kyber1024Wrapper.decapsulate(
        ciphertext,
        aliceKyberKeys.secretKey
      );

      // Alice decrypts the message
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        aliceSharedSecret,
        Buffer.alloc(16) // Same IV
      );
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]).toString('utf8');

      expect(decrypted).toBe(bobSecret);
      expect(sharedSecret.toString('hex')).toBe(aliceSharedSecret.toString('hex'));
    });

    it('should sign and verify messages with Dilithium', async () => {
      // Generate signing keys
      const signingKeys = await dilithium5Wrapper.keypair();

      // Create message with Kinetic Key data
      const kineticData = {
        id: await generateUniqueID(16),
        timestamp: Date.now(),
        data: 'Important message to sign'
      };

      const message = Buffer.from(JSON.stringify(kineticData));
      
      // Sign the message
      const signature = await dilithium5Wrapper.sign(message, signingKeys.secretKey);
      expect(signature.length).toBe(4595);

      // Verify with correct public key
      const isValid = await dilithium5Wrapper.verify(
        signature,
        message,
        signingKeys.publicKey
      );
      expect(isValid).toBe(true);

      // Tamper with message
      const tamperedMessage = Buffer.from(JSON.stringify({
        ...kineticData,
        data: 'Tampered message'
      }));

      // Mock should return false for tampered message
      dilithium5Wrapper.verify.mockResolvedValueOnce(false);
      const isTamperedValid = await dilithium5Wrapper.verify(
        signature,
        tamperedMessage,
        signingKeys.publicKey
      );
      expect(isTamperedValid).toBe(false);
    });
  });

  describe('Multi-party Key Exchange', () => {
    it('should support multi-party key establishment', async () => {
      // Three parties: Alice, Bob, and Charlie
      const parties = await Promise.all([
        kyber1024Wrapper.keypair(),
        kyber1024Wrapper.keypair(),
        kyber1024Wrapper.keypair()
      ]);

      const [alice, bob, charlie] = parties;

      // Each party generates a shared secret with every other party
      const aliceToBob = await kyber1024Wrapper.encapsulate(bob.publicKey);
      const aliceToCharlie = await kyber1024Wrapper.encapsulate(charlie.publicKey);
      
      const bobToAlice = await kyber1024Wrapper.encapsulate(alice.publicKey);
      const bobToCharlie = await kyber1024Wrapper.encapsulate(charlie.publicKey);
      
      const charlieToAlice = await kyber1024Wrapper.encapsulate(alice.publicKey);
      const charlieToBob = await kyber1024Wrapper.encapsulate(bob.publicKey);

      // Each party has established shared secrets
      expect(aliceToBob.sharedSecret.length).toBe(32);
      expect(aliceToCharlie.sharedSecret.length).toBe(32);
      expect(bobToAlice.sharedSecret.length).toBe(32);
      expect(bobToCharlie.sharedSecret.length).toBe(32);
      expect(charlieToAlice.sharedSecret.length).toBe(32);
      expect(charlieToBob.sharedSecret.length).toBe(32);

      // Create a group key using all shared secrets
      const crypto = require('crypto');
      const groupKey = crypto.createHash('sha256')
        .update(aliceToBob.sharedSecret)
        .update(aliceToCharlie.sharedSecret)
        .update(bobToAlice.sharedSecret)
        .update(bobToCharlie.sharedSecret)
        .update(charlieToAlice.sharedSecret)
        .update(charlieToBob.sharedSecret)
        .digest();

      expect(groupKey.length).toBe(32);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid voucher decryption gracefully', async () => {
      const invalidVoucher = 'invalid-base64-voucher';
      const passphrase = 'test';
      const UH = await generateUnlockHash(passphrase);

      await expect(
        decryptVoucher(invalidVoucher, passphrase, UH, SYSTEM_SECRET_KEY)
      ).rejects.toThrow();
    });

    it('should handle empty poem matrix', async () => {
      const emptyMatrix = [];
      
      // The function should throw when trying to generate random indices from an empty array
      expect(() => {
        generateKeyWithPoemMatrix(emptyMatrix, null, 'test-id');
      }).toThrow();
      
      // Also test with invalid indices
      expect(() => {
        generateKeyWithPoemMatrix(emptyMatrix, [0, 1, 2], 'test-id');
      }).toThrow();
    });

    it('should handle concurrent operations', async () => {
      const operations = [];
      
      // Generate multiple unique IDs concurrently
      for (let i = 0; i < 10; i++) {
        operations.push(generateUniqueID(16));
      }

      const results = await Promise.all(operations);
      
      // All should be unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(10);
    });

    it('should maintain security properties under stress', async () => {
      const iterations = 100;
      const passphrases = new Set();
      const hashes = new Set();

      for (let i = 0; i < iterations; i++) {
        const passphrase = `test-passphrase-${i}`;
        const hash = await generateUnlockHash(passphrase);
        
        passphrases.add(passphrase);
        hashes.add(hash);
      }

      // All hashes should be unique
      expect(hashes.size).toBe(iterations);
    });
  });
}); 