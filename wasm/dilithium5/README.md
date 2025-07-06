# Dilithium 5 WASM Module

Post-quantum digital signatures for **Kinetic Keys SDK** using NIST Level 5 security.

## 🔒 Overview

This module compiles the **Dilithium 5** post-quantum cryptographic signature scheme to WebAssembly (WASM), enabling quantum-resistant digital signatures in Node.js environments. Dilithium 5 provides the highest security level (NIST Level 5) against both classical and quantum computers.

### Key Specifications
- **Public Key Size**: 2,592 bytes (2.5 KB)
- **Private Key Size**: 4,880 bytes (4.8 KB)
- **Signature Size**: 4,595 bytes (4.5 KB)
- **Security Level**: NIST Level 5 (256-bit quantum security)
- **Algorithm**: Lattice-based cryptography (Module-LWE)

## 🛠️ Prerequisites

### Required Tools
1. **Emscripten SDK** (for WASM compilation)
   ```bash
   # Install Emscripten
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **Node.js** (v14+ recommended)
   ```bash
   node --version  # Should be 14.0.0 or higher
   ```

3. **Make** (for build automation)
   ```bash
   make --version  # Any recent version
   ```

## 🚀 Quick Start

### 1. Build the WASM Module
```bash
# Navigate to the dilithium5 directory
cd wasm/dilithium5

# Check if Emscripten is available
make install

# Build the WASM module
make all

# Or build with optimization for production
make production
```

### 2. Test the Module
```bash
# Run comprehensive tests
node test-dilithium5.js

# Run performance benchmarks
node test-dilithium5.js --benchmark --iterations=50
```

### 3. Use in Your Code
```javascript
const { createDilithium5 } = require('./wasm/dilithium5/js/dilithium5-wrapper.js');

async function example() {
    // Initialize the WASM module
    const dilithium = await createDilithium5('./wasm/dilithium5/build/dilithium5.js');
    
    // Generate a key pair
    const { publicKey, privateKey } = await dilithium.generateKeyPair();
    
    // Sign a message
    const message = "Hello, post-quantum world!";
    const signature = await dilithium.createSignature(message, privateKey);
    
    // Verify the signature
    const isValid = await dilithium.verifySignature(signature, message, publicKey);
    console.log('Signature valid:', isValid); // true
}
```

## 📁 Directory Structure

```
wasm/dilithium5/
├── src/                    # C source files (copied from reference implementation)
│   ├── sign.c             # Main signing/verification logic
│   ├── poly.c             # Polynomial operations
│   ├── fips202.c          # SHA-3/SHAKE functions
│   ├── randombytes.c      # WASM-compatible random number generation
│   └── ...                # Other source files
├── js/                     # JavaScript wrapper and utilities
│   └── dilithium5-wrapper.js  # Main WASM interface
├── build/                  # Build outputs (generated)
│   ├── dilithium5.js      # Emscripten-generated JS wrapper
│   ├── dilithium5.wasm    # Compiled WASM binary
│   └── package.json       # NPM package definition
├── Makefile.emcc          # Emscripten build configuration
├── test-dilithium5.js     # Comprehensive test suite
└── README.md              # This file
```

## 🔧 Build Options

### Standard Build
```bash
make all
```
- Optimized for balance of size and performance
- Includes debug symbols for troubleshooting
- ~500KB WASM bundle size

### Production Build
```bash
make production
```
- Maximum optimization for production deployment
- Closure compiler optimization
- Smaller bundle size (~400KB)
- No debug symbols

### Debug Build
```bash
make debug
```
- Full debug symbols and runtime checks
- Useful for development and troubleshooting
- Larger bundle size (~800KB)

### Size-Optimized Build
```bash
make size
```
- Optimized for minimal bundle size
- May sacrifice some performance
- ~350KB WASM bundle size

## 🧪 Testing

### Comprehensive Test Suite
```bash
node test-dilithium5.js
```

Tests include:
- ✅ Key pair generation
- ✅ Message signing (detached signatures)
- ✅ Signature verification
- ✅ Invalid signature detection
- ✅ Attached signatures (sign + verify)
- ✅ Base64 encoding/decoding utilities
- 📊 Performance metrics
- 📏 Size analysis

### Performance Benchmarking
```bash
# Run 10 iterations (default)
node test-dilithium5.js --benchmark

