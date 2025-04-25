async function generateUID(idLength) {
	const { customAlphabet } = await import('nanoid');
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