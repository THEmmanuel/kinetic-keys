const {
	generateUniqueID
} = require('./utils/GenerateUniqueID');

const {
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular
} = require('./utils/KeyDerivation');

const {
	generateUnlockHash,
	verifyUnlockHash
} = require('./utils/UnlockHash');

const {
	createVoucher,
	decryptVoucher
} = require('./utils/KineticKeyUtils');

// New wrapper functions for easier use
async function generateKeyAndBlueprint(text, keyId) {
	const poemMatrix = generatePoemMatrix();
	const { blueprint, indices } = await gen(text, poemMatrix, keyId);
	return { blueprint, indices, poemMatrix };
}

async function reconstructText(blueprint, poemMatrix, indices, keyId) {
	return await receive(blueprint, poemMatrix, indices, keyId);
}

// Helper functions from KeyDerivation.js
async function gen(text, poemMatrix, keyId) {
	console.log("\n🧪 gen: generating key and blueprint...");
	const { key, indices } = generateKeyWithPoemMatrix(poemMatrix, undefined, keyId);
	console.log("gen: 🔐 Generated Key:", key.toString("hex"));
	console.log("gen: 🧩 Indices Used:", indices);

	const blueprint = await deriveBlueprintGranular(text, key);
	console.log("gen: 📦 Generated Blueprint:\n", blueprint);

	return { blueprint, indices };
}

async function receive(blueprint, poemMatrix, indices, keyId) {
	console.log("\n📥 receive: reconstructing key and decoding text...");
	const { key: reconstructedKey } = generateKeyWithPoemMatrix(poemMatrix, indices, keyId);

	const reconstructedText = await reconstructTextGranular(blueprint, reconstructedKey);
	console.log("receive: 🧾 Reconstructed Text:\n", reconstructedText);

	return reconstructedText;
}

	generateUniqueID(8).then(console.log)


module.exports = {
	// Unique ID
	generateUniqueID,

	// Key Derivation
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular,
	generateKeyAndBlueprint,
	reconstructText,

	// Unlock Hash
	generateUnlockHash,
	verifyUnlockHash,

	// Vouchers
	createVoucher,
	decryptVoucher,
};