# Run custom number of iterations
node test-dilithium5.js --benchmark --iterations=100
```

### Expected Performance (Node.js on modern hardware)
- **Key Generation**: ~20-50ms
- **Signing**: ~30-80ms
- **Verification**: ~15-40ms

*Performance varies based on hardware and optimization level*

## 📚 API Reference

### Core Class: `Dilithium5`

#### `generateKeyPair()` → `Promise<{publicKey, privateKey}>`
Generate a new Dilithium 5 key pair.

```javascript
const { publicKey, privateKey } = await dilithium.generateKeyPair();
```

#### `createSignature(message, privateKey)` → `Promise<Uint8Array>`
Create a detached signature for a message.

```javascript
const signature = await dilithium.createSignature("Hello World", privateKey);
```

#### `verifySignature(signature, message, publicKey)` → `Promise<boolean>`
Verify a detached signature.

```javascript
const isValid = await dilithium.verifySignature(signature, "Hello World", publicKey);
```

#### `signMessage(message, privateKey)` → `Promise<Uint8Array>`
Create an attached signature (message + signature combined).

```javascript
const signedMessage = await dilithium.signMessage("Hello World", privateKey);
```

#### `verifyMessage(signedMessage, publicKey)` → `Promise<Uint8Array|null>`
Verify an attached signature and recover the original message.

```javascript
const originalMessage = await dilithium.verifyMessage(signedMessage, publicKey);
```

### Static Utilities

#### `Dilithium5.toBase64(data)` → `string`
Convert binary data to Base64 string.

```javascript
const keyB64 = Dilithium5.toBase64(publicKey);
```

#### `Dilithium5.fromBase64(base64)` → `Uint8Array`
Convert Base64 string to binary data.

```javascript
const keyData = Dilithium5.fromBase64(keyB64);
```

## 🔗 Integration with Kinetic Keys

### Enhanced Unlock Hash (Post-Quantum)
```javascript
// Future integration example
const { generatePQUnlockHash } = require('../../utils/PQUnlockHash.js');

async function createPostQuantumHash(passphrase) {
    const dilithium = await createDilithium5();
    const { publicKey, privateKey } = await dilithium.generateKeyPair();
    
    // Combine traditional Argon2 with PQ signature
    const pqHash = await generatePQUnlockHash(passphrase, publicKey, privateKey);
    return pqHash;
}
```

### Enhanced Voucher System
```javascript
// Future integration example
async function createPQVoucher(data, unlockHash, systemSecretKey) {
    const dilithium = await createDilithium5();
    
    // Create traditional voucher
    const voucher = createVoucher(data, unlockHash, systemSecretKey);
    
    // Add post-quantum signature
    const signature = await dilithium.createSignature(voucher, privateKey);
    
    return {
        voucher,
        pqSignature: Dilithium5.toBase64(signature),
        type: 'pq-enhanced'
    };
}
```

## ⚡ Performance Considerations

### Memory Usage
- **Peak Memory**: ~16-32MB during operations
- **Persistent Memory**: ~8MB for loaded WASM module
- **Key Storage**: ~7.4KB per key pair (public + private)

### Bundle Size Impact
- **WASM Module**: ~400-800KB (depending on optimization)
- **JavaScript Wrapper**: ~15KB
- **Total Overhead**: ~500KB for post-quantum capability

### Optimization Strategies
1. **Lazy Loading**: Load WASM module only when PQ features are needed
2. **Key Reuse**: Reuse key pairs where cryptographically safe
3. **Compression**: Use gzip compression for key storage/transmission
4. **Hybrid Approach**: Traditional crypto for frequent operations, PQ for high-security

## 🛡️ Security Considerations

### Cryptographic Security
- **Post-Quantum Resistant**: Secure against Shor's algorithm
- **Classical Security**: 256-bit equivalent security level
- **Side-Channel Resistance**: Constant-time implementations
- **Random Number Generation**: Cryptographically secure (Web Crypto API/Node.js crypto)

### Implementation Security
- **Memory Safety**: All sensitive data cleared after use
- **Input Validation**: Comprehensive parameter checking
- **Error Handling**: Secure failure modes

### Key Management
- **Private Key Security**: Never expose private keys in logs/errors
- **Key Storage**: Use secure storage mechanisms
- **Key Rotation**: Implement regular key rotation for long-term security

## 🔍 Troubleshooting

### Common Issues

#### WASM Module Not Loading
```
Error: Cannot find module './build/dilithium5.js'
```
**Solution**: Build the module first with `make all`

#### Emscripten Not Found
```
emcc: command not found
```
**Solution**: Install and activate Emscripten SDK (see Prerequisites)

#### Memory Errors
```
RuntimeError: memory access out of bounds
```
**Solution**: Use debug build (`make debug`) for detailed error information

#### Performance Issues
- **Slow key generation**: Normal for post-quantum crypto (20-50ms expected)
- **Large bundle size**: Use size-optimized build (`make size`)
- **High memory usage**: Expected for lattice-based cryptography

### Debug Mode
Build with debug symbols for troubleshooting:
```bash
make debug
node test-dilithium5.js
```

## 📄 License

This WASM module is part of the Kinetic Keys SDK project. The underlying Dilithium algorithm is from the NIST Post-Quantum Cryptography standardization process.

## 🤝 Contributing

1. **Bug Reports**: File issues with detailed reproduction steps
2. **Performance Improvements**: Profile with `make debug` and submit optimizations
3. **Security Reviews**: Responsible disclosure for security issues
4. **Documentation**: Improve this README and code comments

## 📞 Support

For issues specific to this WASM module:
1. Check the troubleshooting section above
2. Run tests to isolate the problem: `node test-dilithium5.js`
3. Create an issue with full error logs and system information

---

**⚡ Ready to add post-quantum security to Kinetic Keys!** 🔒 