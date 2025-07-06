#!/usr/bin/env node

const createDilithium5Module = require('./build/dilithium5.js');

async function directTest() {
    console.log('🧪 Direct Dilithium 5 WASM Test\n');
    
    try {
        const Module = await createDilithium5Module();
        console.log('✅ Module loaded');
        
        // Check available functions
        console.log('Available functions:', 
            Object.keys(Module).filter(k => k.includes('pq') || k === 'ccall' || k === 'cwrap' || k.startsWith('_')).sort()
        );
        
        // Try basic memory operations first
        console.log('\n📝 Testing basic memory operations...');
        const testPtr = Module._malloc(100);
        console.log('Allocated 100 bytes at:', testPtr.toString(16));
        
        Module.HEAPU8[testPtr] = 42;
        console.log('Wrote 42, read back:', Module.HEAPU8[testPtr]);
        
        Module._free(testPtr);
        console.log('✅ Basic memory operations work!\n');
        
        // Now try key generation with error handling
        console.log('🔑 Testing key generation...');
        const pkPtr = Module._malloc(2592);
        const skPtr = Module._malloc(4880);
        
        console.log('Public key ptr:', pkPtr.toString(16));
        console.log('Secret key ptr:', skPtr.toString(16));
        
        try {
            // Use ccall for better error handling
            const result = Module.ccall(
                'pqcrystals_dilithium5_ref_keypair',
                'number',
                ['number', 'number'],
                [pkPtr, skPtr]
            );
            
            console.log('Key generation result:', result);
            
            if (result === 0) {
                console.log('✅ Key generation succeeded!');
                const pk = new Uint8Array(Module.HEAPU8.buffer, pkPtr, 16);
                console.log('First 16 bytes of public key:', Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join(' '));
            } else {
                console.log('❌ Key generation returned error code:', result);
            }
        } catch (error) {
            console.error('❌ Error during key generation:', error.message);
            console.error('Stack:', error.stack);
        } finally {
            Module._free(pkPtr);
            Module._free(skPtr);
        }
        
    } catch (error) {
        console.error('❌ Module error:', error.message);
    }
}

directTest(); 