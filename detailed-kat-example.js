#!/usr/bin/env node

/**
 * Detailed KAT Example Analysis
 * Shows exactly how one test vector works in detail
 */

const fs = require('fs');

console.log('🔬 DETAILED KAT TEST VECTOR ANALYSIS');
console.log('=' .repeat(60));

// Parse a specific test vector
function analyzeTestVector(algorithm, vectorIndex = 0) {
    let reqFile, rspFile, algorithmName;
    
    if (algorithm === 'dilithium5') {
        reqFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.req';
        rspFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp';
        algorithmName = 'Dilithium 5 (Digital Signatures)';
    } else if (algorithm === 'kyber1024') {
        reqFile = 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.req';
        rspFile = 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp';
        algorithmName = 'Kyber 1024 (Key Encapsulation)';
    }
    
    console.log(`\n📋 ${algorithmName} - Test Vector ${vectorIndex}`);
    console.log('=' .repeat(60));
    
    try {
        // Read and parse files
        const reqContent = fs.readFileSync(reqFile, 'utf8');
        const rspContent = fs.readFileSync(rspFile, 'utf8');
        
        const reqLines = reqContent.split('\n').filter(line => line.trim());
        const rspLines = rspContent.split('\n').filter(line => line.trim());
        
        // Find the specific test vector
        let reqVector = {};
        let rspVector = {};
        let currentVector = -1;
        let inTargetVector = false;
        
        // Parse request file
        for (const line of reqLines) {
            if (line.startsWith('count = ')) {
                currentVector++;
                if (currentVector === vectorIndex) {
                    inTargetVector = true;
                    reqVector.count = parseInt(line.split('=')[1].trim());
                } else {
                    inTargetVector = false;
                }
            } else if (inTargetVector && line.includes(' = ')) {
                const [key, value] = line.split(' = ', 2);
                reqVector[key.trim()] = value.trim();
            }
        }
        
        // Parse response file
        currentVector = -1;
        inTargetVector = false;
        
        for (const line of rspLines) {
            if (line.startsWith('count = ')) {
                currentVector++;
                if (currentVector === vectorIndex) {
                    inTargetVector = true;
                    rspVector.count = parseInt(line.split('=')[1].trim());
                } else {
                    inTargetVector = false;
                }
            } else if (inTargetVector && line.includes(' = ')) {
                const [key, value] = line.split(' = ', 2);
                rspVector[key.trim()] = value.trim();
            }
        }
        
        // Display the test vector details
        console.log('\n📥 INPUT (Test Vector):');
        console.log('   Count:', reqVector.count);
        console.log('   Seed:', reqVector.seed);
        
        if (algorithm === 'dilithium5') {
            console.log('   Message Length:', reqVector.mlen, 'bytes');
            console.log('   Message:', reqVector.msg);
        }
        
        console.log('\n📤 EXPECTED OUTPUT (Reference Results):');
        
        if (algorithm === 'dilithium5') {
            console.log('   Public Key Length:', rspVector.pk.length / 2, 'bytes');
            console.log('   Public Key:', rspVector.pk.substring(0, 64) + '...');
            console.log('   Secret Key Length:', rspVector.sk.length / 2, 'bytes');
            console.log('   Secret Key:', rspVector.sk.substring(0, 64) + '...');
            console.log('   Signature Length:', rspVector.smlen, 'bytes');
            console.log('   Signature:', rspVector.sm.substring(0, 64) + '...');
        } else {
            console.log('   Public Key Length:', rspVector.pk.length / 2, 'bytes');
            console.log('   Public Key:', rspVector.pk.substring(0, 64) + '...');
            console.log('   Secret Key Length:', rspVector.sk.length / 2, 'bytes');
            console.log('   Secret Key:', rspVector.sk.substring(0, 64) + '...');
            console.log('   Ciphertext Length:', rspVector.ct.length / 2, 'bytes');
            console.log('   Ciphertext:', rspVector.ct.substring(0, 64) + '...');
            console.log('   Shared Secret Length:', rspVector.ss.length / 2, 'bytes');
            console.log('   Shared Secret:', rspVector.ss.substring(0, 64) + '...');
        }
        
        // Show validation process
        console.log('\n🔍 VALIDATION PROCESS:');
        
        if (algorithm === 'dilithium5') {
            console.log('   1. Initialize deterministic RNG with seed:', reqVector.seed.substring(0, 16) + '...');
            console.log('   2. Generate key pair using crypto_sign_keypair()');
            console.log('   3. Sign message using crypto_sign() with secret key');
            console.log('   4. Compare generated public key with expected');
            console.log('   5. Compare generated signature with expected');
            console.log('   6. Verify signature using crypto_sign_open()');
            console.log('   7. Compare recovered message with original');
            console.log('   8. If all comparisons match → PASS');
        } else {
            console.log('   1. Initialize deterministic RNG with seed:', reqVector.seed.substring(0, 16) + '...');
            console.log('   2. Generate key pair using crypto_kem_keypair()');
            console.log('   3. Encapsulate shared secret using crypto_kem_enc()');
            console.log('   4. Decapsulate shared secret using crypto_kem_dec()');
            console.log('   5. Compare generated public key with expected');
            console.log('   6. Compare generated ciphertext with expected');
            console.log('   7. Compare generated shared secret with expected');
            console.log('   8. If all comparisons match → PASS');
        }
        
        // Show what happens if validation fails
        console.log('\n⚠️  WHAT HAPPENS IF VALIDATION FAILS:');
        console.log('   • If any output doesn\'t match expected → FAIL');
        console.log('   • Implementation has a bug or is incorrect');
        console.log('   • Cannot be trusted for cryptographic operations');
        console.log('   • Must be fixed before use');
        
        // Show what success means
        console.log('\n✅ WHAT SUCCESS MEANS:');
        console.log('   • Implementation produces exactly correct outputs');
        console.log('   • Algorithm works as specified by NIST');
        console.log('   • Interoperable with other correct implementations');
        console.log('   • Ready for production use');
        
        return { reqVector, rspVector };
        
    } catch (error) {
        console.error('Error analyzing test vector:', error.message);
        return null;
    }
}

