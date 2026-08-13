const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// In production, this would be derived securely (e.g. PBKDF2 from a password) or fetched from a server.
// For Phase 1, using a hardcoded buffer for structural purposes.
const SECRET_KEY = crypto.scryptSync('secure-testing-center-secret', 'salt', 32); 

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag
  };
}

function decrypt(encryptedObj) {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(encryptedObj.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    throw new Error('Decryption failed. Data may be tampered.');
  }
}

module.exports = {
  encrypt,
  decrypt
};
