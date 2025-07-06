#!/usr/bin/env node

const { createKyber1024 } = require('./js/kyber1024-wrapper.js');

async function demoKyberKeyExchange() {
    console.log('🔐 Kyber1024 Post-Quantum Key Exchange Demo\n');
    console.log('Scenario: Alice wants to send a secure message to Bob using post-quantum cryptography.\n');

    try {
        // Initialize Kyber
        const kyber = await createKyber1024();

        // Step 1: Bob generates his key pair and shares his public key
        console.log('👤 Bob:');
        console.log('  1. Generates a Kyber1024 key pair');
        const bobKeys = await kyber.generateKeyPair();
        console.log(`  2. Shares his public key (${bobKeys.publicKey.length} bytes)`);
        console.log(`     Public key preview: ${Array.from(bobKeys.publicKey.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}...\n`);

        // Step 2: Alice uses Bob's public key to create a shared secret
        console.log('👤 Alice:');
        console.log('  1. Receives Bob\'s public key');
        console.log('  2. Uses it to encapsulate a shared secret');
        const { ciphertext, sharedSecret: aliceSecret } = await kyber.encapsulate(bobKeys.publicKey);
        console.log(`  3. Sends the ciphertext to Bob (${ciphertext.length} bytes)`);
        console.log(`     Ciphertext preview: ${Array.from(ciphertext.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
        console.log(`  4. Has shared secret: ${Array.from(aliceSecret).map(b => b.toString(16).padStart(2, '0')).join('')}\n`);

        // Step 3: Bob decapsulates to get the same shared secret
        console.log('👤 Bob:');
        console.log('  1. Receives the ciphertext from Alice');
        console.log('  2. Uses his private key to decapsulate the shared secret');
        const bobSecret = await kyber.decapsulate(ciphertext, bobKeys.privateKey);
        console.log(`  3. Has shared secret: ${Array.from(bobSecret).map(b => b.toString(16).padStart(2, '0')).join('')}\n`);

        // Verify they have the same secret
        const match = aliceSecret.every((byte, i) => byte === bobSecret[i]);
        console.log(`✅ Shared secrets match: ${match ? 'YES' : 'NO'}`);
        console.log('\n🎉 Alice and Bob now share a 256-bit secret key that can be used for symmetric encryption!');
        console.log('   This key exchange is secure against both classical and quantum computers.\n');

        // Show what happens with tampering
        console.log('⚠️  What if an attacker tampers with the ciphertext?');
        const tamperedCiphertext = new Uint8Array(ciphertext);
        tamperedCiphertext[100] ^= 0xFF; // Flip some bits
        
        const tamperedSecret = await kyber.decapsulate(tamperedCiphertext, bobKeys.privateKey);
        const tamperedMatch = aliceSecret.every((byte, i) => byte === tamperedSecret[i]);
        
        console.log(`   Tampered ciphertext produces same secret: ${tamperedMatch ? 'YES' : 'NO'}`);
        console.log('   Result: Kyber provides IND-CCA2 security - tampering produces a different secret!\n');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

// Run the demo
demoKyberKeyExchange(); 