// Show multiple test vectors for comparison
function showMultipleVectors(algorithm) {
    console.log(`\n📊 MULTIPLE TEST VECTORS COMPARISON - ${algorithm.toUpperCase()}`);
    console.log('=' .repeat(60));
    
    for (let i = 0; i < 3; i++) {
        const result = analyzeTestVector(algorithm, i);
        if (result) {
            console.log(`\n   Test Vector ${i} Summary:`);
            console.log(`   Seed: ${result.reqVector.seed.substring(0, 16)}...`);
            
            if (algorithm === 'dilithium5') {
                console.log(`   Message Length: ${result.reqVector.mlen} bytes`);
                console.log(`   Signature Length: ${result.rspVector.smlen} bytes`);
            } else {
                console.log(`   Public Key: ${result.rspVector.pk.substring(0, 16)}...`);
                console.log(`   Shared Secret: ${result.rspVector.ss.substring(0, 16)}...`);
            }
        }
    }
}

// Main execution
console.log('\n🔬 Analyzing Dilithium 5 Test Vector 0:');
analyzeTestVector('dilithium5', 0);

console.log('\n🔬 Analyzing Kyber 1024 Test Vector 0:');
analyzeTestVector('kyber1024', 0);

console.log('\n📊 Multiple Test Vectors:');
showMultipleVectors('dilithium5');
showMultipleVectors('kyber1024');

console.log('\n' + '=' .repeat(60));
console.log('🎯 KEY INSIGHTS:');
console.log('   • Each test vector has a unique seed for deterministic results');
console.log('   • Expected outputs are pre-computed and verified correct');
console.log('   • Your implementation must produce identical outputs');
console.log('   • This ensures cryptographic correctness and interoperability');
console.log('   • KAT validation is the gold standard for crypto implementations');
console.log('=' .repeat(60)); 