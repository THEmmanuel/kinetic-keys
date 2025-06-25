/**
 * Kinetic Keys SDK - Post-Quantum Cryptography Library
 * Version 2.0.0
 * 
 * Main entry point exposing post-quantum cryptographic algorithms
 * and utility functions for secure key management.
 */

const path = require('path');
const fs = require('fs');

// Import existing utilities
const {
	generateUniqueID
} = require('./utils/GenerateUniqueID');

const {
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular,
	gen,
	receive
} = require('./utils/KeyDerivation');

const {
	generateUnlockHash,
	verifyUnlockHash
} = require('./utils/UnlockHash');

const {
	createVoucher,
	decryptVoucher
} = require('./utils/KineticKeyUtils');

/**
 * Post-Quantum Cryptography Module Loader
 * Dynamically loads WASM modules for PQC algorithms
 */
class PQCLoader {
	constructor() {
		this.kyber1024 = null;
		this.dilithium5 = null;
		this.initialized = false;
	}

	/**
	 * Initialize PQC modules
	 * @returns {Promise<void>}
	 */
	async initialize() {
		if (this.initialized) return;

		try {
			// Try to load Kyber1024
			const kyberWrapperPath = path.join(__dirname, 'pqc-package/lib/kyber1024/kyber1024-wrapper.js');
			if (fs.existsSync(kyberWrapperPath)) {
				const { createKyber1024 } = require(kyberWrapperPath);
				const kyberJsPath = path.join(__dirname, 'pqc-package/lib/kyber1024/kyber1024.js');
				this.kyber1024 = await createKyber1024(kyberJsPath);
			}

			// Try to load Dilithium5
			const dilithiumWrapperPath = path.join(__dirname, 'pqc-package/lib/dilithium5/dilithium5-wrapper.js');
			if (fs.existsSync(dilithiumWrapperPath)) {
				const { createDilithium5 } = require(dilithiumWrapperPath);
				const dilithiumJsPath = path.join(__dirname, 'pqc-package/lib/dilithium5/dilithium5.js');
				this.dilithium5 = await createDilithium5(dilithiumJsPath);
			}

			this.initialized = true;
		} catch (error) {
			console.warn('PQC modules not available:', error.message);
		}
	}

	/**
	 * Get Kyber1024 instance
	 * @returns {Promise<Object>} Kyber1024 instance
	 */
	async getKyber1024() {
		await this.initialize();
		if (!this.kyber1024) {
			throw new Error('Kyber1024 module not available. Please ensure WASM files are properly built.');
		}
		return this.kyber1024;
	}

	/**
	 * Get Dilithium5 instance
	 * @returns {Promise<Object>} Dilithium5 instance
	 */
	async getDilithium5() {
		await this.initialize();
		if (!this.dilithium5) {
			throw new Error('Dilithium5 module not available. Please ensure WASM files are properly built.');
		}
		return this.dilithium5;
	}
}

// Global PQC loader instance
const pqcLoader = new PQCLoader();

/**
 * Post-Quantum Key Encapsulation Mechanism (KEM) using Kyber1024
 */
const PQC_KEM = {
	/**
	 * Generate a new Kyber1024 key pair for key encapsulation
	 * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
	 */
	async generateKeyPair() {
		const kyber = await pqcLoader.getKyber1024();
		return await kyber.generateKeyPair();
	},

	/**
	 * Encapsulate a shared secret using recipient's public key
	 * @param {Uint8Array} publicKey - Recipient's public key
	 * @returns {Promise<{ciphertext: Uint8Array, sharedSecret: Uint8Array}>}
	 */
	async encapsulate(publicKey) {
		const kyber = await pqcLoader.getKyber1024();
		return await kyber.encapsulate(publicKey);
	},

	/**
	 * Decapsulate shared secret from ciphertext using private key
	 * @param {Uint8Array} ciphertext - Ciphertext to decapsulate
	 * @param {Uint8Array} privateKey - Private key for decapsulation
	 * @returns {Promise<Uint8Array>} Shared secret
	 */
	async decapsulate(ciphertext, privateKey) {
		const kyber = await pqcLoader.getKyber1024();
		return await kyber.decapsulate(ciphertext, privateKey);
	},

	/**
	 * Convert binary data to base64 string
	 * @param {Uint8Array} data - Binary data
	 * @returns {string} Base64 encoded string
	 */
	toBase64(data) {
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(data).toString('base64');
		} else {
			return btoa(String.fromCharCode.apply(null, data));
		}
	},

	/**
	 * Convert base64 string to binary data
	 * @param {string} base64 - Base64 encoded string
	 * @returns {Uint8Array} Binary data
	 */
	fromBase64(base64) {
		if (typeof Buffer !== 'undefined') {
			return new Uint8Array(Buffer.from(base64, 'base64'));
		} else {
			const binary = atob(base64);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return bytes;
		}
	}
};

