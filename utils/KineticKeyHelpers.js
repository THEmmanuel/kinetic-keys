// utils/encryptionHelpers.js
const generateUnlockHash = require('../utils/UnlockHash').generateUnlockHash;
const verifyUnlockHash = require('../utils/UnlockHash').verifyUnlockHash;
const createVoucher = require('../utils/KineticKeyUtils').createVoucher;
const decryptVoucher = require('../utils/KineticKeyUtils').decryptVoucher;


async function processEncryption(array, hash) {
	return array.map(item => ({
		_id: item._id, // or you can modify based on structure
		KK: createVoucher(JSON.stringify(item), hash)
	}));
}

async function processDecryption(input, passphrase, hash) {
    if (Array.isArray(input)) {
        return Promise.all(
            input.map(async entry => {
                try {
                    const raw = await decryptVoucher(entry.KK, passphrase, hash);
                    const parsed = JSON.parse(raw);
                    return {
                        _id: entry._id,
                        data: parsed
                    };
                } catch (err) {
                    console.error('Array Decryption Failed:', err.message);
                    return {
                        _id: entry._id,
                        data: null,
                        error: 'Decryption failed'
                    };
                }
            })
        );
    } else {
        try {
            const raw = await decryptVoucher(input, passphrase, hash);
            const parsed = JSON.parse(raw);
            return parsed;
        } catch (err) {
            console.error('Single Decryption Failed:', err.message, { input });
            throw new Error('Failed to decrypt transaction 2');
        }
    }
}


module.exports = {
	processEncryption,
	processDecryption
};