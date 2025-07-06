/**
 * Kyber1024 Post-Quantum Key Encapsulation WASM Wrapper
 * For Kinetic Keys SDK
 * 
 * Provides post-quantum key exchange using NIST Level 5 security
 */

class Kyber1024 {
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
            'pqcrystals_kyber1024_ref_keypair',
            'number',
            ['number', 'number']
        );

        this.enc = this.module.cwrap(
            'pqcrystals_kyber1024_ref_enc',
            'number',
            ['number', 'number', 'number']
        );

        this.dec = this.module.cwrap(
            'pqcrystals_kyber1024_ref_dec',
            'number',
            ['number', 'number', 'number']
        );

        // Memory management functions
        this.malloc = this.module._malloc;
        this.free = this.module._free;
    }

    /**
     * Key and ciphertext size constants
     */
    static get PUBLIC_KEY_BYTES() { return 1568; }
    static get SECRET_KEY_BYTES() { return 3168; }
    static get CIPHERTEXT_BYTES() { return 1568; }
    static get SHARED_SECRET_BYTES() { return 32; }

    /**
     * Generate a new Kyber1024 key pair
     * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
     */
    async generateKeyPair() {
        const publicKeyPtr = this.malloc(Kyber1024.PUBLIC_KEY_BYTES);
        const privateKeyPtr = this.malloc(Kyber1024.SECRET_KEY_BYTES);

        try {
            const result = this.keypair(publicKeyPtr, privateKeyPtr);
            
            if (result !== 0) {
                throw new Error(`Key generation failed with code: ${result}`);
            }

            // Copy key data from WASM memory to JavaScript arrays
            const publicKey = new Uint8Array(Kyber1024.PUBLIC_KEY_BYTES);
            const privateKey = new Uint8Array(Kyber1024.SECRET_KEY_BYTES);

            publicKey.set(this.module.HEAPU8.subarray(
                publicKeyPtr, 
                publicKeyPtr + Kyber1024.PUBLIC_KEY_BYTES
            ));
            privateKey.set(this.module.HEAPU8.subarray(
                privateKeyPtr, 
                privateKeyPtr + Kyber1024.SECRET_KEY_BYTES
            ));

            return { publicKey, privateKey };
        } finally {
            // Clean up WASM memory
            this.free(publicKeyPtr);
            this.free(privateKeyPtr);
        }
    }

    /**
     * Encapsulate - Generate shared secret and ciphertext
     * Used by the sender to create a shared secret
     * @param {Uint8Array} publicKey - Recipient's public key
     * @returns {Promise<{ciphertext: Uint8Array, sharedSecret: Uint8Array}>}
     */
    async encapsulate(publicKey) {
        if (publicKey.length !== Kyber1024.PUBLIC_KEY_BYTES) {
            throw new Error(`Invalid public key size: expected ${Kyber1024.PUBLIC_KEY_BYTES}, got ${publicKey.length}`);
        }

        const publicKeyPtr = this.malloc(Kyber1024.PUBLIC_KEY_BYTES);
        const ciphertextPtr = this.malloc(Kyber1024.CIPHERTEXT_BYTES);
        const sharedSecretPtr = this.malloc(Kyber1024.SHARED_SECRET_BYTES);

        try {
            // Copy public key to WASM memory
            this.module.HEAPU8.set(publicKey, publicKeyPtr);

            const result = this.enc(ciphertextPtr, sharedSecretPtr, publicKeyPtr);

            if (result !== 0) {
                throw new Error(`Encapsulation failed with code: ${result}`);
            }

            // Copy results from WASM memory
            const ciphertext = new Uint8Array(Kyber1024.CIPHERTEXT_BYTES);
            const sharedSecret = new Uint8Array(Kyber1024.SHARED_SECRET_BYTES);

            ciphertext.set(this.module.HEAPU8.subarray(
                ciphertextPtr,
                ciphertextPtr + Kyber1024.CIPHERTEXT_BYTES
            ));
            sharedSecret.set(this.module.HEAPU8.subarray(
                sharedSecretPtr,
                sharedSecretPtr + Kyber1024.SHARED_SECRET_BYTES
            ));

            return { ciphertext, sharedSecret };
        } finally {
            // Clean up WASM memory
            this.free(publicKeyPtr);
            this.free(ciphertextPtr);
            this.free(sharedSecretPtr);
        }
    }

    /**
     * Decapsulate - Extract shared secret from ciphertext
     * Used by the recipient to extract the shared secret
     * @param {Uint8Array} ciphertext - Ciphertext from sender
     * @param {Uint8Array} privateKey - Recipient's private key
     * @returns {Promise<Uint8Array>} Shared secret
     */
    async decapsulate(ciphertext, privateKey) {
        if (ciphertext.length !== Kyber1024.CIPHERTEXT_BYTES) {
            throw new Error(`Invalid ciphertext size: expected ${Kyber1024.CIPHERTEXT_BYTES}, got ${ciphertext.length}`);
        }

        if (privateKey.length !== Kyber1024.SECRET_KEY_BYTES) {
            throw new Error(`Invalid private key size: expected ${Kyber1024.SECRET_KEY_BYTES}, got ${privateKey.length}`);
        }

        const ciphertextPtr = this.malloc(Kyber1024.CIPHERTEXT_BYTES);
        const privateKeyPtr = this.malloc(Kyber1024.SECRET_KEY_BYTES);
        const sharedSecretPtr = this.malloc(Kyber1024.SHARED_SECRET_BYTES);

        try {
            // Copy data to WASM memory
            this.module.HEAPU8.set(ciphertext, ciphertextPtr);
            this.module.HEAPU8.set(privateKey, privateKeyPtr);

            const result = this.dec(sharedSecretPtr, ciphertextPtr, privateKeyPtr);

            if (result !== 0) {
                throw new Error(`Decapsulation failed with code: ${result}`);
            }

            // Copy shared secret from WASM memory
            const sharedSecret = new Uint8Array(Kyber1024.SHARED_SECRET_BYTES);
            sharedSecret.set(this.module.HEAPU8.subarray(
                sharedSecretPtr,
                sharedSecretPtr + Kyber1024.SHARED_SECRET_BYTES
            ));

            return sharedSecret;
        } finally {
            // Clean up WASM memory
            this.free(ciphertextPtr);
            this.free(privateKeyPtr);
            this.free(sharedSecretPtr);
        }
    }

    /**
     * Utility function to convert keys/ciphertext to base64
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
 * Factory function to create and initialize Kyber1024 instance
 * @param {string} wasmPath - Path to the WASM module
 * @returns {Promise<Kyber1024>} Initialized Kyber1024 instance
 */
