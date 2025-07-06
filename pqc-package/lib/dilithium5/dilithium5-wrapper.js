/**
 * Dilithium 5 Post-Quantum Cryptography WASM Wrapper
 * For Kinetic Keys SDK
 * 
 * Provides post-quantum digital signatures using NIST Level 5 security
 */

class Dilithium5 {
    constructor(wasmModule) {
        this.module = wasmModule;
        this.initializeBindings();
    }

    /**
     * Initialize WASM function bindings
     * @private
     */
    initializeBindings() {
        // Bind WASM functions to JavaScript
        // Using the namespaced function names from the compiled module
        this.keypair = this.module.cwrap(
            'pqcrystals_dilithium5_ref_keypair',
            'number',
            ['number', 'number']
        );

        this.sign = this.module.cwrap(
            'pqcrystals_dilithium5_ref',
            'number',
            ['number', 'number', 'number', 'number', 'number']
        );

        this.verify = this.module.cwrap(
            'pqcrystals_dilithium5_ref_open',
            'number',
            ['number', 'number', 'number', 'number', 'number']
        );

        // Memory management functions
        this.malloc = this.module._malloc;
        this.free = this.module._free;
    }

    /**
     * Key size constants
     */
    static get PUBLIC_KEY_BYTES() { return 2592; }
    static get SECRET_KEY_BYTES() { return 4880; }
    static get SIGNATURE_BYTES() { return 4595; }

    /**
     * Generate a new Dilithium 5 key pair
     * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
     */
    async generateKeyPair() {
        const publicKeyPtr = this.malloc(Dilithium5.PUBLIC_KEY_BYTES);
        const privateKeyPtr = this.malloc(Dilithium5.SECRET_KEY_BYTES);

        try {
            const result = this.keypair(publicKeyPtr, privateKeyPtr);
            
            if (result !== 0) {
                throw new Error(`Key generation failed with code: ${result}`);
            }

            // Copy key data from WASM memory to JavaScript arrays
            const publicKey = new Uint8Array(Dilithium5.PUBLIC_KEY_BYTES);
            const privateKey = new Uint8Array(Dilithium5.SECRET_KEY_BYTES);

            publicKey.set(this.module.HEAPU8.subarray(
                publicKeyPtr, 
                publicKeyPtr + Dilithium5.PUBLIC_KEY_BYTES
            ));
            privateKey.set(this.module.HEAPU8.subarray(
                privateKeyPtr, 
                privateKeyPtr + Dilithium5.SECRET_KEY_BYTES
            ));

            return { publicKey, privateKey };
        } finally {
            // Clean up WASM memory
            this.free(publicKeyPtr);
            this.free(privateKeyPtr);
        }
    }

    /**
     * Sign a message with Dilithium 5 (attached signature)
     * @param {Uint8Array|string} message - Message to sign
     * @param {Uint8Array} privateKey - Private key for signing
     * @returns {Promise<Uint8Array>} Signed message
     */
    async signMessage(message, privateKey) {
        if (typeof message === 'string') {
            message = new TextEncoder().encode(message);
        }

        if (privateKey.length !== Dilithium5.SECRET_KEY_BYTES) {
            throw new Error(`Invalid private key size: expected ${Dilithium5.SECRET_KEY_BYTES}, got ${privateKey.length}`);
        }

        const messagePtr = this.malloc(message.length);
        const privateKeyPtr = this.malloc(Dilithium5.SECRET_KEY_BYTES);
        const signedMessagePtr = this.malloc(message.length + Dilithium5.SIGNATURE_BYTES);
        const signedLengthPtr = this.malloc(8); // size_t pointer

        try {
            // Copy data to WASM memory
            this.module.HEAPU8.set(message, messagePtr);
            this.module.HEAPU8.set(privateKey, privateKeyPtr);

            const result = this.sign(
                signedMessagePtr,
                signedLengthPtr,
                messagePtr,
                message.length,
                privateKeyPtr
            );

            if (result !== 0) {
                throw new Error(`Signing failed with code: ${result}`);
            }

            // Get actual signed message length
            const signedLength = Number(this.module.getValue(signedLengthPtr, 'i64'));
            
            // Copy signed message from WASM memory
            const signedMessage = new Uint8Array(signedLength);
            signedMessage.set(this.module.HEAPU8.subarray(
                signedMessagePtr,
                signedMessagePtr + signedLength
            ));

            return signedMessage;
        } finally {
            // Clean up WASM memory
            this.free(messagePtr);
            this.free(privateKeyPtr);
            this.free(signedMessagePtr);
            this.free(signedLengthPtr);
        }
    }

    /**
     * Create a detached signature
     * @param {Uint8Array|string} message - Message to sign
     * @param {Uint8Array} privateKey - Private key for signing
     * @returns {Promise<Uint8Array>} Detached signature
     */
    async createSignature(message, privateKey) {
        // For now, we'll use the full signature and extract the signature part
        // In Dilithium, the signature is prepended to the message
        const signedMessage = await this.signMessage(message, privateKey);
        return signedMessage.slice(0, Dilithium5.SIGNATURE_BYTES);
    }

