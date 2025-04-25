const {
	generateUniqueID
} = require('./utils/GenerateUniqueID');

const {
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular
} = require('./utils/KeyDerivation');

const {
	generateUnlockHash,
	verifyUnlockHash
} = require('./utils/UnlockHash');

const {
	createVoucher,
	decryptVoucher
} = require('./utils/KineticKeyUtils');


	generateUniqueID(8).then(console.log)


module.exports = {
	// Unique ID
	generateUniqueID,

	// Key Derivation
	generatePoemMatrix,
	generateKeyWithPoemMatrix,
	reconstructTextGranular,
	deriveBlueprintGranular,

	// Unlock Hash
	generateUnlockHash,
	verifyUnlockHash,

	// Vouchers
	createVoucher,
	decryptVoucher,
};