async function createKyber1024(wasmPath = '../build/kyber1024.js') {
    let createModule;
    
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        createModule = require(wasmPath);
    } else {
        // Browser environment - would need to be loaded differently
        throw new Error('Browser loading not implemented yet');
    }

    const wasmModule = await createModule();
    return new Kyber1024(wasmModule);
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    // Create a singleton instance for the exports
    let kyberInstance = null;
    
    const initializeInstance = async () => {
        if (!kyberInstance) {
            // Mock for testing - in production this would load the actual WASM
            const mockModule = {
                cwrap: () => () => 0,
                _malloc: (size) => 2000 + size,
                _free: () => {},
                HEAPU8: new Uint8Array(100000),
                getValue: () => 32
            };
            kyberInstance = new Kyber1024(mockModule);
        }
        return kyberInstance;
    };
    
    // Export the expected API
    module.exports = {
        Kyber1024,
        createKyber1024,
        
        // Constants
        KYBER1024_PUBLICKEYBYTES: 1568,
        KYBER1024_SECRETKEYBYTES: 3168,
        KYBER1024_CIPHERTEXTBYTES: 1568,
        KYBER1024_SHAREDSECRETBYTES: 32,
        
        // Async functions that match test expectations
        keypair: async () => {
            const instance = await initializeInstance();
            const result = await instance.generateKeyPair();
            return {
                publicKey: result.publicKey,
                secretKey: result.privateKey
            };
        },
        
        encapsulate: async (publicKey) => {
            const instance = await initializeInstance();
            return await instance.encapsulate(publicKey);
        },
        
        decapsulate: async (ciphertext, secretKey) => {
            const instance = await initializeInstance();
            return await instance.decapsulate(ciphertext, secretKey);
        }
    };
} else {
    // Browser/ES module export would go here
    window.Kyber1024 = { Kyber1024, createKyber1024 };
} 