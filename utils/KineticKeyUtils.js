const crypto = require("crypto");
const {
	verifyUnlockHash
} = require('./UnlockHash');

// const SYSTEM_SECRET_KEY = "YourStaticSecretKeyHere"; // Replace with a secure key

function generateRandomKey() {
	return crypto.randomBytes(32); // AES-256 key
}

function encryptAESGCM(data, key) {
	const iv = crypto.randomBytes(12); // 96-bit IV for GCM
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	let encrypted = cipher.update(data, "utf8", "base64");
	encrypted += cipher.final("base64");
	const authTag = cipher.getAuthTag();

	return {
		encryptedData: encrypted,
		iv: iv.toString("base64"),
		authTag: authTag.toString("base64"),
	};
}

function decryptAESGCM(encryptedData, key, iv, authTag) {
	const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
	decipher.setAuthTag(Buffer.from(authTag, "base64"));

	let decrypted = decipher.update(encryptedData, "base64", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

function deriveKey(UH, KEY) {
	return crypto.createHmac("sha256", KEY).update(UH).digest();
}

function shuffleObject(obj) {
	const keys = Object.keys(obj);
	keys.sort(() => Math.random() - 0.5); // Shuffle keys randomly
	return Object.fromEntries(keys.map(key => [key, obj[key]]));
}

function createVoucher(data, UH, SYSTEM_SECRET_KEY) {
	const EK = generateRandomKey(); // Generate one-time encryption key
	const encryptedVoucher = encryptAESGCM(data, EK);

	// Derive key from (UH + system secret key)
	const derivedKey = deriveKey(UH, SYSTEM_SECRET_KEY);

	// Encrypt EK using the derived key
	const encryptedEK = encryptAESGCM(EK.toString("base64"), derivedKey);

	// Introduce random salt and shuffle JSON properties
	const voucherObj = shuffleObject({
		encryptedData: encryptedVoucher.encryptedData,
		iv: encryptedVoucher.iv,
		authTag: encryptedVoucher.authTag,
		encryptedEK: encryptedEK.encryptedData,
		ekIv: encryptedEK.iv,
		ekAuthTag: encryptedEK.authTag,
		salt: crypto.randomBytes(8).toString("base64")
	});

	// Base64 encode the shuffled object
	const voucherCode = Buffer.from(JSON.stringify(voucherObj)).toString("base64");

	return voucherCode;
}

async function decryptVoucher(voucherCode, passphrase, storedUH) {
	// Verify the passphrase with the stored unlock hash
	const isVerified = await verifyUnlockHash(storedUH, passphrase);
	if (!isVerified) {
		throw new Error("Invalid passphrase");
	}

	// Decode the voucher data
	const decodedData = JSON.parse(Buffer.from(voucherCode, "base64").toString("utf8"));

	// Derive key from (UH + system secret key)
	const derivedKey = deriveKey(storedUH);

	// Decrypt EK
	const decryptedEK = decryptAESGCM(
		decodedData.encryptedEK,
		derivedKey,
		decodedData.ekIv,
		decodedData.ekAuthTag
	);

	// Convert EK back to buffer
	const EK = Buffer.from(decryptedEK, "base64");

	// Decrypt the original voucher data
	const originalData = decryptAESGCM(
		decodedData.encryptedData,
		EK,
		decodedData.iv,
		decodedData.authTag
	);

	return originalData;
}



// Example Usage
// (async () => {
//     const passphrase = "8888";
//     const storedUH = '3aff1b0d4c037f99e895c77c0866cc20.eP4hijZiLit1hXD';
//     const voucherData = '100000';

//     // const voucherCode = createVoucher(voucherData, storedUH);
//     // console.log("Generated Voucher Code:", voucherCode);

//     try {
//         const decryptedData = await decryptVoucher(voucherCode = 'eyJlbmNyeXB0ZWREYXRhIjoiQ3NkaU9rSXVDekhQQ3hEUTRpN0NRcTE3M0F2R2xLZGRQVFBBUzFFU25kQkJqZmJaMy91Tklqdzd5empCZFhCQjU3RnJhOFJoYzcyQTRCVm1mWDFnalZNdG5rT3A0NmZYam1WNTJOV0xwZkM0Nnl6WEVCTFRYMUgxUlYyUHpkOFBsSmg4TmVmVVpVTWhpVDBmcktDR1l4ZE9PZmpZUExUcmh0YWt0M2ZHbkhTSGpJTkdSbW5ZMWc5SkgzL0NCOWFxaWdZcGl0dmVhYlBkMHgxMFkwb0MrejBrZmY5TnZYMEprS2hGdWZubDFPSVZ3aXpKd0J6c0lsR2RnL3VGTEJyWE9Qdm1lUUFxdVg4NWNtbkdoZ3I2THU5SlBXSG56cU9yMFlhdU5hVnBGeGFVdWc0clROV3JJT0VyT2V2T0pyRFN5NDU4Ry9MRkl3SFdwdkFEODFtY1h4aTM2Q3VJK2hyUTVWN0d1d0FqdnZWTnJuVnlTaHZtcnhQMUxWVzAiLCJzYWx0IjoiTXF5R3pZYlhudUE9IiwiYXV0aFRhZyI6ImxyYjczNE9HSExYR2x4VjEvMTMzd3c9PSIsImVrQXV0aFRhZyI6IlY5SXh0RnpXTkFXK1FwVEpUbG0yVkE9PSIsIml2IjoiS1l4TnpEaVJOaDJ4QWJzNyIsImVrSXYiOiJUV096dVp6dHhidnF6THU2IiwiZW5jcnlwdGVkRUsiOiJvOWhFZCs4WHlzNUZSbU5LbGpMbmxqTWdWMDZlMlZ2THhEbHVqbWtramZ5bHNGT1BWZ1pQd2NIcnQ4ND0ifQ==', passphrase, storedUH);
//         console.log("Decrypted Voucher Data:", decryptedData);
//     } catch (error) {
//         console.error("Decryption Failed:", error.message);
//     }
// })();

module.exports = {
	createVoucher,
	decryptVoucher
};