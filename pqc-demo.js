/**
 * Kinetic Keys SDK - Post-Quantum Cryptography Demo
 * Version 2.0.0
 * 
 * This demo showcases the post-quantum cryptographic capabilities
 * including Kyber key encapsulation and Dilithium digital signatures.
 */

const KineticKeys = require('./index.js');

/**
 * Utility function to display binary data as hex string
 */
function toHex(buffer, maxLength = 32) {
    const hex = Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return maxLength && hex.length > maxLength * 2 
        ? hex.substring(0, maxLength * 2) + '...' 
        : hex;
}

/**
 * Utility function to display timing information
 */
function timeOperation(name, startTime) {
    const endTime = Date.now();
    console.log(`⏱️  ${name}: ${endTime - startTime}ms`);
    return endTime;
}

/**
 * Demo: Kyber1024 Key Encapsulation Mechanism
 */
async function demoKyberKEM() {
    console.log('\n🔐 === KYBER-1024 KEY ENCAPSULATION DEMO ===');
    
    try {
        // Check if Kyber is available
        const availability = await KineticKeys.PQC.isAvailable();
        if (!availability.kyber) {
            console.log('❌ Kyber-1024 not available. Please build WASM modules first.');
            return;
        }

        console.log('✅ Kyber-1024 module loaded successfully');

        // Step 1: Generate key pair for recipient
        console.log('\n📋 Step 1: Generating recipient key pair...');
        let startTime = Date.now();
        const recipientKeys = await KineticKeys.PQC.KEM.generateKeyPair();
        timeOperation('Key pair generation', startTime);
        
        console.log(`📤 Public key (${recipientKeys.publicKey.length} bytes): ${toHex(recipientKeys.publicKey)}`);
        console.log(`🔑 Private key (${recipientKeys.privateKey.length} bytes): ${toHex(recipientKeys.privateKey)}`);

        // Step 2: Sender encapsulates a shared secret
        console.log('\n📋 Step 2: Sender encapsulating shared secret...');
        startTime = Date.now();
        const encapsulation = await KineticKeys.PQC.KEM.encapsulate(recipientKeys.publicKey);
        timeOperation('Encapsulation', startTime);
        
        console.log(`📦 Ciphertext (${encapsulation.ciphertext.length} bytes): ${toHex(encapsulation.ciphertext)}`);
        console.log(`🔐 Shared secret (${encapsulation.sharedSecret.length} bytes): ${toHex(encapsulation.sharedSecret)}`);

        // Step 3: Recipient decapsulates the shared secret
        console.log('\n📋 Step 3: Recipient decapsulating shared secret...');
        startTime = Date.now();
        const decapsulatedSecret = await KineticKeys.PQC.KEM.decapsulate(
            encapsulation.ciphertext, 
            recipientKeys.privateKey
        );
        timeOperation('Decapsulation', startTime);
        
        console.log(`🔓 Decapsulated secret (${decapsulatedSecret.length} bytes): ${toHex(decapsulatedSecret)}`);

        // Step 4: Verify shared secrets match
        const secretsMatch = Array.from(encapsulation.sharedSecret).every(
            (byte, index) => byte === decapsulatedSecret[index]
        );
        
        console.log(`\n✅ Shared secret verification: ${secretsMatch ? 'PASSED' : 'FAILED'}`);

        // Step 5: Demonstrate base64 encoding/decoding
        console.log('\n📋 Step 5: Base64 encoding demonstration...');
        const publicKeyB64 = KineticKeys.PQC.KEM.toBase64(recipientKeys.publicKey);
        const decodedPublicKey = KineticKeys.PQC.KEM.fromBase64(publicKeyB64);
        
        console.log(`📤 Public key (Base64, first 64 chars): ${publicKeyB64.substring(0, 64)}...`);
        console.log(`✅ Base64 round-trip: ${Array.from(recipientKeys.publicKey).every(
            (byte, index) => byte === decodedPublicKey[index]
        ) ? 'PASSED' : 'FAILED'}`);

        console.log('\n🎉 Kyber-1024 KEM demo completed successfully!');

    } catch (error) {
        console.error('❌ Kyber KEM demo failed:', error.message);
    }
}

/**
 * Demo: Dilithium5 Digital Signatures
 */
