const kineticKeys = require('kinetic-keys');

// Debug: Log all available functions
console.log('Available functions:', Object.keys(kineticKeys));

const {
    // Unique ID
    generateUniqueID,

    // Key Derivation
    generatePoemMatrix,
    generateKeyWithPoemMatrix,
    reconstructTextGranular,
    deriveBlueprintGranular,
    generateKeyAndBlueprint,
    reconstructText,

    // Unlock Hash
    generateUnlockHash,
    verifyUnlockHash,

    // Vouchers
    createVoucher,
    decryptVoucher
} = kineticKeys;

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

        // === Test 3: Key Generation with Poem Matrix ===
        console.log('📌 Test 3: Key Generation with Poem Matrix');
        const { key, indices, keyId } = generateKeyWithPoemMatrix(poemMatrix);
        console.log('Generated Key:', key.toString('hex'));
        console.log('Generated Indices:', indices);
        console.log('Generated Key ID:', keyId);
        console.log('✅ Test 3 Passed\n');

        // === Test 4: Blueprint Generation and Reconstruction ===
        console.log('📌 Test 4: Blueprint Generation and Reconstruction');
        const testText = "This is a secret message that needs to be encrypted! 🔐";
        console.log('Original Text:', testText);

        // Generate blueprint
        const blueprint = await deriveBlueprintGranular(testText, key);
        console.log('Generated Blueprint:', blueprint);

        // Reconstruct text
        const reconstructedText = await reconstructTextGranular(blueprint, key);
        console.log('Reconstructed Text:', reconstructedText);
        console.log('Test Passed:', testText === reconstructedText);
        console.log('✅ Test 4 Passed\n');

        // === Test 5: High-level Key and Blueprint Generation ===
        console.log('📌 Test 5: High-level Key and Blueprint Generation');
        const { blueprint: highLevelBlueprint, indices: highLevelIndices, poemMatrix: highLevelMatrix } = 
            await generateKeyAndBlueprint(testText, uniqueId);
        console.log('Generated High-level Blueprint:', highLevelBlueprint);
        console.log('Generated High-level Indices:', highLevelIndices);
        console.log('Generated High-level Matrix:', highLevelMatrix);
        console.log('✅ Test 5 Passed\n');

        // === Test 6: High-level Text Reconstruction ===
        console.log('📌 Test 6: High-level Text Reconstruction');
        const highLevelReconstructed = await reconstructText(
            highLevelBlueprint,
            highLevelMatrix,
            highLevelIndices,
            uniqueId
        );
        console.log('High-level Reconstructed Text:', highLevelReconstructed);
        console.log('Test Passed:', testText === highLevelReconstructed);
        console.log('✅ Test 6 Passed\n');

        // === Test 7: Unlock Hash Generation and Verification ===
        console.log('📌 Test 7: Unlock Hash Generation and Verification');
        const unlockHash = await generateUnlockHash(testText);
        console.log('Generated Unlock Hash:', unlockHash);
        const isVerified = await verifyUnlockHash(unlockHash, testText);
        console.log('Hash Verification Result:', isVerified);
        console.log('✅ Test 7 Passed\n');

        // === Test 8: Voucher Creation and Decryption ===
        console.log('📌 Test 8: Voucher Creation and Decryption');
        const SYSTEM_SECRET_KEY = "YourStaticSecretKeyHere"; // In production, use a secure key
        const voucher = await createVoucher(testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Created Voucher:', voucher);
        const decryptedVoucher = await decryptVoucher(voucher, testText, unlockHash, SYSTEM_SECRET_KEY);
        console.log('Decrypted Voucher:', decryptedVoucher);
        console.log('Test Passed:', testText === decryptedVoucher);
        console.log('✅ Test 8 Passed\n');

        // === Error Handling Tests ===
        console.log('📌 Error Handling Tests');

        // Test invalid blueprint
        try {
            await reconstructTextGranular('invalid-blueprint', key);
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