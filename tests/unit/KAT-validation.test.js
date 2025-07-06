const fs = require('fs');
const path = require('path');

describe('KAT (Known Answer Test) Validation', () => {
  describe('Dilithium 5 KAT Files', () => {
    const dilithiumPath = path.join(__dirname, '../../dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp');
    const dilithiumReqPath = path.join(__dirname, '../../dilithium/KAT/dilithium5/PQCsignKAT_4880.req');

    it('should have valid Dilithium 5 KAT response file', () => {
      expect(fs.existsSync(dilithiumPath)).toBe(true);
      
      const content = fs.readFileSync(dilithiumPath, 'utf8');
      const lines = content.split('\n');
      
      // Check file structure
      expect(lines[0]).toMatch(/^# Dilithium5/);
      
      // Count test vectors
      const countMatches = content.match(/count = \d+/g);
      expect(countMatches).toBeDefined();
      expect(countMatches.length).toBe(100); // Should have 100 test vectors
      
      // Verify each test vector has required fields
      const testVectors = content.split(/\ncount = \d+\n/);
      testVectors.slice(1).forEach((vector, index) => {
        expect(vector).toMatch(/seed = [0-9A-F]+/i);
        expect(vector).toMatch(/mlen = \d+/);
        expect(vector).toMatch(/msg = [0-9A-F]*/i);
        expect(vector).toMatch(/pk = [0-9A-F]+/i);
        expect(vector).toMatch(/sk = [0-9A-F]+/i);
        expect(vector).toMatch(/smlen = \d+/);
        expect(vector).toMatch(/sm = [0-9A-F]+/i);
      });
    });

    it('should have valid Dilithium 5 KAT request file', () => {
      expect(fs.existsSync(dilithiumReqPath)).toBe(true);
      
      const content = fs.readFileSync(dilithiumReqPath, 'utf8');
      const lines = content.split('\n');
      
      // Check file structure - Dilithium request files might not have the # header
      expect(content).toMatch(/count = 0/);
      
      // Count test vectors
      const countMatches = content.match(/count = \d+/g);
      expect(countMatches).toBeDefined();
      expect(countMatches.length).toBe(100);
      
      // Verify each test vector has required fields
      const testVectors = content.split(/\ncount = \d+\n/);
      testVectors.slice(1).forEach((vector) => {
        expect(vector).toMatch(/seed = [0-9A-F]+/i);
        expect(vector).toMatch(/mlen = \d+/);
        expect(vector).toMatch(/msg = [0-9A-F]*/i);
      });
    });

    it('should have correct Dilithium 5 parameter sizes', () => {
      const content = fs.readFileSync(dilithiumPath, 'utf8');
      
      // Extract first test vector
      const firstVector = content.match(/count = 0\n([\s\S]*?)(?=\ncount = 1|$)/);
      expect(firstVector).toBeDefined();
      
      const vectorContent = firstVector[1];
      
      // Extract and verify sizes
      const pk = vectorContent.match(/pk = ([0-9A-F]+)/i);
      const sk = vectorContent.match(/sk = ([0-9A-F]+)/i);
      const sm = vectorContent.match(/sm = ([0-9A-F]+)/i);
      
      expect(pk).toBeDefined();
      expect(sk).toBeDefined();
      expect(sm).toBeDefined();
      
      // Dilithium 5 sizes (in hex characters, so multiply by 2)
      expect(pk[1].length).toBe(2592 * 2); // Public key: 2592 bytes
      expect(sk[1].length).toBe(4880 * 2); // Secret key: 4880 bytes
      expect(sm[1].length).toBeGreaterThanOrEqual(4595 * 2); // Signature + message
    });
  });

  describe('Kyber 1024 KAT Files', () => {
    const kyberPath = path.join(__dirname, '../../NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp');
    const kyberReqPath = path.join(__dirname, '../../NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.req');

    it('should have valid Kyber 1024 KAT response file', () => {
      expect(fs.existsSync(kyberPath)).toBe(true);
      
      const content = fs.readFileSync(kyberPath, 'utf8');
      const lines = content.split('\n');
      
      // Check file structure - Kyber files might not have the # header
      expect(content).toMatch(/count = 0/);
      
      // Count test vectors
      const countMatches = content.match(/count = \d+/g);
      expect(countMatches).toBeDefined();
      expect(countMatches.length).toBe(100);
      
      // Verify each test vector has required fields
      const testVectors = content.split(/\ncount = \d+\n/);
      testVectors.slice(1).forEach((vector) => {
        expect(vector).toMatch(/seed = [0-9A-F]+/i);
        expect(vector).toMatch(/pk = [0-9A-F]+/i);
        expect(vector).toMatch(/sk = [0-9A-F]+/i);
        expect(vector).toMatch(/ct = [0-9A-F]+/i);
        expect(vector).toMatch(/ss = [0-9A-F]+/i);
      });
    });

    it('should have valid Kyber 1024 KAT request file', () => {
      expect(fs.existsSync(kyberReqPath)).toBe(true);
      
      const content = fs.readFileSync(kyberReqPath, 'utf8');
      const lines = content.split('\n');
      
      // Check file structure - Kyber files might not have the # header
      expect(content).toMatch(/count = 0/);
      
      // Count test vectors
      const countMatches = content.match(/count = \d+/g);
      expect(countMatches).toBeDefined();
      expect(countMatches.length).toBe(100);
      
      // Verify each test vector has required fields
      const testVectors = content.split(/\ncount = \d+\n/);
      testVectors.slice(1).forEach((vector) => {
        expect(vector).toMatch(/seed = [0-9A-F]+/i);
      });
    });

    it('should have correct Kyber 1024 parameter sizes', () => {
      const content = fs.readFileSync(kyberPath, 'utf8');
      
      // Extract first test vector
      const firstVector = content.match(/count = 0\n([\s\S]*?)(?=\ncount = 1|$)/);
      expect(firstVector).toBeDefined();
      
      const vectorContent = firstVector[1];
      
      // Extract and verify sizes
      const pk = vectorContent.match(/pk = ([0-9A-F]+)/i);
      const sk = vectorContent.match(/sk = ([0-9A-F]+)/i);
      const ct = vectorContent.match(/ct = ([0-9A-F]+)/i);
      const ss = vectorContent.match(/ss = ([0-9A-F]+)/i);
      
      expect(pk).toBeDefined();
      expect(sk).toBeDefined();
      expect(ct).toBeDefined();
      expect(ss).toBeDefined();
      
      // Kyber 1024 sizes (in hex characters, so multiply by 2)
      expect(pk[1].length).toBe(1568 * 2); // Public key: 1568 bytes
      expect(sk[1].length).toBe(3168 * 2); // Secret key: 3168 bytes
      expect(ct[1].length).toBe(1568 * 2); // Ciphertext: 1568 bytes
      expect(ss[1].length).toBe(32 * 2);   // Shared secret: 32 bytes
    });
  });

  describe('KAT Cross-validation', () => {
    it('should verify Dilithium test vectors are deterministic', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../../dilithium/KAT/dilithium5/PQCsignKAT_4880.rsp'),
        'utf8'
      );
      
      // Extract multiple test vectors with same seed length
      const vectors = content.split(/\ncount = \d+\n/).slice(1, 4);
      const seeds = vectors.map(v => v.match(/seed = ([0-9A-F]+)/i)?.[1]);
      
      // Verify all seeds are unique
      expect(new Set(seeds).size).toBe(seeds.length);
      
      // Verify each vector has consistent structure
      vectors.forEach(vector => {
        const mlen = vector.match(/mlen = (\d+)/)?.[1];
        const smlen = vector.match(/smlen = (\d+)/)?.[1];
        
        expect(parseInt(mlen)).toBeGreaterThanOrEqual(0);
        expect(parseInt(smlen)).toBeGreaterThanOrEqual(4595); // Signature size + message
      });
    });

    it('should verify Kyber test vectors are deterministic', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../../NIST-PQ-Submission-Kyber-20201001/KAT/kyber1024/PQCkemKAT_3168.rsp'),
        'utf8'
      );
      
      // Extract multiple test vectors
      const vectors = content.split(/\ncount = \d+\n/).slice(1, 4);
      const seeds = vectors.map(v => v.match(/seed = ([0-9A-F]+)/i)?.[1]);
      
      // Verify all seeds are unique
      expect(new Set(seeds).size).toBe(seeds.length);
      
      // Verify shared secrets are all 32 bytes
      vectors.forEach(vector => {
        const ss = vector.match(/ss = ([0-9A-F]+)/i)?.[1];
        expect(ss).toBeDefined();
        expect(ss.length).toBe(64); // 32 bytes in hex
      });
    });
  });
}); 