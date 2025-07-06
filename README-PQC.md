# Kinetic Keys SDK v2.0.0 - Post-Quantum Cryptography

🚀 **A comprehensive post-quantum cryptography library featuring NIST-standardized algorithms for quantum-resistant security.**

## 🛡️ Overview

The Kinetic Keys SDK v2.0.0 introduces robust post-quantum cryptography capabilities, implementing the NIST-selected algorithms Dilithium (digital signatures) and Kyber (key encapsulation) at the highest security levels. This library is designed to future-proof your cryptographic applications against quantum computing threats.

## 🔐 Supported Algorithms

### Key Encapsulation Mechanism (KEM)
- **Kyber-1024** - NIST Level 5 security
  - Public Key: 1,568 bytes
  - Private Key: 3,168 bytes
  - Ciphertext: 1,568 bytes
  - Shared Secret: 32 bytes

### Digital Signature Algorithm (DSA)
- **Dilithium-5** - NIST Level 5 security
  - Public Key: 2,592 bytes
  - Private Key: 4,880 bytes
  - Signature: up to 4,595 bytes

## 📦 Installation

```bash
npm install kinetic-keys
```

## 🚀 Quick Start

### Basic Usage

```javascript
const KineticKeys = require('kinetic-keys');
const { PQC } = KineticKeys;

async function quickDemo() {
    // Check if PQC modules are available
    const availability = await PQC.isAvailable();
    console.log('Kyber available:', availability.kyber);
    console.log('Dilithium available:', availability.dilithium);

    if (availability.kyber && availability.dilithium) {
        console.log('🎉 Ready for post-quantum cryptography!');
    }
}

quickDemo();
```

### Key Encapsulation (Kyber-1024)

```javascript
async function kyberExample() {
    // Generate recipient's key pair
    const recipientKeys = await PQC.KEM.generateKeyPair();
    
    // Sender encapsulates a shared secret
    const { ciphertext, sharedSecret } = await PQC.KEM.encapsulate(recipientKeys.publicKey);
    
    // Recipient decapsulates the shared secret
    const decapsulatedSecret = await PQC.KEM.decapsulate(ciphertext, recipientKeys.privateKey);
    
    // Verify secrets match
    console.log('Secrets match:', 
        Array.from(sharedSecret).every((byte, i) => byte === decapsulatedSecret[i])
    );
}
```

### Digital Signatures (Dilithium-5)

```javascript
async function dilithiumExample() {
    // Generate signing key pair
    const signingKeys = await PQC.DSA.generateKeyPair();
    
    const message = "Hello, post-quantum world!";
    
    // Sign the message
    const signedMessage = await PQC.DSA.signMessage(message, signingKeys.privateKey);
    
    // Verify the signature
    const verifiedMessage = await PQC.DSA.verifyMessage(signedMessage, signingKeys.publicKey);
    
    if (verifiedMessage) {
        console.log('✅ Signature verified!');
        console.log('Original message:', new TextDecoder().decode(verifiedMessage));
    }
}
```

### Combined Secure Communication

```javascript
async function secureComm() {
    // Alice and Bob generate their key pairs
    const aliceKemKeys = await PQC.KEM.generateKeyPair();
    const aliceDsaKeys = await PQC.DSA.generateKeyPair();
    
    const bobKemKeys = await PQC.KEM.generateKeyPair();
    
    const message = "Confidential post-quantum message";
    
    // Alice signs and encrypts
    const signedMessage = await PQC.DSA.signMessage(message, aliceDsaKeys.privateKey);
    const { ciphertext, sharedSecret } = await PQC.KEM.encapsulate(bobKemKeys.publicKey);
    
    // Bob decrypts and verifies
    const bobSecret = await PQC.KEM.decapsulate(ciphertext, bobKemKeys.privateKey);
    const verified = await PQC.DSA.verifyMessage(signedMessage, aliceDsaKeys.publicKey);
    
    console.log('Secure communication established!');
}
```

## 📚 Complete API Reference

### PQC.KEM (Kyber-1024)

#### Methods

- **`generateKeyPair()`** → `Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>`
  - Generates a new Kyber-1024 key pair

- **`encapsulate(publicKey)`** → `Promise<{ciphertext: Uint8Array, sharedSecret: Uint8Array}>`
  - Encapsulates a shared secret using recipient's public key
  - `publicKey`: Uint8Array (1,568 bytes)

- **`decapsulate(ciphertext, privateKey)`** → `Promise<Uint8Array>`
  - Decapsulates shared secret from ciphertext
  - `ciphertext`: Uint8Array (1,568 bytes)
  - `privateKey`: Uint8Array (3,168 bytes)
  - Returns: Shared secret (32 bytes)

