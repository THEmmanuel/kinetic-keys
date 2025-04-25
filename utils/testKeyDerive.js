// testKeyDerivation.js
const {
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular
} = require('./KeyDerivation');

(async () => {
	const sampleText = "Top secret: Null Wallet is alive. 🧬";
	const keyId = "NULLWALLET-001";

	// Part 1: Generate
	async function gen(text, keyId) {
		console.log("\n🧪 gen: generating key and blueprint...");
		const {
			key,
			indices
		} = generateKeyWithPoemMatrix(undefined, keyId);
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
	async function receive(blueprint, indices, keyId) {
		console.log("\n📥 receive: reconstructing key and decoding text...");
		const {
			key: reconstructedKey
		} = generateKeyWithPoemMatrix(indices, keyId);

		const reconstructedText = await reconstructTextGranular(blueprint, reconstructedKey);
		console.log("receive: 🧾 Reconstructed Text:\n", reconstructedText);

		return reconstructedText;
	}

	// Run both
	const {
		blueprint,
		indices
	} = await gen(sampleText, keyId);
	const reconstructedText = await receive(blueprint, indices, keyId);

	console.log("\n✅ Test Passed:", sampleText === reconstructedText);
})();