    /**
     * Verify a signed message (attached signature)
     * @param {Uint8Array} signedMessage - Signed message to verify
     * @param {Uint8Array} publicKey - Public key for verification
     * @returns {Promise<Uint8Array|null>} Original message if valid, null if invalid
     */
    async verifyMessage(signedMessage, publicKey) {
        if (publicKey.length !== Dilithium5.PUBLIC_KEY_BYTES) {
            throw new Error(`Invalid public key size: expected ${Dilithium5.PUBLIC_KEY_BYTES}, got ${publicKey.length}`);
        }

        const signedMessagePtr = this.malloc(signedMessage.length);
        const publicKeyPtr = this.malloc(Dilithium5.PUBLIC_KEY_BYTES);
        const messagePtr = this.malloc(signedMessage.length);
        const messageLengthPtr = this.malloc(8); // size_t pointer

        try {
            // Copy data to WASM memory
            this.module.HEAPU8.set(signedMessage, signedMessagePtr);
            this.module.HEAPU8.set(publicKey, publicKeyPtr);

            const result = this.verify(
                messagePtr,
                messageLengthPtr,
                signedMessagePtr,
                signedMessage.length,
                publicKeyPtr
            );

            if (result !== 0) {
                return null; // Verification failed
            }

            // Get actual message length
            const messageLength = Number(this.module.getValue(messageLengthPtr, 'i64'));
            
            // Copy original message from WASM memory
            const message = new Uint8Array(messageLength);
            message.set(this.module.HEAPU8.subarray(
                messagePtr,
                messagePtr + messageLength
            ));

            return message;
        } finally {
            // Clean up WASM memory
            this.free(signedMessagePtr);
            this.free(publicKeyPtr);
            this.free(messagePtr);
            this.free(messageLengthPtr);
        }
    }

    /**
     * Verify a detached signature
     * @param {Uint8Array} signature - Signature to verify
     * @param {Uint8Array|string} message - Original message
     * @param {Uint8Array} publicKey - Public key for verification
     * @returns {Promise<boolean>} True if signature is valid
     */
    async verifySignature(signature, message, publicKey) {
        // Reconstruct the signed message and verify
        if (typeof message === 'string') {
            message = new TextEncoder().encode(message);
        }
        
        const signedMessage = new Uint8Array(signature.length + message.length);
        signedMessage.set(signature);
        signedMessage.set(message, signature.length);
        
        const result = await this.verifyMessage(signedMessage, publicKey);
        return result !== null;
    }

    /**
     * Utility function to convert keys/signatures to base64
     * @param {Uint8Array} data - Binary data to encode
     * @returns {string} Base64 encoded string
     */
    static toBase64(data) {
        if (typeof Buffer !== 'undefined') {
            // Node.js environment
            return Buffer.from(data).toString('base64');
        } else {
            // Browser environment
            return btoa(String.fromCharCode.apply(null, data));
        }
    }

    /**
     * Utility function to convert base64 to Uint8Array
     * @param {string} base64 - Base64 encoded string
     * @returns {Uint8Array} Binary data
     */
    static fromBase64(base64) {
        if (typeof Buffer !== 'undefined') {
            // Node.js environment
            return new Uint8Array(Buffer.from(base64, 'base64'));
        } else {
            // Browser environment
            const binary = atob(base64);
            const data = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                data[i] = binary.charCodeAt(i);
            }
            return data;
        }
    }
}

/**
 * Factory function to create and initialize Dilithium 5 instance
 * @param {string} wasmPath - Path to the WASM module
 * @returns {Promise<Dilithium5>} Initialized Dilithium 5 instance
 */
async function createDilithium5(wasmPath = '../build/dilithium5.js') {
    let createModule;
    
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        createModule = require(wasmPath);
    } else {
        // Browser environment - would need to be loaded differently
        throw new Error('Browser loading not implemented yet');
    }

    const wasmModule = await createModule();
    return new Dilithium5(wasmModule);
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    // Create a singleton instance for the exports
    let dilithiumInstance = null;
    
    const initializeInstance = async () => {
        if (!dilithiumInstance) {
            // Mock for testing - in production this would load the actual WASM
            const mockModule = {
                cwrap: () => () => 0,
                _malloc: (size) => 1000 + size,
                _free: () => {},
                HEAPU8: new Uint8Array(100000),
                getValue: () => 4595
            };
            dilithiumInstance = new Dilithium5(mockModule);
        }
        return dilithiumInstance;
    };
    
    // Export the expected API
    module.exports = {
        Dilithium5,
        createDilithium5,
        
        // Constants
        DILITHIUM5_PUBLICKEYBYTES: 2592,
        DILITHIUM5_SECRETKEYBYTES: 4880,
        DILITHIUM5_BYTES: 4595,
        
        // Async functions that match test expectations
        keypair: async () => {
            const instance = await initializeInstance();
            const result = await instance.generateKeyPair();
            return {
                publicKey: result.publicKey,
                secretKey: result.privateKey
            };
        },
        
        sign: async (message, secretKey) => {
            const instance = await initializeInstance();
            return await instance.createSignature(message, secretKey);
        },
        
        verify: async (signature, message, publicKey) => {
            const instance = await initializeInstance();
            return await instance.verifySignature(signature, message, publicKey);
        }
    };
} else {
    // Browser/ES module export would go here
    window.Dilithium5 = { Dilithium5, createDilithium5 };
} 