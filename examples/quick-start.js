/**
 * Kinetic Keys SDK v2.0.0 - Quick Start Example
 * This example shows the most basic usage of post-quantum cryptography
 */

const KineticKeys = require('../index.js');

async function quickStart() {
    console.log('🚀 Kinetic Keys SDK - Quick Start Example\n');

    try {
        // Check if PQC is available
        const availability = await KineticKeys.PQC.isAvailable();
        
        if (!availability.kyber || !availability.dilithium) {
            console.log('⚠️  PQC modules not fully available');
            console.log('   This example requires both Kyber and Dilithium WASM modules');
            return;
        }

        console.log('✅ All PQC modules available\n');

        // 1. Key Encapsulation Example (Kyber)
        console.log('🔐 Key Encapsulation Example:');
        
        // Alice generates her keys
        const aliceKeys = await KineticKeys.PQC.KEM.generateKeyPair();
        console.log('   Alice generated her key pair');
        
        // Bob encapsulates a secret using Alice's public key
        const { ciphertext, sharedSecret } = await KineticKeys.PQC.KEM.encapsulate(aliceKeys.publicKey);
        console.log('   Bob encapsulated a shared secret');
        
        // Alice decapsulates the secret
        const aliceSecret = await KineticKeys.PQC.KEM.decapsulate(ciphertext, aliceKeys.privateKey);
        console.log('   Alice decapsulated the shared secret');
        
        // Verify they match
        const secretsMatch = Array.from(sharedSecret).every((byte, i) => byte === aliceSecret[i]);
        console.log(`   ✅ Shared secrets match: ${secretsMatch}\n`);

        // 2. Digital Signature Example (Dilithium)
        console.log('✍️  Digital Signature Example:');
        
        // Generate signing keys
        const signingKeys = await KineticKeys.PQC.DSA.generateKeyPair();
        console.log('   Generated signing key pair');
        
        // Sign a message
        const message = "Hello from the post-quantum future!";
        const signature = await KineticKeys.PQC.DSA.createSignature(message, signingKeys.privateKey);
        console.log('   Signed message');
        
        // Verify signature
        const isValid = await KineticKeys.PQC.DSA.verifySignature(signature, message, signingKeys.publicKey);
        console.log(`   ✅ Signature valid: ${isValid}\n`);

        // 3. Core functionality still works
        console.log('🔧 Core Functions:');
        const uniqueId = await KineticKeys.generateUniqueID(12);
        console.log(`   Generated unique ID: ${uniqueId}`);
        console.log('   ✅ Core functions work alongside PQC\n');

        console.log('🎉 Quick start completed successfully!');
        console.log('📖 Check README-PQC.md for complete documentation');

    } catch (error) {
        console.error('❌ Quick start failed:', error.message);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    quickStart();
}

module.exports = { quickStart }; 