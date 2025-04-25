# Kinetic Keys SDK

Kinetic Keys (KK) is a novel cryptographic framework that enables secure, privacy-preserving digital transactions without exposing sensitive underlying data. Unlike traditional zero-knowledge proofs (ZKPs) that impose significant computational overhead, Kinetic Keys achieves comparable security guarantees through hierarchical key derivation, deterministic encryption, and structured hashing techniques. The system provides a deterministic yet tamper-resistant mechanism for issuing, transferring, and verifying digital assets with minimal computational requirements.

This SDK includes a set of utilities for generating secure keys, encrypting/decrypting payloads, managing unlock hashes, and reconstructing content using granular poem-based key derivation.

## ✨ Features
- 🔑 Generate unique unlock hashes (single or dual mode)
- 🔍 Verify unlock hashes
- 🧬 Poem-matrix-based key generation and granular reconstruction
- 📦 Create and decrypt Kinetic Key vouchers
- 🆔 Generate unique IDs for users or sessions

## ⚠️ Environment
This SDK is for use in Node.js environments only. Browser-based environments are currently unsupported.

---

## 🔐 Generate Unlock Hashes
The foundation of Kinetic Keys is the Unlock Hash (UH), a secure, non-reversible transformation of a user's secret passphrase. The UH serves as the cryptographic anchor for all subsequent operations.

### Single Mode
```js
const hash = generateUnlockHash('U&Z1I2$9');
console.log(hash);
// Example output: cb7dd3e80e275d58735d0f7991796bb6.KUcS91vx5Dm4Hzc
```

### Dual Mode
The dual mode allows a voucher or transaction to be unlocked using two separate passphrases:
```js
const dualHash = generateUnlockHash('1234', '8888', 'dual');
console.log(dualHash);
// Example output: dual.58d072cf8f27fdaafb2f22eca81dc851.x8w9tBS81QSTg1ftA2xzmAdT0bBtUW.QQhz.gCEB
```

---

## ✅ Verify Unlock Hashes
```js
const result = verifyUnlockHash('U&Z1I2$9', '<storedUnlockHash>');
console.log(result); // true or false
```

---

## 📦 Create Kinetic Key Voucher
Encapsulate sensitive data within a voucher that can only be decrypted using the correct passphrase.

```js
const voucherID = await generateUniqueID(32);

const voucher = createVoucher({
  id: voucherID,
  payload: "Sensitive asset metadata"
}, UnlockHash, SYSTEM_SECRET_KEY);
```

---

## 🔓 Decrypt Kinetic Key Voucher
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

## 📐 Key Derivation Using Poem Matrix
The poem-matrix-based approach generates encryption keys by selecting randomized segments from a matrix of strings, enabling secure transmission of sensitive data with only a reconstruction blueprint.

### Generate Poem Matrix
```js
const poemMatrix = generatePoemMatrix();
console.log(poemMatrix);
// Example output:
// ["I0RIIIhO", "zmTi04jX", "mLr$oS9T", "ZTHrgcUu", "#8tfPHkZ", ...]
```

### Derive Key and Blueprint
```js
const { key, indices, keyId } = generateKeyWithPoemMatrix(poemMatrix);
const blueprint = await deriveBlueprintGranular("Secret text", key);
```

### Reconstruct Text
```js
const original = await reconstructTextGranular(blueprint, key);
console.log(original); // "Secret text"
```

---

# 🔐 Unique ID Generation

The Kinetic Keys SDK includes a utility to generate unique identifiers using a cryptographically secure random generator based on `nanoid`. These IDs are useful for generating unique voucher IDs, session tokens, or user identifiers within the Kinetic Key system.

## ✨ Features
- Generates cryptographically secure, non-sequential IDs
- Customizable character set and length
- Lightweight and efficient

---

## 📦 generateUniqueID

Generates a unique alphanumeric ID of the specified length. Internally, it uses a custom character set including special characters for added entropy.

### Syntax
```js
const { generateUniqueID } = require('@projekt-kinetic/kinetic-keys');

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

## Under the Hood
This function wraps around the `nanoid` library using the `customAlphabet` method to create a secure, flexible ID generator with a rich character set:
```js
const alphabet = '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
```

This makes the output suitable for high-entropy requirements in security-sensitive contexts.

---

## ❗ Environment
Requires Node.js. Not available for browser-based use.



Licensing: https://emmanuels-organization-21.gitbook.io/kinetic/kinetic-keys-a-lightweight-zero-knowledge-framework-for-secure-digital-transactions#license




© 2025 Projekt Kinetic. All rights reserved.