async function demoDilithiumDSA() {
    console.log('\n✍️  === DILITHIUM-5 DIGITAL SIGNATURE DEMO ===');
    
    try {
        // Check if Dilithium is available
        const availability = await KineticKeys.PQC.isAvailable();
        if (!availability.dilithium) {
            console.log('❌ Dilithium-5 not available. Please build WASM modules first.');
            return;
        }

        console.log('✅ Dilithium-5 module loaded successfully');

        // Step 1: Generate signing key pair
        console.log('\n📋 Step 1: Generating signing key pair...');
        let startTime = Date.now();
        const signingKeys = await KineticKeys.PQC.DSA.generateKeyPair();
        timeOperation('Key pair generation', startTime);
        
        console.log(`📤 Public key (${signingKeys.publicKey.length} bytes): ${toHex(signingKeys.publicKey)}`);
        console.log(`🔑 Private key (${signingKeys.privateKey.length} bytes): ${toHex(signingKeys.privateKey)}`);

        // Step 2: Sign a message (attached signature)
        const message = "Hello, Post-Quantum World! This message is signed with Dilithium-5.";
        console.log(`\n📋 Step 2: Signing message: "${message}"`);
        startTime = Date.now();
        const signedMessage = await KineticKeys.PQC.DSA.signMessage(message, signingKeys.privateKey);
        timeOperation('Message signing', startTime);
        
        console.log(`✍️  Signed message (${signedMessage.length} bytes): ${toHex(signedMessage, 48)}`);

        // Step 3: Verify signed message
        console.log('\n📋 Step 3: Verifying signed message...');
        startTime = Date.now();
        const verifiedMessage = await KineticKeys.PQC.DSA.verifyMessage(signedMessage, signingKeys.publicKey);
        timeOperation('Message verification', startTime);
        
        if (verifiedMessage) {
            const messageText = new TextDecoder().decode(verifiedMessage);
            console.log(`✅ Verification PASSED`);
            console.log(`📄 Original message: "${messageText}"`);
        } else {
            console.log(`❌ Verification FAILED`);
        }

        // Step 4: Detached signature demo
        console.log('\n📋 Step 4: Creating detached signature...');
        const detachMessage = "This is a separate message for detached signature demo.";
        startTime = Date.now();
        const detachedSignature = await KineticKeys.PQC.DSA.createSignature(detachMessage, signingKeys.privateKey);
        timeOperation('Detached signature creation', startTime);
        
        console.log(`✍️  Detached signature (${detachedSignature.length} bytes): ${toHex(detachedSignature, 48)}`);

        // Step 5: Verify detached signature
        console.log('\n📋 Step 5: Verifying detached signature...');
        startTime = Date.now();
        const isValidDetached = await KineticKeys.PQC.DSA.verifySignature(
            detachedSignature, 
            detachMessage, 
            signingKeys.publicKey
        );
        timeOperation('Detached signature verification', startTime);
        
        console.log(`✅ Detached signature verification: ${isValidDetached ? 'PASSED' : 'FAILED'}`);

        // Step 6: Test signature tampering
        console.log('\n📋 Step 6: Testing signature tampering detection...');
        const tamperedMessage = "This is a TAMPERED message for signature verification.";
        const isTamperedValid = await KineticKeys.PQC.DSA.verifySignature(
            detachedSignature, 
            tamperedMessage, 
            signingKeys.publicKey
        );
        
        console.log(`🔍 Tampered message verification: ${isTamperedValid ? 'FAILED (Should be false!)' : 'PASSED (Correctly rejected)'}`);

        console.log('\n🎉 Dilithium-5 DSA demo completed successfully!');

    } catch (error) {
        console.error('❌ Dilithium DSA demo failed:', error.message);
    }
}

/**
 * Demo: Complete PQC workflow combining KEM and DSA
 */
