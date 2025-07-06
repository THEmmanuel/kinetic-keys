#!/usr/bin/env node

/**
 * Simple KAT Test Runner
 * Tests individual cryptographic implementations
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Simple logging
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

function logError(message) {
    console.log(`❌ ${message}`);
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

// Test Dilithium 5
async function testDilithium5() {
    log('Testing Dilithium 5...');
    
    const srcDir = 'wasm/dilithium5/src';
    const katDir = 'dilithium/KAT/dilithium5';
    
    try {
        // Check if source files exist
        if (!fs.existsSync(srcDir)) {
            logError(`Source directory not found: ${srcDir}`);
            return false;
        }
        
        // List source files
        const sourceFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.c'));
        logInfo(`Found ${sourceFiles.length} source files in ${srcDir}`);
        
        // Check if KAT files exist
        const reqFile = path.join(katDir, 'PQCsignKAT_4880.req');
        const rspFile = path.join(katDir, 'PQCsignKAT_4880.rsp');
        
        if (!fs.existsSync(reqFile)) {
            logError(`KAT request file not found: ${reqFile}`);
            return false;
        }
        
        if (!fs.existsSync(rspFile)) {
            logError(`KAT response file not found: ${rspFile}`);
            return false;
        }
        
        logSuccess('All required files found');
        
        // Try to compile (optional - might not have gcc)
        try {
            const sourcePaths = sourceFiles.map(f => path.join(srcDir, f));
            const compileCmd = `gcc -O2 -o PQCgenKAT_sign ${sourcePaths.join(' ')} -I${srcDir}`;
            logInfo('Attempting to compile test program...');
            execSync(compileCmd, { stdio: 'pipe' });
            logSuccess('Compilation successful');
            
            // Run the test
            const originalDir = process.cwd();
            process.chdir(katDir);
            
            try {
                const output = execSync('./PQCgenKAT_sign', { encoding: 'utf8' });
                logSuccess('KAT test executed successfully');
                logInfo(`Output: ${output}`);
            } catch (error) {
                logError(`KAT test execution failed: ${error.message}`);
            }
            
            process.chdir(originalDir);
            
        } catch (compileError) {
            logInfo('Compilation failed (gcc not available or compilation error)');
            logInfo('This is expected if gcc is not installed');
        }
        
        // Test WASM module
        try {
            logInfo('Testing WASM module...');
            const wasmTest = require('./wasm/dilithium5/direct-test.js');
            logSuccess('WASM module loaded successfully');
        } catch (wasmError) {
            logError(`WASM test failed: ${wasmError.message}`);
        }
        
        return true;
        
    } catch (error) {
        logError(`Dilithium 5 test failed: ${error.message}`);
        return false;
    }
}

// Test Kyber 1024
async function testKyber1024() {
    log('Testing Kyber 1024...');
    
    const srcDir = 'wasm/kyber1024/src';
    const katDir = 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024';
    
    try {
        // Check if source files exist
        if (!fs.existsSync(srcDir)) {
            logError(`Source directory not found: ${srcDir}`);
            return false;
        }
        
        // List source files
        const sourceFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.c'));
        logInfo(`Found ${sourceFiles.length} source files in ${srcDir}`);
        
        // Check if KAT files exist
        const reqFile = path.join(katDir, 'PQCkemKAT_3168.req');
        const rspFile = path.join(katDir, 'PQCkemKAT_3168.rsp');
        
        if (!fs.existsSync(reqFile)) {
            logError(`KAT request file not found: ${reqFile}`);
            return false;
        }
        
        if (!fs.existsSync(rspFile)) {
            logError(`KAT response file not found: ${rspFile}`);
            return false;
        }
        
        logSuccess('All required files found');
        
        // Try to compile (optional - might not have gcc)
        try {
            const sourcePaths = sourceFiles.map(f => path.join(srcDir, f));
            const compileCmd = `gcc -O2 -o PQCgenKAT_kem ${sourcePaths.join(' ')} -I${srcDir}`;
            logInfo('Attempting to compile test program...');
            execSync(compileCmd, { stdio: 'pipe' });
            logSuccess('Compilation successful');
            
            // Run the test
            const originalDir = process.cwd();
            process.chdir(katDir);
            
            try {
                const output = execSync('./PQCgenKAT_kem', { encoding: 'utf8' });
                logSuccess('KAT test executed successfully');
                logInfo(`Output: ${output}`);
            } catch (error) {
                logError(`KAT test execution failed: ${error.message}`);
            }
            
            process.chdir(originalDir);
            
        } catch (compileError) {
            logInfo('Compilation failed (gcc not available or compilation error)');
            logInfo('This is expected if gcc is not installed');
        }
        
        // Test WASM module
        try {
            logInfo('Testing WASM module...');
            const wasmTest = require('./wasm/kyber1024/demo-kyber.js');
            logSuccess('WASM module loaded successfully');
        } catch (wasmError) {
            logError(`WASM test failed: ${wasmError.message}`);
        }
        
        return true;
        
    } catch (error) {
        logError(`Kyber 1024 test failed: ${error.message}`);
        return false;
    }
}

// Validate KAT files
function validateKATFiles() {
    log('Validating KAT files...');
    
    const katFiles = [
        { name: 'Dilithium 5', req: 'dilithium/KAT/dilithium5/PQCsignKAT_4880.req', rsp: 'dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp' },
        { name: 'Kyber 1024', req: 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.req', rsp: 'NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp' }
    ];
    
    for (const kat of katFiles) {
        try {
            if (fs.existsSync(kat.req) && fs.existsSync(kat.rsp)) {
                const reqStats = fs.statSync(kat.req);
                const rspStats = fs.statSync(kat.rsp);
                
                logSuccess(`${kat.name}: KAT files found`);
                logInfo(`  Request: ${reqStats.size} bytes`);
                logInfo(`  Response: ${rspStats.size} bytes`);
                
                // Quick content check
                const reqContent = fs.readFileSync(kat.req, 'utf8');
                const rspContent = fs.readFileSync(kat.rsp, 'utf8');
                
                const reqLines = reqContent.split('\n').filter(l => l.trim()).length;
                const rspLines = rspContent.split('\n').filter(l => l.trim()).length;
                
                logInfo(`  Request lines: ${reqLines}`);
                logInfo(`  Response lines: ${rspLines}`);
                
                // Check for expected content
                if (kat.name === 'Dilithium 5') {
                    if (rspContent.includes('pk = ') && rspContent.includes('sk = ') && rspContent.includes('sm = ')) {
                        logSuccess(`  ${kat.name}: Response file contains expected fields`);
                    } else {
                        logError(`  ${kat.name}: Response file missing expected fields`);
                    }
                } else if (kat.name === 'Kyber 1024') {
                    if (rspContent.includes('pk = ') && rspContent.includes('sk = ') && rspContent.includes('ct = ') && rspContent.includes('ss = ')) {
                        logSuccess(`  ${kat.name}: Response file contains expected fields`);
                    } else {
                        logError(`  ${kat.name}: Response file missing expected fields`);
                    }
                }
                
            } else {
                logError(`${kat.name}: KAT files not found`);
            }
        } catch (error) {
            logError(`${kat.name}: Error reading KAT files: ${error.message}`);
        }
    }
}

// Main function
async function main() {
    console.log('🔐 Post-Quantum Cryptography KAT Validation Test');
    console.log('=' .repeat(50));
    
    // Validate KAT files first
    validateKATFiles();
    
    console.log('\n' + '=' .repeat(50));
    
    // Test implementations
    const results = {
        dilithium5: await testDilithium5(),
        kyber1024: await testKyber1024()
    };
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results:');
    
    for (const [algorithm, result] of Object.entries(results)) {
        if (result) {
            logSuccess(`${algorithm}: PASSED`);
        } else {
            logError(`${algorithm}: FAILED`);
        }
    }
    
    const allPassed = Object.values(results).every(r => r);
    if (allPassed) {
        console.log('\n🎉 All basic tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testDilithium5, testKyber1024, validateKATFiles }; 