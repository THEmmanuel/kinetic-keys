#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include "randombytes.h"

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

void randombytes(uint8_t *out, size_t outlen) {
    // Call our secure random function
    crypto_get_random_values(out, outlen);
}

#endif 