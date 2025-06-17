# Kinetic Keys SDK

A Lightweight Zero-Knowledge Framework for Secure Digital Transactions.

## Installation

```bash
npm install @ayxdele/kinetic-keys
```

Kinetic Keys (KK) is a novel cryptographic framework that enables secure, privacy-preserving digital transactions without exposing sensitive underlying data. Unlike traditional zero-knowledge proofs (ZKPs) that impose significant computational overhead, Kinetic Keys achieves comparable security guarantees through hierarchical key derivation, deterministic encryption, and structured hashing techniques. The system provides a deterministic yet tamper-resistant mechanism for issuing, transferring, and verifying digital assets with minimal computational requirements.

This SDK includes a set of utilities for generating secure keys, encrypting/decrypting payloads, managing unlock hashes, and reconstructing content using granular poem-based key derivation.

Whitepaper: https://emmanuels-organization-21.gitbook.io/kinetic/kinetic-keys-a-lightweight-zero-knowledge-framework-for-secure-digital-transactions#license

## ✨ Features
- 🆔 Generate unique IDs for users or sessions
- 🔑 Generate unique unlock hashes (single or dual mode)
- 🔍 Verify unlock hashes
- 📦 Create and decrypt Kinetic Key vouchers
- 🧬 Dynamic poem-matrix-based key generation and granular reconstruction

## ⚠️ Environment
This SDK is for use in Node.js environments only. Browser-based environments are currently unsupported.

---

# 🆔 Unique ID Generation

The Kinetic Keys SDK includes a utility to generate unique identifiers using a cryptographically secure random generator based on `nanoid`. These IDs are useful for generating unique voucher IDs, session tokens, or user identifiers within the Kinetic Key system.

## ✨ Features
- Generates cryptographically secure, non-sequential IDs
- Customizable character set and length
- Lightweight and efficient

## 📦 generateUniqueID

Generates a unique alphanumeric ID of the specified length. Internally, it uses a custom character set including special characters for added entropy.

### Syntax
```js
const { generateUniqueID } = require('@ayxdele/kinetic-keys');

const id = await generateUniqueID(length);
```

### Parameters
- `length` (`number`): The desired length of the unique ID.

### Returns
- `Promise<string>`: A promise that resolves to the generated unique ID.

### Example
```js
const id = await generateUniqueID(32);
console.log(id);
// Example output: @8GcB#5dPx7zF1A&K0qLm!Z9sU#XYT3%
```

---

# 🔑 Unlock Hash Generation

The foundation of Kinetic Keys is the Unlock Hash (UH), a secure, non-reversible transformation of a user's secret passphrase. The UH serves as the cryptographic anchor for all subsequent operations.

## Single Mode
```js
const hash = generateUnlockHash('U&Z1I2$9');
console.log(hash);
// Example output: cb7dd3e80e275d58735d0f7991796bb6.KUcS91vx5Dm4Hzc
```

## Dual Mode
The dual mode allows a voucher or transaction to be unlocked using two separate passphrases:
```js
const dualHash = generateUnlockHash('1234', '8888', 'dual');
console.log(dualHash);
// Example output: dual.58d072cf8f27fdaafb2f22eca81dc851.x8w9tBS81QSTg1ftA2xzmAdT0bBtUW.QQhz.gCEB
```

---

# 🔍 Unlock Hash Verification

Verify the authenticity of an unlock hash against a provided passphrase.

```js
const result = verifyUnlockHash('U&Z1I2$9', '<storedUnlockHash>');
console.log(result); // true or false
```

---

# 📦 Kinetic Key Vouchers

Vouchers provide a secure way to encapsulate sensitive data that can only be decrypted using the correct passphrase.

## Create Voucher
```js
const voucherID = await generateUniqueID(32);

const voucher = createVoucher({
  id: voucherID,
  payload: "Sensitive asset metadata"
}, UnlockHash, SYSTEM_SECRET_KEY);
```

## Decrypt Voucher
```js
const data = decryptVoucher(voucher, 'U&Z1I2$9', UnlockHash);
console.log(data); // Original payload object
```

### Dual Unlock Example
```js
const dualData = decryptVoucher(voucher, '1234', dualUnlockHash);
console.log(dualData); // Original payload object
```

---

# 🧬 Dynamic Poem Matrix Key Derivation

The poem-matrix-based approach generates encryption keys by selecting randomized segments from a dynamically generated matrix of strings, enabling secure transmission of sensitive data with only a reconstruction blueprint.

## Generate Dynamic Poem Matrix
```js
// Generate a default 16x10 matrix
const poemMatrix = generatePoemMatrix();

// Or customize the size and length
const customMatrix = generatePoemMatrix(20, 12); // 20 rows, 12 characters each
console.log(customMatrix);
// Example output:
// ["I0RIIIhO", "zmTi04jX", "mLr$oS9T", "ZTHrgcUu", "#8tfPHkZ", ...]
```

