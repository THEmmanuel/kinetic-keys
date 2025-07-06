# Testing and Quality Assurance

![Tests](https://github.com/THEmmanuel/kinetic-keys/workflows/Tests/badge.svg)
![Coverage](https://codecov.io/gh/THEmmanuel/kinetic-keys/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Test Coverage

Kinetic Keys includes comprehensive unit and integration tests to ensure reliability and security of all cryptographic operations.

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/
│   ├── KineticKeyUtils.test.js      # Core utility functions
│   └── PQCrypto.test.js             # Post-quantum cryptography
├── integration/
│   └── KineticKeys.integration.test.js  # Full workflow tests
├── fixtures/                         # Test data and mocks
└── setup.js                         # Jest configuration
```

## What's Tested

### Unit Tests

1. **KineticKeyUtils**
   - Key formatting and poem conversion
   - Mnemonic generation
   - Hashing functions
   - Voucher generation and verification
   - Key matrix operations
   - Encoding/decoding functions

2. **Post-Quantum Cryptography**
   - Dilithium 5 key generation
   - Digital signature creation and verification
   - Kyber 1024 key generation
   - Key encapsulation and decapsulation
   - Hybrid security implementations

### Integration Tests

1. **Complete Workflows**
   - End-to-end key generation and recovery
   - PQC integration with Kinetic Keys
   - Multi-party key exchange scenarios

2. **Security Tests**
   - Tamper detection
   - Concurrent operation safety
   - Stress testing for uniqueness

## Coverage Goals

We maintain the following minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Custom Jest Matchers

The test suite includes custom matchers for cryptographic validation:

```javascript
expect(value).toBeValidHex();        // Validates hexadecimal strings
expect(value).toBeValidBase64();     // Validates base64 strings
expect(value).toBeWithinRange(min, max); // Range validation
```

## Continuous Integration

Tests run automatically on:
- Every push to `main` or `develop` branches
- All pull requests
- Multiple Node.js versions (16.x, 18.x, 20.x)
- Multiple operating systems (Ubuntu, Windows, macOS)

## Security Testing

All cryptographic operations are tested for:
- Correctness against known test vectors
- Resistance to tampering
- Proper error handling
- Memory safety (in WASM modules)

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for workflows
3. Ensure coverage remains above 80%
4. All tests must pass before merging 