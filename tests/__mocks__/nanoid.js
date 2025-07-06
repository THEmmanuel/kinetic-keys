// Mock implementation of nanoid for testing
const customAlphabet = (alphabet, size) => {
  return () => {
    let result = '';
    for (let i = 0; i < size; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  };
};

module.exports = {
  customAlphabet,
  nanoid: customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 21)
}; 