## Generate and Reconstruct Content
The new streamlined API provides two main functions for content encryption and reconstruction:

```js
// Generate a blueprint and indices
const { blueprint, indices } = await gen("Secret text", poemMatrix, keyId);

// Later, reconstruct the text
const reconstructedText = await receive(blueprint, poemMatrix, indices, keyId);
console.log(reconstructedText); // "Secret text"
```

The `gen` function handles:
- Key generation from the poem matrix
- Content encryption
- Blueprint creation
- Index selection

The `receive` function handles:
- Key reconstruction from the poem matrix and indices
- Content decryption
- Blueprint validation

---

## 📝 Comprehensive Usage Example

Here's a complete example showing how to use all the major features of Kinetic Keys:

```javascript
const {
    // Unique ID
    generateUniqueID,

    // Key Derivation
    generatePoemMatrix,
    gen,
    receive,

    // Unlock Hash
    generateUnlockHash,
    verifyUnlockHash,

    // Vouchers
    createVoucher,
    decryptVoucher
} = require('@ayxdele/kinetic-keys');

async function runTests() {
    try {
        console.log('🧪 Starting Kinetic Keys Comprehensive Test Suite\n');

        // === Test 1: Unique ID Generation ===
        console.log('📌 Test 1: Unique ID Generation');
        const uniqueId = await generateUniqueID(8);
        console.log('Generated Unique ID:', uniqueId);
        console.log('✅ Test 1 Passed\n');

        // === Test 2: Poem Matrix Generation ===
        console.log('📌 Test 2: Poem Matrix Generation');
        console.log('generatePoemMatrix type:', typeof generatePoemMatrix);
        const poemMatrix = generatePoemMatrix();
        console.log('Generated Poem Matrix:', poemMatrix);
        console.log('✅ Test 2 Passed\n');

        // === Test 3: New Gen and Receive Functions ===
        console.log('📌 Test 3: New Gen and Receive Functions');
        const testText = "This is a secret message that needs to be encrypted! 🔐";
        console.log('Original Text:', testText);

        // Generate blueprint and indices using gen
        const { blueprint, indices } = await gen(testText, poemMatrix, uniqueId);
        console.log('Generated Blueprint:', blueprint);
        console.log('Generated Indices:', indices);

        // Reconstruct text using receive
        const reconstructedText = await receive(blueprint, poemMatrix, indices, uniqueId);
        console.log('Reconstructed Text:', reconstructedText);
        console.log('Test Passed:', testText === reconstructedText);
        console.log('✅ Test 3 Passed\n');

        // === Test 4: Unlock Hash Generation and Verification ===
        console.log('📌 Test 4: Unlock Hash Generation and Verification');
        const unlockHash = await generateUnlockHash(testText);
        console.log('Generated Unlock Hash:', unlockHash);
        const isVerified = await verifyUnlockHash(unlockHash, testText);
        console.log('Hash Verification Result:', isVerified);
        console.log('✅ Test 4 Passed\n');

        // === Test 5: Voucher Creation and Decryption ===
        console.log('📌 Test 5: Voucher Creation and Decryption');
        const SYSTEM_SECRET_KEY = "YourStaticSecretKeyHere"; // In production, use a secure key
        const voucher = await createVoucher(testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Created Voucher:', voucher);
        const decryptedVoucher = await decryptVoucher(voucher, testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Decrypted Voucher:', decryptedVoucher);
        console.log('Test Passed:', testText === decryptedVoucher);
        console.log('✅ Test 5 Passed\n');

        // === Error Handling Tests ===
        console.log('📌 Error Handling Tests');

        // Test invalid blueprint
        try {
            await receive('invalid-blueprint', poemMatrix, indices, uniqueId);
            console.log('❌ Error handling test failed - should have thrown an error for invalid blueprint');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid blueprint error');
        }

        // Test invalid unlock hash
        try {
            await verifyUnlockHash(testText, 'invalid-hash');
            console.log('❌ Error handling test failed - should have thrown an error for invalid hash');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid hash error');
        }

        // Test invalid voucher
        try {
            await decryptVoucher('invalid-voucher', testText, unlockHash, SYSTEM_SECRET_KEY);
            console.log('❌ Error handling test failed - should have thrown an error for invalid voucher');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid voucher error');
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test suite failed with error:', error);
        console.error('Error stack:', error.stack);
    }
}

// Run all tests
runTests();
```

This example demonstrates:
- All major features of the SDK
- Proper error handling
- Integration between different components
- Best practices for using the library
- The new streamlined `gen` and `receive` functions for content encryption and reconstruction
- Integration with other Kinetic Keys features
- Proper error handling
- Complete workflow from key generation to content reconstruction
- Proper error handling

---

## ❗ Environment
Requires Node.js. Not available for browser-based use.

To run this example:
1. Save it as `test-kk.js`
2. Install the package: `npm install @ayxdele/kinetic-keys`
3. Run: `node test-kk.js`

© 2025 Projekt Kinetic. All rights reserved.