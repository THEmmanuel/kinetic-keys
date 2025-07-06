# Post-Quantum Cryptography WASM Modules for Kinetic Keys

This directory contains WebAssembly implementations of NIST-approved post-quantum cryptographic algorithms.

## Implemented Algorithms

### Dilithium5 (Digital Signatures)
- NIST Level 5 security
- Public key: 2,592 bytes
- Private key: 4,880 bytes
- Signature: 4,595 bytes

### Kyber1024 (Key Encapsulation)
- NIST Level 5 security
- Public key: 1,568 bytes
- Private key: 3,168 bytes
- Ciphertext: 1,568 bytes
- Shared secret: 256 bits

## Usage Examples

See individual module directories for usage examples and test files.

## Security Notice

The included RNG is for testing only. Use crypto.getRandomValues() in production.
