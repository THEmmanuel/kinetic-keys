// utils/KeyDerivation.js
const crypto = require("crypto");
const argon2 = require("argon2");

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";


const { generateUniqueID } = require('./utils/GenerateUniqueID');

// === Utilities to serialize/deserialize ===
function serializePoemMatrix(matrix) {
	return matrix.join('|'); // simple delimiter
}

function deserializePoemMatrix(serialized) {
	return serialized.split('|');
}

// === Dynamic POEM_MATRIX Generation ===
async function generatePoemMatrix(length = 16, idLength = 8) {
	const promises = Array.from({ length }, () => generateUniqueID(idLength));
	const poemMatrix = await Promise.all(promises);
	return poemMatrix;
}

// === Key Generation from POEM_MATRIX ===
function getRandomIndices(matrixLength, count = 8) {
	const indices = new Set();
	while (indices.size < count) {
		indices.add(Math.floor(Math.random() * matrixLength));
	}
	return Array.from(indices);
}

function generateKeyFromMatrix(indices, matrix, keyId = "TEST-KEY-ID") {
	const selected = indices.map(i => matrix[i]).join('');
	const hash = require('crypto').createHash('sha256');
	hash.update(selected + keyId);
	return hash.digest();
}

function generateKeyWithPoemMatrix(matrix, indices = getRandomIndices(matrix.length), keyId = "TEST-KEY-ID") {
	const key = generateKeyFromMatrix(indices, matrix, keyId);
	return {
		key,
		indices,
		keyId
	};
}


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
const POEM_MATRIX = [
	"w4Zg@1#rT8", "p9Lm2%vXeQ", "z6Kb&0NcYh", "aR3Tu@q!Vs",
	"Z9mLp2#XwK", "Bg7$Ye!mQs", "t@6Xo#vWrL", "nB3TzKp8!Q",
	"UeX0@#Vm29", "jK%lMvR4@z", "WzY@1vX&Lo", "qT9mP0!NrZ",
	"s@XnLp7VKe", "o0Lm@Pw2#r", "Nz8YT!oKm#", "xvR2Lp@WzQ"
];

function getRandomIndices(matrixLength = POEM_MATRIX.length, count = 8) {
	const indices = new Set();
	while (indices.size < count) {
		indices.add(Math.floor(Math.random() * matrixLength));
	}
	return Array.from(indices);
}

function generateKeyWithPoemMatrix(indices = getRandomIndices(), keyId = "TEST-KEY-ID") {
	const key = generateKeyFromMatrix(indices, "", keyId);
	return {
		key,
		indices,
		keyId
	};
}


function generateKeyFromMatrix(indices, saltKey = "", keyId = "TEST-KEY-ID") {
	const selected = indices.map((i) => POEM_MATRIX[i]);
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



module.exports = {
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular
};