async function demoCombinedPQC() {
    console.log('\n🔗 === COMBINED PQC WORKFLOW DEMO ===');
    console.log('Demonstrating secure key exchange with message authentication');
    
    try {
        const availability = await KineticKeys.PQC.isAvailable();
        if (!availability.kyber || !availability.dilithium) {
            console.log('❌ Both Kyber and Dilithium are required for this demo');
            return;
        }

        // Step 1: Setup - Each party generates their keys
        console.log('\n📋 Step 1: Setting up Alice and Bob key pairs...');
        const aliceKemKeys = await KineticKeys.PQC.KEM.generateKeyPair();
        const aliceDsaKeys = await KineticKeys.PQC.DSA.generateKeyPair();
        
        const bobKemKeys = await KineticKeys.PQC.KEM.generateKeyPair();
        const bobDsaKeys = await KineticKeys.PQC.DSA.generateKeyPair();
        
        console.log('✅ Alice and Bob have generated their KEM and DSA key pairs');

        // Step 2: Alice wants to send a secure message to Bob
        const secretMessage = "This is Alice's confidential message to Bob, secured with post-quantum cryptography!";
        console.log(`\n📋 Step 2: Alice preparing secure message: "${secretMessage}"`);

        // Step 3: Alice signs the message first
        const signedMessage = await KineticKeys.PQC.DSA.signMessage(secretMessage, aliceDsaKeys.privateKey);
        console.log('✍️  Alice signed the message with her private key');

        // Step 4: Alice encapsulates using Bob's public key
        const encapsulation = await KineticKeys.PQC.KEM.encapsulate(bobKemKeys.publicKey);
        console.log('🔐 Alice encapsulated a shared secret using Bob\'s public key');

        // Step 5: Alice could use the shared secret for symmetric encryption
        // (For demo, we'll just show the process)
        console.log(`🔑 Shared secret for symmetric encryption: ${toHex(encapsulation.sharedSecret)}`);

        // Step 6: Bob receives the ciphertext and signed message
        console.log('\n📋 Step 3: Bob processing received data...');
        
        // Bob decapsulates the shared secret
        const bobSharedSecret = await KineticKeys.PQC.KEM.decapsulate(
            encapsulation.ciphertext, 
            bobKemKeys.privateKey
        );
        console.log('🔓 Bob decapsulated the shared secret');

        // Bob verifies Alice's signature
        const verifiedMessage = await KineticKeys.PQC.DSA.verifyMessage(signedMessage, aliceDsaKeys.publicKey);
        
        if (verifiedMessage) {
            const originalMessage = new TextDecoder().decode(verifiedMessage);
            console.log(`✅ Bob verified Alice's signature successfully`);
            console.log(`📄 Bob recovered original message: "${originalMessage}"`);
        } else {
            console.log(`❌ Signature verification failed`);
            return;
        }

        // Step 7: Verify shared secrets match
        const secretsMatch = Array.from(encapsulation.sharedSecret).every(
            (byte, index) => byte === bobSharedSecret[index]
        );
        
        console.log(`🔐 Shared secret verification: ${secretsMatch ? 'PASSED' : 'FAILED'}`);

        console.log('\n🎉 Combined PQC workflow completed successfully!');
        console.log('✅ Message authenticity verified (Dilithium-5)');
        console.log('✅ Shared secret established (Kyber-1024)');
        console.log('🛡️  Communication secured with post-quantum cryptography!');

    } catch (error) {
        console.error('❌ Combined PQC demo failed:', error.message);
    }
}

/**
 * Main demo runner
 */
async function runPQCDemo() {
    console.log('🚀 KINETIC KEYS SDK - POST-QUANTUM CRYPTOGRAPHY DEMO');
    console.log('====================================================');
    
    // Display SDK information
    const info = KineticKeys.PQC.getInfo();
    console.log(`📦 SDK Version: ${info.version}`);
    console.log(`🔐 KEM Algorithm: ${info.algorithms.kem}`);
    console.log(`✍️  DSA Algorithm: ${info.algorithms.dsa}`);
    
    // Check module availability
    const availability = await KineticKeys.PQC.isAvailable();
    console.log(`\n🟢 Module Availability:`);
    console.log(`   Kyber-1024: ${availability.kyber ? '✅ Available' : '❌ Not Available'}`);
    console.log(`   Dilithium-5: ${availability.dilithium ? '✅ Available' : '❌ Not Available'}`);

    // Run individual demos
    await demoKyberKEM();
    await demoDilithiumDSA();
    await demoCombinedPQC();

    console.log('\n🏁 All PQC demos completed!');
    console.log('💡 The Kinetic Keys SDK is now ready for post-quantum cryptography applications.');
}

// Run the demo if this file is executed directly
if (require.main === module) {
    runPQCDemo().catch(error => {
        console.error('Demo failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runPQCDemo,
    demoKyberKEM,
    demoDilithiumDSA,
    demoCombinedPQC
}; 