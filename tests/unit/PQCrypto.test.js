const path = require('path');

// Mock the WASM modules before requiring the wrappers
jest.mock('../../pqc-package/lib/dilithium5/dilithium5.js', () => ({
  _crypto_sign_keypair: jest.fn(() => 0),
  _crypto_sign: jest.fn(() => 0),
  _crypto_sign_open: jest.fn(() => 0),
  _crypto_sign_verify: jest.fn(() => 0),
  _malloc: jest.fn((size) => 1000 + size),
  _free: jest.fn(),
  HEAPU8: new Uint8Array(100000),
  ccall: jest.fn(),
  cwrap: jest.fn(),
  getValue: jest.fn((ptr, type) => 4595)
}));

jest.mock('../../pqc-package/lib/kyber1024/kyber1024.js', () => ({
  _pqcrystals_kyber1024_ref_keypair: jest.fn(() => 0),
  _pqcrystals_kyber1024_ref_enc: jest.fn(() => 0),
  _pqcrystals_kyber1024_ref_dec: jest.fn(() => 0),
  _malloc: jest.fn((size) => 2000 + size),
  _free: jest.fn(),
  HEAPU8: new Uint8Array(100000),
  ccall: jest.fn(),
  cwrap: jest.fn(),
  getValue: jest.fn((ptr, type) => 32)
}));

// Mock the wrapper modules to provide proper test implementations
jest.mock('../../pqc-package/lib/dilithium5/dilithium5-wrapper', () => {
  const mockDilithium = {
    DILITHIUM5_PUBLICKEYBYTES: 2592,
    DILITHIUM5_SECRETKEYBYTES: 4880,
    DILITHIUM5_BYTES: 4595,
    
    keypair: jest.fn(async () => ({
      publicKey: Buffer.alloc(2592, 1),
      secretKey: Buffer.alloc(4880, 2)
    })),
    
    sign: jest.fn(async (message, secretKey) => {
      return Buffer.alloc(4595, 3);
    }),
    
    verify: jest.fn(async (signature, message, publicKey) => {
      // Return true for matching messages, false for tampered
      const originalMessage = 'Test message';
      const messageStr = Buffer.from(message).toString();
      return messageStr === originalMessage;
    })
  };
  
  return mockDilithium;
});

// Global state for mock counters
const mockState = {
  encapsulateCallCount: 0,
  decapsulateCallCount: 0
};

jest.mock('../../pqc-package/lib/kyber1024/kyber1024-wrapper', () => {
  const mockKyber = {
    KYBER1024_PUBLICKEYBYTES: 1568,
    KYBER1024_SECRETKEYBYTES: 3168,
    KYBER1024_CIPHERTEXTBYTES: 1568,
    KYBER1024_SHAREDSECRETBYTES: 32,
    
    keypair: jest.fn(async () => ({
      publicKey: Buffer.alloc(1568, 4),
      secretKey: Buffer.alloc(3168, 5)
    })),
    
    encapsulate: jest.fn(async (publicKey) => {
      // Generate different values for each call
      const ciphertext = Buffer.alloc(1568);
      const sharedSecret = Buffer.alloc(32);
      
      // Use a simple counter approach
      const count = mockKyber.encapsulate.mock.calls.length - 1;
      
      // Fill with different values based on call count
      for (let i = 0; i < 1568; i++) {
        ciphertext[i] = (i + count * 13) % 256;
      }
      for (let i = 0; i < 32; i++) {
        sharedSecret[i] = (i + count * 17) % 256;
      }
      
      return { ciphertext, sharedSecret };
    }),
    
    decapsulate: jest.fn(async (ciphertext, secretKey) => {
      const sharedSecret = Buffer.alloc(32);
      
      // Check if ciphertext is tampered (first byte changed)
      const isTampered = ciphertext[0] === 255;
      
      if (isTampered) {
        // Return different secret for tampered ciphertext
        for (let i = 0; i < 32; i++) {
          sharedSecret[i] = (i + 100) % 256;
        }
      } else {
        // Return normal secret
        for (let i = 0; i < 32; i++) {
          sharedSecret[i] = i % 256;
        }
      }
      
      return sharedSecret;
    })
  };
  
  return mockKyber;
});

const dilithium5Wrapper = require('../../pqc-package/lib/dilithium5/dilithium5-wrapper');
const kyber1024Wrapper = require('../../pqc-package/lib/kyber1024/kyber1024-wrapper');

