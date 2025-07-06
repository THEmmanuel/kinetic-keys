#!/usr/bin/env node

/**
 * KAT Test Results Viewer
 * Shows actual test vectors and results from the KAT files
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log('\n' + '='.repeat(80), 'cyan');
    log(`  ${message}`, 'bright');
    log('='.repeat(80), 'cyan');
}

function logSection(message) {
    log('\n' + '-'.repeat(60), 'yellow');
    log(`  ${message}`, 'yellow');
    log('-'.repeat(60), 'yellow');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Parse KAT file content
function parseKATFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const testVectors = [];
    let currentVector = {};
    
    for (const line of lines) {
        if (line.startsWith('count = ')) {
            if (Object.keys(currentVector).length > 0) {
                testVectors.push(currentVector);
            }
            currentVector = { count: parseInt(line.split('=')[1].trim()) };
        } else if (line.includes(' = ')) {
            const [key, value] = line.split(' = ', 2);
            currentVector[key.trim()] = value.trim();
        }
    }
    
    if (Object.keys(currentVector).length > 0) {
        testVectors.push(currentVector);
    }
    
    return testVectors;
}

// Display Dilithium 5 KAT results
function showDilithium5Results() {
    logHeader('DILITHIUM 5 KAT TEST RESULTS');
    
    const reqFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.req';
    const rspFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp';
    
    try {
        const requestVectors = parseKATFile(reqFile);
        const responseVectors = parseKATFile(rspFile);
        
        logInfo(`Found ${requestVectors.length} test vectors`);
        logInfo(`Found ${responseVectors.length} response vectors`);
        
        // Show first few test vectors in detail
        for (let i = 0; i < Math.min(3, requestVectors.length); i++) {
            logSection(`Test Vector ${i}`);
            
            const req = requestVectors[i];
            const rsp = responseVectors[i];
            
            logInfo(`Count: ${req.count}`);
            logInfo(`Seed: ${req.seed.substring(0, 32)}...`);
            logInfo(`Message Length: ${req.mlen} bytes`);
            logInfo(`Message: ${req.msg.substring(0, 64)}...`);
            
            if (rsp) {
                logSuccess('Expected Results:');
                logInfo(`Public Key: ${rsp.pk.substring(0, 64)}...`);
                logInfo(`Secret Key: ${rsp.sk.substring(0, 64)}...`);
                logInfo(`Signature Length: ${rsp.smlen}`);
                logInfo(`Signature: ${rsp.sm.substring(0, 64)}...`);
            }
        }
        
        // Show statistics
        logSection('Test Vector Statistics');
        
        const messageLengths = requestVectors.map(v => parseInt(v.mlen));
        const minLen = Math.min(...messageLengths);
        const maxLen = Math.max(...messageLengths);
        const avgLen = Math.round(messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length);
        
        logInfo(`Message Lengths: ${minLen} to ${maxLen} bytes (avg: ${avgLen})`);
        logInfo(`Seed Length: ${requestVectors[0].seed.length / 2} bytes`);
        
        // Check response file structure
        if (responseVectors.length > 0) {
            const firstResponse = responseVectors[0];
            logSuccess('Response File Structure:');
            logInfo(`Public Key Length: ${firstResponse.pk.length / 2} bytes`);
            logInfo(`Secret Key Length: ${firstResponse.sk.length / 2} bytes`);
            logInfo(`Signature Length: ${firstResponse.smlen} bytes`);
            logInfo(`Signature Data Length: ${firstResponse.sm.length / 2} bytes`);
        }
        
    } catch (error) {
        logWarning(`Error reading Dilithium 5 KAT files: ${error.message}`);
    }
}

// Display Kyber 1024 KAT results
function showKyber1024Results() {
    logHeader('KYBER 1024 KAT TEST RESULTS');
    
    const reqFile = 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.req';
    const rspFile = 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp';
    
    try {
        const requestVectors = parseKATFile(reqFile);
        const responseVectors = parseKATFile(rspFile);
        
        logInfo(`Found ${requestVectors.length} test vectors`);
        logInfo(`Found ${responseVectors.length} response vectors`);
        
        // Show first few test vectors in detail
        for (let i = 0; i < Math.min(3, requestVectors.length); i++) {
            logSection(`Test Vector ${i}`);
            
            const req = requestVectors[i];
            const rsp = responseVectors[i];
            
            logInfo(`Count: ${req.count}`);
            logInfo(`Seed: ${req.seed.substring(0, 32)}...`);
            
            if (rsp) {
                logSuccess('Expected Results:');
                logInfo(`Public Key: ${rsp.pk.substring(0, 64)}...`);
                logInfo(`Secret Key: ${rsp.sk.substring(0, 64)}...`);
                logInfo(`Ciphertext: ${rsp.ct.substring(0, 64)}...`);
                logInfo(`Shared Secret: ${rsp.ss.substring(0, 64)}...`);
            }
        }
        
        // Show statistics
        logSection('Test Vector Statistics');
        
        logInfo(`Total Test Vectors: ${requestVectors.length}`);
        logInfo(`Seed Length: ${requestVectors[0].seed.length / 2} bytes`);
        
        // Check response file structure
        if (responseVectors.length > 0) {
            const firstResponse = responseVectors[0];
            logSuccess('Response File Structure:');
            logInfo(`Public Key Length: ${firstResponse.pk.length / 2} bytes`);
            logInfo(`Secret Key Length: ${firstResponse.sk.length / 2} bytes`);
            logInfo(`Ciphertext Length: ${firstResponse.ct.length / 2} bytes`);
            logInfo(`Shared Secret Length: ${firstResponse.ss.length / 2} bytes`);
        }
        
    } catch (error) {
        logWarning(`Error reading Kyber 1024 KAT files: ${error.message}`);
    }
}

// Demonstrate KAT validation process
function demonstrateKATValidation() {
    logHeader('KAT VALIDATION PROCESS DEMONSTRATION');
    
    logSection('How KAT Tests Work');
    
    const steps = [
        '1. Test program reads seed from .req file',
        '2. Initializes deterministic random number generator with seed',
        '3. Performs cryptographic operations (key generation, signing, etc.)',
        '4. Compares output with expected results in .rsp file',
        '5. If outputs match, implementation is correct',
        '6. If outputs differ, implementation has a bug'
    ];
    
    steps.forEach(step => logInfo(step));
    
    logSection('Example: Dilithium 5 Test Vector 0');
    
    try {
        const reqFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.req';
        const rspFile = 'dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp';
        
        const requestVectors = parseKATFile(reqFile);
        const responseVectors = parseKATFile(rspFile);
        
        if (requestVectors.length > 0 && responseVectors.length > 0) {
            const req = requestVectors[0];
            const rsp = responseVectors[0];
            
            logInfo('Input (from .req file):');
            logInfo(`  Seed: ${req.seed}`);
            logInfo(`  Message Length: ${req.mlen}`);
            logInfo(`  Message: ${req.msg}`);
            
            logInfo('Expected Output (from .rsp file):');
            logInfo(`  Public Key: ${rsp.pk.substring(0, 32)}...`);
            logInfo(`  Secret Key: ${rsp.sk.substring(0, 32)}...`);
            logInfo(`  Signature: ${rsp.sm.substring(0, 32)}...`);
            
            logSuccess('Validation Process:');
            logInfo('1. Initialize RNG with seed: ' + req.seed.substring(0, 16) + '...');
            logInfo('2. Generate key pair');
            logInfo('3. Sign message with secret key');
            logInfo('4. Compare generated public key with expected');
            logInfo('5. Compare generated signature with expected');
            logInfo('6. If all match → PASS, else → FAIL');
        }
        
    } catch (error) {
        logWarning(`Error demonstrating KAT validation: ${error.message}`);
    }
}

// Show file statistics
function showFileStatistics() {
    logHeader('KAT FILE STATISTICS');
    
    const files = [
        {
            name: 'Dilithium 5 Request',
            path: 'dilithium/KAT/dilithium5/PQCsignKAT_4880.req',
            type: 'Test vectors'
        },
        {
            name: 'Dilithium 5 Response',
            path: 'dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp',
            type: 'Expected results'
        },
        {
            name: 'Kyber 1024 Request',
            path: 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.req',
            type: 'Test vectors'
        },
        {
            name: 'Kyber 1024 Response',
            path: 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp',
            type: 'Expected results'
        }
    ];
    
    files.forEach(file => {
        try {
            const stats = fs.statSync(file.path);
            const content = fs.readFileSync(file.path, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            logSection(file.name);
            logInfo(`Type: ${file.type}`);
            logInfo(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
            logInfo(`Lines: ${lines.length}`);
            logInfo(`Characters: ${content.length.toLocaleString()}`);
            
            if (file.type === 'Test vectors') {
                const testCount = lines.filter(line => line.startsWith('count =')).length;
                logInfo(`Test Vectors: ${testCount}`);
            }
            
        } catch (error) {
            logWarning(`Error reading ${file.name}: ${error.message}`);
        }
    });
}

// Main function
function main() {
    console.log('🔬 KAT TEST RESULTS ANALYSIS');
    console.log('This shows the actual test vectors and expected results from the KAT files');
    
    showFileStatistics();
    showDilithium5Results();
    showKyber1024Results();
    demonstrateKATValidation();
    
    logHeader('SUMMARY');
    logSuccess('KAT files contain comprehensive test vectors for validation');
    logSuccess('Each test vector has a deterministic seed for reproducible results');
    logSuccess('Response files contain the expected correct outputs');
    logSuccess('These files enable automated validation of cryptographic implementations');
    logInfo('The test vectors ensure implementations work exactly as specified');
    logInfo('This is the gold standard for cryptographic validation');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { 
    showDilithium5Results, 
    showKyber1024Results, 
    demonstrateKATValidation,
    showFileStatistics 
}; 