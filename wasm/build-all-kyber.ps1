#!/usr/bin/env pwsh

# Build script for all Kyber variants
Write-Host "🔨 Building all Kyber variants for Kinetic Keys..." -ForegroundColor Cyan

$variants = @(
    @{name="kyber512"; k=2; pubkey=800; seckey=1632; ciphertext=768},
    @{name="kyber768"; k=3; pubkey=1184; seckey=2400; ciphertext=1088},
    @{name="kyber1024"; k=4; pubkey=1568; seckey=3168; ciphertext=1568}
)

$emcc = "../emsdk/upstream/emscripten/emcc"

foreach ($variant in $variants) {
    Write-Host "`n📦 Building $($variant.name)..." -ForegroundColor Yellow
    
    # Copy source files if not already there
    if (-not (Test-Path "$($variant.name)/src/kem.c")) {
        Write-Host "  Copying source files..."
        Copy-Item "../NIST-PQ-Submission-Kyber-20201001/Optimized_Implementation/crypto_kem/$($variant.name)/*" -Destination "$($variant.name)/src/" -Recurse
        Copy-Item "kyber1024/src/randombytes.c" -Destination "$($variant.name)/src/"
    }
    
    # Update wrapper if needed
    if (-not (Test-Path "$($variant.name)/js/$($variant.name)-wrapper.js")) {
        Write-Host "  Creating wrapper..."
        $wrapper = Get-Content "kyber1024/js/kyber1024-wrapper.js" -Raw
        $wrapper = $wrapper -replace "Kyber1024", $variant.name.Substring(0,1).ToUpper() + $variant.name.Substring(1)
        $wrapper = $wrapper -replace "kyber1024", $variant.name
        $wrapper = $wrapper -replace "1568(?=;)", $variant.pubkey.ToString()
        $wrapper = $wrapper -replace "3168(?=;)", $variant.seckey.ToString()
        $wrapper = $wrapper -replace "1568(?=;)", $variant.ciphertext.ToString()
        $wrapper | Out-File "$($variant.name)/js/$($variant.name)-wrapper.js" -Encoding UTF8
    }
    
    # Compile
    Write-Host "  Compiling WASM module..."
    $exportName = "create" + $variant.name.Substring(0,1).ToUpper() + $variant.name.Substring(1) + "Module"
    $namespace = "pqcrystals_" + $variant.name + "_ref"
    
    & $emcc -O2 -s WASM=1 -s NO_EXIT_RUNTIME=1 `
        -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=32MB -s STACK_SIZE=1MB `
        -s MODULARIZE=1 -s EXPORT_NAME=$exportName -s ENVIRONMENT=node `
        -s EXPORTED_FUNCTIONS="_${namespace}_keypair,_${namespace}_enc,_${namespace}_dec,_malloc,_free" `
        -s EXPORTED_RUNTIME_METHODS=ccall,cwrap,getValue,setValue,HEAPU8 `
        -D__EMSCRIPTEN__ -DKYBER_K=$($variant.k) `
        "$($variant.name)/src/kem.c" `
        "$($variant.name)/src/indcpa.c" `
        "$($variant.name)/src/polyvec.c" `
        "$($variant.name)/src/poly.c" `
        "$($variant.name)/src/ntt.c" `
        "$($variant.name)/src/cbd.c" `
        "$($variant.name)/src/reduce.c" `
        "$($variant.name)/src/verify.c" `
        "$($variant.name)/src/fips202.c" `
        "$($variant.name)/src/symmetric-shake.c" `
        "$($variant.name)/src/sha256.c" `
        "$($variant.name)/src/sha512.c" `
        "$($variant.name)/src/randombytes.c" `
        -o "$($variant.name)/build/$($variant.name).js" 2>&1 | Out-Null
    
    if (Test-Path "$($variant.name)/build/$($variant.name).wasm") {
        $size = (Get-Item "$($variant.name)/build/$($variant.name).wasm").Length / 1KB
        Write-Host "  ✅ Success! Generated $($variant.name).wasm ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Build failed for $($variant.name)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All Kyber variants built successfully!" -ForegroundColor Green 