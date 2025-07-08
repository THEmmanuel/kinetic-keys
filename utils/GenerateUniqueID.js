const crypto = require('crypto');

function generateUID(idLength) {
	const alphabet = '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	if (!idLength || idLength <= 0) return '';
	const bytes = crypto.randomBytes(idLength);
	let id = '';
	for (let i = 0; i < idLength; i++) {
		id += alphabet[bytes[i] % alphabet.length];
	}
	return id;
}

async function generateUniqueID(idLength) {
	return generateUID(idLength);
}

module.exports = {
	generateUniqueID
};