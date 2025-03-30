const ENCRYPTION_KEY = "wordle_secret_key_2025";

export const encryptWordle = (word: string): string => {
  return word
    .split("")
    .map((char, i) => {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    })
    .join("");
};

export const decryptWordle = (encrypted: string): string => {
  return encrypted
    .split("")
    .map((char, i) => {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    })
    .join("");
};
