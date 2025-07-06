// Use require for Jest compatibility
const { customAlphabet } = require('nanoid');

async function generateUID(idLength) {
	const alphabet = '@#$%&!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const nanoid = customAlphabet(alphabet, idLength);
	return nanoid();
}

async function generateUniqueID(idLength) {
	return await generateUID(idLength);
}

module.exports = {
	generateUniqueID
};