/**
 * Post-Quantum Digital Signatures using Dilithium5
 */
const PQC_DSA = {
	/**
	 * Generate a new Dilithium5 key pair for digital signatures
	 * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
	 */
	async generateKeyPair() {
		const dilithium = await pqcLoader.getDilithium5();
		return await dilithium.generateKeyPair();
	},

	/**
	 * Sign a message with Dilithium5 (creates attached signature)
	 * @param {Uint8Array|string} message - Message to sign
	 * @param {Uint8Array} privateKey - Private key for signing
	 * @returns {Promise<Uint8Array>} Signed message
	 */
	async signMessage(message, privateKey) {
		const dilithium = await pqcLoader.getDilithium5();
		return await dilithium.signMessage(message, privateKey);
	},

	/**
	 * Create a detached signature for a message
	 * @param {Uint8Array|string} message - Message to sign
	 * @param {Uint8Array} privateKey - Private key for signing
	 * @returns {Promise<Uint8Array>} Detached signature
	 */
	async createSignature(message, privateKey) {
		const dilithium = await pqcLoader.getDilithium5();
		return await dilithium.createSignature(message, privateKey);
	},

	/**
	 * Verify a signed message and extract original message
	 * @param {Uint8Array} signedMessage - Signed message to verify
	 * @param {Uint8Array} publicKey - Public key for verification
	 * @returns {Promise<Uint8Array|null>} Original message if valid, null if invalid
	 */
	async verifyMessage(signedMessage, publicKey) {
		const dilithium = await pqcLoader.getDilithium5();
		return await dilithium.verifyMessage(signedMessage, publicKey);
	},

	/**
	 * Verify a detached signature
	 * @param {Uint8Array} signature - Signature to verify
	 * @param {Uint8Array|string} message - Original message
	 * @param {Uint8Array} publicKey - Public key for verification
	 * @returns {Promise<boolean>} True if signature is valid
	 */
	async verifySignature(signature, message, publicKey) {
		const dilithium = await pqcLoader.getDilithium5();
		return await dilithium.verifySignature(signature, message, publicKey);
	},

	/**
	 * Convert binary data to base64 string
	 * @param {Uint8Array} data - Binary data
	 * @returns {string} Base64 encoded string
	 */
	toBase64(data) {
		return PQC_KEM.toBase64(data);
	},

	/**
	 * Convert base64 string to binary data
	 * @param {string} base64 - Base64 encoded string
	 * @returns {Uint8Array} Binary data
	 */
	fromBase64(base64) {
		return PQC_KEM.fromBase64(base64);
	}
};

/**
 * Complete Post-Quantum Cryptography Suite
 */
const PQC = {
	// Key Encapsulation Mechanism
	KEM: PQC_KEM,
	
	// Digital Signature Algorithm
	DSA: PQC_DSA,

	/**
	 * Check if PQC modules are available
	 * @returns {Promise<{kyber: boolean, dilithium: boolean}>}
	 */
	async isAvailable() {
		try {
			await pqcLoader.initialize();
			return {
				kyber: pqcLoader.kyber1024 !== null,
				dilithium: pqcLoader.dilithium5 !== null
			};
		} catch (error) {
			return { kyber: false, dilithium: false };
		}
	},

	/**
	 * Get version information
	 * @returns {Object} Version and algorithm information
	 */
	getInfo() {
		return {
			version: '2.0.0',
			algorithms: {
				kem: 'Kyber-1024 (NIST Level 5)',
				dsa: 'Dilithium-5 (NIST Level 5)'
			},
			keySize: {
				kyber: {
					public: 1568,
					private: 3168,
					ciphertext: 1568,
					sharedSecret: 32
				},
				dilithium: {
					public: 2592,
					private: 4880,
					signature: 4595
				}
			}
		};
	}
};

// Main module exports
module.exports = {
	// === POST-QUANTUM CRYPTOGRAPHY (Primary Features) ===
	PQC,
	
	// === LEGACY UTILITIES (Maintained for compatibility) ===
	// Unique ID
	generateUniqueID,

	// Key Derivation
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular,
	gen,
	receive,

	// Unlock Hash
	generateUnlockHash,
	verifyUnlockHash,

	// Vouchers
	createVoucher,
	decryptVoucher,
};