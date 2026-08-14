/**
 * encryption.js — AES-256-GCM encryption / decryption
 *
 * Key derivation: PBKDF2 with SHA-512, 100,000 iterations
 * as specified in project-config.json security_policies.key_derivation.
 *
 * Usage:
 *   const { encrypt, decrypt, deriveKey } = require('./encryption');
 *   const key = deriveKey(sessionId);          // derive per-session key
 *   const enc = encrypt(JSON.stringify(data), key);
 *   const raw = decrypt(enc, key);
 *
 * RULE-9: All locally cached data (recordings, voiceprints, question banks)
 *         MUST be encrypted with this module before writing to disk.
 */

'use strict';

const crypto = require('crypto');

const ALGORITHM    = 'aes-256-gcm';
const PBKDF2_SALT  = 'LockGuard-University-Salt-v1';  // static component
const ITERATIONS   = 100_000;
const KEY_LENGTH   = 32;  // 256 bits
const DIGEST       = 'sha512';

/**
 * Derives a 256-bit key from a session-specific secret (e.g. session token).
 * Combines the session secret with a static salt so the key is unique per exam.
 *
 * @param {string} sessionSecret — unique per exam session (e.g. session token or student ID)
 * @returns {Buffer} 32-byte key
 */
function deriveKey(sessionSecret) {
  return crypto.pbkdf2Sync(
    sessionSecret,
    PBKDF2_SALT,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param {string} plaintext
 * @param {Buffer} key — 32-byte key from deriveKey()
 * @returns {{ iv: string, encryptedData: string, authTag: string }}
 */
function encrypt(plaintext, key) {
  const iv     = crypto.randomBytes(12);   // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted    += cipher.final('hex');

  return {
    iv:            iv.toString('hex'),
    encryptedData: encrypted,
    authTag:       cipher.getAuthTag().toString('hex')
  };
}

/**
 * Decrypts an object produced by encrypt().
 *
 * @param {{ iv: string, encryptedData: string, authTag: string }} encryptedObj
 * @param {Buffer} key — must be the same key used during encryption
 * @returns {string} plaintext
 * @throws if data is tampered or key is wrong
 */
function decrypt(encryptedObj, key) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encryptedObj.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));

  let decrypted  = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
  decrypted     += decipher.final('utf8');
  return decrypted;
}

module.exports = { deriveKey, encrypt, decrypt };