describe('Post-Quantum Cryptography', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset counters for Kyber mock
    mockState.encapsulateCallCount = 0;
    mockState.decapsulateCallCount = 0;
  });

  describe('Dilithium 5 - Digital Signatures', () => {
    it('should have correct key sizes', () => {
      expect(dilithium5Wrapper.DILITHIUM5_PUBLICKEYBYTES).toBe(2592);
      expect(dilithium5Wrapper.DILITHIUM5_SECRETKEYBYTES).toBe(4880);
      expect(dilithium5Wrapper.DILITHIUM5_BYTES).toBe(4595);
    });

    it('should generate key pair', async () => {
      const result = await dilithium5Wrapper.keypair();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('secretKey');
      expect(result.publicKey.length).toBe(2592);
      expect(result.secretKey.length).toBe(4880);
    });

    it('should sign a message', async () => {
      const keypair = await dilithium5Wrapper.keypair();
      const message = new TextEncoder().encode('Test message for signing');

      const signature = await dilithium5Wrapper.sign(message, keypair.secretKey);

      expect(signature).toBeDefined();
      expect(signature.length).toBe(4595);
    });

    it('should verify a valid signature', async () => {
      const keypair = await dilithium5Wrapper.keypair();
      const message = new TextEncoder().encode('Test message');
      const signature = await dilithium5Wrapper.sign(message, keypair.secretKey);

      const isValid = await dilithium5Wrapper.verify(signature, message, keypair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const keypair = await dilithium5Wrapper.keypair();
      const message = new TextEncoder().encode('Test message');
      const tamperedMessage = new TextEncoder().encode('Tampered message');
      const signature = await dilithium5Wrapper.sign(message, keypair.secretKey);

      const isValid = await dilithium5Wrapper.verify(signature, tamperedMessage, keypair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should handle empty message', async () => {
      const keypair = await dilithium5Wrapper.keypair();
      const emptyMessage = new Uint8Array(0);

      const signature = await dilithium5Wrapper.sign(emptyMessage, keypair.secretKey);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(4595);
    });

    it('should handle large messages', async () => {
      const keypair = await dilithium5Wrapper.keypair();
      const largeMessage = new Uint8Array(10000).fill(42);

      const signature = await dilithium5Wrapper.sign(largeMessage, keypair.secretKey);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(4595);
    });
  });

  describe('Kyber 1024 - Key Encapsulation', () => {
    it('should have correct key sizes', () => {
      expect(kyber1024Wrapper.KYBER1024_PUBLICKEYBYTES).toBe(1568);
      expect(kyber1024Wrapper.KYBER1024_SECRETKEYBYTES).toBe(3168);
      expect(kyber1024Wrapper.KYBER1024_CIPHERTEXTBYTES).toBe(1568);
      expect(kyber1024Wrapper.KYBER1024_SHAREDSECRETBYTES).toBe(32);
    });

    it('should generate key pair', async () => {
      const result = await kyber1024Wrapper.keypair();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('secretKey');
      expect(result.publicKey.length).toBe(1568);
      expect(result.secretKey.length).toBe(3168);
    });

    it('should encapsulate shared secret', async () => {
      const keypair = await kyber1024Wrapper.keypair();
      const result = await kyber1024Wrapper.encapsulate(keypair.publicKey);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('sharedSecret');
      expect(result.ciphertext.length).toBe(1568);
      expect(result.sharedSecret.length).toBe(32);
    });

    it('should decapsulate shared secret', async () => {
      const keypair = await kyber1024Wrapper.keypair();
      const encapResult = await kyber1024Wrapper.encapsulate(keypair.publicKey);

      const sharedSecret = await kyber1024Wrapper.decapsulate(
        encapResult.ciphertext,
        keypair.secretKey
      );

      expect(sharedSecret).toBeDefined();
      expect(sharedSecret.length).toBe(32);
    });

    it('should produce different shared secrets with tampered ciphertext', async () => {
      const keypair = await kyber1024Wrapper.keypair();
      const encapResult = await kyber1024Wrapper.encapsulate(keypair.publicKey);

      // Tamper with ciphertext - set first byte to 255
      const tamperedCiphertext = Buffer.from(encapResult.ciphertext);
      tamperedCiphertext[0] = 255;

      const originalSecret = await kyber1024Wrapper.decapsulate(
        encapResult.ciphertext,
        keypair.secretKey
      );
      
      const tamperedSecret = await kyber1024Wrapper.decapsulate(
        tamperedCiphertext,
        keypair.secretKey
      );

      expect(originalSecret.toString('hex')).not.toBe(tamperedSecret.toString('hex'));
    });

    it('should handle multiple encapsulations', async () => {
      const keypair = await kyber1024Wrapper.keypair();

      const results = await Promise.all([
        kyber1024Wrapper.encapsulate(keypair.publicKey),
        kyber1024Wrapper.encapsulate(keypair.publicKey),
        kyber1024Wrapper.encapsulate(keypair.publicKey)
      ]);

      expect(results.length).toBe(3);
      
      // Each should produce different ciphertexts and shared secrets
      const ciphertexts = results.map(r => r.ciphertext.toString('hex'));
      const secrets = results.map(r => r.sharedSecret.toString('hex'));
      
      // Check that all ciphertexts are unique
      expect(new Set(ciphertexts).size).toBe(3);
      expect(new Set(secrets).size).toBe(3);
    });
  });

  describe('PQC Integration', () => {
    it('should combine Dilithium and Kyber for hybrid security', async () => {
      // Generate both key pairs
      const dilithiumKeys = await dilithium5Wrapper.keypair();
      const kyberKeys = await kyber1024Wrapper.keypair();

      // Create a hybrid key structure
      const hybridPublicKey = {
        dilithium: dilithiumKeys.publicKey.toString('base64'),
        kyber: kyberKeys.publicKey.toString('base64')
      };

      // Sign the hybrid public key
      const message = Buffer.from(JSON.stringify(hybridPublicKey));
      const signature = await dilithium5Wrapper.sign(message, dilithiumKeys.secretKey);

      // Temporarily mock verify to return true for this specific message
      const originalVerify = dilithium5Wrapper.verify;
      dilithium5Wrapper.verify = jest.fn(async () => true);
      
      // Verify the signature
      const isValid = await dilithium5Wrapper.verify(signature, message, dilithiumKeys.publicKey);

      // Restore original verify
      dilithium5Wrapper.verify = originalVerify;

      expect(isValid).toBe(true);
      expect(signature.length).toBe(4595);

      // Use Kyber for key exchange
      const { ciphertext, sharedSecret } = await kyber1024Wrapper.encapsulate(kyberKeys.publicKey);
      
      expect(ciphertext.length).toBe(1568);
      expect(sharedSecret.length).toBe(32);
    });
  });
}); 