- **`toBase64(data)`** → `string`
  - Converts Uint8Array to base64 string

- **`fromBase64(base64)`** → `Uint8Array`
  - Converts base64 string to Uint8Array

### PQC.DSA (Dilithium-5)

#### Methods

- **`generateKeyPair()`** → `Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>`
  - Generates a new Dilithium-5 key pair

- **`signMessage(message, privateKey)`** → `Promise<Uint8Array>`
  - Signs a message (attached signature)
  - `message`: string or Uint8Array
  - `privateKey`: Uint8Array (4,880 bytes)

- **`createSignature(message, privateKey)`** → `Promise<Uint8Array>`
  - Creates a detached signature
  - Returns: Signature (up to 4,595 bytes)

- **`verifyMessage(signedMessage, publicKey)`** → `Promise<Uint8Array|null>`
  - Verifies signed message and extracts original
  - Returns: Original message or null if invalid

- **`verifySignature(signature, message, publicKey)`** → `Promise<boolean>`
  - Verifies a detached signature
  - Returns: true if signature is valid

- **`toBase64(data)`** → `string`
  - Converts Uint8Array to base64 string

- **`fromBase64(base64)`** → `Uint8Array`
  - Converts base64 string to Uint8Array

### PQC Utility Methods

- **`PQC.isAvailable()`** → `Promise<{kyber: boolean, dilithium: boolean}>`
  - Checks if PQC modules are available

- **`PQC.getInfo()`** → `Object`
  - Returns version and algorithm information

## 🎮 Running the Demo

The SDK includes a comprehensive demo showcasing all PQC functionality:

```bash
# Run the complete PQC demo
npm run demo

# Or run directly
node pqc-demo.js
```

The demo includes:
- Kyber-1024 key encapsulation demonstration
- Dilithium-5 digital signature examples
- Combined secure communication workflow
- Performance timing and verification

## 🔧 Requirements

### WASM Modules
The PQC functionality requires pre-built WebAssembly modules:
- `pqc-package/lib/kyber1024/kyber1024.wasm`
- `pqc-package/lib/dilithium5/dilithium5.wasm`

### Node.js
- Node.js 14.x or higher
- Works in both Node.js and browser environments

## 🛠️ Building WASM Modules

If you need to rebuild the WASM modules:

```bash
# Build Kyber-1024
cd wasm/kyber1024
make -f Makefile.emcc

# Build Dilithium-5
cd wasm/dilithium5
make -f Makefile.emcc
```

## 🔐 Security Considerations

- **Quantum Resistance**: Both algorithms are designed to be secure against quantum computer attacks
- **NIST Level 5**: Provides the highest security level equivalent to AES-256
- **Side-Channel Resistance**: Implementations include protections against timing attacks
- **Memory Safety**: All sensitive operations are performed in isolated WASM memory

## 📈 Performance

Typical performance on modern hardware:

| Operation | Kyber-1024 | Dilithium-5 |
|-----------|------------|-------------|
| Key Generation | ~1ms | ~2ms |
| Encapsulate/Sign | ~1ms | ~3ms |
| Decapsulate/Verify | ~1ms | ~2ms |

## 🎯 Use Cases

- **Secure Messaging**: End-to-end encrypted communication
- **Digital Certificates**: Post-quantum PKI infrastructure
- **Secure Key Exchange**: Quantum-resistant key establishment
- **Document Signing**: Future-proof digital signatures
- **IoT Security**: Lightweight post-quantum protocols

## 🔗 Legacy Compatibility

Version 2.0.0 maintains full backward compatibility with existing utilities:

```javascript
const KineticKeys = require('kinetic-keys');

// Legacy utilities still available
const uniqueId = KineticKeys.generateUniqueID();
const poemMatrix = KineticKeys.generatePoemMatrix();
// ... etc
```

## 🤝 Contributing

We welcome contributions to improve the post-quantum cryptography implementation:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📜 License

MIT License - see LICENSE file for details.

## 🏆 Acknowledgments

- **NIST**: For standardizing post-quantum cryptography algorithms
- **CRYSTALS-Kyber Team**: For the Kyber key encapsulation mechanism
- **CRYSTALS-Dilithium Team**: For the Dilithium digital signature algorithm
- **Emscripten**: For enabling C/C++ to WebAssembly compilation

---

**⚡ Ready to secure your applications against quantum threats with Kinetic Keys SDK v2.0.0!** 