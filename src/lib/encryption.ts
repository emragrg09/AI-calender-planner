import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits authentication tag

// Helper to get 32-byte encryption key from the environment variable
function getEncryptionKey(): Buffer {
  const keySecret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keySecret) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not defined.');
  }
  // Create a 32-byte key using SHA-256 hashing of the provided key secret
  return crypto.createHash('sha256').update(keySecret).digest();
}

/**
 * Encrypts a text string using AES-256-GCM
 */
export function encryptToken(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  // Format as iv:tag:encryptedtext (all in hex)
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted text string
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format.');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
