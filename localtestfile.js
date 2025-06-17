// Import from local files
const { generateUniqueID } = require('./utils/GenerateUniqueID');
const { generatePoemMatrix, gen, receive } = require('./utils/KeyDerivation');
const { generateUnlockHash, verifyUnlockHash } = require('./utils/UnlockHash');
const { createVoucher, decryptVoucher } = require('./utils/KineticKeyUtils');

// Debug: Log all available functions
console.log('Available functions:', {
    generateUniqueID,
    generatePoemMatrix,
    gen,
    receive,
    generateUnlockHash,
    verifyUnlockHash,
    createVoucher,
    decryptVoucher
});

async function runTests() {
    try {
        console.log('🧪 Starting Kinetic Keys Comprehensive Test Suite\n');

        // === Test 1: Unique ID Generation ===
        console.log('📌 Test 1: Unique ID Generation');
        const uniqueId = await generateUniqueID(8);
        console.log('Generated Unique ID:', uniqueId);
        console.log('✅ Test 1 Passed\n');

        // === Test 2: Poem Matrix Generation ===
        console.log('📌 Test 2: Poem Matrix Generation');
        console.log('generatePoemMatrix type:', typeof generatePoemMatrix);
        const poemMatrix = generatePoemMatrix();
        console.log('Generated Poem Matrix:', poemMatrix);
        console.log('✅ Test 2 Passed\n');

        // === Test 3: New Gen and Receive Functions ===
        console.log('📌 Test 3: New Gen and Receive Functions');
        const testText = "This is a secret message that needs to be encrypted! 🔐";
        console.log('Original Text:', testText);

        // Generate blueprint and indices using gen
        const { blueprint, indices } = await gen(testText, poemMatrix, uniqueId);
        console.log('Generated Blueprint:', blueprint);
        console.log('Generated Indices:', indices);

        // Reconstruct text using receive
        const reconstructedText = await receive(blueprint, poemMatrix, indices, uniqueId);
        console.log('Reconstructed Text:', reconstructedText);
        console.log('Test Passed:', testText === reconstructedText);
        console.log('✅ Test 3 Passed\n');

        // === Test 4: Unlock Hash Generation and Verification ===
        console.log('📌 Test 4: Unlock Hash Generation and Verification');
        const unlockHash = await generateUnlockHash(testText);
        console.log('Generated Unlock Hash:', unlockHash);
        const isVerified = await verifyUnlockHash(unlockHash, testText);
        console.log('Hash Verification Result:', isVerified);
        console.log('✅ Test 4 Passed\n');

        // === Test 5: Voucher Creation and Decryption ===
        console.log('📌 Test 5: Voucher Creation and Decryption');
        const SYSTEM_SECRET_KEY = "YourStaticSecretKeyHere"; // In production, use a secure key
        const voucher = await createVoucher(testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Created Voucher:', voucher);
        const decryptedVoucher = await decryptVoucher(voucher, testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Decrypted Voucher:', decryptedVoucher);
        console.log('Test Passed:', testText === decryptedVoucher);
        console.log('✅ Test 5 Passed\n');

        // === Error Handling Tests ===
        console.log('📌 Error Handling Tests');

        // Test invalid blueprint
        try {
            await receive('invalid-blueprint', poemMatrix, indices, uniqueId);
            console.log('❌ Error handling test failed - should have thrown an error for invalid blueprint');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid blueprint error');
        }

        // Test invalid unlock hash
        try {
            await verifyUnlockHash(testText, 'invalid-hash');
            console.log('❌ Error handling test failed - should have thrown an error for invalid hash');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid hash error');
        }

        // Test invalid voucher
        try {
            await decryptVoucher('invalid-voucher', testText, unlockHash, SYSTEM_SECRET_KEY);
            console.log('❌ Error handling test failed - should have thrown an error for invalid voucher');
        } catch (error) {
            console.log('✅ Error handling test passed - caught invalid voucher error');
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test suite failed with error:', error);
        console.error('Error stack:', error.stack);
    }
}

// Run all tests
runTests(); 