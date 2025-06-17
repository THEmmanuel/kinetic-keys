// utils/KeyDerivation.js
const crypto = require("crypto");
const argon2 = require("argon2");

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// ==== Encoding Utils ====
function encodeBase62(buffer) {
	let num = BigInt("0x" + buffer.toString("hex"));
	let encoded = "";
	while (num > 0) {
		encoded = base62[num % 62n] + encoded;
		num = num / 62n;
	}
	return encoded || "0";
}

function decodeBase62(str) {
	let num = BigInt(0);
	for (const char of str) {
		num = num * 62n + BigInt(base62.indexOf(char));
	}
	const hex = num.toString(16);
	return Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex");
}

// ==== AES Helpers ====
function aesEncrypt(text, secretKey, iv) {
	const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);
	let encrypted = cipher.update(text, "utf-8");
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		encrypted,
		tag
	};
}

function aesDecrypt(encrypted, secretKey, iv, tag) {
	const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, iv);
	decipher.setAuthTag(tag);
	let decrypted = decipher.update(encrypted);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString("utf-8");
}

// ==== POEM MATRIX ====
function generatePoemMatrix(size = 16, length = 10) {
	const matrix = [];
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?";
	
	for (let i = 0; i < size; i++) {
		let row = "";
		for (let j = 0; j < length; j++) {
			const randomIndex = Math.floor(Math.random() * chars.length);
			row += chars[randomIndex];
		}
		matrix.push(row);
	}
	
	console.log("Generated Poem Matrix:", matrix);
	return matrix;
}

function getRandomIndices(matrixLength, count = 8) {
	const indices = new Set();
	while (indices.size < count) {
		indices.add(Math.floor(Math.random() * matrixLength));
	}
	return Array.from(indices);
}

function generateKeyWithPoemMatrix(poemMatrix, indices = null, keyId ) {
	if (!indices) {
		indices = getRandomIndices(poemMatrix.length);
	}
	const key = generateKeyFromMatrix(poemMatrix, indices, "", keyId);
	return {
		key,
		indices,
		keyId
	};
}

function generateKeyFromMatrix(poemMatrix, indices, saltKey, keyId) {
	const selected = indices.map((i) => poemMatrix[i]);
	const combined = selected.join("") + saltKey + keyId;
	return crypto.createHash("sha256").update(combined).digest();
}

async function deriveKeyGranular(salt, keygenKey, assemblerSecret) {
	const combinedSecret = Buffer.concat([keygenKey, assemblerSecret]);
	return await argon2.hash(combinedSecret.toString("hex"), {
		type: argon2.argon2id,
		salt,
		hashLength: 32,
		timeCost: 3,
		memoryCost: 2 ** 16,
		parallelism: 2,
		raw: true
	});
}

async function deriveBlueprintGranular(text, keygenKey) {
	const salt = crypto.randomBytes(16);
	const iv = crypto.randomBytes(12);
	const assemblerSecret = crypto.randomBytes(16);

	const ivHash = crypto.createHash("sha256").update(iv).digest().slice(0, 16);
	const instructionValue = Buffer.from(assemblerSecret).map((byte, i) => byte ^ ivHash[i]);
	const encodedInstruction = encodeBase62(instructionValue);

	const key = await deriveKeyGranular(salt, keygenKey, assemblerSecret);
	const {
		encrypted,
		tag
	} = aesEncrypt(text, key, iv);

	const blueprint = `${salt.toString("hex")}.${encodeBase62(encrypted)}.${encodeBase62(iv)}.${encodeBase62(tag)}.${encodedInstruction}`;
	return blueprint;
}

async function reconstructTextGranular(blueprint, keygenKey) {
	const [saltHex, encodedEncryptedText, encodedIv, encodedTag, encodedInstruction] = blueprint.split(".");
	const salt = Buffer.from(saltHex, "hex");
	const encryptedText = decodeBase62(encodedEncryptedText);
	const iv = decodeBase62(encodedIv);
	const tag = decodeBase62(encodedTag);
	const instructionValue = decodeBase62(encodedInstruction);

	const ivHash = crypto.createHash("sha256").update(iv).digest().slice(0, 16);
	const reconstructedAssemblerSecret = Buffer.from(instructionValue).map((byte, i) => byte ^ ivHash[i]);

	try {
		const key = await deriveKeyGranular(salt, keygenKey, reconstructedAssemblerSecret);
		return aesDecrypt(encryptedText, key, iv, tag);
	} catch (err) {
		console.error("Decryption Error:", err.message);
		return null;
	}
}


	// Part 1: Generate
async function gen(text, poemMatrix, keyId) {
		console.log("\n🧪 gen: generating key and blueprint...");
		const {
			key,
			indices
		} = generateKeyWithPoemMatrix(poemMatrix, undefined, keyId);
		console.log("gen: 🔐 Generated Key:", key.toString("hex"));
		console.log("gen: 🧩 Indices Used:", indices);

		const blueprint = await deriveBlueprintGranular(text, key);
		console.log("gen: 📦 Generated Blueprint:\n", blueprint);

		return {
			blueprint,
			indices
		};
}

	// Part 2: Receive
async function receive(blueprint, poemMatrix, indices, keyId) {
		console.log("\n📥 receive: reconstructing key and decoding text...");
		const {
			key: reconstructedKey
		} = generateKeyWithPoemMatrix(poemMatrix, indices, keyId);

		const reconstructedText = await reconstructTextGranular(blueprint, reconstructedKey);
		console.log("receive: 🧾 Reconstructed Text:\n", reconstructedText);

		return reconstructedText;
}


module.exports = {
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular,
	generatePoemMatrix,
	gen,
	receive
};