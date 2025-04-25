// PSEUDO-CODE
// # User B generates their Unlock Hash (UH)
// FUNCTION generateUnlockHash(passphrase):
//     return HASH(passphrase)  # Secure one-way hash
// done.


const crypto = require("crypto");
const argon2 = require("argon2");

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function encodeBase62(buffer) {
	let num = BigInt("0x" + buffer.toString("hex"));
	let encoded = "";
	while (num > 0) {
		encoded = base62[num % 62n] + encoded;
		num = num / 62n;
	}
	return encoded || "0";
}

function base62Decode(str) {
	let num = BigInt(0);
	for (const char of str) {
		num = num * 62n + BigInt(base62.indexOf(char));
	}
	const hex = num.toString(16);
	return Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex");
}

function xorBuffers(buf1, buf2) {
	const result = Buffer.alloc(Math.min(buf1.length, buf2.length));
	for (let i = 0; i < result.length; i++) {
		result[i] = buf1[i] ^ buf2[i];
	}
	return result;
}

// Generate Unlock Hash — single or dual mode
async function generateUnlockHash(passphraseA, passphraseB = null, mode = "single") {
	const salt = crypto.randomBytes(16);

	if (mode === "dual") {
		if (!passphraseB) throw new Error("Dual mode requires two passphrases.");

		const keyA = await argon2.hash(passphraseA, {
			type: argon2.argon2id,
			salt,
			hashLength: 32,
			timeCost: 3,
			memoryCost: 2 ** 16,
			parallelism: 2,
			raw: true
		});

		const keyB = await argon2.hash(passphraseB, {
			type: argon2.argon2id,
			salt,
			hashLength: 32,
			timeCost: 3,
			memoryCost: 2 ** 16,
			parallelism: 2,
			raw: true
		});

		const hmacA = crypto.createHmac("sha256", keyA).update(salt).digest();
		const hmacB = crypto.createHmac("sha256", keyB).update(salt).digest();

		const xorHash = xorBuffers(hmacA, hmacB);

		const encodedXor = encodeBase62(xorHash).slice(0, 30);
		const checksumA = encodeBase62(hmacA.slice(0, 3));
		const checksumB = encodeBase62(hmacB.slice(0, 3));

		return `dual.${salt.toString("hex")}.${encodedXor}.${checksumA}.${checksumB}`;
	}

	// single mode
	const key = await argon2.hash(passphraseA, {
		type: argon2.argon2id,
		salt,
		hashLength: 32,
		timeCost: 3,
		memoryCost: 2 ** 16,
		parallelism: 2,
		raw: true
	});

	const hmac = crypto.createHmac("sha256", key).update(passphraseA).digest();
	return `${salt.toString("hex")}.${encodeBase62(hmac).slice(0, 15)}`;
}

// Verify Unlock Hash — single or dual mode
async function verifyUnlockHash(storedUnlockHash, inputPassphrase, mode = "single") {
	const parts = storedUnlockHash.split(".");
	let saltHex, storedHash;

	if (mode === "dual" || storedUnlockHash.startsWith("dual.")) {
		const [_, __, encodedXor, checksumA, checksumB] = parts;
		saltHex = parts[1];
		const salt = Buffer.from(saltHex, "hex");

		const key = await argon2.hash(inputPassphrase, {
			type: argon2.argon2id,
			salt,
			hashLength: 32,
			timeCost: 3,
			memoryCost: 2 ** 16,
			parallelism: 2,
			raw: true
		});

		const hmac = crypto.createHmac("sha256", key).update(salt).digest();
		const testChecksum = encodeBase62(hmac.subarray(0, 3));
		return testChecksum === checksumA || testChecksum === checksumB;
	}

	// single mode
	if (parts.length === 3) {
		[, saltHex, storedHash] = parts;
	} else if (parts.length === 2) {
		[saltHex, storedHash] = parts;
	} else {
		throw new Error("Invalid unlock hash format.");
	}

	const salt = Buffer.from(saltHex, "hex");

	const key = await argon2.hash(inputPassphrase, {
		type: argon2.argon2id,
		salt,
		hashLength: 32,
		timeCost: 3,
		memoryCost: 2 ** 16,
		parallelism: 2,
		raw: true
	});

	const hmac = crypto.createHmac("sha256", key).update(inputPassphrase).digest();
	const generatedHash = encodeBase62(hmac).slice(0, 15);
	return generatedHash === storedHash;
}


// Example Usage
// (async () => {
// 	const sharedHash = await generateUnlockHash("aliceSecret", "bobSecret", "dual");
// 	console.log("Generated Dual Unlock Hash:", sharedHash);

// 	const validA = await verifyUnlockHash(sharedHash, "aliceSecret", "dual"); // true
// 	const validB = await verifyUnlockHash(sharedHash, "bobSecret", "dual"); // true
// 	const invalid = await verifyUnlockHash(sharedHash, "charlieSecret", "dual"); // false

// 	console.log("Alice valid?", validA);
// 	console.log("Bob valid?", validB);
// 	console.log("Charlie valid?", invalid);


// 	const passphrase = "mySuperSecurePassword!";
// 	const passphrase2 = "mySuperSecurePassword!";

// 	// Generate the unlock hash (for storage)
// 	const unlockHash = await generateUnlockHash(passphrase);
// 	console.log("Generated Unlock Hashhhhhhh:", unlockHash);

// 	// Verify the user's passphrase (simulate user input)
// 	const isVerified = await verifyUnlockHash(unlockHash, passphrase2);
// 	console.log("Is Passphrase Verified?", isVerified);
// })();

module.exports = {
	generateUnlockHash,
	verifyUnlockHash
};