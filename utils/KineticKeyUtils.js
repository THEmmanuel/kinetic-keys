const crypto = require("crypto");
const {
	verifyUnlockHash
} = require('./UnlockHash');

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

async function decryptVoucher(voucherCode, passphrase, storedUH, SYSTEM_SECRET_KEY) {
	// Verify the passphrase with the stored unlock hash
	const isVerified = await verifyUnlockHash(storedUH, passphrase);
	if (!isVerified) {
		throw new Error("Invalid passphrase");
	}

	// Decode the voucher data
	const decodedData = JSON.parse(Buffer.from(voucherCode, "base64").toString("utf8"));

	// Derive key from (UH + system secret key)
	const derivedKey = deriveKey(storedUH, SYSTEM_SECRET_KEY);

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

module.exports = {
	createVoucher,
	decryptVoucher
};