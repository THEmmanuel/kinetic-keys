#include <stddef.h>
#include <stdint.h>
#include <string.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>

// Cryptographically secure random bytes using Web Crypto API
EM_JS(void, crypto_get_random_values, (uint8_t* buf, size_t len), {
    try {
        var array = new Uint8Array(Module.HEAPU8.buffer, buf, len);
        
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            // Browser environment - use Web Crypto API
            crypto.getRandomValues(array);
        } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
            // Modern Node.js (v15+) with Web Crypto API
            globalThis.crypto.getRandomValues(array);
        } else if (typeof require !== 'undefined') {
            // Older Node.js - use crypto module
            const nodeCrypto = require('crypto');
            const bytes = nodeCrypto.randomBytes(len);
            array.set(bytes);
        } else {
            throw new Error('No cryptographically secure random source available');
        }
    } catch (e) {
        console.error('Failed to get random values:', e);
        // Fatal error - crypto operations should not proceed with bad randomness
        abort();
    }
});

// Kyber expects this signature
int randombytes(unsigned char *x, unsigned long long xlen) {
    // Call our secure random function
    crypto_get_random_values(x, (size_t)xlen);
    return 0;  // Success
}

// Stub for initialization - not needed with Web Crypto API
void randombytes_init(unsigned char *entropy_input,
                     unsigned char *personalization_string,
                     int security_strength) {
    (void)entropy_input;
    (void)personalization_string;
    (void)security_strength;
    // Web Crypto API doesn't need initialization
}

#endif 